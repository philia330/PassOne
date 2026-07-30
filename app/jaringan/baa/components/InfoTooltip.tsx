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
        className="flex h-3.5 w-3.5 items-center justify-center text-slate-400 transition-colors hover:text-purple-500"
      >
        <HelpCircle size={12} />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-1.5 w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug text-white shadow-lg"
        >
          {text}
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
        </span>
      )}
    </span>
  );
}