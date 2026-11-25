import { useEffect, useRef, useState } from "react";
import { Play, Upload, UserCheck } from "lucide-react";
import VisionViewport from "../components/VisionViewport";
import { runLabApi } from "../utils/api";

function VarianceChart({ curve, comp90 }) {
  if (!curve || curve.length === 0) return null;
  const maxComp = curve[curve.length - 1].component;
  const w = 520;
  const h = 180;
  const pad = 28;

  const pts = curve
    .map((p) => {
      const x = pad + (p.component / maxComp) * (w - pad * 2);
      const y = h - pad - (p.variance / 100) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const y90 = h - pad - 0.9 * (h - pad * 2);

  return (
    <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
          Cumulative Explained Variance
        </span>
        <span className="text-xs font-mono-tech text-slate-300">
          90% Threshold:{" "}
          <strong className="text-[#FFD700]">
            {comp90 ? `${comp90} components` : "Increase n_components"}
          </strong>
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 bg-[#060A17] rounded-lg border border-[#1E2B4D]">
        <line x1={pad} y1={y90} x2={w - pad} y2={y90} stroke="#DC0000" strokeDasharray="4 4" strokeWidth="1.5" />
        <text x={pad + 4} y={y90 - 4} fill="#DC0000" fontSize="10" fontFamily="JetBrains Mono">
          90% Variance
        </text>
        <polyline fill="none" stroke="#FFD700" strokeWidth="2.5" points={pts} />
        <text x={pad} y={h - 6} fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
          1
        </text>
        <text x={w - pad - 24} y={h - 6} fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
          {maxComp}
        </text>
      </svg>
    </div>
  );
}

export default function Lab5View() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [predLoading, setPredLoading] = useState(false);
  const [predResult, setPredResult] = useState(null);
  const faceInputRef = useRef(null);

  const [params, setParams] = useState({
    n_components: 150,
    whiten: true,
    svm_c: 5.0,
  });

  const execute = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab5", { params });
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
  }, []);

  const handlePredictFace = async ({ file, sample }) => {
    setPredLoading(true);
    setError("");
    try {
      const data = await runLabApi("/api/lab5/predict", {
        file,
        sample,
        params,
      });
      setPredResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setPredLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex flex-col gap-1 text-xs text-slate-300 min-w-[180px]">
            <span className="font-mono-tech">n_components: {params.n_components}</span>
            <input
              type="range"
              min="20"
              max="220"
              step="10"
              value={params.n_components}
              onChange={(e) => setParams({ ...params, n_components: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-300 min-w-[160px]">
            <span className="font-mono-tech">SVM C: {params.svm_c}</span>
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={params.svm_c}
              onChange={(e) => setParams({ ...params, svm_c: Number(e.target.value) })}
              className="rb-slider"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={params.whiten}
              onChange={(e) => setParams({ ...params, whiten: e.target.checked })}
              className="accent-[#FFD700]"
            />
            <span className="font-mono-tech">whiten=True</span>
          </label>
        </div>

        <button
          type="button"
          onClick={execute}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#DC0000] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#b80000] disabled:opacity-50 transition cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {loading ? "Training PCA + SVM..." : "Run PCA & Train SVM"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#DC0000] bg-[#DC0000]/15 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Dataset & Model Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ["Dataset", result.dataset.source.split("(")[0].trim()],
              ["Samples / Classes", `${result.dataset.n_samples} / ${result.dataset.n_classes}`],
              ["Raw Features", `${result.dataset.n_features} (${result.dataset.image_shape})`],
              ["SVM Accuracy", `${result.metrics.accuracy}%`],
              ["Retained Variance", `${result.metrics.total_variance_pct}%`],
              ["PCA + SVM Time", `${result.metrics.pca_ms + result.metrics.svm_ms} ms`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] px-3 py-2.5">
                <div className="text-[10px] font-mono-tech uppercase text-slate-400">{k}</div>
                <div className="text-xs font-bold font-mono-tech text-[#FFD700] mt-0.5 truncate">{v}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <VarianceChart curve={result.variance_curve} comp90={result.metrics.components_for_90_pct} />

            {/* Classification Report */}
            <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] overflow-hidden">
              <div className="border-b border-[#1E2B4D] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#FFD700]">
                SVM Classification Report (Test Set)
              </div>
              <div className="max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono-tech">
                  <thead className="bg-[#060A17] text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Identity</th>
                      <th className="px-3 py-2">Precision</th>
                      <th className="px-3 py-2">Recall</th>
                      <th className="px-3 py-2">F1</th>
                      <th className="px-3 py-2">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2B4D]/60 text-slate-200">
                    {result.report.map((r) => (
                      <tr key={r.name}>
                        <td className="px-3 py-1.5 font-semibold text-white">{r.name}</td>
                        <td className="px-3 py-1.5">{r.precision}%</td>
                        <td className="px-3 py-1.5">{r.recall}%</td>
                        <td className="px-3 py-1.5 text-[#FFD700]">{r.f1}%</td>
                        <td className="px-3 py-1.5">{r.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Interactive Custom Face Projection & Prediction */}
          <div className="rounded-xl border border-[#1E41FF]/50 bg-[#0B1224] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFD700]">
                  <UserCheck className="h-4 w-4" />
                  <span>Custom Face Projection &amp; SVM Prediction</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload any portrait photo to crop/project onto the {params.n_components} Eigenfaces, view its PCA reconstruction, and predict the closest LFW identity.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={faceInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePredictFace({ file: f });
                  }}
                />
                <button
                  type="button"
                  onClick={() => handlePredictFace({ sample: "astronaut" })}
                  disabled={predLoading}
                  className="rounded-lg border border-[#1E2B4D] bg-[#121C36] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-[#FFD700]/60 cursor-pointer"
                >
                  Test Astronaut Sample
                </button>
                <button
                  type="button"
                  onClick={() => faceInputRef.current?.click()}
                  disabled={predLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0038A8] border border-[#FFD700]/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#002d88] cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-[#FFD700]" />
                  {predLoading ? "Projecting..." : "Upload Face Photo"}
                </button>
              </div>
            </div>

            {predResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <VisionViewport
                  title="Preprocessed Face Crop"
                  badge={predResult.face_detected ? "HAAR FACE" : "CENTER CROP"}
                  src={predResult.input_face}
                  aspectClass="aspect-square"
                />
                <VisionViewport
                  title={`Eigenface Reconstruction (${params.n_components} PCs)`}
                  badge="INVERSE PCA"
                  src={predResult.reconstructed_face}
                  aspectClass="aspect-square"
                />
                <div className="rounded-xl border border-[#1E2B4D] bg-[#060A17] p-4 space-y-3">
                  <div className="text-[10px] font-mono-tech uppercase text-slate-400">
                    Closest LFW Identity Match
                  </div>
                  <div className="text-lg font-bold text-[#FFD700] font-display">
                    {predResult.predicted_name}
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#1E2B4D]">
                    {predResult.top_matches.map((m) => (
                      <div key={m.name} className="flex items-center justify-between text-xs font-mono-tech">
                        <span className="text-slate-300 truncate">{m.name}</span>
                        <span className="text-[#FFD700]">{m.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top 12 Eigenfaces Gallery */}
          <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#FFD700] mb-3">
              Top 12 Extracted Eigenfaces (Principal Components)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2.5">
              {result.eigenfaces.map((ef) => (
                <div key={ef.index} className="rounded-lg border border-[#1E2B4D] bg-[#060A17] p-1.5 text-center">
                  <img src={ef.image} alt={`Eigenface ${ef.index}`} className="w-full rounded object-contain" />
                  <div className="mt-1 text-[10px] font-mono-tech text-slate-400">PC #{ef.index}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Correct vs Misclassified Failure Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                Correct Predictions (Test Samples)
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {result.correct_samples.map((s, i) => (
                  <div key={i} className="rounded-lg border border-emerald-500/30 bg-[#060A17] p-1.5">
                    <img src={s.image} alt={s.actual} className="w-full rounded" />
                    <div className="mt-1 text-[10px] font-mono-tech text-emerald-300 truncate">{s.predicted}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#DC0000] mb-3">
                Failure Analysis (Misclassified Test Faces)
              </div>
              {result.failures.length === 0 ? (
                <p className="text-xs text-slate-400">No misclassifications on the test set!</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {result.failures.map((f, i) => (
                    <div key={i} className="rounded-lg border border-[#DC0000]/40 bg-[#060A17] p-1.5">
                      <img src={f.image} alt={f.actual} className="w-full rounded" />
                      <div className="mt-1 text-[9px] font-mono-tech text-red-300 truncate" title={`Pred: ${f.predicted}`}>
                        P: {f.predicted}
                      </div>
                      <div className="text-[9px] font-mono-tech text-slate-400 truncate" title={`True: ${f.actual}`}>
                        T: {f.actual}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
