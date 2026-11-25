import time
import cv2
import numpy as np
from sklearn.datasets import fetch_lfw_people, fetch_olivetti_faces
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from .utils import encode_image

_DATASET_CACHE = None
_MODEL_CACHE = None


def _load_face_dataset():
    global _DATASET_CACHE
    if _DATASET_CACHE is not None:
        return _DATASET_CACHE

    try:
        lfw = fetch_lfw_people(min_faces_per_person=70, resize=0.4)
        source_name = "Labeled Faces in the Wild (LFW, min_faces=70)"
        n_samples, h, w = lfw.images.shape
        X = lfw.data
        y = lfw.target
        target_names = [str(n) for n in lfw.target_names]
    except Exception:
        olivetti = fetch_olivetti_faces()
        source_name = "Olivetti Faces (Offline Fallback)"
        n_samples, h, w = olivetti.images.shape
        X = olivetti.data
        y = olivetti.target
        target_names = [f"Subject {i:02d}" for i in range(40)]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    _DATASET_CACHE = {
        "source_name": source_name,
        "n_samples": int(n_samples),
        "h": int(h),
        "w": int(w),
        "n_features": int(X.shape[1]),
        "n_classes": len(target_names),
        "target_names": target_names,
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
    }
    return _DATASET_CACHE


def _norm_to_uint8(arr2d: np.ndarray) -> np.ndarray:
    mn, mx = float(arr2d.min()), float(arr2d.max())
    if mx - mn < 1e-8:
        return np.zeros_like(arr2d, dtype=np.uint8)
    norm = ((arr2d - mn) / (mx - mn) * 255.0).astype(np.uint8)
    return cv2.resize(norm, (120, 150), interpolation=cv2.INTER_NEAREST)


def process_lab5(params: dict) -> dict:
    """Lab 05: PCA (Eigenfaces) Dimensionality Reduction & SVM Face Recognition."""
    ds = _load_face_dataset()
    X_train, X_test = ds["X_train"], ds["X_test"]
    y_train, y_test = ds["y_train"], ds["y_test"]
    h, w = ds["h"], ds["w"]
    target_names = ds["target_names"]

    max_comp = min(X_train.shape[0], X_train.shape[1])
    n_components = int(np.clip(params.get("n_components", 150), 5, min(250, max_comp)))
    whiten = bool(params.get("whiten", True))
    svm_c = float(np.clip(params.get("svm_c", 5.0), 0.1, 100.0))

    t0 = time.perf_counter()
    pca = PCA(n_components=n_components, svd_solver="randomized", whiten=whiten, random_state=42)
    pca.fit(X_train)
    X_train_pca = pca.transform(X_train)
    X_test_pca = pca.transform(X_test)
    pca_ms = round((time.perf_counter() - t0) * 1000, 2)

    global _MODEL_CACHE
    t1 = time.perf_counter()
    clf = SVC(kernel="rbf", class_weight="balanced", C=svm_c, probability=True, random_state=42)
    clf.fit(X_train_pca, y_train)
    y_pred = clf.predict(X_test_pca)
    svm_ms = round((time.perf_counter() - t1) * 1000, 2)

    _MODEL_CACHE = {
        "pca": pca,
        "clf": clf,
        "h": h,
        "w": w,
        "scale_max": float(X_train.max()) if float(X_train.max()) > 0 else 1.0,
        "target_names": target_names,
    }

    acc = round(float(accuracy_score(y_test, y_pred)) * 100, 2)
    rep_dict = classification_report(y_test, y_pred, target_names=target_names, output_dict=True, zero_division=0)

    report_rows = []
    for name in target_names:
        if name in rep_dict:
            row = rep_dict[name]
            report_rows.append({
                "name": name,
                "precision": round(row["precision"] * 100, 1),
                "recall": round(row["recall"] * 100, 1),
                "f1": round(row["f1-score"] * 100, 1),
                "support": int(row["support"]),
            })

    # Cumulative explained variance
    cum_var = np.cumsum(pca.explained_variance_ratio_)
    idx_90 = np.where(cum_var >= 0.90)[0]
    comp_90 = int(idx_90[0] + 1) if len(idx_90) > 0 else None

    # Sample curve points (up to 50 points for clean SVG plotting)
    step = max(1, len(cum_var) // 50)
    variance_curve = [
        {"component": int(i + 1), "variance": round(float(cum_var[i]) * 100, 2)}
        for i in range(0, len(cum_var), step)
    ]
    if variance_curve[-1]["component"] != len(cum_var):
        variance_curve.append({"component": len(cum_var), "variance": round(float(cum_var[-1]) * 100, 2)})

    # Top 12 Eigenfaces
    eigenfaces_raw = pca.components_.reshape((n_components, h, w))
    eigenfaces = [
        {"index": i + 1, "image": encode_image(_norm_to_uint8(eigenfaces_raw[i]))}
        for i in range(min(12, n_components))
    ]

    # Correct & Failure analysis portraits
    failures = []
    correct_samples = []
    for i in range(len(y_test)):
        pred_name = target_names[y_pred[i]]
        true_name = target_names[y_test[i]]
        face_img = encode_image(_norm_to_uint8(X_test[i].reshape((h, w))))
        if y_pred[i] != y_test[i] and len(failures) < 6:
            failures.append({"actual": true_name, "predicted": pred_name, "image": face_img})
        elif y_pred[i] == y_test[i] and len(correct_samples) < 6:
            correct_samples.append({"actual": true_name, "predicted": pred_name, "image": face_img})
        if len(failures) >= 6 and len(correct_samples) >= 6:
            break

    return {
        "dataset": {
            "source": ds["source_name"],
            "n_samples": ds["n_samples"],
            "n_features": ds["n_features"],
            "image_shape": f"{h}×{w}",
            "n_classes": ds["n_classes"],
            "train_count": int(X_train.shape[0]),
            "test_count": int(X_test.shape[0]),
        },
        "params": {
            "n_components": n_components,
            "whiten": whiten,
            "svm_c": svm_c,
        },
        "metrics": {
            "accuracy": acc,
            "pca_ms": pca_ms,
            "svm_ms": svm_ms,
            "total_variance_pct": round(float(cum_var[-1]) * 100, 2),
            "components_for_90_pct": comp_90,
        },
        "variance_curve": variance_curve,
        "report": report_rows,
        "eigenfaces": eigenfaces,
        "failures": failures,
        "correct_samples": correct_samples,
    }


def predict_lab5_face(img: np.ndarray, params: dict) -> dict:
    """Project a custom uploaded face image onto Eigenfaces and predict via SVM."""
    if _MODEL_CACHE is None:
        process_lab5(params)

    pca = _MODEL_CACHE["pca"]
    clf = _MODEL_CACHE["clf"]
    h, w = _MODEL_CACHE["h"], _MODEL_CACHE["w"]
    scale_max = _MODEL_CACHE["scale_max"]
    target_names = _MODEL_CACHE["target_names"]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Try detecting the primary face first; fall back to full image if none found
    face_crop = gray
    face_detected = False
    try:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        cascade = cv2.CascadeClassifier(cascade_path)
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
        if len(faces) > 0:
            x, y, fw, fh = max(faces, key=lambda b: b[2] * b[3])
            face_crop = gray[y : y + fh, x : x + fw]
            face_detected = True
    except Exception:
        pass

    resized = cv2.resize(face_crop, (w, h), interpolation=cv2.INTER_AREA)
    vec = resized.astype(np.float32).flatten()
    if scale_max <= 1.5:
        vec = vec / 255.0
    vec = vec.reshape(1, -1)

    proj = pca.transform(vec)
    reconstructed = pca.inverse_transform(proj).reshape((h, w))

    probs = clf.predict_proba(proj)[0]
    top_indices = np.argsort(probs)[::-1][:3]
    top_matches = [
        {"name": target_names[int(i)], "confidence": round(float(probs[i]) * 100, 1)}
        for i in top_indices
    ]

    return {
        "face_detected": face_detected,
        "predicted_name": top_matches[0]["name"],
        "confidence": top_matches[0]["confidence"],
        "top_matches": top_matches,
        "input_face": encode_image(_norm_to_uint8(resized)),
        "reconstructed_face": encode_image(_norm_to_uint8(reconstructed)),
    }

