import { useRef, useState } from "react";
import { Upload, Camera, Image as ImageIcon, Play, VideoOff } from "lucide-react";

export default function InputSourceBar({
  samples,
  selectedSample,
  onSelectSample,
  uploadedFile,
  onUploadFile,
  onRun,
  loading,
  runLabel = "Execute Pipeline",
  allowWebcam = true,
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [stream, setStream] = useState(null);

  const openWebcam = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(media);
      setWebcamOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = media;
        }
      }, 60);
    } catch {
      alert("Could not access webcam. Please allow camera permissions or upload an image.");
    }
  };

  const closeWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setWebcamOpen(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "webcam_capture.png", { type: "image/png" });
        onUploadFile(file);
        closeWebcam();
      }
    }, "image/png");
  };

  return (
    <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Sample Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono-tech uppercase text-[#FFD700]">
            <ImageIcon className="h-4 w-4" />
            <span>Input Source:</span>
          </div>

          <select
            value={uploadedFile ? "__uploaded__" : selectedSample}
            onChange={(e) => {
              if (e.target.value !== "__uploaded__") {
                onSelectSample(e.target.value);
              }
            }}
            className="rounded-lg border border-[#1E2B4D] bg-[#060A17] px-3 py-1.5 text-xs text-slate-100 focus:border-[#1E41FF] focus:outline-none"
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.width}×{s.height})
              </option>
            ))}
            {uploadedFile && (
              <option value="__uploaded__">Uploaded: {uploadedFile.name}</option>
            )}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadFile(f);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E41FF]/50 bg-[#0038A8]/25 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-[#0038A8]/45 transition cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-[#FFD700]" />
            Upload Image
          </button>

          {allowWebcam && (
            <button
              type="button"
              onClick={webcamOpen ? closeWebcam : openWebcam}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2B4D] bg-[#121C36] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-[#FFD700]/60 transition cursor-pointer"
            >
              {webcamOpen ? (
                <>
                  <VideoOff className="h-3.5 w-3.5 text-[#DC0000]" />
                  Close Cam
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5 text-[#FFD700]" />
                  Webcam
                </>
              )}
            </button>
          )}
        </div>

        {/* Execute Button */}
        <button
          type="button"
          onClick={onRun}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#DC0000] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#DC0000]/30 hover:bg-[#b80000] disabled:opacity-50 transition cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {loading ? "Processing..." : runLabel}
        </button>
      </div>

      {webcamOpen && (
        <div className="mt-3 flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-[#1E41FF]/40 bg-[#060A17] p-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-44 rounded-lg border border-[#1E2B4D] bg-black object-cover"
          />
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-300">
              Live webcam feed active. Capture a frame to run it through this lab&apos;s Computer Vision pipeline.
            </p>
            <button
              type="button"
              onClick={captureFrame}
              className="w-fit rounded-lg bg-[#FFD700] px-4 py-1.5 text-xs font-bold text-[#060A17] hover:bg-[#eab308] transition"
            >
              Capture Frame &amp; Use Input
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
