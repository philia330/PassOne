"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOrder = "asc" | "desc";

interface SortableHeaderProps {
  label: string;
  sortOrder: SortOrder;
  onSort: () => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  return (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        "inline-flex items-center gap-1.5 hover:text-purple-600 transition-colors",
        className
      )}
    >
      <span>{label}</span>
      {sortOrder === "asc" ? (
        <ArrowUp size={16} className="text-purple-500" />
      ) : (
        <ArrowDown size={16} className="text-purple-500" />
      )}
    </button>
  );
}

interface SimpleSortButtonProps {
  sortOrder: SortOrder;
  className?: string;
}

export function SimpleSortButton({ sortOrder, className }: SimpleSortButtonProps) {
  return sortOrder === "asc" ? (
    <ArrowUp size={16} className={cn("text-purple-500", className)} />
  ) : (
    <ArrowDown size={16} className={cn("text-purple-500", className)} />
  );
}

export function SortIcon({ isActive, sortOrder }: { isActive?: boolean; sortOrder?: SortOrder }) {
  if (!isActive) {
    return <ArrowUpDown size={16} className="text-slate-400" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUp size={16} className="text-purple-500" />
  ) : (
    <ArrowDown size={16} className="text-purple-500" />
  );
}
