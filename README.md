# Pemetaan Warga GKJ Klasis Jakarta Bagian Timur

Aplikasi web untuk memetakan persebaran warga jemaat gereja-gereja di bawah naungan **GKJ Klasis Jakarta Bagian Timur** berdasarkan kelurahan tempat tinggal. Data divisualisasikan dalam peta interaktif dengan gradasi warna berdasarkan kepadatan warga.

---

## Fitur Utama

### Peta Interaktif
- Polygon kelurahan berwarna berdasarkan jumlah warga (gradasi merah)
- Filter berdasarkan **tahun**, **gereja**, dan **kota/kabupaten**
- Marker lokasi setiap gereja di peta
- Klik polygon untuk melihat detail warga per gereja dan gereja terdekat
- Kelurahan tanpa data warga tetap tampil (warna abu-abu) sebagai base layer

### Sidebar & Navigasi
- Sidebar dapat disembunyikan/dibuka di semua perangkat (tombol ✕ dan ☰)
- Di perangkat mobile, sidebar otomatis tersembunyi saat pertama dibuka
- Daftar kelurahan ber-jemaat muncul saat gereja dipilih — klik nama untuk zoom ke lokasi di peta

### Overview Bar
- Informasi ringkas di atas peta: tahun data, jumlah gereja terdaftar, kelurahan ter-data, dan total warga

### Admin Panel
- **Data Gereja** — tambah dan kelola data gereja beserta koordinat lokasi
- **Data Kelompok** — kelompok/wilayah di bawah setiap gereja
- **Data Kelurahan** — tambah kelurahan, geocoding otomatis via Nominatim (OpenStreetMap), input koordinat manual, filter status geocode, dan edit data inline
- **Data Warga** — input jumlah warga per kombinasi tahun + kelurahan + gereja, autocomplete kelurahan, filter/search/sortir, edit dan hapus per baris

### Manajemen Pengguna
- Login dengan email dan password (Supabase Auth)
- Tiga level akses:
  - **Viewer** — hanya dapat melihat peta
  - **Entry Data** — dapat mengakses admin panel untuk input data
  - **Super Admin** — akses penuh termasuk manajemen pengguna
- Halaman manajemen user: tambah user, ubah role, aktifkan/nonaktifkan akun

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router, TypeScript) |
| UI | [Tailwind CSS v4](https://tailwindcss.com) |
| Peta | [Leaflet](https://leafletjs.com) |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + RLS + Auth) |
| Geocoding | [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap) |
| Deployment | [Vercel](https://vercel.com) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |

---

## Struktur Database

```
gereja          — data gereja (nama, alamat, koordinat)
kelompok        — kelompok/wilayah per gereja
kelurahan       — data kelurahan (kode, nama, kecamatan, kota/kab, provinsi, koordinat, geojson)
fakta_warga     — jumlah warga per tahun + kelurahan + gereja + kelompok
ref_provinsi    — referensi daftar provinsi
user_profiles   — profil pengguna (role, status aktif)
```

---

## Cara Menjalankan Lokal

1. Clone repository dan install dependensi:
   ```bash
   git clone https://github.com/pwdaloe/gkj-klasis-map.git
   cd gkj-klasis-map
   npm install
   ```

2. Buat file `.env.local` dengan isi:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Jalankan development server:
   ```bash
   npm run dev
   ```

---

## Rencana Pengembangan

### Jangka Pendek
- [ ] Export data warga ke format Excel / CSV
- [ ] Cetak / print ringkasan peta per gereja
- [ ] Notifikasi saat data belum lengkap atau ada kelurahan tanpa koordinat

### Jangka Menengah
- [ ] Grafik tren pertumbuhan warga per tahun per gereja
- [ ] Perbandingan antar gereja dalam satu tampilan
- [ ] Input data warga secara batch (upload Excel)
- [ ] Riwayat perubahan data (audit log)

### Jangka Panjang
- [ ] Dashboard laporan untuk Klasis (ringkasan semua gereja)
- [ ] Peta per kelompok / wilayah pelayanan
- [ ] Integrasi data pendataan jemaat (bukan hanya jumlah, tapi profil)

---

## Changelog

Lihat halaman Changelog langsung dari aplikasi setelah login.

---

## Lisensi

Aplikasi ini dikembangkan untuk keperluan internal GKJ Klasis Jakarta Bagian Timur.
