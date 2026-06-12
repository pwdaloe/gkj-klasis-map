---
name: bump-version
description: Naikkan versi aplikasi GKJ Klasis JBT — update package.json, changelog page, version badge login & main page, dan tabel changelog di README sekaligus. Gunakan setelah fitur baru selesai: /bump-version 1.8 atau /bump-version (akan tanya versi).
---

Kamu adalah release manager project GKJ Klasis JBT.

Tugasmu: **update versioning di 4 lokasi sekaligus** agar semuanya konsisten.

---

## LANGKAH 1 — TENTUKAN VERSI BARU

Cek `$ARGUMENTS`. Jika berisi angka versi (misal `1.8`), gunakan itu.
Jika kosong, baca `package.json` untuk tahu versi saat ini, lalu naikkan minor version (1.6 → 1.7, 1.7 → 1.8).

Konfirmasi versi baru ke user sebelum lanjut **hanya jika argumen tidak diberikan dan kamu tidak yakin**.

---

## LANGKAH 2 — KUMPULKAN INFORMASI CHANGELOG

Baca file-file berikut untuk memahami apa yang berubah sejak versi terakhir:
- `app/changelog/page.tsx` — entri versi terakhir (versi apa yang paling baru)
- `git log --oneline -20` — commit terbaru sebagai sumber fitur yang ditambahkan
- `README.md` section "Rencana Pengembangan → Segera" — fitur yang direncanakan dan mungkin sudah selesai

Rangkum perubahan menjadi 5–10 poin ringkas dalam Bahasa Indonesia.

---

## LANGKAH 3 — UPDATE 4 FILE

### 3a. `package.json`
Ganti `"version"` ke versi baru.

### 3b. `app/changelog/page.tsx`
Tambahkan entri baru di **posisi paling atas** array `logs` dengan format:
```js
{
  versi: 'X.Y',
  tanggal: 'YYYY-MM-DD',   // gunakan tanggal hari ini
  fitur: [
    'Deskripsi fitur 1',
    'Deskripsi fitur 2',
    // ...
  ],
},
```
Jangan ubah entri lama.

### 3c. `app/login/page.tsx`
Cari baris yang mengandung `v1.` di dekat akhir file (biasanya di dalam `<p>` tag).
Ganti dengan versi baru: `v{X.Y}`.

### 3d. `app/page.tsx`
Cari baris yang mengandung `v1.` di bagian overview bar (biasanya di `<span>` dengan className text-gray-400).
Ganti dengan versi baru: `v{X.Y}`.

### 3e. `README.md`
Tambahkan baris baru di **bagian atas** tabel Changelog:
```
| **vX.Y** | YYYY-MM-DD | Ringkasan fitur utama |
```

---

## LANGKAH 4 — LAPORAN

Setelah semua file diupdate, tampilkan ringkasan:

```
Versi dinaikkan: vA.B → vX.Y

File yang diupdate:
  ✓ package.json
  ✓ app/changelog/page.tsx  — entri vX.Y ditambahkan
  ✓ app/login/page.tsx      — badge diupdate
  ✓ app/page.tsx            — badge diupdate
  ✓ README.md               — tabel changelog diupdate

Fitur dicatat:
  • Poin 1
  • Poin 2
  ...
```

Tanyakan apakah user ingin commit dan push sekarang.

---

## ATURAN

- Tanggal selalu gunakan hari ini (tersedia di context sebagai `currentDate`)
- Jangan ubah struktur JSX yang ada — hanya ganti teks versi dan tambah entri baru
- Gunakan Bahasa Indonesia di semua teks changelog
- Jangan tambah emoji
- Jangan commit otomatis tanpa konfirmasi user
