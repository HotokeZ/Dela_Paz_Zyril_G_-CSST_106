import { ArrowRight, Cpu, Activity, CheckCircle2 } from "lucide-react";
import { LABS_META } from "../data/labsMeta";

export default function DashboardView({ onSelectTab, backendOk }) {
  return (
    <div className="space-y-6">
      {/* Hero Telemetry Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1E2B4D] bg-gradient-to-br from-[#0B1224] via-[#0F1B38] to-[#060A17] p-6 sm:p-8 shadow-2xl">
        <div className="rb-stripe absolute top-0 left-0 right-0 h-1.5" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10 px-3 py-1 text-xs font-mono-tech text-[#FFD700]">
              <Activity className="h-3.5 w-3.5" />
              <span>CSST106 // PERCEPTION &amp; COMPUTER VISION // AY 2026–2027</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-display">
              Red Bull <span className="text-[#FFD700]">Vision</span> Telemetry Suite
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Unified Web UI compiling all seven Computer Vision laboratory experiments — from fundamental
              pixel matrix manipulation and edge gradients to Eigenface PCA recognition, YOLOv11 object
              detection, and DeepLabV3 semantic segmentation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="rounded-xl border border-[#1E2B4D] bg-[#060A17]/80 px-4 py-3">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">Lab Modules</div>
              <div className="text-2xl font-bold text-[#FFD700] font-mono-tech">07 / 07</div>
            </div>
            <div className="rounded-xl border border-[#1E2B4D] bg-[#060A17]/80 px-4 py-3">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">CV Engine</div>
              <div className="text-sm font-bold text-white font-mono-tech mt-1">OpenCV + Torch</div>
            </div>
            <div className="rounded-xl border border-[#1E2B4D] bg-[#060A17]/80 px-4 py-3 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">API Status</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    backendOk ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-[#DC0000]"
                  }`}
                />
                <span className="text-sm font-bold font-mono-tech text-white">
                  {backendOk ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {LABS_META.map((lab) => (
          <button
            key={lab.id}
            type="button"
            onClick={() => onSelectTab(lab.id)}
            className="group text-left rounded-xl border border-[#1E2B4D] bg-[#0B1224] p-5 hover:border-[#1E41FF] hover:bg-[#0F1830] transition-all shadow-lg flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0038A8]/35 border border-[#1E41FF]/40 px-2.5 py-1 text-xs font-mono-tech font-bold text-[#FFD700]">
                  <Cpu className="h-3.5 w-3.5" />
                  LAB {lab.number}
                </span>
                <span className="text-[11px] font-mono-tech text-slate-400">{lab.week}</span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-[#FFD700] transition font-display">
                {lab.title}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {lab.objective}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {lab.algorithms.slice(0, 3).map((alg) => (
                  <span
                    key={alg}
                    className="rounded bg-[#060A17] border border-[#1E2B4D] px-2 py-0.5 text-[10px] font-mono-tech text-slate-300"
                  >
                    {alg}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E2B4D]/80 flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono-tech">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready
              </span>
              <span className="inline-flex items-center gap-1 text-[#FFD700] group-hover:translate-x-1 transition-transform">
                Launch Module <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

