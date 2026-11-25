import cv2
import numpy as np
from .utils import encode_image


def process_lab1(img: np.ndarray, params: dict) -> dict:
    """Lab 01: Image Representation, Color Spaces, Pixel Inspection & Basic Manipulation."""
    h, w, c = img.shape

    # Pixel inspection coordinates & selected area dimensions
    px_x = int(np.clip(params.get("px_x", w // 2), 0, w - 1))
    px_y = int(np.clip(params.get("px_y", h // 2), 0, h - 1))
    patch_w = int(np.clip(params.get("patch_w", 40), 1, w))
    patch_h = int(np.clip(params.get("patch_h", 40), 1, h))
    fill_mode = str(params.get("fill_mode", "solid"))
    new_r = int(np.clip(params.get("new_r", 255), 0, 255))
    new_g = int(np.clip(params.get("new_g", 215), 0, 255))
    new_b = int(np.clip(params.get("new_b", 0), 0, 255))

    orig_bgr = [int(v) for v in img[px_y, px_x]]
    orig_rgb = [orig_bgr[2], orig_bgr[1], orig_bgr[0]]

    # Modify selected area centered at (px_x, px_y) & outline selection
    modified = img.copy()
    x1 = max(0, min(w - patch_w, px_x - patch_w // 2))
    y1 = max(0, min(h - patch_h, px_y - patch_h // 2))
    x2 = min(w, x1 + patch_w)
    y2 = min(h, y1 + patch_h)

    roi_slice = modified[y1:y2, x1:x2]
    area_mean_bgr = [round(float(v), 1) for v in np.mean(roi_slice, axis=(0, 1))]
    area_mean_rgb = [area_mean_bgr[2], area_mean_bgr[1], area_mean_bgr[0]]

    if fill_mode == "tint":
        overlay = np.full_like(roi_slice, (new_b, new_g, new_r))
        modified[y1:y2, x1:x2] = cv2.addWeighted(roi_slice, 0.45, overlay, 0.55, 0)
    else:
        modified[y1:y2, x1:x2] = (new_b, new_g, new_r)

    if patch_w > 1 or patch_h > 1:
        cv2.rectangle(modified, (x1, y1), (x2 - 1, y2 - 1), (0, 215, 255), 2, cv2.LINE_AA)
    else:
        cv2.circle(modified, (px_x, px_y), 8, (0, 215, 255), 2, cv2.LINE_AA)

    # Grayscale conversion
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Individual BGR channels visualized
    b_ch, g_ch, r_ch = cv2.split(img)
    zeros = np.zeros_like(b_ch)
    b_vis = cv2.merge([b_ch, zeros, zeros])
    g_vis = cv2.merge([zeros, g_ch, zeros])
    r_vis = cv2.merge([zeros, zeros, r_ch])

    # ROI Crop
    crop_x = int(np.clip(params.get("crop_x", w // 4), 0, w - 2))
    crop_y = int(np.clip(params.get("crop_y", h // 4), 0, h - 2))
    crop_w = int(np.clip(params.get("crop_w", w // 2), 10, w - crop_x))
    crop_h = int(np.clip(params.get("crop_h", h // 2), 10, h - crop_y))
    cropped = img[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w]

    # Resize
    scale = float(np.clip(params.get("scale", 0.5), 0.1, 2.0))
    resize_w = max(16, int(w * scale))
    resize_h = max(16, int(h * scale))
    resized = cv2.resize(img, (resize_w, resize_h), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR)

    # Rotate
    rotate_deg = int(params.get("rotate_deg", 90))
    if rotate_deg == 90:
        rotated = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    elif rotate_deg == 180:
        rotated = cv2.rotate(img, cv2.ROTATE_180)
    elif rotate_deg == 270:
        rotated = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    else:
        rotated = img.copy()

    return {
        "properties": {
            "height": int(h),
            "width": int(w),
            "channels": int(c),
            "shape_str": f"({h}, {w}, {c})",
            "dtype": str(img.dtype),
            "total_pixels": int(h * w),
            "color_space": "BGR (OpenCV Native)",
        },
        "pixel_inspection": {
            "x": px_x,
            "y": px_y,
            "original_bgr": orig_bgr,
            "original_rgb": orig_rgb,
            "new_rgb": [new_r, new_g, new_b],
            "area_box": {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2),
                "w": int(x2 - x1),
                "h": int(y2 - y1),
                "fill_mode": fill_mode,
            },
            "area_mean_rgb": area_mean_rgb,
        },
        "crop_info": {"x": crop_x, "y": crop_y, "w": crop_w, "h": crop_h},
        "resize_info": {"w": resize_w, "h": resize_h, "scale": scale},
        "rotate_deg": rotate_deg,
        "images": {
            "original": encode_image(img),
            "grayscale": encode_image(gray),
            "pixel_modified": encode_image(modified),
            "cropped": encode_image(cropped),
            "resized": encode_image(resized),
            "rotated": encode_image(rotated),
            "channel_r": encode_image(r_vis),
            "channel_g": encode_image(g_vis),
            "channel_b": encode_image(b_vis),
        },
    }

