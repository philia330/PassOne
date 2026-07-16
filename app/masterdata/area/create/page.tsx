import Link from "next/link";
import { createArea, getNextAreaCode } from "../actions";

export default async function CreateAreaPage() {
  const nextCode = await getNextAreaCode();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">

        <h1 className="mb-2 text-3xl font-bold">
          Tambah Area
        </h1>

        <p className="mb-8 text-gray-500">
          Tambahkan data Area baru ke sistem PASSNET.
        </p>

        <form action={createArea} className="space-y-6">

          {/* Kode Area */}
          <div>
            <label className="mb-2 block font-medium">
              Kode Area <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={nextCode}
              readOnly
              disabled
              className="w-full cursor-not-allowed rounded-lg border bg-gray-100 p-3 font-mono text-gray-500 outline-none"
            />
          </div>

          {/* Nama Area */}
          <div>
            <label className="mb-2 block font-medium">
              Nama Area <span className="text-red-500">*</span>
            </label>

            <input
              name="nama_area"
              type="text"
              placeholder="Masukkan nama area"
              required
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="mb-2 block font-medium">
              Keterangan
            </label>

            <textarea
              name="keterangan"
              rows={4}
              placeholder="Masukkan keterangan..."
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Tombol */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Simpan
            </button>

            <Link
              href="/masterdata/area"
              className="rounded-lg border px-6 py-3 hover:bg-gray-100"
            >
              Kembali
            </Link>
          </div>

        </form>

      </div>
    </main>
  );
}