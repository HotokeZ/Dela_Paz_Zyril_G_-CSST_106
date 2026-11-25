import { useRef, useState } from "react";
import { Maximize2, X, Crosshair } from "lucide-react";

export default function VisionViewport({
  title,
  badge,
  src,
  subtitle,
  onImageClick,
  onAreaSelect,
  interactiveHint,
  aspectClass = "aspect-[4/3]",
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragBox, setDragBox] = useState(null);
  const dragStartRef = useRef(null);

  const getNormCoords = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      nx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      ny: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if ((!onAreaSelect && !onImageClick) || !src) return;
    const pt = getNormCoords(e);
    dragStartRef.current = pt;
    if (onAreaSelect) {
      setDragBox({ x1: pt.px, y1: pt.py, x2: pt.px, y2: pt.py });
    }
  };

  const handleMouseMove = (e) => {
    if (!dragStartRef.current || !onAreaSelect) return;
    const pt = getNormCoords(e);
    setDragBox({ x1: dragStartRef.current.px, y1: dragStartRef.current.py, x2: pt.px, y2: pt.py });
  };

  const handleMouseUp = (e) => {
    if (!dragStartRef.current) return;
    const start = dragStartRef.current;
    const end = getNormCoords(e);
    dragStartRef.current = null;
    setDragBox(null);

    const movedPx = Math.hypot(end.px - start.px, end.py - start.py);
    if (onAreaSelect && movedPx > 8) {
      onAreaSelect(
        Math.min(start.nx, end.nx),
        Math.min(start.ny, end.ny),
        Math.max(start.nx, end.nx),
        Math.max(start.ny, end.ny)
      );
    } else if (onImageClick) {
      onImageClick(end.nx, end.ny);
    }
  };

  return (
    <>
      <div className="group relative flex flex-col rounded-xl border border-[#1E2B4D] bg-[#0B1224] overflow-hidden shadow-lg shadow-black/40">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#1E2B4D] bg-[#0F172A]/80 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-[#FFD700] shrink-0" />
            <span className="text-xs font-semibold tracking-wide text-slate-100 truncate font-display uppercase">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {badge && (
              <span className="rounded bg-[#0038A8]/40 border border-[#1E41FF]/50 px-1.5 py-0.5 text-[10px] font-mono-tech text-[#FFD700]">
                {badge}
              </span>
            )}
            {src && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="rounded p-1 text-slate-400 hover:bg-[#1E2B4D] hover:text-white transition"
                title="Expand viewport"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Viewport Canvas */}
        <div
          className={`relative ${aspectClass} w-full bg-[#060A17] flex items-center justify-center overflow-hidden ${
            onImageClick || onAreaSelect ? "cursor-crosshair" : ""
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {dragBox && (
            <div
              className="pointer-events-none absolute border-2 border-[#FFD700] bg-[#FFD700]/20 z-20"
              style={{
                left: Math.min(dragBox.x1, dragBox.x2),
                top: Math.min(dragBox.y1, dragBox.y2),
                width: Math.abs(dragBox.x2 - dragBox.x1),
                height: Math.abs(dragBox.y2 - dragBox.y1),
              }}
            />
          )}

          {/* Telemetry Corner Reticles */}
          <span className="pointer-events-none absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2 border-[#FFD700]/70 z-10" />
          <span className="pointer-events-none absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2 border-[#FFD700]/70 z-10" />
          <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-[#DC0000]/80 z-10" />
          <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[#DC0000]/80 z-10" />

          {src ? (
            <img
              src={src}
              alt={title}
              className="h-full w-full object-contain select-none"
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500 text-xs font-mono-tech">
              <Crosshair className="h-6 w-6 opacity-40" />
              <span>AWAITING_SIGNAL</span>
            </div>
          )}

          {interactiveHint && src && (
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#060A17]/85 border border-[#FFD700]/40 px-2.5 py-0.5 text-[10px] font-mono-tech text-[#FFD700] whitespace-nowrap">
              {interactiveHint}
            </div>
          )}
        </div>

        {subtitle && (
          <div className="border-t border-[#1E2B4D]/70 bg-[#080E1E] px-3 py-1.5 text-[11px] font-mono-tech text-slate-400 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {expanded && src && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative max-w-5xl w-full rounded-2xl border border-[#1E41FF]/50 bg-[#0B1224] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2B4D]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#DC0000]" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-display text-white">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1E2B4D] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[78vh] flex items-center justify-center bg-[#060A17] rounded-xl overflow-hidden">
              <img src={src} alt={title} className="max-h-[76vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
