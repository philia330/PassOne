"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { checkPermission } from "@/lib/auth/check-permissions";

export interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  category: string;
}

export interface GlobalSearchResults {
  fab: SearchResult[];
  baa: SearchResult[];
  odp: SearchResult[];
  olt: SearchResult[];
  ont: SearchResult[];
  pop: SearchResult[];
  area: SearchResult[];
  paket: SearchResult[];
  material: SearchResult[];
  portPon: SearchResult[];
  user: SearchResult[];
}

const LIMIT_PER_CATEGORY = 5;

/**
 * Server action untuk global search.
 *
 * Search paralel ke beberapa tabel dengan batasan hasil per kategori.
 * Menghormati role-based access control.
 */
export async function globalSearch(
  query: string
): Promise<GlobalSearchResults> {
  if (!query || query.trim().length < 2) {
    return {
      fab: [],
      baa: [],
      odp: [],
      olt: [],
      ont: [],
      pop: [],
      area: [],
      paket: [],
      material: [],
      portPon: [],
      user: [],
    };
  }

  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const searchTerm = query.trim();

  const [
    fabResults,
    baaResults,
    odpResults,
    oltResults,
    ontResults,
    popResults,
    areaResults,
    paketResults,
    materialResults,
    portPonResults,
    userResults,
  ] = await Promise.all([
    // =========================================================
    // FAB Search
    // =========================================================
    role && checkPermission(role, "fab", "read")
      ? prisma.fab.findMany({
          where: {
            OR: [
              { kode_fab: { contains: searchTerm } },
              { nama_pelanggan: { contains: searchTerm } },
              { nik: { contains: searchTerm } },
              { no_hp: { contains: searchTerm } },
              { alamat: { contains: searchTerm } },
            ],
          },
          select: {
            id_fab: true,
            kode_fab: true,
            nama_pelanggan: true,
            nik: true,
            status: true,
            alamat: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // BAA Search
    // =========================================================
    role && checkPermission(role, "baa", "read")
      ? prisma.baa.findMany({
          where: {
            OR: [
              { kode_baa: { contains: searchTerm } },
              {
                fab: {
                  nama_pelanggan: {
                    contains: searchTerm,
                  },
                },
              },
              {
                fab: {
                  kode_fab: {
                    contains: searchTerm,
                  },
                },
              },
            ],
          },
          select: {
            id_baa: true,
            kode_baa: true,
            status: true,
            tanggal_instalasi: true,
            fab: {
              select: {
                kode_fab: true,
                nama_pelanggan: true,
              },
            },
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // ODP Search
    // =========================================================
    role && checkPermission(role, "odp", "read")
      ? prisma.odp.findMany({
          where: {
            OR: [
              { kode_odp: { contains: searchTerm } },
              { nama_odp: { contains: searchTerm } },
              { alamat: { contains: searchTerm } },
            ],
          },
          select: {
            id_odp: true,
            kode_odp: true,
            nama_odp: true,
            alamat: true,
            jumlah_port: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // OLT Search
    // =========================================================
    role && (role === "ADMIN" || role === "LEADER")
      ? prisma.olt.findMany({
          where: {
            OR: [
              { kode_olt: { contains: searchTerm } },
              { nama_olt: { contains: searchTerm } },
              { lokasi: { contains: searchTerm } },
              { ip_olt: { contains: searchTerm } },
            ],
          },
          select: {
            id_olt: true,
            kode_olt: true,
            nama_olt: true,
            lokasi: true,
            ip_olt: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // ONT Search
    // =========================================================
    role && checkPermission(role, "ont", "read")
      ? prisma.ont.findMany({
          where: {
            OR: [
              { serial_number: { contains: searchTerm } },
              { pelanggan: { contains: searchTerm } },
            ],
          },
          select: {
            id_ont: true,
            serial_number: true,
            pelanggan: true,
            status: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // POP Search
    // =========================================================
    role && (role === "ADMIN" || role === "TEKNISI")
      ? prisma.pop.findMany({
          where: {
            OR: [
              { kode_pop: { contains: searchTerm } },
              { nama_pop: { contains: searchTerm } },
              { alamat: { contains: searchTerm } },
            ],
          },
          select: {
            id_pop: true,
            kode_pop: true,
            nama_pop: true,
            alamat: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // AREA Search
    // =========================================================
    role === "ADMIN"
      ? prisma.area.findMany({
          where: {
            OR: [
              { kode_area: { contains: searchTerm } },
              { nama_area: { contains: searchTerm } },
              { keterangan: { contains: searchTerm } },
            ],
          },
          select: {
            id_area: true,
            kode_area: true,
            nama_area: true,
            keterangan: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // PAKET Search
    // =========================================================
    role && (role === "ADMIN" || role === "LOGISTIK")
      ? prisma.paket.findMany({
          where: {
            OR: [
              { kode_paket: { contains: searchTerm } },
              { nama_paket: { contains: searchTerm } },
              { kecepatan: { contains: searchTerm } },
            ],
          },
          select: {
            id_paket: true,
            kode_paket: true,
            nama_paket: true,
            kecepatan: true,
            harga: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // MATERIAL Search
    // =========================================================
    role && checkPermission(role, "materialList", "read")
      ? prisma.material.findMany({
          where: {
            OR: [
              {
                kode_material: {
                  contains: searchTerm,
                },
              },
              {
                nama_material: {
                  contains: searchTerm,
                },
              },
              {
                satuan: {
                  contains: searchTerm,
                },
              },
              {
                keterangan: {
                  contains: searchTerm,
                },
              },
            ],
          },
          select: {
            id_material: true,
            kode_material: true,
            nama_material: true,
            stok: true,
            satuan: true,
            kondisi: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: {
            createdAt: "desc",
          },
        })
      : Promise.resolve([]),

    // =========================================================
    // PORT PON Search
    // =========================================================
    role && (role === "ADMIN" || role === "LEADER" || role === "TEKNISI")
      ? prisma.portPon.findMany({
          where: {
            OR: [
              { tipe_kartu: { contains: searchTerm } },
              {
                olt: {
                  nama_olt: {
                    contains: searchTerm,
                  },
                },
              },
              {
                odp: {
                  nama_odp: {
                    contains: searchTerm,
                  },
                },
              },
            ],
          },
          select: {
            id_port: true,
            nomor_port: true,
            tipe_kartu: true,
            status: true,
            olt: {
              select: {
                nama_olt: true,
              },
            },
            odp: {
              select: {
                nama_odp: true,
              },
            },
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    // =========================================================
    // USER Search
    // =========================================================
    role === "ADMIN"
      ? prisma.user.findMany({
          where: {
            OR: [
              { kode_user: { contains: searchTerm } },
              { nama: { contains: searchTerm } },
              { username: { contains: searchTerm } },
              { email: { contains: searchTerm } },
            ],
            status: true,
          },
          select: {
            id_user: true,
            kode_user: true,
            nama: true,
            username: true,
            role: true,
          },
          take: LIMIT_PER_CATEGORY,
          orderBy: {
            createdAt: "desc",
          },
        })
      : Promise.resolve([]),
  ]);

  // =========================================================
  // TRANSFORM HASIL SEARCH
  // =========================================================

  const fab: SearchResult[] = fabResults.map((item) => ({
    id: String(item.id_fab),
    label: item.nama_pelanggan,
    sublabel: `${item.kode_fab} • ${item.nik}`,
    href: `/workspace?view=fab&highlight=${item.id_fab}`,
    category: "FAB",
  }));

  const baa: SearchResult[] = baaResults.map((item) => ({
    id: String(item.id_baa),
    label: item.fab?.nama_pelanggan || "Unknown",
    sublabel: `${item.kode_baa} • ${item.fab?.kode_fab || ""}`,
    href: `/workspace?view=baa&highlight=${item.id_baa}`,
    category: "BAA",
  }));

  const odp: SearchResult[] = odpResults.map((item) => ({
    id: String(item.id_odp),
    label: item.nama_odp,
    sublabel: `${item.kode_odp}${
      item.alamat ? ` • ${item.alamat}` : ""
    }`,
    href: `/workspace?view=odp&highlight=${item.id_odp}`,
    category: "ODP",
  }));

  const olt: SearchResult[] = oltResults.map((item) => ({
    id: String(item.id_olt),
    label: item.nama_olt,
    sublabel: `${item.kode_olt}${
      item.ip_olt ? ` • IP: ${item.ip_olt}` : ""
    }`,
    href: `/workspace?view=olt&highlight=${item.id_olt}`,
    category: "OLT",
  }));

  const ont: SearchResult[] = ontResults.map((item) => ({
    id: String(item.id_ont),
    label: item.pelanggan,
    sublabel: `${item.serial_number} • ${item.status}`,
    href: `/workspace?view=ont&highlight=${item.id_ont}`,
    category: "ONT",
  }));

  const pop: SearchResult[] = popResults.map((item) => ({
    id: String(item.id_pop),
    label: item.nama_pop,
    sublabel: `${item.kode_pop}${
      item.alamat ? ` • ${item.alamat}` : ""
    }`,
    href: `/workspace?view=pop&highlight=${item.id_pop}`,
    category: "POP",
  }));

  const area: SearchResult[] = areaResults.map((item) => ({
    id: String(item.id_area),
    label: item.nama_area,
    sublabel: item.kode_area,
    href: `/workspace?view=area&highlight=${item.id_area}`,
    category: "Area",
  }));

  const paket: SearchResult[] = paketResults.map((item) => ({
    id: String(item.id_paket),
    label: item.nama_paket,
    sublabel: `${item.kecepatan} • Rp ${Number(
      item.harga
    ).toLocaleString("id-ID")}`,
    href: `/workspace?view=paket&highlight=${item.id_paket}`,
    category: "Paket",
  }));

  // =========================================================
  // MATERIAL RESULT
  // =========================================================

  const material: SearchResult[] = materialResults.map((item) => ({
    id: String(item.id_material),
    label: item.nama_material,
    sublabel: `${item.kode_material} • ${item.satuan}`,
    href: `/workspace?view=material&highlight=${item.id_material}`,
    category: "Material",
  }));

  // =========================================================
  // PORT PON RESULT
  // =========================================================

  const portPon: SearchResult[] = portPonResults.map((item) => ({
    id: String(item.id_port),
    label: `Port ${item.nomor_port}`,
    sublabel: `${item.tipe_kartu} • ${item.olt?.nama_olt || "-"} ${item.odp ? `• ${item.odp.nama_odp}` : ""}`,
    href: `/workspace?view=port-pon&highlight=${item.id_port}`,
    category: "PortPon",
  }));

  const user: SearchResult[] = userResults.map((item) => ({
    id: String(item.id_user),
    label: item.nama,
    sublabel: `${item.kode_user} • ${item.role}`,
    href: `/workspace?view=user&highlight=${item.id_user}`,
    category: "User",
  }));

  return {
    fab,
    baa,
    odp,
    olt,
    ont,
    pop,
    area,
    paket,
    material,
    portPon,
    user,
  };
}