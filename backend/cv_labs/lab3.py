import cv2
import numpy as np
from .utils import encode_image


def _calc_hist_bins(gray_img: np.ndarray, bins: int = 64) -> list:
    hist = cv2.calcHist([gray_img], [0], None, [bins], [0, 256]).flatten()
    return [int(v) for v in hist]


def _img_stats(gray_img: np.ndarray) -> dict:
    return {
        "mean": round(float(np.mean(gray_img)), 2),
        "std": round(float(np.std(gray_img)), 2),
        "min": int(np.min(gray_img)),
        "max": int(np.max(gray_img)),
    }


def process_lab3(img: np.ndarray, params: dict) -> dict:
    """Lab 03: Histogram Equalization, Linear Contrast Adjustment & CLAHE."""
    color_mode = params.get("color_mode", "grayscale")  # "grayscale" or "color_yuv"
    clip_limit = float(np.clip(params.get("clip_limit", 2.0), 0.5, 12.0))
    tile_size = int(np.clip(params.get("tile_size", 8), 2, 32))
    alpha = float(np.clip(params.get("alpha", 1.5), 0.2, 3.5))
    beta = int(np.clip(params.get("beta", 0), -100, 100))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe_obj = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_size, tile_size))

    if color_mode == "color_yuv":
        yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
        y_orig = yuv[:, :, 0].copy()

        # Global Histogram Equalization on Y channel
        yuv_eq = yuv.copy()
        yuv_eq[:, :, 0] = cv2.equalizeHist(y_orig)
        eq_out = cv2.cvtColor(yuv_eq, cv2.COLOR_YUV2BGR)

        # CLAHE on Y channel
        yuv_clahe = yuv.copy()
        yuv_clahe[:, :, 0] = clahe_obj.apply(y_orig)
        clahe_out = cv2.cvtColor(yuv_clahe, cv2.COLOR_YUV2BGR)

        # Linear Contrast Stretching
        linear_out = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)

        orig_lum = y_orig
        eq_lum = yuv_eq[:, :, 0]
        clahe_lum = yuv_clahe[:, :, 0]
        linear_lum = cv2.cvtColor(linear_out, cv2.COLOR_BGR2GRAY)
        orig_out = img
    else:
        orig_out = gray
        eq_out = cv2.equalizeHist(gray)
        clahe_out = clahe_obj.apply(gray)
        linear_out = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)

        orig_lum = gray
        eq_lum = eq_out
        clahe_lum = clahe_out
        linear_lum = linear_out

    return {
        "params": {
            "color_mode": color_mode,
            "clip_limit": clip_limit,
            "tile_size": tile_size,
            "alpha": alpha,
            "beta": beta,
        },
        "histograms": {
            "bins": 64,
            "original": _calc_hist_bins(orig_lum, 64),
            "equalized": _calc_hist_bins(eq_lum, 64),
            "linear": _calc_hist_bins(linear_lum, 64),
            "clahe": _calc_hist_bins(clahe_lum, 64),
        },
        "stats": {
            "original": _img_stats(orig_lum),
            "equalized": _img_stats(eq_lum),
            "linear": _img_stats(linear_lum),
            "clahe": _img_stats(clahe_lum),
        },
        "images": {
            "original": encode_image(orig_out),
            "equalized": encode_image(eq_out),
            "linear": encode_image(linear_out),
            "clahe": encode_image(clahe_out),
        },
    }

