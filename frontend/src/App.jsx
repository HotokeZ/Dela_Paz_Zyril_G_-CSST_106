import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Eye,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { LABS_META } from "./data/labsMeta";
import CodeDrawer from "./components/CodeDrawer";
import DashboardView from "./components/DashboardView";
import Lab1View from "./labs/Lab1View";
import Lab2View from "./labs/Lab2View";
import Lab3View from "./labs/Lab3View";
import Lab4View from "./labs/Lab4View";
import Lab5View from "./labs/Lab5View";
import Lab6View from "./labs/Lab6View";
import Lab7View from "./labs/Lab7View";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [samples, setSamples] = useState([]);
  const [backendOk, setBackendOk] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => setBackendOk(r.ok))
      .catch(() => setBackendOk(false));

    fetch("/api/samples")
      .then((r) => r.json())
      .then((d) => setSamples(d.samples || []))
      .catch(() => {});
  }, []);

  const currentLabMeta = LABS_META.find((l) => l.id === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onSelectTab={setActiveTab} backendOk={backendOk} />;
      case "lab1":
        return <Lab1View samples={samples} />;
      case "lab2":
        return <Lab2View samples={samples} />;
      case "lab3":
        return <Lab3View samples={samples} />;
      case "lab4":
        return <Lab4View samples={samples} />;
      case "lab5":
        return <Lab5View />;
      case "lab6":
        return <Lab6View samples={samples} />;
      case "lab7":
        return <Lab7View samples={samples} />;
      default:
        return <DashboardView onSelectTab={setActiveTab} backendOk={backendOk} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060A17] text-slate-100 cv-grid-bg">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[#1E2B4D] bg-[#080E1E] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="rb-stripe h-1 w-full" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2B4D]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DC0000] text-white shadow-md shadow-[#DC0000]/40">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide font-display text-white">
                RB // VISION LAB
              </div>
              <div className="text-[10px] font-mono-tech text-[#FFD700]">
                CSST106 COMPILATION
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("dashboard");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#0038A8] text-white border border-[#FFD700]/60"
                : "text-slate-300 hover:bg-[#121C36]"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-[#FFD700]" />
            <span>Pit-Wall Overview</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] font-mono-tech uppercase tracking-widest text-slate-500">
            Laboratory Activities
          </div>

          {LABS_META.map((lab) => {
            const active = activeTab === lab.id;
            return (
              <button
                key={lab.id}
                type="button"
                onClick={() => {
                  setActiveTab(lab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition cursor-pointer ${
                  active
                    ? "bg-[#0038A8] text-white border border-[#FFD700]/70 shadow-md shadow-[#0038A8]/30"
                    : "text-slate-300 hover:bg-[#121C36]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono-tech font-bold ${
                      active ? "bg-[#FFD700] text-[#060A17]" : "bg-[#121C36] text-[#FFD700]"
                    }`}
                  >
                    {lab.number}
                  </span>
                  <span className="text-xs font-medium truncate">{lab.shortTitle}</span>
                </div>
                {active && <ChevronRight className="h-3.5 w-3.5 text-[#FFD700] shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#1E2B4D] p-4 text-[11px] font-mono-tech text-slate-400">
          <div className="flex items-center justify-between">
            <span>CV Backend</span>
            <span className={backendOk ? "text-emerald-400" : "text-[#DC0000]"}>
              {backendOk ? "● CONNECTED" : "● DISCONNECTED"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#1E2B4D] bg-[#060A17]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg border border-[#1E2B4D] p-2 text-slate-300 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              {currentLabMeta ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#DC0000] px-2 py-0.5 text-[10px] font-mono-tech font-bold text-white">
                      LAB {currentLabMeta.number}
                    </span>
                    <span className="text-[11px] font-mono-tech text-[#FFD700]">
                      {currentLabMeta.week}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-display truncate">
                    {currentLabMeta.title}
                  </h2>
                </>
              ) : (
                <h2 className="text-base sm:text-lg font-bold text-white font-display truncate">
                  CSST106 // Computer Vision Telemetry Dashboard
                </h2>
              )}
            </div>
          </div>

          {currentLabMeta && (
            <div className="hidden xl:flex items-center gap-1.5">
              {currentLabMeta.algorithms.slice(0, 3).map((alg) => (
                <span
                  key={alg}
                  className="rounded-md border border-[#1E2B4D] bg-[#0B1224] px-2.5 py-1 text-[10px] font-mono-tech text-slate-300"
                >
                  {alg}
                </span>
              ))}
            </div>
          )}
        </header>

        {currentLabMeta && (
          <>
            <div className="border-b border-[#1E2B4D]/70 bg-[#0B1224]/70 px-4 sm:px-6 py-2.5 text-xs text-slate-300">
              <span className="font-bold text-[#FFD700] uppercase font-mono-tech mr-2">Objective:</span>
              {currentLabMeta.objective}
            </div>
            <CodeDrawer labMeta={currentLabMeta} />
          </>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
