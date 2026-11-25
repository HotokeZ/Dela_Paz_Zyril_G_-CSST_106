import { useEffect, useState } from "react";
import InputSourceBar from "../components/InputSourceBar";
import VisionViewport from "../components/VisionViewport";
import SplitCompareSlider from "../components/SplitCompareSlider";
import { runLabApi } from "../utils/api";

export default function Lab2View({ samples }) {
  const [selectedSample, setSelectedSample] = useState("rb_target");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [compareKey, setCompareKey] = useState("canny");

  const [params, setParams] = useState({
    blur_ksize: 3,
    sobel_ksize: 3,
    canny_low: 100,
    canny_high: 200,
  });

  const execute = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab2", {
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
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSample, uploadedFile]);

  return (
    <div className="space-y-5">
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
      />

      {error && (
        <div className="rounded-lg border border-[#DC0000] bg-[#DC0000]/15 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Controls & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
        <div className="space-y-2">
          <label className="flex flex-col gap-1.5 text-xs text-slate-300">
            <span className="font-mono-tech">Gaussian Blur Kernel: {params.blur_ksize}×{params.blur_ksize}</span>
            <input
              type="range"
              min="1"
              max="15"
              step="2"
              value={params.blur_ksize}
              onChange={(e) => setParams({ ...params, blur_ksize: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-slate-300">
            <span className="font-mono-tech">Sobel Kernel Size: {params.sobel_ksize}×{params.sobel_ksize}</span>
            <input
              type="range"
              min="1"
              max="7"
              step="2"
              value={params.sobel_ksize}
              onChange={(e) => setParams({ ...params, sobel_ksize: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex flex-col gap-1.5 text-xs text-slate-300">
            <span className="font-mono-tech">Canny Low Threshold: {params.canny_low}</span>
            <input
              type="range"
              min="0"
              max="255"
              value={params.canny_low}
              onChange={(e) => setParams({ ...params, canny_low: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-slate-300">
            <span className="font-mono-tech">Canny High Threshold: {params.canny_high}</span>
            <input
              type="range"
              min="0"
              max="255"
              value={params.canny_high}
              onChange={(e) => setParams({ ...params, canny_high: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>

        {result?.metrics && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-[#1E2B4D] bg-[#060A17] p-3">
              <div className="text-[10px] font-mono-tech text-slate-400">CANNY EDGE DENSITY</div>
              <div className="text-lg font-bold font-mono-tech text-[#FFD700]">
                {result.metrics.canny_edge_pct}%
              </div>
            </div>
            <div className="rounded-lg border border-[#1E2B4D] bg-[#060A17] p-3">
              <div className="text-[10px] font-mono-tech text-slate-400">SOBEL ACTIVE</div>
              <div className="text-lg font-bold font-mono-tech text-white">
                {result.metrics.sobel_active_pct}%
              </div>
            </div>
            <div className="rounded-lg border border-[#1E2B4D] bg-[#060A17] p-3">
              <div className="text-[10px] font-mono-tech text-slate-400">MAX GRADIENT</div>
              <div className="text-sm font-bold font-mono-tech text-slate-200">
                {result.metrics.max_gradient}
              </div>
            </div>
            <div className="rounded-lg border border-[#1E2B4D] bg-[#060A17] p-3">
              <div className="text-[10px] font-mono-tech text-slate-400">LATENCY</div>
              <div className="text-sm font-bold font-mono-tech text-emerald-400">
                {result.metrics.processing_ms} ms
              </div>
            </div>
          </div>
        )}
      </div>

      {result?.images && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VisionViewport title="Original Image" badge="INPUT" src={result.images.original} />
            <VisionViewport
              title="Sobel Combined Magnitude"
              badge={`k=${result.params.sobel_ksize}`}
              src={result.images.sobel_combined}
            />
            <VisionViewport
              title="Canny Edge Detector"
              badge={`${result.params.canny_low}/${result.params.canny_high}`}
              src={result.images.canny}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VisionViewport title="Gaussian Smoothed" badge={`k=${result.params.blur_ksize}`} src={result.images.blurred} />
            <VisionViewport title="Sobel X Gradient (Gx)" badge="dx=1" src={result.images.sobel_x} />
            <VisionViewport title="Sobel Y Gradient (Gy)" badge="dy=1" src={result.images.sobel_y} />
          </div>

          <SplitCompareSlider
            beforeSrc={result.images.original}
            afterSrc={result.images[compareKey]}
            beforeLabel="Original"
            afterLabel={compareKey === "canny" ? "Canny Edges" : "Sobel Magnitude"}
            options={[
              { key: "canny", label: "Canny Edge Map" },
              { key: "sobel_combined", label: "Sobel Magnitude" },
              { key: "blurred", label: "Gaussian Blurred" },
            ]}
            selectedOption={compareKey}
            onSelectOption={setCompareKey}
          />
        </>
      )}
    </div>
  );
}

