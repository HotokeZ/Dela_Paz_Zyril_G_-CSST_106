import { useState } from "react";
import { Code2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

export default function CodeDrawer({ labMeta }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!labMeta?.codeSnippet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(labMeta.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="no-print border-b border-[#1E2B4D]/70 bg-[#080E1E]/90">
      <div className="px-4 sm:px-6 py-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#FFD700] hover:text-white transition cursor-pointer"
        >
          <Code2 className="h-4 w-4 text-[#1E41FF]" />
          <span>View Python / OpenCV Implementation (Lab {labMeta.number})</span>
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {open && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded border border-[#1E2B4D] bg-[#0B1224] px-2.5 py-1 text-[11px] font-mono-tech text-slate-200 hover:border-[#FFD700]/60 cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy Code"}
          </button>
        )}
      </div>

      {open && (
        <div className="px-4 sm:px-6 pb-4">
          <pre className="rounded-xl border border-[#1E2B4D] bg-[#060A17] p-4 text-xs font-mono-tech text-slate-200 overflow-x-auto leading-relaxed">
            <code>{labMeta.codeSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

