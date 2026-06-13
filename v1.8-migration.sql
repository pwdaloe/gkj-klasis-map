-- ============================================================
-- GKJ Klasis JBT - Migration v1.8
-- Jalankan di VPS sebelum deploy v1.8
--
-- Cara pakai:
--   psql -U gkj_user -d gkj_klasis -f v1.8-migration.sql
-- ============================================================


-- ============================================================
-- 1. Update role constraint di user_profiles
--    Tambah role 'bph' untuk Badan Pengelola Harian Klasis
-- ============================================================
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('viewer', 'entry', 'superadmin', 'bph'));


-- ============================================================
-- 2. Tabel audit_log
--    Menyimpan riwayat semua perubahan data (INSERT/UPDATE/DELETE)
--    pada tabel: fakta_warga, kelurahan, gereja, kelompok, user_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  user_id     UUID          REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_nama   TEXT          NOT NULL DEFAULT '',
  action      TEXT          NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  tabel       TEXT          NOT NULL,
  record_id   TEXT          NOT NULL,
  data_lama   JSONB,
  data_baru   JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabel     ON audit_log(tabel);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id   ON audit_log(user_id);

GRANT ALL PRIVILEGES ON TABLE audit_log TO gkj_user;
