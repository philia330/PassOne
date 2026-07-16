'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ============================================
// SCHEMA VALIDASI (TANPA KODE_POP)
// ============================================

const CreatePopSchema = z.object({
  nama_pop: z.string().min(1, 'Nama POP wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  latitude: z.coerce.number().min(-90, 'Latitude minimal -90').max(90, 'Latitude maksimal 90'),
  longitude: z.coerce.number().min(-180, 'Longitude minimal -180').max(180, 'Longitude maksimal 180'),
  id_area: z.coerce.number().min(1, 'Area wajib dipilih'),
})

const UpdatePopSchema = z.object({
  nama_pop: z.string().min(1, 'Nama POP wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  latitude: z.coerce.number().min(-90, 'Latitude minimal -90').max(90, 'Latitude maksimal 90'),
  longitude: z.coerce.number().min(-180, 'Longitude minimal -180').max(180, 'Longitude maksimal 180'),
  id_area: z.coerce.number().min(1, 'Area wajib dipilih'),
})

export type PopFormData = z.infer<typeof CreatePopSchema>

// ============================================
// GET ALL POPS WITH AREA
// ============================================

export async function getPops() {
  try {
    const pops = await prisma.pop.findMany({
      include: {
        area: {
          select: {
            id_area: true,
            kode_area: true,
            nama_area: true,
          },
        },
        _count: {
          select: {
            olts: true,
            onts: true,
          },
        },
      },
    })

    const sortedPops = pops.sort((a, b) => {
      const numA = parseInt(a.kode_pop.replace(/\D/g, ''), 10) || 0
      const numB = parseInt(b.kode_pop.replace(/\D/g, ''), 10) || 0
      return numA - numB
    })

    return sortedPops
  } catch (error) {
    console.error('Error fetching POPs:', error)
    return []
  }
}

// ============================================
// GET POP BY ID
// ============================================

export async function getPopById(id: number) {
  try {
    const pop = await prisma.pop.findUnique({
      where: { id_pop: id },
      include: {
        area: {
          select: {
            id_area: true,
            kode_area: true,
            nama_area: true,
          },
        },
        olts: {
          select: {
            id_olt: true,
            kode_olt: true,
            nama_olt: true,
          },
        },
        onts: {
          select: {
            id_ont: true,
            serial_number: true,
            pelanggan: true,
          },
        },
      },
    })
    return pop
  } catch (error) {
    console.error('Error fetching POP by ID:', error)
    return null
  }
}

// ============================================
// GET AREAS FOR SELECT OPTION
// ============================================

export async function getAreas() {
  try {
    const areas = await prisma.area.findMany({
      select: {
        id_area: true,
        kode_area: true,
        nama_area: true,
      },
      orderBy: {
        nama_area: 'asc',
      },
    })
    return areas
  } catch (error) {
    console.error('Error fetching areas:', error)
    return []
  }
}

// ============================================
// GENERATE KODE POP OTOMATIS
// ============================================

export async function generateKodePop() {
  try {
    const pops = await prisma.pop.findMany({
      orderBy: {
        id_pop: 'desc',
      },
      take: 1,
      select: {
        kode_pop: true,
      },
    })

    if (pops.length === 0) {
      return 'POP-001'
    }

    const lastKode = pops[0].kode_pop
    const lastNumber = parseInt(lastKode.split('-')[1])
    const newNumber = lastNumber + 1
    const formattedNumber = String(newNumber).padStart(3, '0')

    return `POP-${formattedNumber}`
  } catch (error) {
    console.error('Error generating kode POP:', error)
    return 'POP-001'
  }
}

// ============================================
// CREATE POP (KODE OTOMATIS)
// ============================================

export async function createPop(formData: FormData) {
  const validatedFields = CreatePopSchema.safeParse({
    nama_pop: formData.get('nama_pop'),
    alamat: formData.get('alamat'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    id_area: formData.get('id_area'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validasi gagal. Silakan periksa data Anda.',
    }
  }

  const { nama_pop, alamat, latitude, longitude, id_area } = validatedFields.data

  const kode_pop = await generateKodePop()

  const area = await prisma.area.findUnique({
    where: { id_area },
  })

  if (!area) {
    return {
      errors: { id_area: ['Area tidak ditemukan'] },
      message: 'Area tidak valid',
    }
  }

  await prisma.pop.create({
    data: {
      kode_pop,
      nama_pop,
      alamat,
      latitude,
      longitude,
      id_area,
    },
  })

  revalidatePath('/masterdata/pop')
  redirect('/masterdata/pop')
}

// ============================================
// UPDATE POP
// ============================================

export async function updatePop(id: number, formData: FormData) {
  const validatedFields = UpdatePopSchema.safeParse({
    nama_pop: formData.get('nama_pop'),
    alamat: formData.get('alamat'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    id_area: formData.get('id_area'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validasi gagal. Silakan periksa data Anda.',
    }
  }

  const { nama_pop, alamat, latitude, longitude, id_area } = validatedFields.data

  const existingPop = await prisma.pop.findUnique({
    where: { id_pop: id },
  })

  if (!existingPop) {
    return {
      message: 'POP tidak ditemukan',
    }
  }

  const area = await prisma.area.findUnique({
    where: { id_area },
  })

  if (!area) {
    return {
      errors: { id_area: ['Area tidak ditemukan'] },
      message: 'Area tidak valid',
    }
  }

  await prisma.pop.update({
    where: { id_pop: id },
    data: {
      nama_pop,
      alamat,
      latitude,
      longitude,
      id_area,
    },
  })

  revalidatePath('/masterdata/pop')
  redirect('/masterdata/pop')
}

// ============================================
// DELETE POP
// ============================================

export async function deletePop(id: number) {
  try {
    const pop = await prisma.pop.findUnique({
      where: { id_pop: id },
      include: {
        olts: true,
        onts: true,
      },
    })

    if (!pop) {
      return {
        success: false,
        message: 'POP tidak ditemukan',
      }
    }

    if (pop.olts.length > 0) {
      return {
        success: false,
        message: `POP tidak dapat dihapus karena masih memiliki ${pop.olts.length} OLT yang terdaftar. Hapus OLT terlebih dahulu.`,
      }
    }

    if (pop.onts.length > 0) {
      return {
        success: false,
        message: `POP tidak dapat dihapus karena masih memiliki ${pop.onts.length} ONT yang terdaftar. Hapus ONT terlebih dahulu.`,
      }
    }

    await prisma.pop.delete({
      where: { id_pop: id },
    })

    revalidatePath('/masterdata/pop')
    return { success: true, message: 'POP berhasil dihapus' }
  } catch (error) {
    console.error('Error deleting POP:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus POP',
    }
  }
}