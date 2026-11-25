# CSST106: Perception & Computer Vision — Lab Compilation Web UI

A unified, F1 Red Bull Racing-themed Computer Vision Telemetry Web Application integrating **Lab Activity 01 through Lab Activity 07** for **CSST106 (Perception and Computer Vision)**.

## Laboratory Modules
1. **Lab 01 — Image Manipulation**: Image shape/channels (`BGR`/`RGB`), grayscale conversion, pixel coordinate inspection & modification, ROI cropping, resizing, and rotation.
2. **Lab 02 — Edge Detection Technique**: Gaussian smoothing, Sobel X/Y/Magnitude gradients, and Canny edge detection with interactive thresholds.
3. **Lab 03 — Histogram Equalization & Contrast Adjustment**: Global `equalizeHist` (grayscale & YUV luminance), linear contrast stretching, CLAHE, and live RGB/Luminance histogram comparison.
4. **Lab 04 — Feature Detection & Matching (SURF / SIFT / ORB)**: Keypoint & descriptor extraction, Hessian/feature threshold tuning, two-image feature matching, and SURF vs. SIFT vs. ORB comparison.
5. **Lab 05 — PCA in Computer Vision (Eigenfaces)**: Dimensionality reduction on LFW faces, Eigenfaces gallery, Cumulative Explained Variance (90% threshold), SVM face recognition classification report, and failure analysis.
6. **Lab 06 — YOLOv11 Object Detection**: Real-time/uploaded image & webcam object detection with Ultralytics YOLO, confidence/IoU controls, bounding box telemetry, and custom dataset (`data.yaml`) builder.
7. **Lab 07 — Image Segmentation Techniques**: Otsu & Adaptive Thresholding, Region Growing (interactive seed point) & Watershed, Edge/Contour-based segmentation, and DeepLabV3 Semantic Segmentation.

## Project Structure
```
CSST 106 Act Compilation/
├── Acts/                  # Original lab activity .docx specifications
├── backend/               # Flask + OpenCV + scikit-learn + Ultralytics API
│   ├── app.py
│   ├── cv_labs/           # Modular lab processors (lab1.py .. lab7.py)
│   └── samples/           # Built-in sample images generated for instant testing
├── frontend/              # React + Vite + Tailwind CSS F1 Red Bull CV HUD
└── README.md
```

## Quick Start

### 1. Backend (Flask API)
```bash
pip install -r backend/requirements.txt
python backend/app.py
```
Runs on `http://localhost:5000`.

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` (proxied to `/api` -> `http://localhost:5000`).

