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