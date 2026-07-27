"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
};

export default function ImagePreview({
  src,
  alt,
  className,
  width = 48,
  height = 48,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Thumbnail — bisa diklik */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-zoom-in transition hover:opacity-80"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
        />
      </button>

      {/* Lightbox — di-render lewat portal langsung ke document.body,
          supaya tidak terkurung oleh ancestor yang punya CSS transform (misal Sidebar) */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X size={22} />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl"
            >
              <img
                src={src}
                alt={alt}
                className="max-h-[85vh] max-w-[90vw] object-contain"
              />

              <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-center text-sm font-medium text-white">
                {alt}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}