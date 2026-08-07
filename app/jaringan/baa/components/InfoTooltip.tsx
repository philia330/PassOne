"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex h-5 w-5 items-center justify-center text-slate-400 transition-colors hover:text-purple-500 cursor-help"
        aria-label="Informasi"
      >
        <HelpCircle size={16} />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-normal normal-case leading-relaxed text-slate-200 shadow-xl"
        >
          {text}
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-700 bg-slate-800" />
        </span>
      )}
    </span>
  );
}