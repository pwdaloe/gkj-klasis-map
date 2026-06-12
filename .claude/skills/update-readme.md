---
name: update-readme
description: Update README.md project GKJ Klasis JBT agar mencerminkan kondisi terkini — tech stack, arsitektur, setup instructions, dan API reference. Jalankan setelah ada perubahan besar pada stack atau fitur.
---

Kamu adalah technical writer yang memahami kode project ini secara menyeluruh.

Tugasmu: **update `README.md`** di root project agar akurat dan up-to-date dengan kondisi kode saat ini.

---

## LANGKAH 1 — ORIENTASI

Baca file-file berikut untuk memahami kondisi terkini:
- `README.md` — kondisi sekarang yang akan di-update
- `package.json` — versi dependencies yang aktif
- `middleware.ts` — mekanisme auth yang dipakai
- `lib/db.ts` — database client
- `lib/auth.ts` — auth helper
- `app/api/` — semua route (untuk API Reference)
- `lib/types.ts` — type definitions

---

## LANGKAH 2 — IDENTIFIKASI PERBEDAAN

Bandingkan README yang ada dengan kode aktual. Tandai bagian mana yang:
- **Salah** — menyebut teknologi yang sudah tidak dipakai (mis. Supabase Auth, `@supabase/supabase-js`)
- **Usang** — versi, env variable, atau setup steps yang tidak lagi relevan
- **Kurang** — fitur atau route yang ada di kode tapi belum terdokumentasi

---

## LANGKAH 3 — TULIS ULANG README

Update README.md dengan aturan berikut:

### Tech Stack
Sesuaikan tabel tech stack dengan `package.json`. Kolom: Lapisan | Teknologi | Versi.

### Arsitektur
Sesuaikan diagram arsitektur teks dengan alur request yang nyata (auth via JWT cookie, DB langsung ke PostgreSQL).

### Struktur Database
Update jika ada kolom baru di skema (mis. `email`, `password_hash`, `must_change_password` di `user_profiles`).

### Struktur Direktori
Sertakan file/folder baru yang relevan. Hapus yang sudah tidak ada.

### Setup & Menjalankan Lokal
- Hapus instruksi Supabase
- Ganti dengan instruksi PostgreSQL self-hosted
- Update daftar env variables ke: `DATABASE_URL`, `JWT_SECRET`, `APP_URL`

### API Reference
Pastikan semua route di `app/api/` terdokumentasi. Tambahkan route baru, hapus yang sudah tidak ada.

### Role & Akses
Pastikan masih akurat.

---

## ATURAN PENULISAN

- Gunakan Bahasa Indonesia
- Jangan tambah emoji
- Pertahankan struktur heading yang sudah ada
- Jangan hapus section Rencana Pengembangan dan Changelog
- Jangan mention Supabase di bagian Setup (kecuali di section Changelog kalau ada histori)
- Setelah selesai menulis, jalankan: `grep -n "supabase\|Supabase" README.md` untuk pastikan tidak ada referensi Supabase yang salah konteks

---

## OUTPUT

Tulis langsung ke `README.md` menggunakan Write atau Edit tool. Laporkan bagian mana saja yang berubah.
