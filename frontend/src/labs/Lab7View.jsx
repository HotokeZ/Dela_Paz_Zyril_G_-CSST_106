import { useEffect, useState } from "react";
import InputSourceBar from "../components/InputSourceBar";
import VisionViewport from "../components/VisionViewport";
import SplitCompareSlider from "../components/SplitCompareSlider";
import { runLabApi } from "../utils/api";

export default function Lab7View({ samples }) {
  const [selectedSample, setSelectedSample] = useState("coins");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [compareKey, setCompareKey] = useState("watershed");

  const [params, setParams] = useState({
    adaptive_block: 15,
    adaptive_c: 4,
    seed_x: 180,
    seed_y: 140,
    region_tol: 22,
    watershed_dist: 0.4,
    canny_low: 60,
    canny_high: 150,
    run_semantic: true,
  });

  const execute = async (overrideParams = params) => {
    setLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab7", {
        sample: selectedSample,
        file: uploadedFile,
        params: overrideParams,
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

  const activeSampleMeta = samples.find((s) => s.id === selectedSample);

  const handleSeedClick = (normX, normY) => {
    const w = activeSampleMeta?.width || 400;
    const h = activeSampleMeta?.height || 300;
    const next = {
      ...params,
      seed_x: Math.round(normX * w),
      seed_y: Math.round(normY * h),
    };
    setParams(next);
    execute(next);
  };

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
        onRun={() => execute()}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg border border-[#DC0000] bg-[#DC0000]/15 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Thresholding</div>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Adaptive Block: {params.adaptive_block}</span>
            <input
              type="range"
              min="3"
              max="51"
              step="2"
              value={params.adaptive_block}
              onChange={(e) => setParams({ ...params, adaptive_block: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Adaptive C: {params.adaptive_c}</span>
            <input
              type="range"
              min="-15"
              max="20"
              value={params.adaptive_c}
              onChange={(e) => setParams({ ...params, adaptive_c: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Region Growing &amp; Watershed</div>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Region Tolerance: ±{params.region_tol}</span>
            <input
              type="range"
              min="5"
              max="80"
              value={params.region_tol}
              onChange={(e) => setParams({ ...params, region_tol: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Watershed Dist Ratio: {params.watershed_dist}</span>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={params.watershed_dist}
              onChange={(e) => setParams({ ...params, watershed_dist: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Edge-Based Contours</div>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Canny Low: {params.canny_low}</span>
            <input
              type="range"
              min="10"
              max="200"
              value={params.canny_low}
              onChange={(e) => setParams({ ...params, canny_low: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Canny High: {params.canny_high}</span>
            <input
              type="range"
              min="50"
              max="255"
              value={params.canny_high}
              onChange={(e) => setParams({ ...params, canny_high: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Semantic (DeepLabV3)</div>
          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={params.run_semantic}
              onChange={(e) => setParams({ ...params, run_semantic: e.target.checked })}
              className="accent-[#FFD700]"
            />
            Run DeepLabV3-MobileNetV3
          </label>
          {result?.metrics && (
            <div className="rounded-lg border border-[#1E2B4D] bg-[#060A17] p-2.5 text-[11px] font-mono-tech text-slate-300 space-y-0.5">
              <div>Otsu Thr: <span className="text-[#FFD700]">{result.metrics.otsu_threshold}</span></div>
              <div>Contours: <span className="text-[#FFD700]">{result.metrics.contours_found}</span></div>
              <div>Latency: <span className="text-emerald-400">{result.metrics.processing_ms} ms</span></div>
            </div>
          )}
        </div>
      </div>

      {result?.images && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <VisionViewport
              title="1. Otsu Global Thresholding"
              badge={`T=${result.metrics.otsu_threshold}`}
              src={result.images.otsu}
            />
            <VisionViewport
              title="2. Adaptive Gaussian Thresholding"
              badge={`blk=${params.adaptive_block}`}
              src={result.images.adaptive}
            />
            <VisionViewport
              title="3. Region Growing (Click Seed Point)"
              badge={`${result.metrics.region_area_pct}%`}
              src={result.images.region_growing}
              onImageClick={handleSeedClick}
              interactiveHint={`Seed (${params.seed_x}, ${params.seed_y}) — click to move`}
            />
            <VisionViewport
              title="4. Watershed Segmentation"
              badge="MARKERS"
              src={result.images.watershed}
            />
            <VisionViewport
              title="5. Edge-Based Contours"
              badge={`${result.metrics.contours_found} CONTOURS`}
              src={result.images.edge_contours}
            />
            <VisionViewport
              title="6. Semantic Segmentation (DeepLabV3)"
              badge="PASCAL VOC"
              src={result.images.semantic}
            />
          </div>

          {result.semantic_classes?.length > 0 && (
            <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700] mb-2.5">
                Semantic Class Coverage (DeepLabV3)
              </div>
              <div className="flex flex-wrap gap-2">
                {result.semantic_classes.map((c) => (
                  <div
                    key={c.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#1E2B4D] bg-[#060A17] px-3 py-1.5 text-xs font-mono-tech"
                  >
                    <span
                      className="h-3 w-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-white font-semibold">{c.name}</span>
                    <span className="text-[#FFD700]">{c.coverage_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SplitCompareSlider
            beforeSrc={result.images.original}
            afterSrc={result.images[compareKey] || result.images.watershed}
            beforeLabel="Original"
            afterLabel={compareKey.replace("_", " ").toUpperCase()}
            options={[
              { key: "watershed", label: "Watershed" },
              { key: "region_growing", label: "Region Growing" },
              { key: "edge_contours", label: "Edge Contours" },
              { key: "otsu", label: "Otsu Threshold" },
              ...(result.images.semantic ? [{ key: "semantic", label: "DeepLabV3 Semantic" }] : []),
            ]}
            selectedOption={compareKey}
            onSelectOption={setCompareKey}
          />
        </>
      )}
    </div>
  );
}

