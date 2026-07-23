export type PaketData = {
  id_paket: number;
  kode_paket: string;
  nama_paket: string;
  kecepatan: string;
  harga: number;
  keterangan: string | null;
  createdAt: Date;
  updatedAt: Date;
};