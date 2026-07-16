import Link from 'next/link'
import { getPops } from './actions'
import DeletePop from './components/DeletePop'
import { deletePop } from './actions'

export default async function PopPage() {
  const pops = await getPops()

  const totalOlt = pops.reduce((sum, pop) => sum + pop._count.olts, 0)
  const totalOnt = pops.reduce((sum, pop) => sum + pop._count.onts, 0)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data POP</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data Point of Presence (POP) jaringan
          </p>
        </div>
        <Link
          href="/masterdata/pop/create"
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm flex items-center gap-2 w-fit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Tambah POP
        </Link>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM13 10a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total POP</p>
            <p className="text-xl font-bold text-gray-800">{pops.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v4.59L6.7 11.24a.75.75 0 101.06 1.06l3.5-3.5A.75.75 0 0011.5 8.3V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total OLT</p>
            <p className="text-xl font-bold text-gray-800">{totalOlt}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h4v1H5V6zm0 3h4v1H5V9zm0 3h4v1H5v-1z" />
              <path d="M15 7h1a2 2 0 012 2v5a2 2 0 01-2 2h-1V7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total ONT</p>
            <p className="text-xl font-bold text-gray-800">{totalOnt}</p>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kode POP
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama POP
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Alamat
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  OLT
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ONT
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v2H7V5zm0 4h6v2H7V9zm0 4h4v2H7v-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Belum ada data POP</p>
                      <p className="text-gray-400 text-sm mt-1">Klik tombol "Tambah POP" untuk menambahkan data baru</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pops.map((pop, index) => (
                  <tr key={pop.id_pop} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      {pop.kode_pop}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pop.nama_pop}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {pop.area.kode_area}
                      </span>
                      <span className="ml-1.5 text-gray-500">
                        {pop.area.nama_area}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={pop.alamat}>
                      {pop.alamat}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {pop._count.olts}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                        {pop._count.onts}
                      </span>
                    </td>
                   <td className="px-6 py-4 text-sm text-center">
  <div className="flex justify-center items-center gap-2">
    {/* Tombol Edit */}
    <Link
      href={`/masterdata/pop/edit/${pop.id_pop}`}
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
      Edit
    </Link>

    {/* Tombol Hapus */}
    <DeletePop
      id={pop.id_pop}
      kode_pop={pop.kode_pop}
      nama_pop={pop.nama_pop}
      onDelete={deletePop}
    />
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info jumlah data */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center">
          <span>Total: <span className="font-semibold text-gray-700">{pops.length}</span> POP</span>
        </div>
      </div>
    </div>
  )
}