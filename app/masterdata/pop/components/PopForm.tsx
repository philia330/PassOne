'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PopFormProps {
  initialData?: {
    id_pop?: number
    kode_pop: string
    nama_pop: string
    alamat: string
    latitude: number
    longitude: number
    id_area: number
  }
  areas: Array<{
    id_area: number
    kode_area: string
    nama_area: string
  }>
  onSubmit: (formData: FormData) => Promise<any>
  isEdit?: boolean
  previewKodePop?: string
}

export default function PopForm({
  initialData,
  areas,
  onSubmit,
  isEdit = false,
  previewKodePop,
}: PopFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formMessage, setFormMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})
    setFormMessage(null)

    const formData = new FormData(event.currentTarget)
    const result = await onSubmit(formData)

    if (result?.errors) {
      setErrors(result.errors)
      setIsLoading(false)
    } else if (result?.message) {
      setFormMessage(result.message)
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }

  const displayedKodePop = initialData?.kode_pop || previewKodePop || ''

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEdit ? 'Edit POP' : 'Tambah POP Baru'}
      </h2>

      {formMessage && (
        <div
          className={`mb-4 p-3 rounded ${
            Object.keys(errors).length > 0
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {formMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="kode_pop" className="block text-sm font-medium mb-1">
            Kode POP <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="kode_pop"
            name="kode_pop"
            value={displayedKodePop}
            readOnly
            className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {isEdit
              ? 'Kode POP tidak dapat diubah'
              : 'Kode POP dibuat otomatis secara berurutan'}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="nama_pop" className="block text-sm font-medium mb-1">
            Nama POP <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nama_pop"
            name="nama_pop"
            defaultValue={initialData?.nama_pop || ''}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nama_pop ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Contoh: POP Tangerang"
            disabled={isLoading}
            autoFocus={!isEdit}
            required
          />
          {errors.nama_pop && (
            <p className="mt-1 text-sm text-red-500">{errors.nama_pop[0]}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="alamat" className="block text-sm font-medium mb-1">
            Alamat <span className="text-red-500">*</span>
          </label>
          <textarea
            id="alamat"
            name="alamat"
            defaultValue={initialData?.alamat || ''}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.alamat ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="Masukkan alamat lengkap POP"
            disabled={isLoading}
            required
          />
          {errors.alamat && (
            <p className="mt-1 text-sm text-red-500">{errors.alamat[0]}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="id_area" className="block text-sm font-medium mb-1">
            Area <span className="text-red-500">*</span>
          </label>
          <select
            id="id_area"
            name="id_area"
            defaultValue={initialData?.id_area || ''}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.id_area ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            required
          >
            <option value="">Pilih Area</option>
            {areas.map((area) => (
              <option key={area.id_area} value={area.id_area}>
                {area.kode_area} - {area.nama_area}
              </option>
            ))}
          </select>
          {errors.id_area && (
            <p className="mt-1 text-sm text-red-500">{errors.id_area[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium mb-1">
              Latitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              step="any"
              defaultValue={initialData?.latitude || ''}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.latitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Contoh: -6.2088"
              disabled={isLoading}
              required
            />
            {errors.latitude && (
              <p className="mt-1 text-sm text-red-500">{errors.latitude[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium mb-1">
              Longitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              step="any"
              defaultValue={initialData?.longitude || ''}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.longitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Contoh: 106.8456"
              disabled={isLoading}
              required
            />
            {errors.longitude && (
              <p className="mt-1 text-sm text-red-500">{errors.longitude[0]}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Menyimpan...' : isEdit ? 'Update POP' : 'Simpan POP'}
          </button>
        </div>
      </form>
    </div>
  )
}