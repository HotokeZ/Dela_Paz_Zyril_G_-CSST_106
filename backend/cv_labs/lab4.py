import time
import cv2
import numpy as np
from .utils import encode_image


def _check_surf_available() -> bool:
    return hasattr(cv2, "xfeatures2d") and hasattr(cv2.xfeatures2d, "SURF_create")


def _run_detector(gray: np.ndarray, method: str, hessian_threshold: int, max_features: int, upright: bool):
    t0 = time.perf_counter()
    note = ""
    actual_method = method

    if method == "SURF":
        if _check_surf_available():
            det = cv2.xfeatures2d.SURF_create(hessianThreshold=hessian_threshold, upright=upright)
            kps, desc = det.detectAndCompute(gray, None)
        else:
            actual_method = "SIFT (SURF Fallback)"
            note = "SURF is patented and excluded from standard OpenCV 4+/5+ binary wheels; SIFT is used as the closest scale-invariant fallback."
            det = cv2.SIFT_create(nfeatures=max_features)
            kps, desc = det.detectAndCompute(gray, None)
    elif method == "SIFT":
        det = cv2.SIFT_create(nfeatures=max_features)
        kps, desc = det.detectAndCompute(gray, None)
    elif method == "BRISK" and hasattr(cv2, "BRISK_create"):
        det = cv2.BRISK_create()
        kps, desc = det.detectAndCompute(gray, None)
    elif method == "AKAZE" and hasattr(cv2, "AKAZE_create"):
        det = cv2.AKAZE_create()
        kps, desc = det.detectAndCompute(gray, None)
    else:  # ORB
        actual_method = "ORB"
        det = cv2.ORB_create(nfeatures=max_features)
        kps, desc = det.detectAndCompute(gray, None)

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    return actual_method, kps, desc, elapsed_ms, note


def process_lab4(img: np.ndarray, params: dict, img2: np.ndarray = None) -> dict:
    """Lab 04: SURF / SIFT / ORB / AKAZE Feature Detection, Comparison & Matching."""
    method = params.get("detector", "SIFT").upper()
    hessian_threshold = int(np.clip(params.get("hessian_threshold", 400), 50, 2000))
    max_features = int(np.clip(params.get("max_features", 500), 50, 2500))
    upright = bool(params.get("upright", False))

    gray1 = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    surf_available = _check_surf_available()

    # Primary selected detector
    actual_method, kps1, desc1, elapsed_ms, note = _run_detector(
        gray1, method, hessian_threshold, max_features, upright
    )

    kp_img = cv2.drawKeypoints(
        img, kps1, None, (0, 215, 255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS
    )

    # Benchmark comparison across SIFT, ORB, BRISK (and SURF if compiled)
    comparison = []
    bench_methods = (["SURF"] if surf_available else []) + ["SIFT", "ORB"]
    if hasattr(cv2, "BRISK_create"):
        bench_methods.append("BRISK")
    for m in bench_methods:
        _, mkps, mdesc, m_ms, _ = _run_detector(gray1, m, hessian_threshold, max_features, upright)
        desc_shape = f"{mdesc.shape[0]}×{mdesc.shape[1]}" if mdesc is not None else "None"
        comparison.append({
            "method": m,
            "keypoints": len(mkps),
            "descriptor_shape": desc_shape,
            "time_ms": m_ms,
        })

    # Feature Matching (against img2 or an affine rotated/scaled version of img1)
    if img2 is None:
        h, w = img.shape[:2]
        mat = cv2.getRotationMatrix2D((w / 2, h / 2), 18, 0.85)
        img2 = cv2.warpAffine(img, mat, (w, h))
        match_source = "Auto-Transformed Target (18° Rotated, 0.85× Scale)"
    else:
        match_source = "Uploaded/Selected Secondary Image"

    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    _, kps2, desc2, _, _ = _run_detector(gray2, method, hessian_threshold, max_features, upright)

    good_matches = []
    match_vis = img.copy()
    if desc1 is not None and desc2 is not None and len(kps1) >= 2 and len(kps2) >= 2:
        if desc1.dtype == np.float32:
            bf = cv2.BFMatcher(cv2.NORM_L2)
            raw_matches = bf.knnMatch(desc1, desc2, k=2)
            for pair in raw_matches:
                if len(pair) == 2 and pair[0].distance < 0.75 * pair[1].distance:
                    good_matches.append(pair[0])
        else:
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            good_matches = sorted(bf.match(desc1, desc2), key=lambda x: x.distance)

        good_matches = sorted(good_matches, key=lambda x: x.distance)[:45]
        match_vis = cv2.drawMatches(
            img, kps1, img2, kps2, good_matches, None,
            matchColor=(0, 215, 255), singlePointColor=(220, 0, 0),
            flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS
        )

    return {
        "surf_available": surf_available,
        "actual_method": actual_method,
        "note": note,
        "keypoints_count": len(kps1),
        "descriptor_shape": f"{desc1.shape[0]}×{desc1.shape[1]}" if desc1 is not None else "None",
        "elapsed_ms": elapsed_ms,
        "matches_count": len(good_matches),
        "match_source": match_source,
        "comparison": comparison,
        "images": {
            "original": encode_image(img),
            "keypoints": encode_image(kp_img),
            "matches": encode_image(match_vis),
        },
    }

