/**
 * ======================================
 * VALIDATION SCHEMAS - Aplikasi Passnet
 * Centralized Zod schemas for all forms
 * ======================================
 */

import { z } from "zod";

// ======================================
// COMMON PATTERNS & REFINEMENTS
// ======================================

/** Only allow letters, spaces, and common name characters */
const namePattern = /^[a-zA-Z\s\.\']+$/;

/** Only allow letters, numbers, and underscores */
const usernamePattern = /^[a-zA-Z0-9_]+$/;

/** Indonesian phone number pattern (08xx, +62xx, 62xx) */
const phonePattern = /^(\+?62|0)[0-9]{9,14}$/;

/** IP Address pattern */
const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

/** Decimal number pattern for coordinates */
const coordinatePattern = /^-?\d{1,3}\.\d+$/;

// ======================================
// USER VALIDATION SCHEMAS
// ======================================

export const userNameSchema = z
  .string()
  .min(1, "Nama wajib diisi.")
  .min(2, "Nama minimal 2 karakter.")
  .max(100, "Nama maksimal 100 karakter.")
  .regex(namePattern, "Nama hanya boleh berisi huruf, spasi, titik, dan apostrof.");

export const usernameSchema = z
  .string()
  .min(1, "Username wajib diisi.")
  .min(3, "Username minimal 3 karakter.")
  .max(30, "Username maksimal 30 karakter.")
  .regex(usernamePattern, "Username hanya boleh berisi huruf, angka, dan underscore.")
  .toLowerCase();

// BUG FIX: pola lama `.optional().or(z.literal("").transform(() => null))`
// rapuh — kalau value yang masuk bukan persis `undefined` atau `""` (mis.
// whitespace, atau memang salah format), Zod gagal di kedua cabang union
// dan melempar error dari cabang pertama ("Format email tidak valid"),
// bahkan untuk kasus yang seharusnya valid/kosong.
// Fix: normalisasi string kosong/whitespace-only jadi `null` LEBIH DULU
// lewat `z.preprocess`, sebelum masuk ke validator .email(). Jadi tidak
// pernah ada string kosong yang nyasar ke pengecekan format email.
export const emailSchema = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z
    .string()
    .trim()
    .email("Format email tidak valid.")
    .max(254, "Email maksimal 254 karakter.")
    .nullable()
    .optional()
);

export const noHpSchema = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z
    .string()
    .trim()
    .regex(phonePattern, "Nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxxx")
    .max(15, "Nomor HP maksimal 15 karakter.")
    .nullable()
    .optional()
);

export const passwordSchema = z
  .string()
  .min(6, "Password minimal 6 karakter.")
  .max(100, "Password maksimal 100 karakter.");

export const createUserSchema = z.object({
  nama: userNameSchema,
  username: usernameSchema,
  password: z.string().min(1, "Password wajib diisi.").and(passwordSchema),
  email: emailSchema,
  no_hp: noHpSchema,
  role: z.enum(["ADMIN", "LEADER", "SALES", "TEKNISI", "LOGISTIK"], {
    message: "Role wajib dipilih.",
  }),
  jkl: z.enum(["LAKI_LAKI", "PEREMPUAN"], {
    message: "Jenis kelamin wajib dipilih.",
  }),
  status: z.boolean(),
  foto: z.instanceof(File).optional(),
});

export const updateUserSchema = z.object({
  nama: userNameSchema,
  username: usernameSchema,
  password: passwordSchema.optional().or(z.literal("")),
  email: emailSchema,
  no_hp: noHpSchema,
  role: z.enum(["ADMIN", "LEADER", "SALES", "TEKNISI", "LOGISTIK"], {
    message: "Role wajib dipilih.",
  }),
  jkl: z.enum(["LAKI_LAKI", "PEREMPUAN"], {
    message: "Jenis kelamin wajib dipilih.",
  }),
  status: z.boolean(),
  foto: z.instanceof(File).optional().nullable(),
});

// ======================================
// FAB VALIDATION SCHEMAS
// ======================================

export const fabNamaPelangganSchema = z
  .string()
  .min(1, "Nama pelanggan wajib diisi.")
  .min(2, "Nama pelanggan minimal 2 karakter.")
  .max(100, "Nama pelanggan maksimal 100 karakter.");

export const nikSchema = z
  .string()
  .min(1, "NIK wajib diisi.")
  .length(16, "NIK harus tepat 16 digit.")
  .regex(/^\d+$/, "NIK hanya boleh berisi angka.");

export const fabNoHpSchema = z
  .string()
  .min(1, "Nomor HP wajib diisi.")
  .regex(phonePattern, "Nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxxx")
  .max(15, "Nomor HP maksimal 15 karakter.");

export const fabAlamatSchema = z
  .string()
  .min(1, "Alamat wajib diisi.")
  .min(10, "Alamat minimal 10 karakter.")
  .max(500, "Alamat maksimal 500 karakter.");

export const latitudeSchema = z
  .number()
  .min(-90, "Latitude tidak valid.")
  .max(90, "Latitude tidak valid.");

export const longitudeSchema = z
  .number()
  .min(-180, "Longitude tidak valid.")
  .max(180, "Longitude tidak valid.");

export const fabSchema = z.object({
  nama_pelanggan: fabNamaPelangganSchema,
  nik: nikSchema,
  no_hp: fabNoHpSchema,
  alamat: fabAlamatSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  id_area: z.number().int().positive("Area wajib dipilih."),
  id_paket: z.number().int().positive("Paket wajib dipilih."),
  id_user: z.number().int().positive("Sales wajib dipilih."),
  foto: z.instanceof(File).nullable(),
});

// ======================================
// MATERIAL VALIDATION SCHEMAS
// ======================================

export const materialNamaSchema = z
  .string()
  .min(1, "Nama material wajib diisi.")
  .min(2, "Nama material minimal 2 karakter.")
  .max(100, "Nama material maksimal 100 karakter.");

export const satuanSchema = z
  .string()
  .min(1, "Satuan wajib diisi.")
  .max(20, "Satuan maksimal 20 karakter.");

export const stokSchema = z
  .number()
  .int("Stok harus berupa angka bulat.")
  .min(0, "Stok tidak boleh kurang dari 0.")
  .max(999999, "Stok maksimal 999999.");

export const minimalStokSchema = z
  .number()
  .int("Minimal stok harus berupa angka bulat.")
  .min(0, "Minimal stok tidak boleh kurang dari 0.")
  .max(999999, "Minimal stok maksimal 999999.");

export const hargaSchema = z
  .number()
  .positive("Harga harus lebih dari 0.")
  .max(999999999999, "Harga terlalu besar.");

export const materialSchema = z.object({
  nama_material: materialNamaSchema,
  stok: stokSchema,
  minimal_stok: minimalStokSchema,
  satuan: satuanSchema,
  harga: hargaSchema,
  kondisi: z.enum(["BAIK", "RUSAK"], {
    message: "Kondisi wajib dipilih.",
  }),
  keterangan: z
    .string()
    .max(500, "Keterangan maksimal 500 karakter.")
    .optional()
    .nullable(),
});

// ======================================
// AREA VALIDATION SCHEMAS
// ======================================

export const areaNamaSchema = z
  .string()
  .min(1, "Nama area wajib diisi.")
  .min(2, "Nama area minimal 2 karakter.")
  .max(100, "Nama area maksimal 100 karakter.");

export const areaKeteranganSchema = z
  .string()
  .max(255, "Keterangan maksimal 255 karakter.")
  .optional()
  .nullable();

export const areaSchema = z.object({
  nama_area: areaNamaSchema,
  keterangan: areaKeteranganSchema,
});

// ======================================
// OLT VALIDATION SCHEMAS
// ======================================

export const oltNamaSchema = z
  .string()
  .min(1, "Nama OLT wajib diisi.")
  .min(2, "Nama OLT minimal 2 karakter.")
  .max(100, "Nama OLT maksimal 100 karakter.");

export const oltLokasiSchema = z
  .string()
  .min(1, "Lokasi wajib diisi.")
  .min(3, "Lokasi minimal 3 karakter.")
  .max(255, "Lokasi maksimal 255 karakter.");

export const oltIpSchema = z
  .string()
  .regex(ipPattern, "Format IP address tidak valid. Contoh: 192.168.1.1")
  .max(45, "IP address terlalu panjang.")
  .nullable();

export const oltUsernameSchema = z
  .string()
  .min(1, "Username OLT wajib diisi.")
  .max(50, "Username maksimal 50 karakter.")
  .nullable();

export const oltPasswordSchema = z
  .string()
  .min(1, "Password OLT wajib diisi.")
  .max(100, "Password maksimal 100 karakter.")
  .nullable();

export const oltSchema = z.object({
  nama_olt: oltNamaSchema,
  lokasi: oltLokasiSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  id_pop: z.number().int().positive("POP wajib dipilih."),
  ip_olt: oltIpSchema,
  username_olt: oltUsernameSchema,
  password_olt: oltPasswordSchema,
  foto_olt: z.instanceof(File).nullable(),
});

// ======================================
// ODP VALIDATION SCHEMAS
// ======================================

export const odpNamaSchema = z
  .string()
  .min(1, "Nama ODP wajib diisi.")
  .min(2, "Nama ODP minimal 2 karakter.")
  .max(100, "Nama ODP maksimal 100 karakter.");

export const odpAlamatSchema = z
  .string()
  .min(1, "Alamat wajib diisi.")
  .min(5, "Alamat minimal 5 karakter.")
  .max(255, "Alamat maksimal 255 karakter.");

export const jumlahPortSchema = z
  .number()
  .int("Jumlah port harus berupa angka bulat.")
  .min(1, "Jumlah port minimal 1.")
  .max(256, "Jumlah port maksimal 256.");

export const odpSchema = z.object({
  nama_odp: odpNamaSchema,
  alamat: odpAlamatSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  id_olt: z.number().int().positive("OLT wajib dipilih."),
  jumlah_port: jumlahPortSchema,
});

// ======================================
// POP VALIDATION SCHEMAS
// ======================================

export const popNamaSchema = z
  .string()
  .min(1, "Nama POP wajib diisi.")
  .min(2, "Nama POP minimal 2 karakter.")
  .max(100, "Nama POP maksimal 100 karakter.");

export const popAlamatSchema = z
  .string()
  .min(1, "Alamat wajib diisi.")
  .min(5, "Alamat minimal 5 karakter.")
  .max(255, "Alamat maksimal 255 karakter.");

export const popSchema = z.object({
  nama_pop: popNamaSchema,
  alamat: popAlamatSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  id_area: z.number().int().positive("Area wajib dipilih."),
});

// ======================================
// PAKET VALIDATION SCHEMAS
// ======================================

export const paketNamaSchema = z
  .string()
  .min(1, "Nama paket wajib diisi.")
  .min(2, "Nama paket minimal 2 karakter.")
  .max(100, "Nama paket maksimal 100 karakter.");

export const paketKecepatanSchema = z
  .string()
  .min(1, "Kecepatan wajib diisi.")
  .max(50, "Kecepatan maksimal 50 karakter.")
  .regex(/^\d+\s*(Mbps|MBps|Gbps|GBps)?$/i, "Format kecepatan tidak valid. Contoh: 10 Mbps");

export const paketSchema = z.object({
  nama_paket: paketNamaSchema,
  kecepatan: paketKecepatanSchema,
  harga: hargaSchema,
  keterangan: z
    .string()
    .max(255, "Keterangan maksimal 255 karakter.")
    .optional()
    .nullable(),
});

// ======================================
// PORT PON VALIDATION SCHEMAS
// ======================================

export const portPonSchema = z.object({
  nomor_port: z
    .number()
    .int("Nomor port harus berupa angka bulat.")
    .min(1, "Nomor port minimal 1.")
    .max(256, "Nomor port maksimal 256."),
  tipe_kartu: z
    .string()
    .min(1, "Tipe kartu wajib diisi.")
    .max(50, "Tipe kartu maksimal 50 karakter."),
  status: z.enum(["TERSEDIA", "TERPASANG", "RUSAK"], {
    message: "Status wajib dipilih.",
  }),
  id_olt: z.number().int().positive("OLT wajib dipilih."),
  id_odp: z.number().int().positive("ODP wajib dipilih."),
});

// ======================================
// ONT VALIDATION SCHEMAS
// ======================================

export const serialNumberSchema = z
  .string()
  .min(1, "Serial number wajib diisi.")
  .min(5, "Serial number minimal 5 karakter.")
  .max(50, "Serial number maksimal 50 karakter.")
  .regex(/^[a-zA-Z0-9\-]+$/, "Serial number hanya boleh berisi huruf, angka, dan tanda hubung.");

export const ontModelSchema = z
  .string()
  .max(100, "Model maksimal 100 karakter.")
  .optional()
  .nullable();

export const ontSchema = z.object({
  serial_number: serialNumberSchema,
  model: ontModelSchema,
  status: z.enum(["TERSEDIA", "TERPASANG", "RUSAK"], {
    message: "Status wajib dipilih.",
  }),
  id_pop: z.number().int().positive("POP wajib dipilih."),
  id_odp: z.number().int().positive("ODP wajib dipilih."),
});

// ======================================
// BAA VALIDATION SCHEMAS
// ======================================

export const portOltSchema = z
  .number()
  .int("Port OLT harus berupa angka bulat.")
  .min(0, "Port OLT tidak boleh kurang dari 0.")
  .max(9999, "Port OLT maksimal 9999.")
  .nullable();

export const portOdpSchema = z
  .number()
  .int("Port ODP harus berupa angka bulat.")
  .min(0, "Port ODP tidak boleh kurang dari 0.")
  .max(9999, "Port ODP maksimal 9999.")
  .nullable();

export const rxPowerSchema = z
  .number()
  .min(-60, "RX Power minimal -60 dBm.")
  .max(10, "RX Power maksimal 10 dBm.")
  .nullable();

export const txPowerSchema = z
  .number()
  .min(-10, "TX Power minimal -10 dBm.")
  .max(20, "TX Power maksimal 20 dBm.")
  .nullable();

export const pingMsSchema = z
  .number()
  .int("Ping harus berupa angka bulat.")
  .min(0, "Ping tidak boleh kurang dari 0.")
  .max(10000, "Ping maksimal 10000 ms.")
  .nullable();

export const speedSchema = z
  .string()
  .max(20, "Kecepatan maksimal 20 karakter.")
  .nullable()
  .optional();

export const catatanSchema = z
  .string()
  .max(1000, "Catatan maksimal 1000 karakter.")
  .nullable()
  .optional();

export const baaDetailSchema = z.object({
  id_material: z.number().int().positive(),
  jumlah: z.number().int().min(1, "Jumlah minimal 1."),
  keterangan: z.string().max(255).nullable().optional(),
});

export const baaSchema = z.object({
  tanggal_instalasi: z.string().min(1, "Tanggal instalasi wajib diisi."),
  id_fab: z.number().int().positive("FAB wajib dipilih."),
  id_user: z.number().int().positive("Teknisi utama wajib dipilih."),
  id_olt: z.number().int().positive("OLT wajib dipilih."),
  id_odp: z.number().int().positive("ODP wajib dipilih."),
  id_ont: z.number().int().positive("ONT wajib dipilih."),
  port_olt: portOltSchema,
  port_odp: portOdpSchema,
  rx_power_dbm: rxPowerSchema,
  tx_power_dbm: txPowerSchema,
  speed_download: speedSchema,
  speed_upload: speedSchema,
  ping_ms: pingMsSchema,
  catatan: catatanSchema,
  baa_details: z.array(baaDetailSchema).min(1, "Minimal harus ada 1 material."),
  teknisi_tambahan: z.array(z.number()).optional(),
  foto_instalasi: z.instanceof(File).nullable().optional(),
});

// ======================================
// TEKNISI VALIDATION SCHEMAS
// ======================================

export const teknisiSchema = z.object({
  nama_teknisi: userNameSchema,
  username_teknisi: usernameSchema,
  email_teknisi: emailSchema,
});

// ======================================
// TYPE EXPORTS
// ======================================

export type UserNameInput = z.infer<typeof userNameSchema>;
export type UsernameInput = z.infer<typeof usernameSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type NoHpInput = z.infer<typeof noHpSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type FabInput = z.infer<typeof fabSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type AreaInput = z.infer<typeof areaSchema>;
export type OltInput = z.infer<typeof oltSchema>;
export type OdpInput = z.infer<typeof odpSchema>;
export type PopInput = z.infer<typeof popSchema>;
export type PaketInput = z.infer<typeof paketSchema>;
export type PortPonInput = z.infer<typeof portPonSchema>;
export type OntInput = z.infer<typeof ontSchema>;
export type BaaInput = z.infer<typeof baaSchema>;
export type TeknisiInput = z.infer<typeof teknisiSchema>;