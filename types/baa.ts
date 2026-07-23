export type StatusBaa = "PENDING" | "PROSES" | "SELESAI";

export interface BaaDetailData {
  id_baa_detail: number;
  id_material: number;
  jumlah: number;
  keterangan: string | null;
  material?: { id_material: number; nama_material: string; satuan: string };
}

export interface BaaData {
  id_baa: number;
  kode_baa: string;
  tanggal_instalasi: Date;
  rx_power_dbm: number | null;
  tx_power_dbm: number | null;
  speed_download: string | null;
  speed_upload: string | null;
  ping_ms: number | null;
  status: StatusBaa;
  catatan: string | null;
  foto_instalasi: string | null;
  id_fab: number;
  id_user: number;
  id_olt: number;
  id_odp: number;
  id_ont: number;
  port_olt: number | null;
  port_odp: number | null;
  createdAt: Date;
  updatedAt: Date;
  fab?: { id_fab: number; kode_fab: string; nama_pelanggan: string };
  user?: { id_user: number; nama: string };
  olt?: { id_olt: number; nama_olt: string };
  odp?: { id_odp: number; nama_odp: string };
  ont?: { id_ont: number; serial_number: string };
  baaDetails: BaaDetailData[];
}

// Opsi dropdown — semua hasil query READ-ONLY, tidak membuat/mengubah data master.
export interface FabOption {
  id_fab: number;
  kode_fab: string;
  nama_pelanggan: string;
}

export interface TeknisiOption {
  id_user: number;
  nama: string;
}

export interface OltOption {
  id_olt: number;
  nama_olt: string;
}

export interface OdpOption {
  id_odp: number;
  nama_odp: string;
}

export interface OntOption {
  id_ont: number;
  serial_number: string;
}

export interface MaterialOption {
  id_material: number;
  nama_material: string;
  satuan: string;
}

// Baris material dinamis di form (state client, sebelum dikirim sebagai JSON)
export interface MaterialRow {
  rowId: string; // key lokal untuk React, bukan id_baa_detail
  id_material: string;
  jumlah: string;
  keterangan: string;
}