"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hook untuk menangani highlight item dari Command Palette.
 * - Membaca param `highlight` dari URL
 * - Scroll ke item dan beri highlight visual
 * - Auto-clear param highlight dari URL setelah highlight selesai
 */
export function useTableHighlight<T extends { id: number }>({
  data,
  page,
  pageSize,
  onSearchChange,
  onPageChange,
  getItemId,
}: {
  data: T[];
  page: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  getItemId: (item: T) => number;
}) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const hasHandledHighlight = useRef(false);

  // Handle highlight saat mount
  useEffect(() => {
    if (!highlightId || hasHandledHighlight.current) return;
    hasHandledHighlight.current = true;

    const targetId = Number(highlightId);
    if (isNaN(targetId)) return;

    // Cari item di data
    const itemIndex = data.findIndex((item) => getItemId(item) === targetId);

    if (itemIndex === -1) {
      // Item tidak ditemukan di data saat ini, skip
      return;
    }

    // Hitung halaman yang perlu ditampilkan
    const targetPage = Math.floor(itemIndex / pageSize) + 1;

    if (targetPage !== page) {
      // Pindah ke halaman yang benar
      onPageChange(targetPage);

      // Tunggu render selesai, baru scroll dan highlight
      // Karena pagination change butuh waktu untuk fetch data
      setTimeout(() => {
        setHighlightedId(targetId);

        // Scroll ke baris setelah render
        setTimeout(() => {
          const row = rowRefs.current.get(targetId);
          if (row) {
            row.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }, 300);
    } else {
      // Sudah di halaman yang benar
      setHighlightedId(targetId);

      setTimeout(() => {
        const row = rowRefs.current.get(targetId);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }

    // Hapus highlight setelah 3 detik
    const timer = setTimeout(() => {
      setHighlightedId(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [highlightId, data, page, pageSize, onPageChange, getItemId]);

  // Reset flag saat highlightId berubah
  useEffect(() => {
    if (!highlightId) {
      hasHandledHighlight.current = false;
    }
  }, [highlightId]);

  // Set ref untuk baris
  const setRowRef = (id: number) => (el: HTMLTableRowElement | null) => {
    if (el) {
      rowRefs.current.set(id, el);
    } else {
      rowRefs.current.delete(id);
    }
  };

  // Check apakah item ini sedang di-highlight
  const isHighlighted = (id: number) => highlightedId === id;

  return { isHighlighted, setRowRef };
}
