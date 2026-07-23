export type StatusFab = "PENDING" | "SURVEY" | "INSTALASI" | "SELESAI";

export interface FabData {
  id_fab: number;
  kode_fab: string;
  nama_pelanggan: string;
  nik: string;
  no_hp: string;
  alamat: string;
  latitude: number;
  longitude: number;
  status: StatusFab;
  id_area: number;
  id_paket: number;
  id_user: number;
  createdAt: Date;
  updatedAt: Date;
  area?: { id_area: number; nama_area: string };
  paket?: { id_paket: number; nama_paket: string };
  user?: { id_user: number; nama: string };
}

// Opsi untuk dropdown — hasil query READ-ONLY dari tabel Area/Paket/User.
// TIDAK membuat/mengubah data user, cuma menampilkan pilihan Sales yang sudah ada.
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