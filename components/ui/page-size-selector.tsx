"use client";

import { Rows } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageSizeSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
  options?: number[];
  label?: string;
}

const DEFAULT_OPTIONS = [5, 10, 15, 20, 25, 50, 100];

export function PageSizeSelector({
  value,
  onValueChange,
  options = DEFAULT_OPTIONS,
}: PageSizeSelectorProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
    >
      <SelectTrigger className="h-11 min-w-[140px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-700">
        <Rows className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-slate-200 p-1.5 shadow-lg dark:border-slate-700 max-h-[350px] overflow-y-auto">
        {options.map((size) => (
          <SelectItem
            key={size}
            value={String(size)}
            className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"
          >
            <span className="font-medium">{size}</span>
            <span className="text-slate-400 dark:text-slate-500 ml-1">data</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}