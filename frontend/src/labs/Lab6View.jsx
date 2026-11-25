import { useEffect, useRef, useState } from "react";
import { Radio, Square, Film, Play, Pause, Upload } from "lucide-react";
import InputSourceBar from "../components/InputSourceBar";
import VisionViewport from "../components/VisionViewport";
import { runLabApi } from "../utils/api";

export default function Lab6View({ samples }) {
  const [mode, setMode] = useState("image"); // "image" | "live" | "video"
  const [selectedSample, setSelectedSample] = useState("coffee");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [params, setParams] = useState({
    conf: 0.3,
    iou: 0.45,
    imgsz: 640,
  });

  // Live webcam stream state
  const liveVideoRef = useRef(null);
  const liveStreamRef = useRef(null);
  const liveActiveRef = useRef(false);
  const [liveActive, setLiveActive] = useState(false);
  const [liveFps, setLiveFps] = useState(0);

  // Video file playback state
  const videoInputRef = useRef(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const [customClasses, setCustomClasses] = useState("helmet, race_car, pit_crew");

  const execute = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab6", {
        sample: selectedSample,
        file: uploadedFile,
        params,
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "image") {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSample, uploadedFile]);

  // Stop webcam stream on unmount or mode change
  const stopLiveStream = () => {
    liveActiveRef.current = false;
    setLiveActive(false);
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopLiveStream();
  }, []);

  const startLiveStream = async () => {
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true });
      liveStreamRef.current = media;
      liveActiveRef.current = true;
      setLiveActive(true);

      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = media;
        }
      }, 60);

      const canvas = document.createElement("canvas");
      const loop = async () => {
        if (!liveActiveRef.current) return;
        const vid = liveVideoRef.current;
        if (vid && vid.readyState >= 2) {
          canvas.width = vid.videoWidth || 640;
          canvas.height = vid.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const tStart = performance.now();
          try {
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
            if (blob && liveActiveRef.current) {
              const file = new File([blob], "live_frame.jpg", { type: "image/jpeg" });
              const data = await runLabApi("/api/lab6", { file, params });
              setResult(data);
              const dt = (performance.now() - tStart) / 1000;
              setLiveFps(dt > 0 ? Number((1 / dt).toFixed(1)) : 0);
            }
          } catch {
            // Continue next frame silently
          }
        }
        if (liveActiveRef.current) {
          setTimeout(loop, 80);
        }
      };
      setTimeout(loop, 400);
    } catch {
      setError("Could not start webcam stream. Please check camera permissions.");
    }
  };

  const handleVideoUpload = async (file) => {
    setVideoLoading(true);
    setError("");
    setPlaying(false);
    setFrameIdx(0);
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("conf", String(params.conf));
      fd.append("iou", String(params.iou));
      fd.append("imgsz", String(params.imgsz));
      const res = await fetch("/api/lab6/video", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video processing failed");
      setVideoResult(data);
      setPlaying(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setVideoLoading(false);
    }
  };

  useEffect(() => {
    if (!playing || !videoResult?.frames?.length) return;
    const id = setInterval(() => {
      setFrameIdx((idx) => (idx + 1) % videoResult.frames.length);
    }, 220);
    return () => clearInterval(id);
  }, [playing, videoResult]);

  const classList = customClasses
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-3">
        <span className="text-xs font-mono-tech uppercase text-[#FFD700] mr-2">Detection Mode:</span>
        {[
          ["image", "Image / Snapshot"],
          ["live", "Live Webcam Stream"],
          ["video", "Video File Upload"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id !== "live") stopLiveStream();
              setMode(id);
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
              mode === id
                ? "bg-[#0038A8] border-[#FFD700] text-white"
                : "bg-[#060A17] border-[#1E2B4D] text-slate-300 hover:border-[#1E41FF]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "image" && (
        <InputSourceBar
          samples={samples}
          selectedSample={selectedSample}
          onSelectSample={(id) => {
            setUploadedFile(null);
            setSelectedSample(id);
          }}
          uploadedFile={uploadedFile}
          onUploadFile={(f) => setUploadedFile(f)}
          onRun={execute}
          loading={loading}
          runLabel="Run YOLOv11 Inference"
        />
      )}

      {mode === "live" && (
        <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <video ref={liveVideoRef} autoPlay playsInline muted className="hidden" />
            <span
              className={`h-3 w-3 rounded-full ${
                liveActive ? "bg-[#DC0000] animate-pulse shadow-[0_0_10px_#DC0000]" : "bg-slate-600"
              }`}
            />
            <div>
              <div className="text-xs font-bold text-white uppercase font-display">
                Real-Time Webcam YOLOv11 Stream
              </div>
              <div className="text-[11px] font-mono-tech text-slate-400">
                {liveActive ? `Streaming @ ${liveFps} FPS` : "Click Start Stream to run continuous detection"}
              </div>
            </div>
          </div>

          {liveActive ? (
            <button
              type="button"
              onClick={stopLiveStream}
              className="inline-flex items-center gap-2 rounded-lg bg-[#DC0000] px-4 py-2 text-xs font-bold uppercase text-white cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop Stream
            </button>
          ) : (
            <button
              type="button"
              onClick={startLiveStream}
              className="inline-flex items-center gap-2 rounded-lg bg-[#FFD700] px-4 py-2 text-xs font-bold uppercase text-[#060A17] cursor-pointer"
            >
              <Radio className="h-3.5 w-3.5" />
              Start Live Stream
            </button>
          )}
        </div>
      )}

      {mode === "video" && (
        <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Film className="h-5 w-5 text-[#FFD700]" />
            <div>
              <div className="text-xs font-bold text-white uppercase font-display">
                Video Clip YOLOv11 Analyzer (.mp4 / .webm / .mov)
              </div>
              <div className="text-[11px] font-mono-tech text-slate-400">
                Samples up to 30 frames evenly across the video and builds an annotated frame player.
              </div>
            </div>
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleVideoUpload(f);
            }}
          />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={videoLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC0000] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#b80000] disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            {videoLoading ? "Analyzing Video..." : "Upload Video Clip"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#DC0000] bg-[#DC0000]/15 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Hyperparameter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
        <label className="flex flex-col gap-1.5 text-xs text-slate-300">
          <span className="font-mono-tech">Confidence Threshold: {params.conf}</span>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={params.conf}
            onChange={(e) => setParams({ ...params, conf: Number(e.target.value) })}
            className="rb-slider"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-slate-300">
          <span className="font-mono-tech">IoU NMS Threshold: {params.iou}</span>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={params.iou}
            onChange={(e) => setParams({ ...params, iou: Number(e.target.value) })}
            className="rb-slider"
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs text-slate-300 font-mono-tech">Image Size (px)</div>
            <div className="flex gap-1.5">
              {[320, 480, 640].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setParams({ ...params, imgsz: sz })}
                  className={`rounded px-2.5 py-1 text-xs font-mono-tech border cursor-pointer ${
                    params.imgsz === sz
                      ? "bg-[#0038A8] border-[#FFD700] text-white"
                      : "bg-[#060A17] border-[#1E2B4D] text-slate-300"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {result && mode !== "video" && (
            <div className="text-right font-mono-tech">
              <div className="text-[10px] text-slate-400">INFERENCE</div>
              <div className="text-sm font-bold text-emerald-400">{result.inference_ms} ms</div>
              <div className="text-[10px] text-[#FFD700]">{result.model_name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Video Mode Player */}
      {mode === "video" && videoResult?.frames?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <VisionViewport
              title={`Annotated Video Frame ${frameIdx + 1}/${videoResult.sampled_frames}`}
              badge={`t=${videoResult.frames[frameIdx].timestamp_s}s`}
              src={videoResult.frames[frameIdx].image}
              subtitle={`Detections: ${videoResult.frames[frameIdx].detections_count} | Avg Inference: ${videoResult.avg_inference_ms} ms`}
            />
            <div className="flex items-center gap-3 rounded-xl border border-[#1E2B4D] bg-[#0B1224] px-4 py-2.5">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="rounded-lg bg-[#FFD700] p-1.5 text-[#060A17] cursor-pointer"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max={videoResult.frames.length - 1}
                value={frameIdx}
                onChange={(e) => {
                  setPlaying(false);
                  setFrameIdx(Number(e.target.value));
                }}
                className="rb-slider flex-1"
              />
              <span className="text-xs font-mono-tech text-slate-300">
                {videoResult.frames[frameIdx].timestamp_s}s
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
              Video Detection Summary
            </div>
            <div className="text-xs font-mono-tech text-slate-300 space-y-1">
              <div>Model: <span className="text-[#FFD700]">{videoResult.model_name}</span></div>
              <div>Total Frames: {videoResult.total_frames} ({videoResult.fps} FPS)</div>
              <div>Avg Latency: <span className="text-emerald-400">{videoResult.avg_inference_ms} ms</span></div>
            </div>
            <div className="border-t border-[#1E2B4D] pt-2.5 space-y-1.5">
              <div className="text-[11px] font-mono-tech text-slate-400 uppercase">Aggregate Class Hits</div>
              {Object.entries(videoResult.aggregate_counts).map(([cls, cnt]) => (
                <div key={cls} className="flex justify-between text-xs font-mono-tech">
                  <span className="text-white">{cls}</span>
                  <span className="text-[#FFD700]">{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image & Live Stream View */}
      {mode !== "video" && result?.images && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <VisionViewport
              title={mode === "live" ? "Live YOLOv11 Stream Output" : "YOLOv11 Detection Output"}
              badge={`${result.total_detections} OBJECTS`}
              src={result.images.annotated}
              subtitle={`Model: ${result.model_name} | Conf ≥ ${result.params.conf} | IoU: ${result.params.iou}`}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] overflow-hidden">
              <div className="border-b border-[#1E2B4D] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#FFD700]">
                Detected Objects ({result.total_detections})
              </div>
              {result.detections.length === 0 ? (
                <div className="p-4 text-xs text-slate-400">
                  No objects detected above confidence {result.params.conf}.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono-tech">
                    <thead className="bg-[#060A17] text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Class</th>
                        <th className="px-3 py-2">Conf</th>
                        <th className="px-3 py-2">Area</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2B4D]/60 text-slate-200">
                      {result.detections.map((d) => (
                        <tr key={d.id}>
                          <td className="px-3 py-2 font-bold text-[#FFD700]">{d.class_name}</td>
                          <td className="px-3 py-2">{d.confidence}%</td>
                          <td className="px-3 py-2">{d.area_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
                Custom Training data.yaml Generator
              </div>
              <input
                type="text"
                value={customClasses}
                onChange={(e) => setCustomClasses(e.target.value)}
                placeholder="class1, class2, ..."
                className="w-full rounded-lg border border-[#1E2B4D] bg-[#060A17] px-3 py-1.5 text-xs font-mono-tech text-slate-100"
              />
              <pre className="rounded-lg border border-[#1E2B4D] bg-[#060A17] p-3 text-[11px] font-mono-tech text-slate-300 overflow-x-auto">
{`train: ./dataset/images/train
val: ./dataset/images/val
nc: ${classList.length}
names: [${classList.map((c) => `'${c}'`).join(", ")}]`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
