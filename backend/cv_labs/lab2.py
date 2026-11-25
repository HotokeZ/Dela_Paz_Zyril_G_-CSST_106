import time
import cv2
import numpy as np
from .utils import encode_image


def process_lab2(img: np.ndarray, params: dict) -> dict:
    """Lab 02: Edge Detection using Gaussian Blur, Sobel Gradients, and Canny."""
    t0 = time.perf_counter()

    blur_ksize = int(params.get("blur_ksize", 3))
    if blur_ksize % 2 == 0:
        blur_ksize += 1
    blur_ksize = int(np.clip(blur_ksize, 1, 15))

    sobel_ksize = int(params.get("sobel_ksize", 3))
    if sobel_ksize not in (1, 3, 5, 7):
        sobel_ksize = 3

    canny_low = int(np.clip(params.get("canny_low", 100), 0, 255))
    canny_high = int(np.clip(params.get("canny_high", 200), 0, 255))
    if canny_high < canny_low:
        canny_high = canny_low

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_blur = cv2.GaussianBlur(gray, (blur_ksize, blur_ksize), 0) if blur_ksize > 1 else gray.copy()

    # Sobel X, Y and combined magnitude
    sobelx = cv2.Sobel(img_blur, cv2.CV_64F, 1, 0, ksize=sobel_ksize)
    sobely = cv2.Sobel(img_blur, cv2.CV_64F, 0, 1, ksize=sobel_ksize)
    sobel_mag = cv2.magnitude(sobelx, sobely)

    sobelx_vis = cv2.convertScaleAbs(sobelx)
    sobely_vis = cv2.convertScaleAbs(sobely)
    sobel_max = float(np.max(sobel_mag)) if np.max(sobel_mag) > 0 else 1.0
    sobel_norm = np.clip((sobel_mag / sobel_max) * 255.0, 0, 255).astype(np.uint8)

    # Canny edge detection
    edges_canny = cv2.Canny(img_blur, canny_low, canny_high)

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    total_px = gray.shape[0] * gray.shape[1]
    canny_edge_pct = round(float(np.count_nonzero(edges_canny)) / total_px * 100, 2)
    sobel_edge_pct = round(float(np.count_nonzero(sobel_norm > 50)) / total_px * 100, 2)

    return {
        "params": {
            "blur_ksize": blur_ksize,
            "sobel_ksize": sobel_ksize,
            "canny_low": canny_low,
            "canny_high": canny_high,
        },
        "metrics": {
            "processing_ms": elapsed_ms,
            "canny_edge_pct": canny_edge_pct,
            "sobel_active_pct": sobel_edge_pct,
            "max_gradient": round(sobel_max, 2),
        },
        "images": {
            "original": encode_image(img),
            "grayscale": encode_image(gray),
            "blurred": encode_image(img_blur),
            "sobel_x": encode_image(sobelx_vis),
            "sobel_y": encode_image(sobely_vis),
            "sobel_combined": encode_image(sobel_norm),
            "canny": encode_image(edges_canny),
        },
    }

