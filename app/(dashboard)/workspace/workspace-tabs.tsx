"use client";

import Link from "next/link";
import { WORKSPACE_MODULES, type WorkspaceModuleKey } from "./modules";

export function WorkspaceTabs({ activeView }: { activeView: WorkspaceModuleKey }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
      {WORKSPACE_MODULES.map((mod) => {
        const Icon = mod.icon;
        const active = mod.key === activeView;

        return (
          <Link
            key={mod.key}
            href={`/workspace?view=${mod.key}`}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={16} />
            {mod.title}
          </Link>
        );
      })}
    </div>
  );
}