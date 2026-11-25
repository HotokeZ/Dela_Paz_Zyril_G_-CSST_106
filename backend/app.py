import os
import tempfile
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from cv_labs.lab1 import process_lab1
from cv_labs.lab2 import process_lab2
from cv_labs.lab3 import process_lab3
from cv_labs.lab4 import process_lab4
from cv_labs.lab5 import predict_lab5_face, process_lab5
from cv_labs.lab6 import process_lab6, process_lab6_video
from cv_labs.lab7 import process_lab7
from cv_labs.utils import (
    decode_image_from_request,
    decode_second_image_from_request,
    encode_image,
    ensure_samples,
    load_sample_image,
)

DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

app = Flask(__name__, static_folder=DIST_DIR if os.path.isdir(DIST_DIR) else None)
CORS(app)


def _extract_params(req) -> dict:
    if req.is_json:
        return req.get_json(silent=True) or {}
    raw = req.form.to_dict()
    parsed = {}
    for k, v in raw.items():
        if v.lower() in ("true", "false"):
            parsed[k] = v.lower() == "true"
        else:
            try:
                parsed[k] = float(v) if "." in v else int(v)
            except ValueError:
                parsed[k] = v
    return parsed


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "CSST106 Computer Vision Telemetry API"})


@app.route("/api/samples", methods=["GET"])
def get_samples():
    catalog = ensure_samples()
    samples = []
    for key, meta in catalog.items():
        img = load_sample_image(key)
        samples.append({**meta, "preview": encode_image(img)})
    return jsonify({"samples": samples})


@app.route("/api/lab1", methods=["POST"])
def api_lab1():
    try:
        img = decode_image_from_request(request)
        params = _extract_params(request)
        return jsonify(process_lab1(img, params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/lab2", methods=["POST"])
def api_lab2():
    try:
        img = decode_image_from_request(request)
        params = _extract_params(request)
        return jsonify(process_lab2(img, params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/lab3", methods=["POST"])
def api_lab3():
    try:
        img = decode_image_from_request(request)
        params = _extract_params(request)
        return jsonify(process_lab3(img, params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/lab4", methods=["POST"])
def api_lab4():
    try:
        img = decode_image_from_request(request)
        img2 = decode_second_image_from_request(request)
        params = _extract_params(request)
        return jsonify(process_lab4(img, params, img2))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/lab5", methods=["POST"])
def api_lab5():
    try:
        params = _extract_params(request)
        return jsonify(process_lab5(params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/lab5/predict", methods=["POST"])
def api_lab5_predict():
    try:
        img = decode_image_from_request(request)
        params = _extract_params(request)
        return jsonify(predict_lab5_face(img, params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/lab6", methods=["POST"])
def api_lab6():
    try:
        img = decode_image_from_request(request)
        params = _extract_params(request)
        return jsonify(process_lab6(img, params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/lab6/video", methods=["POST"])
def api_lab6_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided."}), 400
    vid_file = request.files["video"]
    suffix = os.path.splitext(vid_file.filename or "clip.mp4")[1] or ".mp4"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        vid_file.save(tmp.name)
        tmp.close()
        params = _extract_params(request)
        return jsonify(process_lab6_video(tmp.name, params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400
    finally:
        if os.path.exists(tmp.name):
            os.remove(tmp.name)


@app.route("/api/lab7", methods=["POST"])
def api_lab7():
    try:
        img = decode_image_from_request(request)
        params = _extract_params(request)
        return jsonify(process_lab7(img, params))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if os.path.isdir(DIST_DIR):
        target = os.path.join(DIST_DIR, path)
        if path and os.path.exists(target):
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({"message": "Backend running. Start Vite dev server or build frontend/dist."})


if __name__ == "__main__":
    ensure_samples()
    app.run(host="127.0.0.1", port=5000, debug=False)

