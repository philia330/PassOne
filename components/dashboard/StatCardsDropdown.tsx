"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sublabel?: string;
  gradient?: boolean;
}

function StatCard({ icon, label, value, sublabel, gradient = true }: StatCardProps) {
  if (gradient) {
    return (
      <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-white/80">{label}</p>
            <h2 className="mt-2 text-4xl font-bold">{value}</h2>
            {sublabel && <p className="mt-1 text-sm text-white/80">{sublabel}</p>}
          </div>
          <div className="rounded-2xl bg-white/20 p-4">
            {icon}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>}
        </div>
        <div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-700">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardsDropdownProps {
  stats: StatCardProps[];
  defaultExpanded?: boolean;
}

export function StatCardsDropdown({ stats, defaultExpanded = false }: StatCardsDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Mobile: dropdown version */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {stats.slice(0, 3).map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-3 py-2 text-white"
                  >
                    <span className="text-lg font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <ChevronDown
              size={20}
              className={cn(
                "text-slate-400 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-2 grid gap-3">
            {stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: regular cards */}
      <div className="hidden md:contents">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>
    </div>
  );
}
