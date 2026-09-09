"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { ont_status } from "@prisma/client";
import { z } from "zod";

const PAGE_SIZE = 10;

/*
 * ======================================================
 * VALIDATION SCHEMA - ONT
 * ======================================================
 *
 * Digunakan untuk memvalidasi data sebelum:
 * - Create ONT
 * - Update ONT
 *
 * Catatan:
 * Status TERPASANG tidak boleh dipilih langsung
 * dari form master ONT karena status tersebut digunakan
 * ketika ONT sudah terpasang melalui proses BAA.
 */
const ontValidation = z.object({
  serial_number: z
    .string()
    .min(1, "Serial number wajib diisi.")
    .min(5, "Serial number minimal 5 karakter.")
    .max(
      50,
      "Serial number maksimal 50 karakter."
    )
    .regex(
      /^[a-zA-Z0-9\-]+$/,
      "Serial number hanya boleh berisi huruf, angka, dan tanda hubung."
    ),

  model: z
    .string()
    .max(
      100,
      "Model maksimal 100 karakter."
    )
    .optional()
    .nullable(),

  status: z.enum(
    ["TERSEDIA", "RUSAK"],
    {
      message: "Status wajib dipilih.",
    }
  ),

  /*
   * id_pop boleh 0 ketika ONT dibuat
   * dari konteks BAA.
   *
   * Nilai 0 akan dicari otomatis dari ODP.
   */
  id_pop: z
    .number()
    .int()
    .min(
      0,
      "POP tidak valid."
    ),

  /*
   * ODP wajib dipilih.
   */
  id_odp: z
    .number()
    .int()
    .positive(
      "ODP wajib dipilih."
    ),
});

/*
 * ======================================================
 * HELPER: AUDIT LOG
 * ======================================================
 *
 * Mencatat aktivitas user ke activityLog.
 *
 * Kalau gagal membuat log, proses utama tidak dibatalkan.
 */
async function logActivity(
  type: string,
  description: string
) {
  const session = await auth();

  try {
    /*
     * User bisa saja logout / session tidak tersedia.
     * Karena audit log bukan proses utama, kita tetap
     * membiarkan proses utama berjalan.
     */
    if (!session?.user?.id_user) {
      return;
    }

    await prisma.activityLog.create({
      data: {
        type: type as any,
        description,
        id_user: session.user.id_user as number,
      },
    });
  } catch (error) {
    console.error(
      "Failed to log activity:",
      error
    );
  }
}

/*
 * ======================================================
 * HELPER: CREATE ACCESS
 * ======================================================
 *
 * Role yang boleh membuat ONT:
 * - ADMIN
 * - LOGISTIK
 * - TEKNISI
 */
async function requireCreateAccess() {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Sesi tidak valid, silakan login ulang."
    );
  }

  const role = session.user.role;

  if (
    role !== Role.ADMIN &&
    role !== Role.LOGISTIK &&
    role !== Role.TEKNISI
  ) {
    throw new Error(
      "Anda tidak memiliki akses untuk membuat ONT."
    );
  }

  return session;
}

/*
 * ======================================================
 * HELPER: UPDATE ACCESS
 * ======================================================
 *
 * Role yang boleh mengedit ONT:
 * - ADMIN
 * - LOGISTIK
 */
async function requireUpdateAccess() {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Sesi tidak valid, silakan login ulang."
    );
  }

  const role = session.user.role;

  if (
    role !== Role.ADMIN &&
    role !== Role.LOGISTIK
  ) {
    throw new Error(
      "Anda tidak memiliki akses untuk mengubah ONT."
    );
  }

  return session;
}

/*
 * ======================================================
 * HELPER: DELETE ACCESS
 * ======================================================
 *
 * HANYA ADMIN yang boleh menghapus ONT.
 *
 * Ini penting karena permission di frontend saja
 * tidak cukup. Server juga wajib memeriksa role.
 */
async function requireDeleteAccess() {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Sesi tidak valid, silakan login ulang."
    );
  }

  if (session.user.role !== Role.ADMIN) {
    throw new Error(
      "Hanya Admin yang boleh menghapus ONT."
    );
  }

  return session;
}

/*
 * ======================================================
 * GET DATA ONT
 * ======================================================
 *
 * Digunakan untuk mengambil data ONT dengan:
 * - Search
 * - Pagination
 */
export const getOnts = async (
  search: string = "",
  page: number = 1
) => {
  const where = search
    ? {
        OR: [
          {
            serial_number: {
              contains: search,
            },
          },

          {
            pelanggan: {
              contains: search,
            },
          },

          {
            model: {
              contains: search,
            },
          },

          {
            pop: {
              nama_pop: {
                contains: search,
              },
            },
          },

          {
            odp: {
              nama_odp: {
                contains: search,
              },
            },
          },
        ],
      }
    : {};

  const [data, total] =
    await Promise.all([
      prisma.ont.findMany({
        where,

        /*
         * Ambil hanya field POP dan ODP yang diperlukan.
         *
         * Ini mencegah field Decimal seperti latitude/
         * longitude ikut dikirim ke Client Component.
         */
        include: {
          pop: {
            select: {
              id_pop: true,
              nama_pop: true,
            },
          },

          odp: {
            select: {
              id_odp: true,
              nama_odp: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        skip:
          (page - 1) *
          PAGE_SIZE,

        take: PAGE_SIZE,
      }),

      /*
       * Hitung total data sesuai pencarian.
       */
      prisma.ont.count({
        where,
      }),
    ]);

  return {
    data,
    total,

    totalPages: Math.max(
      1,
      Math.ceil(
        total / PAGE_SIZE
      )
    ),
  };
};

/*
 * ======================================================
 * GET POP
 * ======================================================
 */
export const getPops = async () => {
  return prisma.pop.findMany({
    select: {
      id_pop: true,
      nama_pop: true,
    },

    orderBy: {
      nama_pop: "asc",
    },
  });
};

/*
 * ======================================================
 * GET ODP
 * ======================================================
 */
export const getOdps = async () => {
  return prisma.odp.findMany({
    select: {
      id_odp: true,
      nama_odp: true,
    },

    orderBy: {
      nama_odp: "asc",
    },
  });
};

/*
 * ======================================================
 * CREATE ONT
 * ======================================================
 */
export const createOnt = async (
  formData: FormData
) => {
  const session =
    await requireCreateAccess();

  /*
   * ======================================
   * AMBIL DATA DARI FORM
   * ======================================
   */
  const rawData = {
    serial_number:
      (
        formData.get(
          "serial_number"
        ) as string
      )?.trim() || "",

    model:
      (
        formData.get(
          "model"
        ) as string
      )?.trim() || undefined,

    status:
      (
        formData.get(
          "status"
        ) as string
      ) || "TERSEDIA",

    id_pop:
      parseInt(
        formData.get(
          "id_pop"
        ) as string,
        10
      ) || 0,

    id_odp:
      parseInt(
        formData.get(
          "id_odp"
        ) as string,
        10
      ) || 0,
  };

  /*
   * ======================================
   * VALIDASI INPUT
   * ======================================
   */
  const parseResult =
    ontValidation.safeParse(
      rawData
    );

  if (!parseResult.success) {
    const firstError =
      parseResult.error.issues[0];

    throw new Error(
      firstError.message
    );
  }

  const validated =
    parseResult.data;

  /*
   * ======================================
   * DERIVE POP DARI ODP
   * ======================================
   *
   * Ketika id_pop = 0, cari POP dari relasi ODP -> OLT -> POP.
   */
  let finalIdPop =
    validated.id_pop;

  if (
    !finalIdPop ||
    finalIdPop === 0
  ) {
    const odp =
      await prisma.odp.findUnique({
        where: {
          id_odp:
            validated.id_odp,
        },

        select: {
          olt: {
            select: {
              id_pop: true,
            },
          },
        },
      });

    if (!odp?.olt?.id_pop) {
      throw new Error(
        "ODP tidak memiliki relasi POP. Pilih ODP yang valid."
      );
    }

    finalIdPop =
      odp.olt.id_pop;
  }

  /*
   * ======================================
   * CEK DUPLIKAT SERIAL NUMBER
   * ======================================
   */
  const existing =
    await prisma.ont.findUnique({
      where: {
        serial_number:
          validated.serial_number,
      },
    });

  if (existing) {
    throw new Error(
      `ONT dengan serial number "${validated.serial_number}" sudah ada.`
    );
  }

  /*
   * ======================================
   * CREATE DALAM TRANSACTION
   * ======================================
   */
  await prisma.$transaction(
    async (tx) => {
      /*
       * Double-check duplicate di dalam transaction
       * untuk mengurangi kemungkinan race condition.
       */
      const existingInTx =
        await tx.ont.findUnique({
          where: {
            serial_number:
              validated.serial_number,
          },
        });

      if (existingInTx) {
        throw new Error(
          `ONT dengan serial number "${validated.serial_number}" sudah ada.`
        );
      }

      /*
       * Pelanggan sengaja kosong.
       *
       * Pelanggan nantinya akan diisi oleh proses BAA.
       */
      await tx.ont.create({
        data: {
          serial_number:
            validated.serial_number,

          pelanggan: "",

          model:
            validated.model || "",

          status:
            validated.status as ont_status,

          id_pop:
            finalIdPop,

          id_odp:
            validated.id_odp,
        },
      });
    }
  );

  /*
   * ======================================
   * AUDIT LOG
   * ======================================
   */
  await logActivity(
    "ONT_CREATED",
    `ONT "${validated.serial_number}" dibuat oleh ${session.user.nama}`
  );

  /*
   * Refresh halaman Master Data ONT.
   */
  revalidatePath(
    "/masterdata/ont"
  );
};

/*
 * ======================================================
 * UPDATE ONT
 * ======================================================
 */
export const updateOnt = async (
  id: number,
  formData: FormData
) => {
  const session =
    await requireUpdateAccess();

  /*
   * ======================================
   * CEK ONT
   * ======================================
   */
  const existing =
    await prisma.ont.findUnique({
      where: {
        id_ont: id,
      },
    });

  if (!existing) {
    throw new Error(
      "ONT tidak ditemukan."
    );
  }

  /*
   * ======================================
   * AMBIL DATA FORM
   * ======================================
   */
  const rawData = {
    serial_number:
      (
        formData.get(
          "serial_number"
        ) as string
      )?.trim() || "",

    model:
      (
        formData.get(
          "model"
        ) as string
      )?.trim() || undefined,

    /*
     * Status TERPASANG yang sudah ada di database
     * tidak dapat dipilih dari schema form ini.
     */
    status:
      (
        formData.get(
          "status"
        ) as string
      ) ||
      (existing.status as string) ||
      "TERSEDIA",

    id_pop:
      parseInt(
        formData.get(
          "id_pop"
        ) as string,
        10
      ) || 0,

    id_odp:
      parseInt(
        formData.get(
          "id_odp"
        ) as string,
        10
      ) || 0,
  };

  /*
   * ======================================
   * VALIDASI
   * ======================================
   */
  const parseResult =
    ontValidation.safeParse(
      rawData
    );

  if (!parseResult.success) {
    const firstError =
      parseResult.error.issues[0];

    throw new Error(
      firstError.message
    );
  }

  const validated =
    parseResult.data;

  /*
   * ======================================
   * EDIT WAJIB MEMILIKI POP
   * ======================================
   */
  if (
    !validated.id_pop ||
    validated.id_pop <= 0
  ) {
    throw new Error(
      "POP wajib dipilih."
    );
  }

  /*
   * ======================================
   * CEK SERIAL DUPLIKAT
   * ======================================
   */
  if (
    validated.serial_number !==
    existing.serial_number
  ) {
    const duplicate =
      await prisma.ont.findFirst({
        where: {
          serial_number:
            validated.serial_number,

          id_ont: {
            not: id,
          },
        },
      });

    if (duplicate) {
      throw new Error(
        `ONT dengan serial number "${validated.serial_number}" sudah ada.`
      );
    }
  }

  /*
   * ======================================
   * UPDATE DALAM TRANSACTION
   * ======================================
   */
  await prisma.$transaction(
    async (tx) => {
      /*
       * Double-check duplicate.
       */
      if (
        validated.serial_number !==
        existing.serial_number
      ) {
        const existingInTx =
          await tx.ont.findFirst({
            where: {
              serial_number:
                validated.serial_number,

              id_ont: {
                not: id,
              },
            },
          });

        if (existingInTx) {
          throw new Error(
            `ONT dengan serial number "${validated.serial_number}" sudah ada.`
          );
        }
      }

      /*
       * pelanggan TIDAK diubah dari Master Data.
       *
       * Perubahan pelanggan dilakukan melalui
       * sinkronisasi BAA.
       */
      await tx.ont.update({
        where: {
          id_ont: id,
        },

        data: {
          serial_number:
            validated.serial_number,

          model:
            validated.model || "",

          status:
            validated.status as ont_status,

          id_pop:
            validated.id_pop,

          id_odp:
            validated.id_odp,
        },
      });
    }
  );

  /*
   * ======================================
   * AUDIT LOG
   * ======================================
   */
  await logActivity(
    "ONT_UPDATED",
    `ONT "${validated.serial_number}" diupdate oleh ${session.user.nama}`
  );

  revalidatePath(
    "/masterdata/ont"
  );
};

/*
 * ======================================================
 * DELETE ONT
 * ======================================================
 *
 * ATURAN:
 *
 * 1. User harus login
 * 2. Hanya ADMIN yang boleh menghapus
 * 3. ONT harus ditemukan
 * 4. ONT TERPASANG tidak boleh dihapus
 * 5. ONT yang masih dipakai BAA tidak boleh dihapus
 *
 * Ini adalah pengamanan SERVER-SIDE.
 */
export const deleteOnt = async (
  id: number
) => {
  /*
   * ======================================
   * CEK ROLE
   * ======================================
   *
   * HANYA ADMIN.
   */
  const session =
    await requireDeleteAccess();

  /*
   * ======================================
   * AMBIL DATA ONT
   * ======================================
   */
  const ont =
    await prisma.ont.findUnique({
      where: {
        id_ont: id,
      },

      include: {
        _count: {
          select: {
            baa: true,
          },
        },
      },
    });

  /*
   * ======================================
   * CEK DATA
   * ======================================
   */
  if (!ont) {
    throw new Error(
      "ONT tidak ditemukan."
    );
  }

  /*
   * ======================================
   * CEK STATUS TERPASANG
   * ======================================
   *
   * ONT yang sudah terpasang tidak boleh dihapus.
   */
  if (
    ont.status === "TERPASANG"
  ) {
    throw new Error(
      `ONT "${ont.serial_number}" tidak bisa dihapus karena statusnya masih TERPASANG.`
    );
  }

  /*
   * ======================================
   * CEK RELASI BAA
   * ======================================
   *
   * Meskipun status bukan TERPASANG,
   * ONT yang masih dipakai BAA tidak boleh
   * dihapus.
   */
  if (
    ont._count.baa > 0
  ) {
    throw new Error(
      `ONT "${ont.serial_number}" tidak bisa dihapus karena masih dipakai oleh ${ont._count.baa} BAA.`
    );
  }

  /*
   * ======================================
   * DELETE
   * ======================================
   */
  await prisma.ont.delete({
    where: {
      id_ont: id,
    },
  });

  /*
   * ======================================
   * AUDIT LOG
   * ======================================
   */
  await logActivity(
    "ONT_DELETED",
    `ONT "${ont.serial_number}" dihapus oleh ${session.user.nama}`
  );

  /*
   * Refresh data.
   */
  revalidatePath(
    "/masterdata/ont"
  );
};