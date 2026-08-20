"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyText = "Tidak ditemukan",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-100 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-900",
          className
        )}
      >
        <span className={cn("truncate", !selected && "text-slate-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="flex-shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <Search size={15} className="flex-shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X size={14} className="text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-1 dropdown-scroll">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">{emptyText}</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-slate-800",
                    opt.value === value && "bg-purple-50 font-semibold text-purple-700 dark:bg-slate-800"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check size={14} className="flex-shrink-0 text-purple-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}