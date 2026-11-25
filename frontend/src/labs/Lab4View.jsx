import { useEffect, useRef, useState } from "react";
import { Upload, AlertTriangle } from "lucide-react";
import InputSourceBar from "../components/InputSourceBar";
import VisionViewport from "../components/VisionViewport";
import { runLabApi } from "../utils/api";

export default function Lab4View({ samples }) {
  const [selectedSample, setSelectedSample] = useState("chelsea");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [secondFile, setSecondFile] = useState(null);
  const secondInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [params, setParams] = useState({
    detector: "SURF",
    hessian_threshold: 400,
    max_features: 500,
    upright: false,
  });

  const execute = async (overrideParams = params) => {
    setLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab4", {
        sample: selectedSample,
        file: uploadedFile,
        file2: secondFile,
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
  }, [selectedSample, uploadedFile, secondFile]);

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

      {result?.note && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#FFD700]/40 bg-[#FFD700]/10 px-4 py-3 text-xs text-[#FFD700]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{result.note}</span>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">Feature Detector</div>
          <div className="flex flex-wrap gap-2">
            {["SURF", "SIFT", "ORB", "BRISK"].map((det) => (
              <button
                key={det}
                type="button"
                onClick={() => {
                  const next = { ...params, detector: det };
                  setParams(next);
                  execute(next);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono-tech font-bold border transition cursor-pointer ${
                  params.detector === det
                    ? "bg-[#0038A8] border-[#FFD700] text-white"
                    : "bg-[#060A17] border-[#1E2B4D] text-slate-300"
                }`}
              >
                {det}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 pt-1">
            <input
              type="checkbox"
              checked={params.upright}
              onChange={(e) => setParams({ ...params, upright: e.target.checked })}
              className="accent-[#FFD700]"
            />
            U-SURF Mode (Upright / Orientation-Fixed)
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Hessian Threshold: {params.hessian_threshold}</span>
            <input
              type="range"
              min="100"
              max="1200"
              step="50"
              value={params.hessian_threshold}
              onChange={(e) => setParams({ ...params, hessian_threshold: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-mono-tech">Max Features (SIFT/ORB): {params.max_features}</span>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={params.max_features}
              onChange={(e) => setParams({ ...params, max_features: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
            Secondary Image (Matching)
          </div>
          <input
            ref={secondInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSecondFile(e.target.files?.[0] || null)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => secondInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E41FF]/50 bg-[#0038A8]/25 px-3 py-1.5 text-xs text-slate-100 hover:bg-[#0038A8]/45 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-[#FFD700]" />
              {secondFile ? secondFile.name : "Upload Target Image 2"}
            </button>
            {secondFile && (
              <button
                type="button"
                onClick={() => setSecondFile(null)}
                className="text-xs text-[#DC0000] hover:underline"
              >
                Reset to Auto-Transform
              </button>
            )}
          </div>
          {result && (
            <div className="text-[11px] font-mono-tech text-slate-400">
              Active: <span className="text-[#FFD700]">{result.actual_method}</span> •{" "}
              {result.keypoints_count} keypoints • {result.matches_count} good matches
            </div>
          )}
        </div>
      </div>

      {result?.images && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <VisionViewport
              title="Rich Keypoints Visualization"
              badge={`${result.keypoints_count} KP`}
              src={result.images.keypoints}
              subtitle={`Descriptor Matrix: ${result.descriptor_shape} | Time: ${result.elapsed_ms} ms`}
            />
            <VisionViewport
              title="Feature Matching (Image A ↔ Image B)"
              badge={`${result.matches_count} MATCHES`}
              src={result.images.matches}
              subtitle={result.match_source}
            />
          </div>

          {/* Benchmark Comparison Table */}
          <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] overflow-hidden">
            <div className="border-b border-[#1E2B4D] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#FFD700]">
              Detector Benchmark Comparison (Same Input)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-tech">
                <thead className="bg-[#060A17] text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Algorithm</th>
                    <th className="px-4 py-2.5">Keypoints Detected</th>
                    <th className="px-4 py-2.5">Descriptor Shape</th>
                    <th className="px-4 py-2.5">Execution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2B4D]/60 text-slate-200">
                  {result.comparison.map((row) => (
                    <tr key={row.method} className="hover:bg-[#121C36]/50">
                      <td className="px-4 py-2.5 font-bold text-[#FFD700]">{row.method}</td>
                      <td className="px-4 py-2.5">{row.keypoints}</td>
                      <td className="px-4 py-2.5">{row.descriptor_shape}</td>
                      <td className="px-4 py-2.5 text-emerald-400">{row.time_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

