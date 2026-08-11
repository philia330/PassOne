"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const OdpSortToggle = ({ sortOrder }: { sortOrder: "asc" | "desc" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortOrder === "asc" ? "desc" : "asc");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={toggleSort}
      className="inline-flex items-center gap-1.5 hover:text-purple-600 transition-colors"
      title={sortOrder === "asc" ? "Urutan: terlama dulu" : "Urutan: terbaru dulu"}
    >
      Kode
      {sortOrder === "asc" ? (
        <ArrowUp size={16} className="text-purple-500" />
      ) : (
        <ArrowDown size={16} className="text-purple-500" />
      )}
    </button>
  );
};