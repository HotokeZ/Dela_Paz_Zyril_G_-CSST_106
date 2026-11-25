import base64
import os
import cv2
import numpy as np
from skimage import data as skdata

SAMPLES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "samples")


def decode_image_from_request(req) -> np.ndarray:
    """Decode an uploaded file or base64 JSON image into an OpenCV BGR ndarray."""
    if "image" in req.files:
        file_bytes = np.frombuffer(req.files["image"].read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode uploaded image file.")
        return img

    data = req.get_json(silent=True) or {}
    b64 = data.get("image")
    sample_name = data.get("sample")

    if sample_name:
        return load_sample_image(sample_name)

    if b64:
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        img_bytes = base64.b64decode(b64)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode base64 image.")
        return img

    return load_sample_image("astronaut")


def decode_second_image_from_request(req) -> np.ndarray:
    """Decode a second uploaded/base64/sample image for feature matching."""
    if "image2" in req.files:
        file_bytes = np.frombuffer(req.files["image2"].read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode second uploaded image.")
        return img

    data = req.get_json(silent=True) or {}
    b64 = data.get("image2")
    sample_name = data.get("sample2")
    if sample_name:
        return load_sample_image(sample_name)
    if b64:
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        img_bytes = base64.b64decode(b64)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode second base64 image.")
        return img

    return None


def encode_image(img: np.ndarray, ext: str = ".png") -> str:
    """Encode a BGR or grayscale OpenCV image as a base64 data URI."""
    if img is None:
        return ""
    if img.dtype != np.uint8:
        img = np.clip(img, 0, 255).astype(np.uint8)
    ok, buf = cv2.imencode(ext, img)
    if not ok:
        raise ValueError("Failed to encode image.")
    mime = "image/jpeg" if ext.lower() in (".jpg", ".jpeg") else "image/png"
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
    return f"data:{mime};base64,{b64}"


def _build_f1_calibration_target() -> np.ndarray:
    """Create a crisp F1 Red Bull Racing themed CV calibration & telemetry target."""
    w, h = 640, 420
    img = np.full((h, w, 3), (23, 10, 6), dtype=np.uint8)  # Deep RB navy (BGR)
    # Grid lines
    for x in range(0, w, 40):
        cv2.line(img, (x, 0), (x, h), (60, 35, 18), 1)
    for y in range(0, h, 40):
        cv2.line(img, (0, y), (w, y), (60, 35, 18), 1)

    # Red Bull racing stripes
    cv2.rectangle(img, (0, 0), (w, 18), (0, 0, 220), -1)
    cv2.rectangle(img, (0, 18), (w, 26), (0, 215, 255), -1)

    # Geometric shapes for edge, corner & segmentation testing
    cv2.circle(img, (160, 210), 85, (255, 190, 0), 4)
    cv2.circle(img, (160, 210), 50, (0, 0, 225), -1)
    cv2.rectangle(img, (290, 110), (450, 290), (0, 215, 255), 3)
    cv2.rectangle(img, (320, 140), (420, 260), (240, 240, 240), -1)

    # Checkerboard corner patch
    for r in range(4):
        for c in range(4):
            color = (245, 245, 245) if (r + c) % 2 == 0 else (15, 15, 20)
            cv2.rectangle(img, (485 + c * 30, 120 + r * 30), (515 + c * 30, 150 + r * 30), color, -1)

    cv2.putText(img, "RB-CV // TELEMETRY TARGET", (32, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(img, "CSST106 CALIBRATION", (32, 375), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 215, 255), 2, cv2.LINE_AA)
    return img


def _build_low_contrast_sample() -> np.ndarray:
    """Create a low-contrast grayscale-toned scene for Lab 03 histogram equalization."""
    cam = skdata.camera()
    low = np.clip(cam.astype(np.float32) * 0.28 + 85.0, 0, 255).astype(np.uint8)
    return cv2.cvtColor(low, cv2.COLOR_GRAY2BGR)


def ensure_samples() -> dict:
    """Generate and cache built-in sample images on disk, returning metadata."""
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    catalog = {
        "astronaut": ("Astronaut (Portrait & Detail)", lambda: cv2.cvtColor(skdata.astronaut(), cv2.COLOR_RGB2BGR)),
        "coffee": ("Coffee Cup (Objects & Edges)", lambda: cv2.cvtColor(skdata.coffee(), cv2.COLOR_RGB2BGR)),
        "coins": ("Coins (Segmentation & Threshold)", lambda: cv2.cvtColor(skdata.coins(), cv2.COLOR_GRAY2BGR)),
        "chelsea": ("Chelsea Cat (Texture & Features)", lambda: cv2.cvtColor(skdata.chelsea(), cv2.COLOR_RGB2BGR)),
        "low_contrast": ("Low-Contrast Camera (Histogram)", _build_low_contrast_sample),
        "rb_target": ("Red Bull CV Calibration Target", _build_f1_calibration_target),
    }
    info = {}
    for key, (label, builder) in catalog.items():
        path = os.path.join(SAMPLES_DIR, f"{key}.png")
        if not os.path.exists(path):
            img = builder()
            cv2.imwrite(path, img)
        else:
            img = cv2.imread(path)
        h, w = img.shape[:2]
        info[key] = {"id": key, "label": label, "width": int(w), "height": int(h)}
    return info


def load_sample_image(name: str) -> np.ndarray:
    """Load a cached sample image by id."""
    ensure_samples()
    path = os.path.join(SAMPLES_DIR, f"{name}.png")
    if not os.path.exists(path):
        path = os.path.join(SAMPLES_DIR, "astronaut.png")
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Failed to load sample '{name}'.")
    return img

