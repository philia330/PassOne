 "use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const OdpSearch = ({
  defaultValue,
}: {
  defaultValue: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (value === (searchParams.get("search") ?? "")) {
      return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set("search", value);
      } else {
        params.delete("search");
      }

      params.set("page", "1");

      router.replace(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={`relative w-full max-w-xs transition-all duration-200 ${focused ? 'scale-[1.02]' : ''}`}>
      <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${focused ? 'text-purple-500' : 'text-slate-400 dark:text-slate-500'}`} />

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Cari kode, nama, alamat, atau OLT..."
        className={`h-11 rounded-2xl border-slate-200 bg-white pl-9 transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${focused ? 'border-purple-500 ring-4 ring-purple-500/10' : 'focus-visible:ring-purple-500'}`}
      />
    </div>
  );
};