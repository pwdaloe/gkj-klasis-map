# ~~To-Do: Migrasi Supabase → PostgreSQL Self-Hosted (VPS)~~
# SELESAI: Migrasi Supabase → PostgreSQL Self-Hosted (VPS)

> Dibuat: 2026-06-11  
> Estimasi total: 1–2 hari kerja penuh  
> **Selesai: 2026-06-13 ✓ — Aplikasi sudah berjalan di VPS**

### Keputusan yang sudah ditetapkan
- **Password lama**: user harus ganti password sendiri saat login pertama (lihat Fase 2.5)
- **Domain**: ada domain + SSL — domain akan diinfokan saat hari-H
- **Strategi**: langsung cutover (tidak parallel run)

---

## Gambaran Perubahan

Supabase bukan hanya database — ada tiga lapisan yang harus diganti:

| Lapisan | Supabase sekarang | Pengganti (VPS) |
|---|---|---|
| **Database** | Supabase PostgreSQL (hosted) | PostgreSQL di VPS |
| **Auth (login/session)** | Supabase Auth + `@supabase/ssr` | Custom JWT + `bcrypt` |
| **DB Client** | `@supabase/supabase-js` | `postgres.js` atau `pg` |
| **User Management** | `supabaseAdmin.auth.admin.createUser` | Custom endpoint |
| **Middleware session** | `createServerClient` (@supabase/ssr) | Verifikasi JWT dari cookie |

---

## FASE 1 — Setup VPS & Database

### 1.1 Setup PostgreSQL di VPS
- [x] Install PostgreSQL 16 di VPS (`apt install postgresql-16`)
- [x] Buat database baru: `gkj_klasis`
- [x] Buat user PostgreSQL khusus app (jangan pakai `postgres` langsung)
- [x] Simpan kredensial: `DATABASE_URL=postgresql://user:pass@localhost:5432/gkj_klasis`
- [x] Pastikan port 5432 hanya bisa diakses dari localhost (jangan expose ke publik)

### 1.2 Ekspor Data dari Supabase
- [x] Buka Supabase Dashboard → Settings → Database → Backups
- [x] Download backup PostgreSQL (format `.sql`) atau gunakan `pg_dump`:
  ```bash
  pg_dump "postgresql://postgres:[password]@db.ihgdikyvaxszptafvoah.supabase.co:5432/postgres" \
    --no-owner --no-acl \
    --table=gereja --table=kelompok --table=kelurahan \
    --table=fakta_warga --table=ref_provinsi \
    -f data_export.sql
  ```
- [x] **Jangan** ekspor tabel `auth.*` dari Supabase — tidak kompatibel

### 1.3 Import Skema & Data ke VPS
- [x] Jalankan `supabase_migration.sql` di VPS (sudah ada di project):
  ```bash
  psql -U gkj_user -d gkj_klasis -f supabase_migration.sql
  ```
- [x] Import data yang sudah diekspor:
  ```bash
  psql -U gkj_user -d gkj_klasis -f data_export.sql
  ```
- [x] Verifikasi data: cek jumlah row tiap tabel

### 1.4 Modifikasi Skema untuk Auth Mandiri
- [x] Hapus FK constraint dari `user_profiles.id` ke `auth.users`
- [x] Tambah kolom `email` dan `password_hash` ke tabel `user_profiles`:
  ```sql
  ALTER TABLE user_profiles ADD COLUMN email TEXT UNIQUE NOT NULL DEFAULT '';
  ALTER TABLE user_profiles ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
  ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  ```
- [x] Tambah kolom `must_change_password` ke tabel `user_profiles`:
  ```sql
  ALTER TABLE user_profiles ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT TRUE;
  ```
- [x] Migrasi data user yang sudah ada:
  - Isi kolom `email` dari data Supabase auth (export manual dari Supabase Dashboard → Authentication → Users)
  - Set password sementara untuk semua user (akan wajib diganti saat login pertama):
    ```sql
    UPDATE user_profiles SET password_hash = '[bcrypt dari password sementara]';
    ```
  - Semua user di-set `must_change_password = TRUE`

---

## FASE 2 — Ganti Library & Auth

### 2.1 Install Dependency Baru
```bash
# Tambah
npm install postgres bcryptjs jose

# Hapus yang tidak perlu lagi
npm uninstall @supabase/supabase-js @supabase/ssr
```

- [x] Install `postgres` (postgres.js — modern PostgreSQL client untuk Node.js)
- [x] Install `bcryptjs` (hash password)
- [x] Install `jose` (buat & verifikasi JWT)
- [x] Uninstall `@supabase/supabase-js` dan `@supabase/ssr`

### 2.2 Buat File DB Client Baru (`lib/db.ts`)
- [x] Ganti `lib/supabase.ts` dengan koneksi `postgres.js`:
  ```ts
  import postgres from 'postgres'
  const sql = postgres(process.env.DATABASE_URL!)
  export default sql
  ```
- [x] Hapus `lib/supabase.ts` dan `lib/supabase-browser.ts`

### 2.3 Buat Auth Helper (`lib/auth.ts`)
- [x] Fungsi `hashPassword(password)` → bcryptjs
- [x] Fungsi `verifyPassword(password, hash)` → bcryptjs
- [x] Fungsi `signToken(payload)` → jose (JWT, expires 7 hari)
- [x] Fungsi `verifyToken(token)` → jose
- [x] Set `JWT_SECRET` di environment variable

### 2.5 Buat Alur "Ganti Password Saat Login Pertama"
- [x] Di `/api/auth/login`: setelah login berhasil, cek `must_change_password`
  - Kalau `true` → set flag di JWT payload: `{ ...payload, mustChangePassword: true }`
- [x] Di `middleware.ts`: jika `mustChangePassword === true` dan route bukan `/change-password` → redirect ke `/change-password`
- [x] Buat halaman `/app/change-password/page.tsx`:
  - Form: input password baru + konfirmasi
  - POST ke `/api/auth/change-password`
- [x] Buat `/api/auth/change-password`:
  1. Verifikasi token dari cookie (user harus login)
  2. Hash password baru dengan bcryptjs
  3. Update `password_hash` dan set `must_change_password = FALSE`
  4. Refresh JWT cookie (update payload `mustChangePassword: false`)
  5. Redirect ke `/`

### 2.6 Update Middleware (`middleware.ts`)
- [x] Hapus semua import dari `@supabase/ssr`
- [x] Baca JWT dari cookie `session` (HTTP-only)
- [x] Verifikasi token dengan `jose`
- [x] Ambil `role` dan `mustChangePassword` dari payload JWT
- [x] Tambah `/change-password` ke daftar route yang bisa diakses selama sudah login
- [x] Jika `mustChangePassword === true` → redirect ke `/change-password` (kecuali sudah di sana)
- [x] Logic redirect lain tetap sama (viewer → `/`, non-entry → `/`, dst)

---

## FASE 3 — Update API Routes

### 3.1 Auth Routes
- [x] **`/api/auth` (POST — logout)**: ganti `supabase.auth.signOut()` dengan `response.cookies.delete('session')`
- [x] **`/app/login/page.tsx`**: ganti `supabase.auth.signInWithPassword` dengan POST ke `/api/auth/login`
- [x] **Buat `/api/auth/login` (baru)**:
  1. Terima `{ email, password }`
  2. Query `user_profiles` by email
  3. `verifyPassword(password, user.password_hash)`
  4. `signToken({ id, email, role, nama })`
  5. Set cookie HTTP-only `session` dengan token JWT
  6. Return `{ success: true }`

### 3.2 User Management (`/api/users`)
- [x] **GET**: query langsung ke `user_profiles` via `postgres.js`
- [x] **POST**: hash password dengan `bcryptjs`, insert ke `user_profiles` (tidak perlu Supabase Auth)
- [x] **PUT**: update `user_profiles` (role, aktif, nama)
- [x] Hapus semua referensi ke `supabaseAdmin.auth.admin.*`

### 3.3 Data Routes (Gereja, Kelompok, Kelurahan, Warga)
- [x] Update `/api/gereja/route.ts` — ganti `supabase.from('gereja')` dengan query `postgres.js`
- [x] Update `/api/kelompok/route.ts`
- [x] Update `/api/kelurahan/route.ts`
- [x] Update `/api/warga/route.ts` (yang paling kompleks — ada aggregasi)
- [x] Update `/api/geocode/route.ts`
- [x] Update `/api/provinsi/route.ts`

> Tips query dengan postgres.js:
> ```ts
> // SELECT
> const rows = await sql`SELECT * FROM gereja ORDER BY nama`
> // INSERT
> await sql`INSERT INTO gereja ${sql(data, 'nama', 'alamat', 'lat', 'lng')}`
> // WHERE dengan parameter
> const [row] = await sql`SELECT * FROM gereja WHERE gereja_id = ${id}`
> ```

---

## FASE 4 — Setup VPS & Deployment

### 4.1 Siapkan VPS
- [x] Install Node.js 20+ (via `nvm` atau `nodesource`)
- [x] Install PM2: `npm install -g pm2`
- [x] Install Nginx
- [x] Konfigurasi firewall: buka port 80 dan 443, tutup 5432 dari luar

### 4.2 Environment Variables di VPS
- [x] Buat file `.env.production` di VPS (jangan commit ke git):
  ```env
  DATABASE_URL=postgresql://gkj_user:password@localhost:5432/gkj_klasis
  JWT_SECRET=random-string-panjang-minimal-32-karakter
  APP_URL=https://[domain yang diinfokan]
  ```
- [x] Hapus semua variabel `SUPABASE_*`

### 4.3 Build & Run Aplikasi
- [x] Clone/pull repo terbaru ke VPS
- [x] `npm install`
- [x] `npm run build`
- [x] Start dengan PM2:
  ```bash
  pm2 start npm --name "gkj-map" -- start
  pm2 save
  pm2 startup
  ```

### 4.4 Setup Nginx Reverse Proxy
- [x] Buat config Nginx yang forward ke `localhost:3000`
- [x] Setup SSL dengan Certbot (Let's Encrypt) jika ada domain
- [x] Restart Nginx

---

## FASE 5 — Verifikasi & Cleanup

- [x] Test login dengan user yang sudah ada
- [x] Test CRUD gereja, kelurahan, warga
- [x] Test peta interaktif (polygon, filter, klik)
- [x] Test geocoding (Nominatim masih sama, tidak berubah)
- [x] Test manajemen user (tambah user baru via Super Admin)
- [x] Cek semua role: Viewer, Entry Data, Super Admin
- [x] Monitor error log PM2: `pm2 logs gkj-map`

---

## Estimasi Waktu per Fase

| Fase | Estimasi |
|---|---|
| Fase 1 — Setup DB | 1–2 jam |
| Fase 2 — Library & Auth | 2–3 jam |
| Fase 3 — Update API Routes | 3–4 jam |
| Fase 4 — Deploy VPS | 1–2 jam |
| Fase 5 — Verifikasi | 1 jam |
| **Total** | **~8–12 jam** |
