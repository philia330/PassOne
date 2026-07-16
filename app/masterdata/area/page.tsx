// app/masterdata/area/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteArea } from "./actions";
import DeleteForm from "./DeleteForm"; 

export default async function AreaPage() {
  const areas = await prisma.area.findMany({
    orderBy: {
      kode_area: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Master Data Area
          </h1>

          <p className="mt-1 text-gray-500">
            Kelola seluruh data Area jaringan PASSNET.
          </p>
        </div>

        <Link
          href="/masterdata/area/create"
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
        >
          + Tambah Area
        </Link>
      </div>

      {/* Statistik */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Area</p>
          <h2 className="mt-2 text-4xl font-bold text-blue-600">
            {areas.length}
          </h2>
          <p className="mt-2 text-sm text-gray-400">Area Terdaftar</p>
        </div>
      </div>

      {/* Card Table */}
      <div className="rounded-2xl border bg-white shadow-sm">
        {/* Header Table */}
        <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Daftar Area</h2>
            <p className="text-sm text-gray-500">
              Semua data area yang telah tersimpan.
            </p>
          </div>

          <input
            type="text"
            placeholder="Cari kode area atau nama area..."
            className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 md:w-80"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">Kode Area</th>
                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">Nama Area</th>
                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">Keterangan</th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {areas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 text-6xl">📍</div>
                      <h3 className="text-xl font-semibold">Belum Ada Data Area</h3>
                      <p className="mt-2 text-gray-500">Silakan tambahkan Area pertama.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                areas.map((area, index) => (
                  <tr key={area.id_area} className="border-t transition hover:bg-blue-50">
                    <td className="px-5 py-4 font-medium">{index + 1}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                        {area.kode_area}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">{area.nama_area}</td>
                    <td className="px-5 py-4">
                      {area.keterangan ? (
                        <span className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-700">
                          {area.keterangan}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-3">
                        <Link
                          href={`/masterdata/area/edit/${area.id_area}`}
                          className="rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600 inline-block text-center"
                        >
                          Edit
                        </Link>

                        <DeleteForm
                            id={area.id_area}
                            nama={area.nama_area}
                            action={deleteArea}
                            />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-5">
          <p className="text-sm text-gray-500">
            Total Data : <span className="font-semibold">{areas.length}</span>
          </p>
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100">
            Refresh
          </button>
        </div>
      </div>
    </main>
  );
}