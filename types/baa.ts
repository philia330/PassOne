// ================================================================
// TIPE DATA BAA
// ================================================================

export type StatusBaa = "SELESAI";

// ================================================================
// BAA TEKNISI (BARU - untuk teknisi tambahan)
// ================================================================
export interface BaaTeknisiData {
  id_baa_teknisi: number;
  id_baa: number;
  id_user: number;
  createdAt: Date;
  users?: {
    // ← user → users
    id_user: number;
    nama: string;
    username?: string;
    email?: string;
  };
}

// ================================================================
// BAA DETAIL (Material)
// ================================================================
export interface BaaDetailData {
  id_baa_detail: number;
  id_material: number;
  jumlah: number;
  keterangan: string | null;
  material?: {
    id_material: number;
    nama_material: string;
    satuan: string;
  };
}

// ================================================================
// BAA DATA (Lengkap dengan semua relasi)
// ================================================================
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
  
  // Foreign Keys
  id_fab: number;
  id_user: number;           // Teknisi Utama
  id_olt: number;
  id_odp: number;
  id_ont: number;
  
  port_olt: number | null;
  port_odp: number | null;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relasi
  fab?: {
    id_fab: number;
    kode_fab: string;
    nama_pelanggan: string;
  };
  
  users?: {
    // ← user → users
    id_user: number;
    nama: string;
    username?: string;
  };
  
  olt?: {
    id_olt: number;
    nama_olt: string;
  };
  
  odp?: {
    id_odp: number;
    nama_odp: string;
  };
  
  ont?: {
    id_ont: number;
    serial_number: string;
  };
  
  // ================================================================
  // TEKNISI TAMBAHAN
  // ================================================================
  teknisiTambahan?: BaaTeknisiData[];
  
  // ================================================================
  // MATERIAL - PERUBAHAN: baaDetails → baadetail
  // ================================================================
  baadetail: BaaDetailData[]; // ← baaDetails → baadetail
}

// ================================================================
// OPSI DROPDOWN
// ================================================================
export interface FabOption {
  id_fab: number;
  kode_fab: string;
  nama_pelanggan: string;
}

export interface TeknisiOption {
  id_user: number;
  nama: string;
  username?: string;
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

// ================================================================
// BARIS MATERIAL DINAMIS (Client State)
// ================================================================
export interface MaterialRow {
  rowId: string;           // key lokal untuk React
  id_material: string;
  jumlah: string;
  keterangan: string;
}

// ================================================================
// TEKNISI TAMBAHAN (Client State)
// ================================================================
export interface TeknisiTambahanRow {
  rowId: string;           // key lokal untuk React
  id_user: string;
  nama: string;
}

// ================================================================
// RESPONSE API
// ================================================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type CurrentUser = {
  id_user: number;
  nama: string;
  role: "ADMIN" | "LEADER" | "SALES" | "TEKNISI" | "LOGISTIK";
};