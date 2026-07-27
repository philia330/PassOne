"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const OltSecretCell = ({
  value,
}: {
  value: string | null;
}) => {
  const [visible, setVisible] = useState(false);

  if (!value) {
    return <span className="text-slate-400 dark:text-slate-500">-</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
        {visible ? value : "•".repeat(Math.min(value.length, 10))}
      </span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        title={visible ? "Sembunyikan" : "Tampilkan"}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};