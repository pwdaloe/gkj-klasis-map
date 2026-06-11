# Pemetaan Warga GKJ Klasis Jakarta Bagian Timur

Aplikasi web untuk memetakan persebaran warga jemaat gereja-gereja di bawah naungan **GKJ Klasis Jakarta Bagian Timur** berdasarkan kelurahan tempat tinggal. Data divisualisasikan dalam peta interaktif dengan gradasi warna berdasarkan kepadatan warga.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur Aplikasi](#arsitektur-aplikasi)
- [Struktur Database](#struktur-database)
- [Struktur Direktori](#struktur-direktori)
- [API Reference](#api-reference)
- [Setup & Menjalankan Lokal](#setup--menjalankan-lokal)
- [Role & Akses Pengguna](#role--akses-pengguna)
- [Rencana Pengembangan](#rencana-pengembangan)
- [Changelog](#changelog)

---

## Gambaran Umum

Aplikasi ini dibangun untuk membantu GKJ Klasis Jakarta Bagian Timur dalam:

- Memantau sebaran geografis warga jemaat dari tiap gereja anggota klasis
- Merekam jumlah warga per kelurahan, per tahun, per gereja, dan per kelompok
- Memberikan visualisasi peta interaktif dengan gradasi warna berdasarkan kepadatan warga
- Menyediakan admin panel bagi petugas untuk input dan manajemen data

**Live app**: tersedia melalui Vercel deployment (URL di konfigurasi Vercel project).

---

## Fitur Utama

### Peta Interaktif
- Polygon kelurahan berwarna berdasarkan jumlah warga (gradasi merah: `#fde0d9` → `#a50f15`)
- Kelurahan tanpa data tetap tampil dengan warna abu-abu sebagai base layer
- Marker gereja (ikon ⛪) di peta dengan tooltip nama gereja
- Klik polygon untuk melihat detail warga per gereja dan gereja terdekat

### Sidebar & Navigasi
- Filter berdasarkan **tahun** (2024–2028), **gereja**, dan **kota/kabupaten**
- Daftar kelurahan ber-jemaat saat gereja dipilih — klik nama untuk fly-to zoom ke peta
- Sidebar dapat disembunyikan/dibuka di semua perangkat (tombol ✕ dan ☰)
- Di mobile, sidebar otomatis tersembunyi saat pertama dibuka

### Overview Bar
- Informasi ringkas di atas peta: tahun data, jumlah gereja terdaftar, kelurahan ter-data, total warga

### Admin Panel
- **Data Gereja** — tambah, edit, hapus gereja beserta koordinat lokasi
- **Data Kelompok** — kelompok/wilayah pelayanan di bawah setiap gereja
- **Data Kelurahan** — geocoding otomatis via Nominatim (OSM), input koordinat manual, filter/search/edit inline
- **Data Warga** — input jumlah warga per kombinasi tahun + kelurahan + gereja, autocomplete, filter, sort, edit & hapus

### Manajemen Pengguna
- Login email + password via Supabase Auth
- Tiga level akses: **Viewer**, **Entry Data**, **Super Admin**
- Halaman manajemen user (Super Admin only): tambah user, ubah role, aktifkan/nonaktifkan akun

---

## Tech Stack

| Lapisan | Teknologi | Versi |
|---|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) | ^15 |
| Language | TypeScript | ^5 |
| UI | React + [Tailwind CSS v4](https://tailwindcss.com) | ^19 / ^4 |
| Peta/GIS | [Leaflet](https://leafletjs.com) + react-leaflet | ^5 |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + RLS + Auth) | ^2 |
| Geocoding | [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap) | Free |
| Deployment | [Vercel](https://vercel.com) | — |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) | ^2 |

---

## Arsitektur Aplikasi

```
Browser
  │
  ├── / (Peta Interaktif)          → MapView (Leaflet, SSR disabled)
  │     ├── Sidebar (filter)        → filter tahun / gereja / kota
  │     └── InfoPanel (klik peta)   → detail warga + gereja terdekat
  │
  ├── /admin/*  (Admin Panel)       → client-side React, role-guarded
  │     ├── /gereja                 → CRUD gereja
  │     ├── /kelompok               → CRUD kelompok
  │     ├── /kelurahan              → CRUD kelurahan + geocoding
  │     ├── /warga                  → input/edit data warga
  │     └── /users                  → manajemen user (Super Admin)
  │
  ├── /login                        → Supabase Auth
  └── /changelog                    → halaman publik
  
  │
  Next.js API Routes (/app/api/*)
  │
  Supabase (PostgreSQL + Auth + RLS)
```

**Pola penting:**
- `MapView.tsx` di-load dengan `next/dynamic` + `ssr: false` karena Leaflet hanya bisa jalan di browser
- Supabase client menggunakan singleton pattern (lazy-loaded via Proxy) di `lib/supabase.ts`
- Autentikasi dan proteksi route dilakukan di `middleware.ts` sebelum request sampai ke halaman
- Kalkulasi jarak gereja–kelurahan menggunakan Haversine formula (`lib/haversine.ts`)

---

## Struktur Database

```sql
gereja          — data gereja (gereja_id PK, nama, alamat, lat, lng)
kelompok        — kelompok/wilayah per gereja (kelompok_id PK, gereja_id FK, kode, nama)
kelurahan       — data kelurahan (kode PK, nama, kecamatan, kota_kab, provinsi, lat, lng, geojson JSONB)
fakta_warga     — jumlah warga (id UUID PK, tahun, kelurahan_kode FK, gereja_id FK, kelompok_id FK, jumlah_warga)
ref_provinsi    — referensi provinsi
user_profiles   — profil pengguna (id FK → auth.users, nama, role ENUM, aktif BOOLEAN)
```

**Relasi:**
```
gereja ──< kelompok
gereja ──< fakta_warga >── kelurahan
kelompok ──< fakta_warga
auth.users ──── user_profiles
```

**Constraints penting:**
- `fakta_warga`: UNIQUE(tahun, kelurahan_kode, gereja_id, kelompok_id)
- `fakta_warga`: CHECK(jumlah_warga >= 0)
- Trigger: auto-update `updated_at` saat fakta_warga diubah

> File migrasi lengkap ada di `supabase_migration.sql` di root project.

---

## Struktur Direktori

```
gkj-klasis-map/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Halaman utama (peta)
│   ├── globals.css
│   ├── changelog/page.tsx      # Halaman changelog (publik)
│   ├── login/page.tsx          # Halaman login
│   ├── admin/
│   │   ├── layout.tsx          # Layout admin (header + navigasi)
│   │   ├── gereja/page.tsx
│   │   ├── kelompok/page.tsx
│   │   ├── kelurahan/page.tsx  # Termasuk geocoding otomatis
│   │   ├── warga/page.tsx
│   │   └── users/page.tsx      # Super Admin only
│   └── api/
│       ├── gereja/route.ts
│       ├── kelompok/route.ts
│       ├── kelurahan/route.ts
│       ├── warga/route.ts      # GET + aggregasi untuk peta
│       ├── users/route.ts
│       ├── auth/route.ts
│       ├── provinsi/route.ts
│       └── geocode/route.ts    # Nominatim geocoding
├── components/
│   ├── map/
│   │   ├── MapView.tsx         # Komponen peta Leaflet
│   │   ├── Sidebar.tsx         # Filter sidebar
│   │   └── InfoPanel.tsx       # Panel info saat klik polygon
│   └── admin/                  # Komponen-komponen admin
├── lib/
│   ├── types.ts                # TypeScript types (Gereja, Kelurahan, dll)
│   ├── supabase.ts             # Supabase server client (singleton)
│   ├── supabase-browser.ts     # Supabase browser client
│   └── haversine.ts            # Kalkulasi jarak haversine
├── middleware.ts               # Proteksi route & auth
├── next.config.ts
├── supabase_migration.sql      # Skema database lengkap
└── .env.local                  # Kredensial Supabase (jangan di-commit)
```

---

## API Reference

Semua endpoint membutuhkan session valid kecuali yang ditandai *publik*.

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/gereja` | Daftar semua gereja |
| POST | `/api/gereja` | Tambah gereja baru |
| PUT | `/api/gereja` | Update data gereja |
| DELETE | `/api/gereja?gereja_id=` | Hapus gereja |
| GET | `/api/kelompok?gereja_id=` | Daftar kelompok per gereja |
| POST | `/api/kelompok` | Tambah kelompok |
| PUT | `/api/kelompok` | Update kelompok |
| DELETE | `/api/kelompok?kelompok_id=` | Hapus kelompok |
| GET | `/api/kelurahan` | Daftar semua kelurahan |
| POST | `/api/kelurahan` | Tambah kelurahan |
| PUT | `/api/kelurahan` | Update kelurahan |
| DELETE | `/api/kelurahan?kode=` | Hapus kelurahan |
| GET | `/api/warga?tahun=&mode=raw` | Data warga mentah (admin) |
| GET | `/api/warga?tahun=&gereja_id=&kota_kab=` | Data warga teragregasi (peta) |
| POST | `/api/warga` | Tambah data warga |
| PUT | `/api/warga` | Update data warga |
| DELETE | `/api/warga?id=` | Hapus data warga |
| GET | `/api/users` | Daftar user (Super Admin) |
| POST | `/api/users` | Tambah user baru |
| PUT | `/api/users` | Update role/status user |
| GET | `/api/geocode?kode=` | Geocode satu kelurahan |
| POST | `/api/geocode` | Batch geocode semua kelurahan |
| GET | `/api/provinsi` | Daftar provinsi |

---

## Setup & Menjalankan Lokal

### Prasyarat
- Node.js v18+
- npm v9+
- Akun Supabase (atau self-hosted)

### 1. Clone & Install

```bash
git clone https://github.com/pwdaloe/gkj-klasis-map.git
cd gkj-klasis-map
npm install
```

### 2. Setup Supabase

Buat project baru di [supabase.com](https://supabase.com), lalu jalankan file migrasi:

```bash
# Di Supabase Dashboard → SQL Editor, paste dan run isi file:
supabase_migration.sql
```

Atau gunakan Supabase CLI:
```bash
supabase db push
```

### 3. Konfigurasi Environment

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Kredensial tersedia di Supabase Dashboard → Project Settings → API.

> **Perhatian:** Jangan pernah commit `.env.local` ke repository. File ini sudah masuk `.gitignore`.

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 5. Build untuk Production

```bash
npm run build
npm start
```

---

## Role & Akses Pengguna

| Role | Lihat Peta | Admin Panel | Manajemen User |
|------|:---:|:---:|:---:|
| **Viewer** | ✓ | — | — |
| **Entry Data** | ✓ | ✓ | — |
| **Super Admin** | ✓ | ✓ | ✓ |

User dibuat melalui halaman `/admin/users` oleh Super Admin. Tidak ada self-registration.

---

## Rencana Pengembangan

### Jangka Pendek
- [ ] Export data warga ke format Excel / CSV
- [ ] Cetak / print ringkasan peta per gereja
- [ ] Notifikasi saat ada kelurahan tanpa koordinat atau data belum lengkap
- [ ] Validasi input di admin panel (jumlah warga tidak boleh negatif, duplikasi entri)

### Jangka Menengah
- [ ] Grafik tren pertumbuhan warga per tahun per gereja
- [ ] Perbandingan antar gereja dalam satu tampilan
- [ ] Upload data warga secara batch (Excel/CSV)
- [ ] Riwayat perubahan data (audit log)
- [ ] Paginasi dan lazy-load pada peta dengan banyak polygon

### Jangka Panjang
- [ ] Dashboard laporan untuk Klasis (ringkasan semua gereja)
- [ ] Peta per kelompok / wilayah pelayanan
- [ ] Integrasi profil warga (bukan hanya jumlah, tapi data demografis)
- [ ] Mode offline / PWA untuk daerah dengan koneksi terbatas

---

## Changelog

Lihat halaman `/changelog` langsung dari aplikasi, atau lihat riwayat commit di GitHub.

---

## Lisensi

Aplikasi ini dikembangkan untuk keperluan internal **GKJ Klasis Jakarta Bagian Timur**.
