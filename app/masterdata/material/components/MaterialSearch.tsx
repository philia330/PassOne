"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const MaterialSearch = ({ defaultValue }: { defaultValue: string }) => {
  const [value, setValue] = useState(defaultValue);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 400);

    return () => clearTimeout(handler);
  }, [value]);

  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        size={16}
      />
      <Input
        type="text"
        placeholder="Cari kode / nama material..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-2xl h-12 pl-11 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  );
};