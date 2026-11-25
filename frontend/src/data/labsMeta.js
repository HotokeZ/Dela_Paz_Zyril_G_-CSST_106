export const LABS_META = [
  {
    id: "lab1",
    number: "01",
    title: "Image Manipulation",
    shortTitle: "Image Ops",
    week: "Week 1–2",
    topic: "Introduction to Computer Vision & Digital Image Representation",
    objective:
      "Understand how digital images are represented as 2D/3D pixel arrays, inspect BGR/RGB color channels and pixel values, convert to grayscale, and perform ROI cropping, resizing, and rotation using OpenCV.",
    algorithms: ["cv2.imread / BGR-RGB", "cv2.cvtColor (GRAY)", "Pixel Coordinate Indexing", "ROI Slicing", "cv2.resize", "cv2.rotate"],
    procedure: [
      "Load a color image and inspect its shape (Height × Width × Channels) and data type.",
      "Split and visualize individual Blue, Green, and Red color channels and convert to grayscale.",
      "Inspect and modify pixel intensity values at specific (x, y) coordinates.",
      "Crop a Region of Interest (ROI), resize by scale factor, and rotate by 90°/180°/270°.",
    ],
    conclusion: [
      "Through this laboratory activity, we established how digital images are stored and processed mathematically as multi-dimensional NumPy arrays of uint8 intensity values ranging from 0 to 255. Inspecting the image shape (Height × Width × Channels) and splitting the individual Blue, Green, and Red planes demonstrated that OpenCV natively loads color images in BGR order rather than standard RGB, which directly affects color interpretation and visualization. Converting images to single-channel grayscale further illustrated how luminance information can be preserved while reducing memory footprint and computational overhead by a factor of three.",
      "Performing coordinate-level pixel indexing and spatial transformations highlighted critical practical considerations in image preprocessing. Modifying pixel patches at specific (x, y) coordinates confirmed that array indexing follows row-major (y, x) order, whereas ROI cropping, scaling, and 90°/180°/270° rotations directly alter spatial resolution and aspect ratio. Downscaling images (such as 0.1× resizing) visibly reduces high-frequency detail and introduces pixelation, underscoring why choosing appropriate interpolation methods (INTER_AREA for shrinking vs. INTER_LINEAR for enlarging) is essential to preserve visual integrity.",
      "Overall, mastering fundamental matrix representation, color space conversion, and geometric image manipulation forms the indispensable preprocessing backbone for every downstream computer vision task. In real-world systems—ranging from autonomous vehicle camera calibration and medical DICOM normalization to dataset augmentation for deep learning models—accurate ROI extraction, channel alignment, and resolution standardization ensure consistent and reliable feature extraction in later stages of the vision pipeline.",
    ],
    codeSnippet: `import cv2

img = cv2.imread("input.jpg")
h, w, c = img.shape
print("Shape:", img.shape, "DType:", img.dtype)

# Grayscale & BGR channel split
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
b, g, r = cv2.split(img)

# Inspect & modify pixel at (x, y)
print("Pixel BGR:", img[y, x])
img[y, x] = [0, 215, 255]

# Crop ROI, Resize, Rotate
roi = img[y1:y2, x1:x2]
resized = cv2.resize(img, (int(w * 0.5), int(h * 0.5)))
rotated = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)`,
  },
  {
    id: "lab2",
    number: "02",
    title: "Edge Detection Technique",
    shortTitle: "Edge Detection",
    week: "Week 3–4",
    topic: "Sobel Gradient Operators & Canny Edge Detector",
    objective:
      "Preprocess images with Gaussian smoothing, apply Sobel (X, Y, Magnitude) and Canny edge detection algorithms, and compare their edge maps.",
    algorithms: ["cv2.GaussianBlur", "cv2.Sobel (dx, dy)", "cv2.magnitude", "cv2.Canny (Hysteresis Thresholding)"],
    procedure: [
      "Convert the input image to grayscale and apply Gaussian blur to suppress high-frequency noise.",
      "Compute horizontal (Gx) and vertical (Gy) intensity gradients using the Sobel operator and combine via Euclidean magnitude.",
      "Apply Canny edge detection using non-maximum suppression and double hysteresis thresholding.",
      "Compare Sobel's thick gradient-magnitude edges against Canny's thin, connected edge contours.",
    ],
    conclusion: [
      "Comparing Sobel and Canny edge detection revealed fundamental differences in how gradient-based versus multi-stage edge extractors capture object boundaries. The Sobel operator computes directional first-order spatial derivatives along the horizontal (Gx) and vertical (Gy) axes, highlighting vertical and horizontal intensity transitions respectively before combining them into a continuous gradient magnitude map. Because Sobel outputs raw gradient strengths without thinning, it produces thicker, shaded edge responses that reflect edge intensity but also remain sensitive to subtle texture variations.",
      "In contrast, the Canny edge detector applies a structured four-stage pipeline—Gaussian noise smoothing, gradient calculation, non-maximum suppression, and dual-threshold hysteresis—to produce crisp, single-pixel-wide binary contours. Adjusting the Gaussian blur kernel size and Canny's low/high thresholds demonstrated the delicate trade-off between noise suppression and detail preservation: overly high thresholds discard faint structural boundaries, whereas overly low thresholds or minimal smoothing introduce spurious background clutter and fragmented edges.",
      "In practical computer vision applications, edge detection serves as a foundational structural cue for higher-level scene understanding. Sobel gradients are widely used in texture analysis, optical flow, and gradient-based feature descriptors (such as HOG), while Canny edge maps power lane-line detection in autonomous driving, PCB and industrial defect inspection, document boundary scanning, and contour-driven robotic guidance.",
    ],
    codeSnippet: `import cv2

gray = cv2.imread("input.jpg", cv2.IMREAD_GRAYSCALE)
blur = cv2.GaussianBlur(gray, (3, 3), 0)

# Sobel gradient magnitude
sobelx = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
sobely = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
sobel_mag = cv2.magnitude(sobelx, sobely)

# Canny edge detection
edges_canny = cv2.Canny(blur, 100, 200)`,
  },
  {
    id: "lab3",
    number: "03",
    title: "Histogram Equalization & Contrast",
    shortTitle: "Histogram & CLAHE",
    week: "Week 4–5",
    topic: "Global Histogram Equalization, Linear Contrast & CLAHE",
    objective:
      "Enhance low-contrast images by redistributing pixel intensity distributions using Global Histogram Equalization, Linear Contrast Stretching, and Contrast Limited Adaptive Histogram Equalization (CLAHE).",
    algorithms: ["cv2.calcHist", "cv2.equalizeHist", "YUV Luminance Equalization", "cv2.convertScaleAbs", "cv2.createCLAHE"],
    procedure: [
      "Compute and plot the intensity histogram of the original grayscale or color (YUV luminance) image.",
      "Apply Global Histogram Equalization to spread intensity values across the full [0, 255] dynamic range.",
      "Apply Linear Contrast Stretching (alpha/beta) and Adaptive Histogram Equalization (CLAHE) with configurable clip limit and tile grid.",
      "Compare detail visibility, noise amplification, and resulting histogram distributions.",
    ],
    conclusion: [
      "Analyzing the intensity histograms before and after processing clearly demonstrated how contrast enhancement reshapes an image's pixel distribution. Low-contrast inputs exhibit tightly clustered histogram peaks concentrated in a narrow intensity band, resulting in washed-out details. Global Histogram Equalization flattens and stretches this cumulative distribution function across the entire [0, 255] range, dramatically increasing global standard deviation (σ) and overall brightness separation, though applying it to color images requires transforming into YUV/HSV space so only the luminance (Y) channel is equalized without distorting hue.",
      "Comparing Global Equalization, Linear Contrast Stretching (α, β), and CLAHE exposed important limitations of global methods. While global equalization and aggressive linear scaling boost overall contrast, they frequently over-saturate highlights, crush shadows, and amplify background sensor noise in uniform regions such as sky or asphalt. CLAHE resolves this by partitioning the image into local tiles (e.g., 8×8) and capping histogram bin heights at a configurable clip limit before redistribution, yielding balanced local detail recovery in both shadowed and brightly lit areas without unnatural artifacts.",
      "Histogram-based contrast enhancement is heavily utilized across mission-critical imaging domains where lighting conditions cannot be controlled. In medical radiology (X-rays, MRIs, retinal scans), CLAHE reveals subtle tissue anomalies without blowing out bone structures; in automotive ADAS, surveillance, and motorsport onboard cameras, adaptive luminance equalization improves visibility through glare, fog, tunnel transitions, and night scenes prior to object detection.",
    ],
    codeSnippet: `import cv2

gray = cv2.imread("low_contrast.jpg", cv2.IMREAD_GRAYSCALE)

# Global Histogram Equalization
eq_global = cv2.equalizeHist(gray)

# Linear Contrast & Brightness
linear = cv2.convertScaleAbs(gray, alpha=1.8, beta=-40)

# CLAHE Adaptive Equalization
clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
eq_clahe = clahe.apply(gray)`,
  },
  {
    id: "lab4",
    number: "04",
    title: "Feature Detection & Matching",
    shortTitle: "SURF / SIFT / ORB",
    week: "Week 6",
    topic: "SURF, SIFT, ORB & BRISK Keypoints and Descriptor Matching",
    objective:
      "Detect scale- and rotation-invariant keypoints and feature descriptors using SURF/SIFT/ORB, visualize rich keypoints, and match features across two views.",
    algorithms: ["SURF (Hessian/Haar)", "SIFT (DoG)", "ORB (FAST + rBRIEF)", "BRISK", "BFMatcher + Lowe's Ratio Test"],
    procedure: [
      "Load an image in grayscale and configure detector parameters (Hessian threshold / max features / upright mode).",
      "Extract keypoints and descriptors, then render rich keypoints showing scale and orientation.",
      "Benchmark SURF (with SIFT fallback if patented non-free module is absent), SIFT, ORB, and BRISK.",
      "Match descriptors between two images using Brute-Force matching with Lowe's ratio test.",
    ],
    conclusion: [
      "This experiment demonstrated how local feature detectors identify repeatable, distinctive keypoints (corners, blobs, and textured regions) and encode their local neighborhoods into invariant descriptors. Visualizing rich keypoints revealed both the spatial scale (circle radius) and dominant orientation (radial line) assigned to each feature, explaining how descriptors remain matchable even when a target object undergoes rotation, scaling, or viewpoint shifts. Applying Brute-Force matching paired with Lowe's ratio test effectively filtered out ambiguous correspondences, leaving geometrically consistent matches between two image views.",
      "Benchmarking SIFT (used as the scale-invariant fallback where patented SURF is excluded from standard OpenCV 4+/5+ binary distributions) against ORB and BRISK highlighted the classic accuracy-versus-speed trade-off. SIFT produces 128-dimensional floating-point descriptors with strong scale-space precision and clean cross-view matching, but incurs significantly higher extraction latency. Conversely, ORB combines FAST corner detection with binary rBRIEF descriptors (32 bytes per keypoint) and Hamming-distance matching, executing roughly an order of magnitude faster while remaining completely patent-free, albeit with slightly greater sensitivity to extreme scale changes.",
      "Local keypoint detection and descriptor matching underpin numerous real-world geometric computer vision pipelines. They are core components in panoramic image stitching, Simultaneous Localization and Mapping (SLAM) for robotics and drones, augmented reality markerless tracking, 3D multi-view reconstruction (Structure-from-Motion), and visual object retrieval across large image databases.",
    ],
    codeSnippet: `import cv2

img1 = cv2.imread("img1.jpg", cv2.IMREAD_GRAYSCALE)
img2 = cv2.imread("img2.jpg", cv2.IMREAD_GRAYSCALE)

# Use SURF if opencv-contrib nonfree is built, else SIFT / ORB
sift = cv2.SIFT_create(nfeatures=500)
kp1, des1 = sift.detectAndCompute(img1, None)
kp2, des2 = sift.detectAndCompute(img2, None)

# Match with Lowe's Ratio Test
bf = cv2.BFMatcher(cv2.NORM_L2)
matches = [m for m, n in bf.knnMatch(des1, des2, k=2) if m.distance < 0.75 * n.distance]
vis = cv2.drawMatches(img1, kp1, img2, kp2, matches[:45], None)`,
  },
  {
    id: "lab5",
    number: "05",
    title: "PCA in Computer Vision",
    shortTitle: "PCA Eigenfaces",
    week: "Week 7–8",
    topic: "Dimensionality Reduction & Facial Recognition (Eigenfaces + SVM)",
    objective:
      "Apply Principal Component Analysis (PCA) to high-dimensional facial images to extract Eigenfaces, analyze cumulative explained variance, and classify identities using an RBF-kernel SVM.",
    algorithms: ["LFW Dataset", "PCA (svd_solver='randomized', whiten=True)", "Eigenfaces Visualization", "Cumulative Explained Variance", "SVC (RBF Kernel)"],
    procedure: [
      "Load and flatten facial images from the Labeled Faces in the Wild (LFW) dataset and split 80/20 into train/test sets.",
      "Fit PCA on the training set to project high-dimensional pixels into a compact subspace of principal components.",
      "Visualize the top 12 Eigenfaces and plot Cumulative Explained Variance to find the 90% variance threshold.",
      "Train a class-balanced RBF SVM on the PCA projections, evaluate precision/recall/F1, and inspect misclassified faces.",
    ],
    conclusion: [
      "Applying Principal Component Analysis to facial images demonstrated how high-dimensional pixel spaces (e.g., 1,850+ raw pixel features per portrait) can be compressed into a compact, orthogonal subspace of Eigenfaces without sacrificing discriminative structure. Inspecting the top Eigenfaces revealed that early principal components capture global illumination gradients, face contours, and overall head pose, whereas higher-index components encode finer localized details such as eye placement, eyebrows, and mouth shape. Plotting the Cumulative Explained Variance curve quantified the exact dimensionality required to retain 90% of dataset variance.",
      "Training an RBF-kernel Support Vector Machine (SVM) with whiten=True illustrated both the power and limitations of linear subspace methods in facial recognition. Whitening normalizes each projected principal component to unit variance, preventing high-variance lighting components from dominating the SVM kernel distance metric and substantially boosting precision, recall, and F1-scores. However, failure analysis on misclassified test portraits and custom photo projections confirmed that Eigenfaces rely heavily on pixel-aligned spatial correspondence—making the pipeline sensitive to extreme head tilts, occlusions (sunglasses/microphones), background clutter, and lighting shifts compared to modern deep metric embeddings.",
      "Despite deep learning superseding classical Eigenfaces in unconstrained consumer biometrics, PCA remains a vital, mathematically transparent tool across computer vision and machine learning. It is widely applied for feature compression prior to classical classifiers, anomaly and defect detection via reconstruction error, noise filtering, hyperspectral image compression, and exploratory visualization of high-dimensional visual embeddings.",
    ],
    codeSnippet: `from sklearn.datasets import fetch_lfw_people
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
from sklearn.svm import SVC

lfw = fetch_lfw_people(min_faces_per_person=70, resize=0.4)
X_train, X_test, y_train, y_test = train_test_split(lfw.data, lfw.target, test_size=0.2)

pca = PCA(n_components=150, svd_solver="randomized", whiten=True).fit(X_train)
X_train_pca = pca.transform(X_train)
X_test_pca = pca.transform(X_test)

clf = SVC(kernel="rbf", class_weight="balanced", C=5.0).fit(X_train_pca, y_train)
y_pred = clf.predict(X_test_pca)`,
  },
  {
    id: "lab6",
    number: "06",
    title: "YOLOv11 Object Detection",
    shortTitle: "YOLOv11 Detection",
    week: "Week 8–9",
    topic: "Real-Time Object Detection & Custom Dataset Pipeline with YOLOv11",
    objective:
      "Run inference with a pre-trained Ultralytics YOLOv11 model on uploaded images, video clips, or live webcam streams, analyze confidence/IoU thresholds, and design custom YOLO dataset configurations.",
    algorithms: ["Ultralytics YOLOv11n", "Non-Maximum Suppression (IoU)", "Confidence Thresholding", "YOLO Normalized Annotations"],
    procedure: [
      "Provide an image upload, video clip, built-in sample, or live webcam stream.",
      "Configure confidence threshold, IoU NMS threshold, and inference resolution (320/480/640).",
      "Execute YOLOv11 forward pass and inspect bounding boxes, class counts, confidence scores, and inference latency.",
      "Configure custom dataset structure and data.yaml specifications for transfer learning.",
    ],
    conclusion: [
      "Executing Ultralytics YOLOv11 across static images, live webcam streams, and sampled video clips demonstrated the efficiency of modern single-stage object detection architectures. Unlike pure image classification—which assigns a single global label to an entire frame—YOLOv11 simultaneously predicts spatial bounding box coordinates, objectness/class probabilities, and multi-scale detections in a single forward pass. Tuning the confidence threshold, Non-Maximum Suppression (NMS) IoU threshold, and input resolution (320/480/640) directly illustrated the trade-off between inference latency, recall of small objects, and suppression of overlapping duplicate boxes.",
      "Evaluating detections across domain-specific imagery (such as Formula 1 cars and pit-crew scenes) also highlighted the boundaries of pre-trained COCO models. Because a pre-trained model only recognizes the 80 general COCO categories, specialized objects such as an open-wheel race car can be misclassified as a visually similar class (e.g., 'motorcycle' or 'car') or missed under motion blur. This underscores why the custom dataset pipeline—normalized YOLO label formatting, train/validation splitting, and accurate data.yaml configuration—is critical when adapting YOLOv11 via transfer learning to specialized targets.",
      "In industry and real-world deployments, real-time object detectors like YOLOv11 power high-speed perception across autonomous vehicles, traffic analytics, sports broadcasting and motorsport pit-lane telemetry, warehouse inventory automation, retail checkout systems, and perimeter security monitoring where millisecond-level localization is required.",
    ],
    codeSnippet: `from ultralytics import YOLO
import cv2

model = YOLO("yolo11n.pt")
results = model.predict(source="image.jpg", conf=0.30, iou=0.45, imgsz=640)

for box in results[0].boxes:
    x1, y1, x2, y2 = map(int, box.xyxy[0])
    cls_name = results[0].names[int(box.cls[0])]
    conf = float(box.conf[0])
    print(f"{cls_name}: {conf:.2f} [{x1}, {y1}, {x2}, {y2}]")`,
  },
  {
    id: "lab7",
    number: "07",
    title: "Image Segmentation Techniques",
    shortTitle: "Segmentation",
    week: "Week 13",
    topic: "Thresholding, Region-Based, Edge-Based & Semantic Segmentation",
    objective:
      "Implement and compare four major segmentation paradigms: Otsu/Adaptive Thresholding, Region Growing & Watershed, Canny Contour Segmentation, and DeepLabV3 Semantic Segmentation.",
    algorithms: ["Otsu Global Thresholding", "Adaptive Gaussian Threshold", "Region Growing (Seed FloodFill)", "Watershed + Distance Transform", "DeepLabV3 MobileNetV3"],
    procedure: [
      "Apply Otsu's global thresholding and Adaptive Gaussian thresholding to separate foreground from background.",
      "Click a seed point on the image to run Region Growing, and run Watershed with distance transform to separate touching objects.",
      "Extract closed object boundaries using Canny edge detection and contour tracing.",
      "Run DeepLabV3 semantic segmentation to assign pixel-level class labels across natural scenes.",
    ],
    conclusion: [
      "Evaluating thresholding, region-based, edge-based, and deep semantic segmentation side by side clearly illustrated how each paradigm models object boundaries differently. Otsu's global thresholding automatically identifies an optimal intensity split for bimodal, high-contrast images, while Adaptive Gaussian thresholding handles uneven illumination by computing local thresholds per neighborhood. Region Growing expands from a user-selected seed pixel based on intensity similarity, and the Watershed algorithm interprets pixel intensity as a topographic surface—leveraging distance transforms and foreground/background markers to cleanly separate touching objects.",
      "Comparing classical methods against DeepLabV3 semantic segmentation highlighted key algorithmic limitations. Classical approaches depend purely on low-level intensity, gradient, or connectivity cues: edge-based contour segmentation breaks down when edges are noisy or unclosed, Region Growing leaks across weak boundaries if tolerance is too high, and Watershed suffers from over-segmentation on textured natural scenes without careful marker tuning. DeepLabV3 overcomes these failure modes by using dilated (atrous) convolutions and multi-scale spatial pyramid pooling to understand high-level semantic context, accurately masking complex objects like vehicles or people even against textured backgrounds.",
      "Pixel-level segmentation is indispensable whenever knowing exact object shape, area, or scene layout matters more than coarse bounding boxes. Classical thresholding and Watershed remain fast, interpretable staples in cell counting, pill inspection, and industrial metrology, whereas deep semantic segmentation networks like DeepLabV3 and U-Net drive autonomous drivable-lane parsing, medical tumor/organ delineation, satellite land-use mapping, and background replacement in computational photography.",
    ],
    codeSnippet: `import cv2
import torch
from torchvision.models.segmentation import deeplabv3_mobilenet_v3_large

# 1. Otsu & Adaptive Thresholding
_, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 4)

# 2. Region Growing via FloodFill & Watershed
cv2.floodFill(gray.copy(), mask, (seed_x, seed_y), 255, loDiff=22, upDiff=22)

# 3. Semantic Segmentation (DeepLabV3)
model = deeplabv3_mobilenet_v3_large(weights="DEFAULT").eval()
out = model(input_tensor)["out"][0].argmax(0)`,
  },
];
