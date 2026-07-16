import { getAreas, createPop, generateKodePop } from '../actions'
import PopForm from '../components/PopForm'

export default async function CreatePopPage() {
  const areas = await getAreas()
  const nextKodePop = await generateKodePop()

  return (
    <div className="p-6">
      <PopForm
        areas={areas}
        onSubmit={createPop}
        isEdit={false}
        previewKodePop={nextKodePop}
      />
    </div>
  )
}