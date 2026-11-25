import time
import cv2
import numpy as np
from .utils import encode_image

_YOLO_MODEL = None
_YOLO_MODEL_NAME = None


def _get_yolo_model():
    global _YOLO_MODEL, _YOLO_MODEL_NAME
    if _YOLO_MODEL is not None:
        return _YOLO_MODEL, _YOLO_MODEL_NAME

    from ultralytics import YOLO

    for candidate in ("yolo11n.pt", "yolov8n.pt"):
        try:
            _YOLO_MODEL = YOLO(candidate)
            _YOLO_MODEL_NAME = candidate
            return _YOLO_MODEL, _YOLO_MODEL_NAME
        except Exception:
            continue
    raise RuntimeError("Could not load YOLOv11n or YOLOv8n weights.")


def _detect_and_annotate(model, img: np.ndarray, conf: float, iou: float, imgsz: int):
    t0 = time.perf_counter()
    results = model.predict(source=img, conf=conf, iou=iou, imgsz=imgsz, verbose=False)
    inference_ms = round((time.perf_counter() - t0) * 1000, 2)

    result = results[0]
    annotated = img.copy()
    h, w = img.shape[:2]
    total_area = float(h * w)

    palette_bgr = [
        (0, 215, 255),   # RB Yellow
        (0, 0, 225),     # RB Red
        (255, 110, 30),  # RB Electric Blue
        (255, 255, 255), # White
    ]

    detections = []
    class_counts = {}

    if result.boxes is not None:
        for idx, box in enumerate(result.boxes):
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            cls_id = int(box.cls[0].item())
            score = float(box.conf[0].item())
            cls_name = result.names.get(cls_id, f"class_{cls_id}")

            class_counts[cls_name] = class_counts.get(cls_name, 0) + 1
            area_pct = round(((x2 - x1) * (y2 - y1)) / total_area * 100, 2)

            detections.append({
                "id": idx + 1,
                "class_name": cls_name,
                "confidence": round(score * 100, 1),
                "bbox": [x1, y1, x2, y2],
                "area_pct": area_pct,
            })

            color = palette_bgr[cls_id % len(palette_bgr)]
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)
            label = f"{cls_name} {score*100:.0f}%"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            ty = max(y1 - 6, th + 6)
            cv2.rectangle(annotated, (x1, ty - th - 6), (x1 + tw + 8, ty + 2), color, -1)
            txt_color = (10, 15, 30) if color in ((0, 215, 255), (255, 255, 255)) else (255, 255, 255)
            cv2.putText(annotated, label, (x1 + 4, ty - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.55, txt_color, 2, cv2.LINE_AA)

    return annotated, detections, class_counts, inference_ms


def process_lab6(img: np.ndarray, params: dict) -> dict:
    """Lab 06: YOLOv11 Object Detection with Bounding Boxes & Telemetry."""
    conf = float(np.clip(params.get("conf", 0.30), 0.05, 0.95))
    iou = float(np.clip(params.get("iou", 0.45), 0.10, 0.95))
    imgsz = int(params.get("imgsz", 640))
    if imgsz not in (320, 480, 640):
        imgsz = 640

    model, model_name = _get_yolo_model()
    annotated, detections, class_counts, inference_ms = _detect_and_annotate(
        model, img, conf, iou, imgsz
    )

    return {
        "model_name": model_name,
        "params": {"conf": conf, "iou": iou, "imgsz": imgsz},
        "inference_ms": inference_ms,
        "total_detections": len(detections),
        "class_counts": class_counts,
        "detections": detections,
        "images": {
            "original": encode_image(img),
            "annotated": encode_image(annotated),
        },
    }


def process_lab6_video(video_path: str, params: dict) -> dict:
    """Lab 06: Sample and annotate uploaded video frames with YOLOv11."""
    conf = float(np.clip(params.get("conf", 0.30), 0.05, 0.95))
    iou = float(np.clip(params.get("iou", 0.45), 0.10, 0.95))
    imgsz = int(params.get("imgsz", 480))
    if imgsz not in (320, 480, 640):
        imgsz = 480

    model, model_name = _get_yolo_model()
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open uploaded video file.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    fps = float(cap.get(cv2.CAP_PROP_FPS)) or 24.0
    max_samples = 30
    step = max(1, total_frames // max_samples) if total_frames > 0 else 5

    frames_out = []
    aggregate_counts = {}
    total_ms = 0.0
    frame_idx = 0

    try:
        while len(frames_out) < max_samples:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx % step == 0:
                # Resize large videos down slightly for fast browser playback
                h, w = frame.shape[:2]
                if w > 960:
                    scale = 960.0 / w
                    frame = cv2.resize(frame, (960, int(h * scale)))

                annotated, detections, counts, inf_ms = _detect_and_annotate(
                    model, frame, conf, iou, imgsz
                )
                total_ms += inf_ms
                for k, v in counts.items():
                    aggregate_counts[k] = aggregate_counts.get(k, 0) + v

                frames_out.append({
                    "frame_index": frame_idx,
                    "timestamp_s": round(frame_idx / fps, 2),
                    "detections_count": len(detections),
                    "inference_ms": inf_ms,
                    "image": encode_image(annotated, ".jpg"),
                })
            frame_idx += 1
    finally:
        cap.release()

    if not frames_out:
        raise ValueError("No readable video frames found.")

    return {
        "model_name": model_name,
        "total_frames": total_frames or frame_idx,
        "sampled_frames": len(frames_out),
        "fps": round(fps, 1),
        "avg_inference_ms": round(total_ms / len(frames_out), 2),
        "aggregate_counts": aggregate_counts,
        "frames": frames_out,
    }

