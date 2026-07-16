'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePopProps {
  id: number
  kode_pop: string
  nama_pop: string
  onDelete: (id: number) => Promise<any>
}

export default function DeletePop({ id, kode_pop, nama_pop, onDelete }: DeletePopProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsLoading(true)
    setMessage(null)

    const result = await onDelete(id)

    if (result?.success) {
      setIsOpen(false)
      router.refresh()
    } else if (result?.message) {
      setMessage(result.message)
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Tombol Hapus */}
      <button
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer' }}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm cursor-pointer"
        title="Hapus POP"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Hapus
      </button>

      {/* Modal Konfirmasi */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.598c.75 1.334-.213 2.985-1.742 2.985H3.48c-1.53 0-2.493-1.651-1.743-2.985L8.257 3.1zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Hapus POP?
            </h3>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm text-center ${
                  message.includes('tidak dapat') || message.includes('gagal')
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            <p className="text-gray-500 text-center mb-6">
              POP <strong className="text-gray-700">"{kode_pop} - {nama_pop}"</strong> akan
              dihapus permanen dan tidak bisa dikembalikan.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setMessage(null)
                }}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition font-medium"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-full hover:bg-red-700 transition disabled:opacity-50 font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}