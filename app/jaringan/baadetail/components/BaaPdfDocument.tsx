"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id } from "date-fns/locale";



// Style untuk PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#7c3aed",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#7c3aed",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
  },
  companyName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 8,
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  col2: {
    flex: 1,
  },
  col2Right: {
    flex: 1,
    alignItems: "flex-end",
  },
  infoLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 600,
    color: "#1e293b",
  },
  infoValueSmall: {
    fontSize: 9,
    color: "#475569",
  },
  card: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardItem: {
    width: "25%",
    paddingHorizontal: 4,
  },
  cardLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 9,
    fontWeight: 600,
    color: "#1e293b",
  },
  cardValueMono: {
    fontSize: 8,
    fontWeight: 600,
    color: "#1e293b",
    fontFamily: "Courier",
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableFooter: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: "#e2e8f0",
  },
  footerCol: {
    width: "56%",
  },
  footerTotal: {
    width: "18%",
    textAlign: "right",
    fontWeight: 700,
    color: "#1e293b",
  },
  footerValue: {
    width: "18%",
    textAlign: "right",
    fontWeight: 700,
    color: "#7c3aed",
  },
  headerText: {
    fontSize: 9,
    fontWeight: 600,
    color: "#475569",
  },
  cellText: {
    fontSize: 9,
    color: "#1e293b",
  },
  cellTextSmall: {
    fontSize: 7,
    color: "#94a3b8",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 9,
    color: "#94a3b8",
    paddingVertical: 20,
  },
  photoSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  photoPlaceholder: {
    backgroundColor: "#f1f5f9",
    padding: 20,
    textAlign: "center",
    borderRadius: 4,
  },
  photoImage: {
    width: "100%",
    height: 200,
    objectFit: "contain",
    marginBottom: 8,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  signatureBox: {
    alignItems: "center",
    width: "45%",
  },
  signatureLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#cbd5e1",
    marginBottom: 8,
    marginTop: 60,
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 2,
  },
  signatureName: {
    fontSize: 8,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
  speedTestSection: {
    flexDirection: "row",
    marginTop: 10,
  },
  speedTestItem: {
    flex: 1,
    textAlign: "center",
    padding: 8,
    backgroundColor: "#f8fafc",
    marginHorizontal: 4,
    borderRadius: 4,
  },
  speedTestLabel: {
    fontSize: 7,
    color: "#64748b",
    marginBottom: 4,
  },
  speedTestValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1e293b",
  },
  notesSection: {
    marginTop: 15,
    backgroundColor: "#fefce8",
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#eab308",
  },
  notesText: {
    fontSize: 9,
    color: "#713f12",
    lineHeight: 1.4,
  },
});

// Helper functions
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

function formatTanggal(date: Date | string): string {
  try {
    return format(new Date(date), "dd MMMM yyyy", { locale: id });
  } catch {
    return "-";
  }
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Types
export interface MaterialDetail {
  id_baa_detail: number;
  jumlah: number;
  keterangan: string | null;
  material: {
    nama_material: string;
    harga: number;
    satuan: string;
  } | null;
}

export interface BaaPdfData {
  id_baa: number;
  kode_baa: string;
  tanggal_instalasi: Date | string;
  status: string;
  rx_power_dbm: number | null;
  tx_power_dbm: number | null;
  ping_ms: number | null;
  speed_download: string | null;
  speed_upload: string | null;
  catatan: string | null;
  foto_instalasi: string | null;
  port_olt: number | null;
  port_odp: number | null;
  fab: {
    kode_fab: string;
    nama_pelanggan: string;
    nik: string | null;
    alamat: string | null;
    no_hp: string | null;
    paket: { nama_paket: string; kecepatan: string; harga: number } | null;
    area: { nama_area: string } | null;
    users: { nama: string } | null;
  } | null;
  users: { nama: string; no_hp: string | null } | null;
  teknisiTambahan: Array<{
    id_baa_teknisi: number;
    users: { nama: string } | null;
  }>;
  olt: { nama_olt: string } | null;
  odp: { nama_odp: string } | null;
  ont: { serial_number: string } | null;
  baadetail: MaterialDetail[];
}

interface BaaPdfDocumentProps {
  baa: BaaPdfData;
  appName?: string;
}

export default function BaaPdfDocument({ baa, appName = "PASSNET" }: BaaPdfDocumentProps) {
  const totalHarga = baa.baadetail.reduce(
    (sum, d) => sum + (d.material?.harga ? d.material.harga * d.jumlah : 0),
    0
  );

  const teknisiUtama = baa.users?.nama || "-";
  const teknisiTambahanList = baa.teknisiTambahan
    .map((t) => t.users?.nama)
    .filter(Boolean);
  const teknisiTambahan = teknisiTambahanList.join(", ");

  const rxPower = baa.rx_power_dbm;
  const txPower = baa.tx_power_dbm;
  const ping = baa.ping_ms;

  const hasSpeedTest = baa.speed_download || baa.speed_upload || (ping && ping > 0);

  // Safe date formatting
  const tanggalInstalasi = formatTanggal(baa.tanggal_instalasi);
  const printedDate = format(new Date(), "dd MMM yyyy HH:mm", { locale: id });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>BERITA ACARA AKTIVASI</Text>
            <Text style={styles.subtitle}>BAA - {baa.kode_baa}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>{appName.toUpperCase()}</Text>
            <Text style={styles.companyTagline}>Broadband Management System</Text>
          </View>
        </View>

        {/* Info Pelanggan & Invoice */}
        <View style={styles.row}>
          <View style={styles.col2}>
            <Text style={styles.sectionTitle}>Informasi Pelanggan</Text>
            <Text style={styles.infoValue}>{baa.fab?.nama_pelanggan || "-"}</Text>
            <Text style={styles.infoValueSmall}>{baa.fab?.nik || "-"}</Text>
            <Text style={styles.infoValueSmall}>{baa.fab?.alamat || "-"}</Text>
            <Text style={styles.infoValueSmall}>HP: {baa.fab?.no_hp || "-"}</Text>
          </View>
          <View style={styles.col2Right}>
            <Text style={styles.sectionTitle}>Detail Dokumen</Text>
            <Text style={styles.infoValueSmall}>
              {"No. BAA: "}
              {baa.kode_baa}
            </Text>
            <Text style={styles.infoValueSmall}>
              {"No. FAB: "}
              {baa.fab?.kode_fab || "-"}
            </Text>
            <Text style={styles.infoValueSmall}>
              {"Tanggal: "}
              {tanggalInstalasi}
            </Text>
            <Text style={styles.infoValueSmall}>
              {"Paket: "}
              {baa.fab?.paket ? `${baa.fab.paket.nama_paket} (${baa.fab.paket.kecepatan})` : "-"}
            </Text>
          </View>
        </View>

        {/* Teknisi */}
        <View style={styles.row}>
          <View style={styles.col2}>
            <Text style={styles.sectionTitle}>Tim Teknisi</Text>
            <Text style={styles.infoValueSmall}>
              {"Utama: "}
              {teknisiUtama}
            </Text>
            {teknisiTambahan && (
              <Text style={styles.infoValueSmall}>
                {"Tambahan: "}
                {teknisiTambahan}
              </Text>
            )}
          </View>
          <View style={styles.col2Right}>
            <Text style={styles.sectionTitle}>Sales & Area</Text>
            <Text style={styles.infoValueSmall}>{baa.fab?.users?.nama || "-"}</Text>
            <Text style={styles.infoValueSmall}>{baa.fab?.area?.nama_area || "-"}</Text>
          </View>
        </View>

        {/* Perangkat Jaringan */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Perangkat Jaringan</Text>
          <View style={styles.cardRow}>
            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>OLT</Text>
              <Text style={styles.cardValue}>{baa.olt?.nama_olt || "-"}</Text>
              <Text style={styles.cellTextSmall}>Port: {baa.port_olt ?? "-"}</Text>
            </View>
            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>ODP</Text>
              <Text style={styles.cardValue}>{baa.odp?.nama_odp || "-"}</Text>
              <Text style={styles.cellTextSmall}>Port: {baa.port_odp ?? "-"}</Text>
            </View>
            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>ONT Serial</Text>
              <Text style={styles.cardValueMono}>{baa.ont?.serial_number || "-"}</Text>
            </View>
            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>Power Signal</Text>
              <Text style={styles.cardValue}>
                RX: {rxPower !== null ? `${rxPower} dBm` : "-"}
              </Text>
              <Text style={styles.cellTextSmall}>
                TX: {txPower !== null ? `${txPower} dBm` : "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Speed Test Results */}
        {hasSpeedTest && (
          <View style={styles.speedTestSection}>
            <View style={styles.speedTestItem}>
              <Text style={styles.speedTestLabel}>Download</Text>
              <Text style={styles.speedTestValue}>{baa.speed_download || "-"}</Text>
            </View>
            <View style={styles.speedTestItem}>
              <Text style={styles.speedTestLabel}>Upload</Text>
              <Text style={styles.speedTestValue}>{baa.speed_upload || "-"}</Text>
            </View>
            <View style={styles.speedTestItem}>
              <Text style={styles.speedTestLabel}>Ping</Text>
              <Text style={styles.speedTestValue}>
                {ping && ping > 0 ? `${ping} ms` : "-"}
              </Text>
            </View>
          </View>
        )}

        {/* Tabel Material */}
        <View style={styles.sectionTitle}>
          <Text>Material yang Dipakai</Text>
        </View>
        {baa.baadetail.length > 0 ? (
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, { width: 40 }]}>No</Text>
              <Text style={[styles.headerText, { flex: 1 }]}>Nama Material</Text>
              <Text style={[styles.headerText, { width: 60, textAlign: "center" }]}>Jumlah</Text>
              <Text style={[styles.headerText, { width: 80, textAlign: "right" }]}>Harga</Text>
              <Text style={[styles.headerText, { width: 80, textAlign: "right" }]}>Total</Text>
            </View>

            {/* Rows */}
            {baa.baadetail.map((detail, index) => (
              <View key={detail.id_baa_detail} style={styles.tableRow}>
                <Text style={[styles.cellText, { width: 40 }]}>{index + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cellText}>{detail.material?.nama_material || "-"}</Text>
                  {detail.keterangan && (
                    <Text style={styles.cellTextSmall}> ({detail.keterangan})</Text>
                  )}
                </View>
                <Text style={[styles.cellText, { width: 60, textAlign: "center" }]}>
                  {detail.jumlah} {detail.material?.satuan || "-"}
                </Text>
                <Text style={[styles.cellText, { width: 80, textAlign: "right" }]}>
                  {detail.material?.harga ? formatRupiah(detail.material.harga) : "-"}
                </Text>
                <Text style={[styles.cellText, { width: 80, textAlign: "right" }]}>
                  {detail.material?.harga ? formatRupiah(detail.material.harga * detail.jumlah) : "-"}
                </Text>
              </View>
            ))}

            {/* Footer */}
            <View style={styles.tableFooter}>
              <View style={styles.footerCol} />
              <Text style={styles.footerTotal}>TOTAL</Text>
              <Text style={styles.footerValue}>{formatRupiah(totalHarga)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.emptyText}>Tidak ada material yang dicatat</Text>
          </View>
        )}

        {/* Foto Instalasi - Skip karena masalah loading */}
        {/* {baa.foto_instalasi && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Foto Instalasi</Text>
            <Image src={baa.foto_instalasi} style={styles.photoImage} />
          </View>
        )} */}

        {/* Catatan */}
        {baa.catatan && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Catatan</Text>
            <Text style={styles.notesText}>{baa.catatan}</Text>
          </View>
        )}

        {/* Tanda Tangan */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Pelanggan</Text>
            <Text style={styles.signatureName}>{baa.fab?.nama_pelanggan || "-"}</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Teknisi</Text>
            <Text style={styles.signatureName}>{teknisiUtama}</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dicetak dari {appName} pada {printedDate}
          </Text>
          <Text style={styles.footerText}>
            {baa.kode_baa}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
