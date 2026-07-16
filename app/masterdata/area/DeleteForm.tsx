// app/masterdata/area/DeleteForm.tsx
"use client";

import { useState, useTransition } from "react";

export default function DeleteForm({
  id,
  nama,
  action,
}: {
  id: number;
  nama: string;
  action: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await action(id);
      setOpen(false);
    });
  }

  return (
    <>
      {/* Tombol Hapus */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 cursor-pointer"
      >
        Hapus
      </button>

      {/* Modal konfirmasi custom */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            {/* Icon peringatan */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-center text-lg font-semibold text-gray-900">
              Hapus Area?
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              Area <span className="font-semibold text-gray-700">"{nama}"</span> akan
              dihapus permanen dan tidak bisa dikembalikan.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}