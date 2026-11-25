import time
import cv2
import numpy as np
from .utils import encode_image

_DEEPLAB_MODEL = None
_DEEPLAB_PREPROCESS = None
_VOC_CLASSES = [
    "background", "aeroplane", "bicycle", "bird", "boat", "bottle", "bus",
    "car", "cat", "chair", "cow", "diningtable", "dog", "horse", "motorbike",
    "person", "pottedplant", "sheep", "sofa", "train", "tvmonitor",
]
_VOC_PALETTE = np.array([
    [6, 10, 23], [220, 0, 0], [255, 215, 0], [0, 120, 255], [0, 200, 180],
    [180, 60, 255], [255, 110, 30], [255, 40, 90], [255, 215, 0], [100, 200, 255],
    [140, 255, 100], [255, 160, 60], [60, 180, 255], [200, 120, 255], [255, 80, 80],
    [0, 180, 255], [80, 220, 120], [240, 240, 100], [220, 100, 180], [120, 140, 255],
    [180, 220, 255],
], dtype=np.uint8)


def _get_deeplab():
    global _DEEPLAB_MODEL, _DEEPLAB_PREPROCESS
    if _DEEPLAB_MODEL is not None:
        return _DEEPLAB_MODEL, _DEEPLAB_PREPROCESS

    import torch
    from torchvision.models.segmentation import (
        DeepLabV3_MobileNet_V3_Large_Weights,
        deeplabv3_mobilenet_v3_large,
    )

    weights = DeepLabV3_MobileNet_V3_Large_Weights.DEFAULT
    _DEEPLAB_MODEL = deeplabv3_mobilenet_v3_large(weights=weights).eval()
    _DEEPLAB_PREPROCESS = weights.transforms()
    return _DEEPLAB_MODEL, _DEEPLAB_PREPROCESS


def _region_growing(gray: np.ndarray, seed_x: int, seed_y: int, tol: int) -> np.ndarray:
    h, w = gray.shape
    mask = np.zeros((h + 2, w + 2), np.uint8)
    flags = 4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY
    img_copy = gray.copy()
    cv2.floodFill(img_copy, mask, (seed_x, seed_y), 255, loDiff=tol, upDiff=tol, flags=flags)
    return mask[1:-1, 1:-1]


def _watershed_segmentation(img: np.ndarray, dist_thresh: float) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
    sure_bg = cv2.dilate(opening, kernel, iterations=3)
    dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
    _, sure_fg = cv2.threshold(dist_transform, dist_thresh * dist_transform.max(), 255, 0)
    sure_fg = np.uint8(sure_fg)
    unknown = cv2.subtract(sure_bg, sure_fg)
    _, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0
    ws_img = img.copy()
    markers = cv2.watershed(ws_img, markers)
    ws_img[markers == -1] = [0, 215, 255]  # Red Bull Yellow boundaries
    return ws_img


def process_lab7(img: np.ndarray, params: dict) -> dict:
    """Lab 07: Thresholding, Region-Based, Edge-Based & Semantic Segmentation."""
    t0 = time.perf_counter()
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    adaptive_block = int(params.get("adaptive_block", 15))
    if adaptive_block % 2 == 0:
        adaptive_block += 1
    adaptive_block = int(np.clip(adaptive_block, 3, 51))
    adaptive_c = int(np.clip(params.get("adaptive_c", 4), -20, 20))

    seed_x = int(np.clip(params.get("seed_x", w // 2), 0, w - 1))
    seed_y = int(np.clip(params.get("seed_y", h // 2), 0, h - 1))
    region_tol = int(np.clip(params.get("region_tol", 20), 2, 100))
    watershed_dist = float(np.clip(params.get("watershed_dist", 0.4), 0.1, 0.85))
    canny_low = int(np.clip(params.get("canny_low", 60), 0, 255))
    canny_high = int(np.clip(params.get("canny_high", 150), 0, 255))
    run_semantic = bool(params.get("run_semantic", True))

    # 1. Thresholding
    otsu_val, otsu_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive_mask = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, adaptive_block, adaptive_c
    )

    # 2. Region-Based
    rg_mask = _region_growing(gray, seed_x, seed_y, region_tol)
    rg_vis = img.copy()
    rg_vis[rg_mask == 255] = (rg_vis[rg_mask == 255] * 0.45 + np.array([255, 110, 30]) * 0.55).astype(np.uint8)
    cv2.circle(rg_vis, (seed_x, seed_y), 6, (0, 215, 255), -1)
    cv2.circle(rg_vis, (seed_x, seed_y), 8, (0, 0, 220), 2)

    watershed_vis = _watershed_segmentation(img, watershed_dist)

    # 3. Edge-Based Segmentation (Canny + Contours)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, canny_low, canny_high)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    edge_vis = img.copy()
    cv2.drawContours(edge_vis, contours, -1, (0, 215, 255), 2)

    # 4. Semantic Segmentation (DeepLabV3 MobileNetV3)
    semantic_vis = None
    semantic_classes = []
    if run_semantic:
        import torch
        from PIL import Image

        model, preprocess = _get_deeplab()
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        input_tensor = preprocess(pil_img).unsqueeze(0)
        with torch.no_grad():
            output = model(input_tensor)["out"][0]
        pred_mask = output.argmax(0).byte().cpu().numpy()
        pred_resized = cv2.resize(pred_mask, (w, h), interpolation=cv2.INTER_NEAREST)

        color_mask_rgb = _VOC_PALETTE[pred_resized]
        color_mask_bgr = cv2.cvtColor(color_mask_rgb, cv2.COLOR_RGB2BGR)
        semantic_vis = cv2.addWeighted(img, 0.45, color_mask_bgr, 0.55, 0)

        unique_ids, counts = np.unique(pred_resized, return_counts=True)
        total_px = float(h * w)
        for cid, cnt in zip(unique_ids, counts):
            pct = round(float(cnt) / total_px * 100, 2)
            if pct >= 0.3 and cid < len(_VOC_CLASSES):
                rgb_c = _VOC_PALETTE[cid].tolist()
                semantic_classes.append({
                    "id": int(cid),
                    "name": _VOC_CLASSES[cid],
                    "coverage_pct": pct,
                    "color": f"rgb({rgb_c[0]}, {rgb_c[1]}, {rgb_c[2]})",
                })

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

    return {
        "metrics": {
            "otsu_threshold": round(float(otsu_val), 1),
            "contours_found": len(contours),
            "region_area_pct": round(float(np.count_nonzero(rg_mask)) / (h * w) * 100, 2),
            "processing_ms": elapsed_ms,
        },
        "semantic_classes": semantic_classes,
        "images": {
            "original": encode_image(img),
            "otsu": encode_image(otsu_mask),
            "adaptive": encode_image(adaptive_mask),
            "region_growing": encode_image(rg_vis),
            "watershed": encode_image(watershed_vis),
            "edge_contours": encode_image(edge_vis),
            "semantic": encode_image(semantic_vis) if semantic_vis is not None else None,
        },
    }

