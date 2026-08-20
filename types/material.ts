export interface MaterialData {
  id_material: number;
  kode_material: string;
  nama_material: string;
  stok: number;
  minimal_stok: number;
  satuan: string;
  harga: number;
  kondisi: "BAIK" | "RUSAK";
  keterangan: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ================================================================
// BAA USAGE DATA - untuk melihat penggunaan material di BAA
// ================================================================
export interface BaaUsageData {
  id_baa: number;
  kode_baa: string;
  tanggal_instalasi: Date;
  nama_pelanggan: string;
  jumlah: number;
  keterangan: string | null;
  teknisi_utama: string;
}

// ================================================================
// MATERIAL WITH BAA USAGE
// ================================================================
export interface MaterialWithUsage extends MaterialData {
  baaUsage: BaaUsageData[];
  totalDigunakan: number;
}