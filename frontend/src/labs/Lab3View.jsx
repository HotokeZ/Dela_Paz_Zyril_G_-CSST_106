import { useEffect, useState } from "react";
import InputSourceBar from "../components/InputSourceBar";
import VisionViewport from "../components/VisionViewport";
import SplitCompareSlider from "../components/SplitCompareSlider";
import { runLabApi } from "../utils/api";

function MiniHistogram({ bins, color = "#FFD700", label }) {
  if (!bins || bins.length === 0) return null;
  const maxVal = Math.max(...bins, 1);
  return (
    <div className="rounded-xl border border-[#1E2B4D] bg-[#060A17] p-3">
      <div className="text-[11px] font-mono-tech uppercase text-slate-300 mb-2">{label}</div>
      <div className="flex items-end gap-[1px] h-24 w-full">
        {bins.map((val, i) => (
          <div
            key={i}
            style={{
              height: `${Math.max(2, (val / maxVal) * 100)}%`,
              backgroundColor: color,
            }}
            className="flex-1 rounded-t-[1px] opacity-85"
          />
        ))}
      </div>
    </div>
  );
}

export default function Lab3View({ samples }) {
  const [selectedSample, setSelectedSample] = useState("low_contrast");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [compareKey, setCompareKey] = useState("clahe");

  const [params, setParams] = useState({
    color_mode: "grayscale",
    clip_limit: 2.5,
    tile_size: 8,
    alpha: 1.8,
    beta: -40,
  });

  const execute = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab3", {
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

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Color Space Mode</div>
          <div className="flex gap-2">
            {[
              ["grayscale", "Grayscale"],
              ["color_yuv", "Color (YUV Luminance)"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setParams({ ...params, color_mode: val })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition cursor-pointer ${
                  params.color_mode === val
                    ? "bg-[#0038A8] border-[#FFD700] text-white"
                    : "bg-[#060A17] border-[#1E2B4D] text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">CLAHE Clip Limit: {params.clip_limit}</span>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={params.clip_limit}
              onChange={(e) => setParams({ ...params, clip_limit: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">CLAHE Tile Grid: {params.tile_size}×{params.tile_size}</span>
            <input
              type="range"
              min="2"
              max="24"
              step="2"
              value={params.tile_size}
              onChange={(e) => setParams({ ...params, tile_size: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Linear Contrast (α): {params.alpha}</span>
            <input
              type="range"
              min="0.4"
              max="3.2"
              step="0.1"
              value={params.alpha}
              onChange={(e) => setParams({ ...params, alpha: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Brightness Offset (β): {params.beta}</span>
            <input
              type="range"
              min="-100"
              max="100"
              step="5"
              value={params.beta}
              onChange={(e) => setParams({ ...params, beta: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>
      </div>

      {result?.images && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <VisionViewport
              title="Original"
              badge={`σ=${result.stats.original.std}`}
              src={result.images.original}
              subtitle={`Mean: ${result.stats.original.mean} | Range: [${result.stats.original.min}, ${result.stats.original.max}]`}
              histogram={{ bins: result.histograms.original, color: "#94A3B8", label: "Original Histogram" }}
            />
            <VisionViewport
              title="Global Equalized"
              badge={`σ=${result.stats.equalized.std}`}
              src={result.images.equalized}
              subtitle={`Mean: ${result.stats.equalized.mean} | Range: [${result.stats.equalized.min}, ${result.stats.equalized.max}]`}
              histogram={{ bins: result.histograms.equalized, color: "#1E41FF", label: "Global Equalized Histogram" }}
            />
            <VisionViewport
              title="Linear Contrast"
              badge={`α=${result.params.alpha}`}
              src={result.images.linear}
              subtitle={`Mean: ${result.stats.linear.mean} | σ: ${result.stats.linear.std}`}
              histogram={{ bins: result.histograms.linear, color: "#DC0000", label: "Linear Contrast Histogram" }}
            />
            <VisionViewport
              title="CLAHE Adaptive"
              badge={`clip=${result.params.clip_limit}`}
              src={result.images.clahe}
              subtitle={`Mean: ${result.stats.clahe.mean} | σ: ${result.stats.clahe.std}`}
              histogram={{ bins: result.histograms.clahe, color: "#FFD700", label: "CLAHE Histogram" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MiniHistogram bins={result.histograms.original} color="#94A3B8" label="Original Histogram" />
            <MiniHistogram bins={result.histograms.equalized} color="#1E41FF" label="Global Equalized Histogram" />
            <MiniHistogram bins={result.histograms.linear} color="#DC0000" label="Linear Contrast Histogram" />
            <MiniHistogram bins={result.histograms.clahe} color="#FFD700" label="CLAHE Histogram" />
          </div>

          <SplitCompareSlider
            beforeSrc={result.images.original}
            afterSrc={result.images[compareKey]}
            beforeLabel="Original"
            afterLabel={compareKey.toUpperCase()}
            options={[
              { key: "clahe", label: "CLAHE Adaptive" },
              { key: "equalized", label: "Global Equalized" },
              { key: "linear", label: "Linear Contrast" },
            ]}
            selectedOption={compareKey}
            onSelectOption={setCompareKey}
          />
        </>
      )}
    </div>
  );
}

