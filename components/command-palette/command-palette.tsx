"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, FileText, Package, Users, MapPin, Router, Boxes, Network, PackageOpen, Cable } from "lucide-react";
import { globalSearch, type SearchResult, type GlobalSearchResults } from "@/app/actions/global-search";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Icon mapping untuk setiap kategori
const categoryIcons: Record<string, React.ElementType> = {
  FAB: FileText,
  BAA: FileText,
  ODP: Boxes,
  OLT: Router,
  ONT: Network,
  POP: MapPin,
  Area: MapPin,
  Paket: PackageOpen,
  Material: Package,
  PortPon: Cable,
  User: Users,
};

// Gradient accent untuk headers
const categoryGradients: Record<string, string> = {
  FAB: "from-purple-500 to-fuchsia-500",
  BAA: "from-purple-500 to-fuchsia-500",
  ODP: "from-sky-500 to-blue-500",
  OLT: "from-sky-500 to-blue-500",
  ONT: "from-sky-500 to-blue-500",
  POP: "from-emerald-500 to-teal-500",
  Area: "from-amber-500 to-orange-500",
  Paket: "from-pink-500 to-rose-500",
  Material: "from-orange-500 to-red-500",
  PortPon: "from-cyan-500 to-blue-500",
  User: "from-indigo-500 to-purple-500",
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearchResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  React.useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await globalSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Handle selection - navigasi ke halaman
  const handleSelect = React.useCallback((href: string) => {
    router.push(href);
    onOpenChange(false);
  }, [router, onOpenChange]);

  // List untuk render items per kategori
  const categoryList = React.useMemo(() => {
    if (!results) return [];

    const categories = [
      { key: "fab" as const, label: "FAB" as const },
      { key: "baa" as const, label: "BAA" as const },
      { key: "odp" as const, label: "ODP" as const },
      { key: "olt" as const, label: "OLT" as const },
      { key: "ont" as const, label: "ONT" as const },
      { key: "pop" as const, label: "POP" as const },
      { key: "area" as const, label: "Area" as const },
      { key: "paket" as const, label: "Paket" as const },
      { key: "material" as const, label: "Material" as const },
      { key: "portPon" as const, label: "PortPon" as const },
      { key: "user" as const, label: "User" as const },
    ];

    return categories
      .map(({ key, label }) => {
        const items = results[key];
        if (!items || items.length === 0) return null;
        return {
          category: label,
          items,
          Icon: categoryIcons[label] || Package,
          gradient: categoryGradients[label] || "from-gray-500 to-gray-600",
          count: items.length,
        };
      })
      .filter(Boolean) as Array<{
        category: string;
        items: SearchResult[];
        Icon: React.ElementType;
        gradient: string;
        count: number;
      }>;
  }, [results]);

  // Hitung total items
  const totalItems = categoryList.reduce((sum, cat) => sum + cat.count, 0);
  const hasResults = totalItems > 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      // Disable filter bawaan cmdk karena kita sudah filter sendiri via server
      shouldFilter={false}
      className={cn(
        "fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]",
        "pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Content */}
      <div
        className={cn(
          "relative w-full max-w-xl mx-4",
          "bg-popover rounded-2xl shadow-2xl border ring-1 ring-foreground/10",
          "overflow-hidden transition-all duration-200",
          "pointer-events-auto",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* Header with search icon */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Command.Input
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            placeholder="Ketik untuk mencari..."
            className={cn(
              "flex-1 bg-transparent border-0 outline-none",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "caret-primary"
            )}
          />
          {isLoading && (
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Command List dengan overflow */}
        <Command.List
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {/* Empty state - belum ada input */}
          {!query && (
            <div className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Ketik nama, kode, atau NIK untuk mencari
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tekan <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↑</kbd>{" "}
                <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↓</kbd> untuk navigasi,{" "}
                <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> untuk memilih
              </p>
            </div>
          )}

          {/* No results state */}
          {query && query.length >= 2 && !isLoading && !hasResults && (
            <div className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Tidak ditemukan hasil untuk "{query}"
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Coba gunakan kata kunci lain
              </p>
            </div>
          )}

          {/* Results - grouped by category */}
          {hasResults && (
            <div className="space-y-4">
              {categoryList.map((group) => (
                <div key={group.category}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className={cn("p-1 rounded-md bg-gradient-to-br", group.gradient)}>
                      <group.Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.category}
                    </span>
                    <span className="text-xs text-muted-foreground/50">
                      ({group.count})
                    </span>
                  </div>

                  {/* Items dalam category */}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = categoryIcons[item.category] || Package;
                      return (
                        <Command.Item
                          key={item.href}
                          value={item.href}
                          onSelect={() => handleSelect(item.href)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer",
                            "transition-colors duration-150",
                            // Selected state dari cmdk
                            "[&[data-selected=true]]:bg-purple-100 [&[data-selected=true]]:dark:bg-purple-500/20",
                            "[&[data-selected=true]]:text-foreground",
                            "hover:bg-accent/50"
                          )}
                        >
                          <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", group.gradient)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-muted-foreground/50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </Command.Item>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Command.List>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">↑↓</kbd>
              navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">↵</kbd>
              pilih
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">esc</kbd>
              tutup
            </span>
          </div>
          <span className="text-muted-foreground/70">
            Global Search
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
