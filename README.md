# PassNet - Aplikasi Manajemen Jaringan Fiber Optic

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.3-38B2AC?style=flat-square&logo=tailwind-css)

## 📋 Deskripsi

PassNet adalah aplikasi manajemen jaringan fiber optic untuk ISP (Internet Service Provider). Aplikasi ini membantu pengelolaan data pelanggan, perangkat jaringan, dan aktivitas teknis secara terpusat.

## ✨ Fitur Utama

### 🔐 Autentikasi & Otorisasi
- Login dengan NextAuth.js
- Role-based access control (ADMIN, LEADER, SALES, TEKNISI, LOGISTIK)
- Hak akses berbeda untuk setiap role

### 📊 Dashboard
- Statistik real-time (Total User, FAB, BAA, Material)
- Grafik tren bulanan FAB dan BAA
- Peta sebaran jaringan interaktif
- Aktivitas terbaru dengan detail
- SLA Alerts panel

### 🌐 Master Data

| Modul | Deskripsi |
|-------|-----------|
| **Area** | Kelola wilayah cakupan layanan |
| **POP** | Point of Presence di setiap area |
| **OLT** | Optical Line Terminal (perangkat inti) |
| **ODP** | Optical Distribution Point |
| **ONT** | Optical Network Terminal (perangkat pelanggan) |
| **Paket** | Paket internet dan kecepatan |
| **Material** | Inventaris material teknis |
| **User** | Kelola pengguna sistem |

### 📋 Jaringan

| Modul | Deskripsi |
|-------|-----------|
| **FAB** | Form Aktivasi Berlangganan - pengajuan pemasangan |
| **BAA** | Berita Acara Aktifasi - dokumentasi instalasi |

### 🛠️ Fitur Tambahan
- **Google Maps Integration** - Langsung buka lokasi POP, OLT, ODP, FAB di Google Maps
- **WhatsApp Integration** - Hubungi pelanggan/teknisi langsung via WhatsApp
- **Import Excel** - Import data FAB dan BAA dari file Excel
- **Export Excel** - Export data BAA ke Excel
- **Dark Mode** - Dukungan tema gelap/terang
- **Responsive Design** - Tampilan optimal di semua perangkat

## 🏗️ Tech Stack

### Frontend
- **Next.js 16.2** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Recharts** - Charts
- **Leaflet** - Maps
- **React Hook Form + Zod** - Form validation
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - Server-side logic
- **Prisma ORM** - Database ORM
- **NextAuth.js** - Authentication

### Database
- **MySQL** - Relational database

## 📁 Struktur Folder

```
app/
├── (auth)/              # Halaman autentikasi
│   └── login/
├── (dashboard)/         # Halaman utama (setelah login)
│   ├── dashboard/        # Dashboard utama
│   ├── baa/             # Modul BAA
│   ├── fab/             # Modul FAB
│   ├── masterdata/      # Master data
│   │   ├── area/
│   │   ├── material/
│   │   ├── odp/
│   │   ├── olt/
│   │   ├── ont/
│   │   ├── paket/
│   │   ├── pop/
│   │   └── user/
│   └── workspace/       # Workspace tabs
├── api/                 # API routes
│   ├── auth/
│   ├── baa/
│   ├── fab/
│   └── ...
└── login/              # Halaman login

components/
├── dashboard/          # Komponen dashboard
├── shared/              # Komponen shared
└── ui/                 # UI components (shadcn/ui style)

lib/
├── auth.ts             # Konfigurasi NextAuth
├── prisma.ts           # Prisma client
├── dashboard-stats.ts   # Statistik dashboard
├── network-points.ts    # Titik jaringan untuk peta
└── utils.ts            # Utility functions

prisma/
└── schema.prisma       # Schema database
```

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js 18+
- MySQL database
- npm/yarn/pnpm/bun

### Instalasi

1. Clone repository
```bash
git clone <repository-url>
cd applikasipassnet
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
# Buat file .env dan isi dengan:
DATABASE_URL="mysql://user:password@localhost:3306/passnet"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Setup database
```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# (Opsional) Seed database
npx prisma db seed
```

5. Jalankan development server
```bash
npm run dev
```

6. Buka [http://localhost:3000](http://localhost:3000)

## 👤 Role & Hak Akses

| Role | Akses |
|------|-------|
| **ADMIN** | Akses penuh ke semua fitur |
| **LEADER** | Master data, view FAB/BAA, delete FAB |
| **SALES** | Input & edit FAB sendiri |
| **TEKNISI** | Input & edit FAB/BAA sendiri |
| **LOGISTIK** | Kelola ONT, Paket, Material |

## 📝 Lisensi

Proprietary - All rights reserved

## 👨‍💻 Author

PassNet Development Team
