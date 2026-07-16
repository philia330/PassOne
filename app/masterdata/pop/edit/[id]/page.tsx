import { notFound } from 'next/navigation'
import { getPopById, getAreas, updatePop } from '../../actions'
import PopForm from '../../components/PopForm'

export default async function EditPopPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idParam } = await params
  const id = parseInt(idParam, 10)

  const [pop, areas] = await Promise.all([getPopById(id), getAreas()])

  if (!pop) {
    notFound()
  }

  const updatePopWithId = async (formData: FormData) => {
    'use server'
    return updatePop(id, formData)
  }

  return (
    <div className="p-6">
      <PopForm
        areas={areas}
        initialData={{
          id_pop: pop.id_pop,
          kode_pop: pop.kode_pop,
          nama_pop: pop.nama_pop,
          alamat: pop.alamat,
          latitude: pop.latitude,
          longitude: pop.longitude,
          id_area: pop.id_area,
        }}
        onSubmit={updatePopWithId}
        isEdit={true}
      />
    </div>
  )
}