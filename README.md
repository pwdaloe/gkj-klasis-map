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

**Live app**: [https://klasis.purwandaru.com](https://klasis.purwandaru.com)

Aplikasi ini dibangun untuk membantu GKJ Klasis Jakarta Bagian Timur dalam:

- Memantau sebaran geografis warga jemaat dari tiap gereja anggota klasis
- Merekam jumlah warga per kelurahan, per tahun, per gereja, dan per kelompok
- Memberikan visualisasi peta interaktif dengan gradasi warna berdasarkan kepadatan warga
- Menyediakan admin panel bagi petugas untuk input dan manajemen data

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
- Login email + password dengan autentikasi JWT (HTTP-only cookie)
- Tiga level akses: **Viewer**, **Entry Data**, **Super Admin**
- Halaman manajemen user (Super Admin only): tambah user, ubah role, aktifkan/nonaktifkan akun
- User baru wajib mengganti password saat login pertama

---

## Tech Stack

| Lapisan | Teknologi | Versi |
|---|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) | 16.x |
| Language | TypeScript | ^5 |
| UI | React + [Tailwind CSS v4](https://tailwindcss.com) | 19.x / ^4 |
| Peta/GIS | [Leaflet](https://leafletjs.com) + react-leaflet | ^5 |
| Database | PostgreSQL (self-hosted di VPS) | 16 |
| DB Client | [postgres.js](https://github.com/porsager/postgres) | ^3 |
| Auth | Custom JWT dengan `bcryptjs` + `jose` | — |
| Geocoding | [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap) | Free |
| Runtime | Node.js + PM2 | 20+ |
| Web Server | Nginx (reverse proxy) | — |
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
  ├── /login                        → form login → POST /api/auth/login
  ├── /change-password              → wajib diisi user baru saat login pertama
  └── /changelog                    → halaman publik

  │
  Next.js API Routes (/app/api/*)
  │
  PostgreSQL (self-hosted di VPS via postgres.js)
```

**Pola penting:**
- `MapView.tsx` di-load dengan `next/dynamic` + `ssr: false` karena Leaflet hanya bisa jalan di browser
- Autentikasi menggunakan JWT disimpan sebagai HTTP-only cookie `session`, diverifikasi di `proxy.ts` via `jose`
- Password di-hash dengan `bcryptjs` (cost factor 12)
- User baru memiliki flag `must_change_password = TRUE` — middleware redirect ke `/change-password` sebelum bisa akses halaman lain
- Kalkulasi jarak gereja–kelurahan menggunakan Haversine formula (`lib/haversine.ts`)

---

## Struktur Database

```sql
gereja          — data gereja (gereja_id PK, nama, alamat, lat, lng)
kelompok        — kelompok/wilayah per gereja (kelompok_id PK, gereja_id FK, kode, nama)
kelurahan       — data kelurahan aktif (kode PK, nama, kecamatan, kota_kab, provinsi, lat, lng, geojson TEXT)
fakta_warga     — jumlah warga (id UUID PK, tahun, kelurahan_kode FK, gereja_id FK, kelompok_id FK, jumlah_warga)
ref_provinsi    — referensi provinsi
ref_wilayah     — referensi kelurahan Jabodetabek dari SHP BPS 2020 (id PK, kelurahan, kecamatan, kota_kab, provinsi, geojson TEXT, kode_bps)
user_profiles   — profil pengguna (id UUID PK, email, password_hash, nama, role, aktif, must_change_password)
```

**Relasi:**
```
gereja ──< kelompok
gereja ──< fakta_warga >── kelurahan
kelompok ──< fakta_warga
user_profiles (mandiri — tidak bergantung pada auth eksternal)
```

**Constraints penting:**
- `fakta_warga`: UNIQUE(tahun, kelurahan_kode, gereja_id, kelompok_id)
- `fakta_warga`: CHECK(jumlah_warga >= 0)
- `user_profiles`: email UNIQUE NOT NULL
- Trigger: auto-update `updated_at` saat fakta_warga diubah

> Skema awal ada di `supabase_migration.sql`. Tabel `ref_wilayah` ditambahkan di v1.7.

---

## Struktur Direktori

```
gkj-klasis-map/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Halaman utama (peta)
│   ├── globals.css
│   ├── changelog/page.tsx      # Halaman changelog (publik)
│   ├── login/page.tsx          # Halaman login (POST ke /api/auth/login)
│   ├── change-password/page.tsx # Ganti password saat login pertama
│   ├── admin/
│   │   ├── layout.tsx          # Layout admin (header + navigasi + logout)
│   │   ├── gereja/page.tsx
│   │   ├── kelompok/page.tsx
│   │   ├── kelurahan/page.tsx  # Termasuk geocoding otomatis
│   │   ├── warga/page.tsx
│   │   └── users/page.tsx      # Super Admin only
│   └── api/
│       ├── auth/
│       │   ├── route.ts                  # POST logout (hapus cookie session)
│       │   ├── login/route.ts            # POST login → set JWT cookie
│       │   └── change-password/route.ts  # POST ganti password
│       ├── gereja/route.ts
│       ├── kelompok/route.ts
│       ├── kelurahan/route.ts
│       ├── warga/route.ts      # GET + aggregasi untuk peta
│       ├── users/route.ts
│       ├── provinsi/route.ts
│       └── geocode/route.ts    # Nominatim geocoding
├── components/
│   ├── map/
│   │   ├── MapView.tsx         # Komponen peta Leaflet
│   │   ├── Sidebar.tsx         # Filter sidebar + tombol logout
│   │   └── InfoPanel.tsx       # Panel info saat klik polygon
│   └── admin/                  # Komponen-komponen admin
├── lib/
│   ├── types.ts                # TypeScript types (Gereja, Kelurahan, dll)
│   ├── db.ts                   # PostgreSQL client (postgres.js singleton)
│   ├── auth.ts                 # JWT helper (signToken, verifyToken, hashPassword)
│   └── haversine.ts            # Kalkulasi jarak haversine
├── proxy.ts                    # Proteksi route, verifikasi JWT, redirect change-password
├── next.config.ts
├── supabase_migration.sql      # Skema database lengkap
└── .env.local                  # Environment variables (jangan di-commit)
```

---

## API Reference

Semua endpoint membutuhkan cookie `session` valid kecuali `/api/auth/login`.

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login, set cookie JWT |
| POST | `/api/auth` | Logout, hapus cookie |
| POST | `/api/auth/change-password` | Ganti password (user baru) |
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
| POST | `/api/warga` | Tambah / upsert data warga |
| PUT | `/api/warga` | Update jumlah warga |
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
- Node.js v20+
- npm v10+
- PostgreSQL 16 (lokal atau di VPS)

### 1. Clone & Install

```bash
git clone https://github.com/pwdaloe/gkj-klasis-map.git
cd gkj-klasis-map
npm install
```

### 2. Setup PostgreSQL

Buat database dan user:

```sql
CREATE USER gkj_user WITH PASSWORD 'password_anda';
CREATE DATABASE gkj_klasis OWNER gkj_user;
GRANT ALL PRIVILEGES ON DATABASE gkj_klasis TO gkj_user;
```

Jalankan file migrasi (membuat tabel gereja, kelompok, kelurahan, fakta_warga, ref_provinsi):

```bash
psql -U gkj_user -h localhost -d gkj_klasis -f supabase_migration.sql
```

Buat tabel `user_profiles` untuk auth mandiri:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  nama TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'entry', 'superadmin')),
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT ALL PRIVILEGES ON TABLE user_profiles TO gkj_user;
```

### 3. Konfigurasi Environment

Buat file `.env.local` di root project:

```env
DATABASE_URL=postgresql://gkj_user:password_anda@localhost:5432/gkj_klasis
JWT_SECRET=random-string-panjang-minimal-32-karakter
APP_URL=http://localhost:3000
```

> **Perhatian:** Jangan pernah commit `.env.local` ke repository. File ini sudah masuk `.gitignore`.

### 4. Buat User Pertama

Generate bcrypt hash lalu insert ke database:

```bash
# Generate hash (jalankan dari folder project)
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password_sementara', 12));"
```

```sql
INSERT INTO user_profiles (email, password_hash, nama, role, aktif, must_change_password)
VALUES ('admin@email.com', '[output_hash_di_atas]', 'Admin', 'superadmin', TRUE, FALSE);
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 6. Build untuk Production

```bash
npm run build
npm start
```

---

## Deployment (VPS)

Aplikasi di-deploy di VPS Ubuntu 24.04 dengan stack berikut:

| Komponen | Detail |
|---|---|
| Server | VPS Ubuntu 24.04 LTS |
| Process manager | PM2 (port 3001) |
| Web server | Nginx (reverse proxy) |
| SSL | Let's Encrypt via Certbot |
| URL Production | https://klasis.purwandaru.com |

**Perintah deploy ulang setelah update kode:**

```bash
cd /var/www/gkj-klasis
git pull
npm install
npm run build
pm2 restart gkj-klasis
```

**Environment variables di VPS** (simpan di `.env.production`):

```env
DATABASE_URL=postgresql://gkj_user:password@localhost:5432/gkj_klasis
JWT_SECRET=random-string-minimal-32-karakter
APP_URL=https://klasis.purwandaru.com
```

---

## Role & Akses Pengguna

| Role | Lihat Peta | Admin Panel | Manajemen User |
|------|:---:|:---:|:---:|
| **Viewer** | ✓ | — | — |
| **Entry Data** | ✓ | ✓ | — |
| **Super Admin** | ✓ | ✓ | ✓ |

User dibuat melalui halaman `/admin/users` oleh Super Admin. Tidak ada self-registration. User baru menerima password sementara dan wajib menggantinya saat login pertama.

---

## Rencana Pengembangan

### Dalam Pengerjaan (v1.8)
- [ ] Export data warga ke format Excel / CSV
- [ ] Upload data warga secara batch (template Excel pre-filled per gereja)
- [ ] Landing page publik `/tentang` — kegunaan aplikasi + download template per gereja
- [ ] Audit log riwayat perubahan data (semua tabel)
- [ ] Dashboard laporan Klasis `/bph` — ringkasan, perbandingan gereja, ranking kelurahan
- [ ] Role baru `bph` untuk Badan Pengelola Harian Klasis

> Detail lengkap ada di [V1.8-TODO.md](V1.8-TODO.md)

### Jangka Pendek
- [ ] Cetak / print ringkasan peta per gereja
- [ ] Notifikasi saat ada kelurahan tanpa koordinat atau polygon belum tersedia
- [ ] Validasi input di admin panel (jumlah warga tidak boleh negatif, duplikasi entri)

### Jangka Menengah
- [ ] Grafik tren pertumbuhan warga per tahun per gereja
- [ ] Paginasi dan lazy-load pada peta dengan banyak polygon

### Jangka Panjang
- [ ] Peta per kelompok / wilayah pelayanan
- [ ] Integrasi profil warga (bukan hanya jumlah, tapi data demografis)
- [ ] Mode offline / PWA untuk daerah dengan koneksi terbatas

### Selesai
- [x] Export, upload batch, landing page, audit log, dashboard BPH, role bph (v1.8)
- [x] Tabel ref_wilayah + admin browser + import + autocomplete (v1.7)
- [x] Migrasi database Supabase → PostgreSQL self-hosted di VPS (v1.6)
- [x] Perbaikan rendering polygon kelurahan (geojson TEXT → parse di API) (v1.6)
- [x] Input GeoJSON manual per kelurahan di admin panel + validasi geometry (v1.6)
- [x] Import massal polygon dari SHP BPS 2020 (v1.6)

---

## Changelog

| Versi | Tanggal | Highlight |
|-------|---------|-----------|
| **v1.8** | 2026-06-13 | Export Excel/CSV, upload batch, landing page /tentang, audit log, dashboard BPH, role bph |
| **v1.7** | 2026-06-12 | Tabel ref_wilayah 471 kelurahan Jabodetabek, admin browser + import, autocomplete kelurahan baru |
| **v1.6** | 2026-06-12 | Migrasi ke PostgreSQL VPS, perbaikan polygon rendering, input GeoJSON manual, import massal dari SHP BPS 2020 |
| **v1.5** | 2026-05-11 | Sidebar collapsible, mobile UX, overview bar |
| **v1.4** | 2026-05-11 | Autocomplete, search/filter/sort di admin warga & kelurahan |
| **v1.3** | 2026-05-11 | Sistem login JWT, manajemen user, Vercel Analytics |
| **v1.1** | 2026-05-11 | Provinsi dinamis, koordinat manual, polygon kelurahan kosong |
| **v1.0** | 2026-05-10 | Rilis pertama — peta interaktif, admin panel, geocoding Nominatim |

Lihat detail lengkap di halaman [`/changelog`](https://klasis.purwandaru.com/changelog) atau riwayat commit di GitHub.

---

## Lisensi

Aplikasi ini dikembangkan untuk keperluan internal **GKJ Klasis Jakarta Bagian Timur**.
