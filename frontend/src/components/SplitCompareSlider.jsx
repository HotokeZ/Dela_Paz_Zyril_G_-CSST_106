import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

export default function SplitCompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "Processed",
  options,
  selectedOption,
  onSelectOption,
}) {
  const [pos, setPos] = useState(50);

  if (!beforeSrc || !afterSrc) return null;

  const updatePos = (clientX, rect) => {
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div className="rounded-xl border border-[#1E2B4D] bg-[#0B1224] overflow-hidden shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2B4D] bg-[#0F172A]/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#DC0000]" />
          <span className="text-xs font-bold uppercase tracking-wider font-display text-white">
            Interactive Before / After Comparison
          </span>
        </div>

        {options && options.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono-tech text-slate-400">Compare Layer:</span>
            <select
              value={selectedOption}
              onChange={(e) => onSelectOption(e.target.value)}
              className="rounded border border-[#1E2B4D] bg-[#060A17] px-2.5 py-1 text-xs font-mono-tech text-[#FFD700] focus:outline-none"
            >
              {options.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div
        className="relative h-72 sm:h-96 w-full bg-[#060A17] select-none overflow-hidden cursor-ew-resize"
        onMouseMove={(e) => {
          if (e.buttons === 1) updatePos(e.clientX, e.currentTarget.getBoundingClientRect());
        }}
        onClick={(e) => updatePos(e.clientX, e.currentTarget.getBoundingClientRect())}
        onTouchMove={(e) => {
          if (e.touches[0]) updatePos(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
        }}
      >
        {/* After (Base full layer) */}
        <img
          src={afterSrc}
          alt={afterLabel}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Before (Clipped overlay layer) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        {/* Vertical Divider & Handle */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.8)]"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFD700] bg-[#DC0000] text-white shadow-lg">
            <MoveHorizontal className="h-4 w-4" />
          </div>
        </div>

        {/* Corner Labels */}
        <span className="pointer-events-none absolute top-3 left-3 rounded bg-[#060A17]/85 border border-[#1E41FF]/60 px-2 py-0.5 text-[10px] font-mono-tech text-white">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded bg-[#060A17]/85 border border-[#FFD700]/60 px-2 py-0.5 text-[10px] font-mono-tech text-[#FFD700]">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}

