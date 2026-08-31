export type StatusFab = "OPEN" | "AKTIF";

export interface FabData {
  id_fab: number;
  kode_fab: string;
  nama_pelanggan: string;
  nik: string;
  foto?: string | null;
  no_hp: string;
  alamat: string;
  latitude: number;
  longitude: number;
  status: StatusFab;
  id_area: number;
  id_paket: number;
  id_user: number;
  id_teknisi_ditugaskan?: number | null;
  createdAt: Date;
  updatedAt: Date;
  area?: { id_area: number; nama_area: string };
  paket?: { id_paket: number; nama_paket: string };
  users?: { id_user: number; nama: string };
  penginput?: { id_user: number; nama: string };
  teknisiDitugaskan?: { id_user: number; nama: string } | null;
}

// Opsi untuk dropdown — hasil query READ-ONLY dari tabel Area/Paket/User.
export interface AreaOption {
  id_area: number;
  nama_area: string;
}

export interface PaketOption {
  id_paket: number;
  nama_paket: string;
}

export interface UserOption {
  id_user: number;
  nama: string;
}

export type CurrentUser = {
  id_user: number;
  nama: string;
  role: "ADMIN" | "LEADER" | "SALES" | "TEKNISI" | "LOGISTIK";
};