#!/usr/bin/env python3
"""
Populate tabel ref_wilayah dari SHP BPS 2020.
Jalankan setelah deploy v1.7 dan setelah memanggil GET /api/setup.

Kebutuhan:
  pip install pyshp requests

Penggunaan:
  python3 scripts/populate_ref_wilayah.py

SHP source: https://github.com/Alf-Anas/batas-administrasi-indonesia
  2020/batas_desa_shp/Batas Desa SHP_2.zip.001 - .007 (278 MB total)
"""

import sys, os, zipfile, json, time, tempfile, shutil
sys.path.insert(0, '/opt/homebrew/lib/python3.11/site-packages')

import shapefile
import requests

# ── Konfigurasi ─────────────────────────────────────────────────────────────
API_BASE   = "https://klasis.purwandaru.com"
BATCH_SIZE = 50   # jumlah baris per POST request

# Wilayah yang diinginkan (nilai dari field WADMKK / WADMPR di SHP)
TARGET_KOTA = {
    "Kota Bekasi", "Kabupaten Bekasi",
    "Kota Depok",
    "Kota Bogor", "Kabupaten Bogor",
}
TARGET_PROVINSI = {"DKI Jakarta"}   # semua kota DKI diambil

SHP_URL_BASE = (
    "https://raw.githubusercontent.com/Alf-Anas/"
    "batas-administrasi-indonesia/master/2020/"
    "batas_desa_shp/Batas%20Desa%20SHP_2.zip"
)
PARTS = 7
# ─────────────────────────────────────────────────────────────────────────────


def download_shp(tmpdir):
    print("Mengunduh SHP BPS 2020 (278 MB)...")
    parts = []
    for i in range(1, PARTS + 1):
        ext  = f"{i:03d}"
        dest = os.path.join(tmpdir, f"part.{ext}")
        url  = f"{SHP_URL_BASE}.{ext}"
        print(f"  [{i}/{PARTS}] {url}")
        r = requests.get(url, stream=True, timeout=120)
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
        parts.append(dest)
    return parts


def extract_shp(tmpdir, parts):
    combined = os.path.join(tmpdir, "combined.zip")
    print("Menggabungkan bagian zip...")
    with open(combined, "wb") as out:
        for p in parts:
            with open(p, "rb") as f:
                shutil.copyfileobj(f, out)

    outer_zip = os.path.join(tmpdir, "outer")
    os.makedirs(outer_zip, exist_ok=True)
    print("Mengekstrak outer zip...")
    with zipfile.ZipFile(combined) as z:
        z.extractall(outer_zip)

    inner_zip_path = os.path.join(outer_zip, "Batas Desa SHP.zip")
    shp_dir = os.path.join(tmpdir, "shp")
    os.makedirs(shp_dir, exist_ok=True)
    print("Mengekstrak SHP dari inner zip...")
    with zipfile.ZipFile(inner_zip_path) as z:
        z.extractall(shp_dir)

    return os.path.join(shp_dir, "Batas Desa")  # tanpa ekstensi


def scan_shp(shp_base):
    print("Memindai SHP...")
    sf     = shapefile.Reader(shp_base, encoding="utf-8")
    fields = [f[0] for f in sf.fields[1:]]
    print(f"  Fields: {fields}")

    def idx(name):
        return fields.index(name)

    rows     = []
    total    = 0
    matched  = 0

    for rec in sf.iterShapeRecords():
        total += 1
        kd  = str(rec.record[idx("WADMKD")]).strip()
        kc  = str(rec.record[idx("WADMKC")]).strip()
        kk  = str(rec.record[idx("WADMKK")]).strip()
        pr  = str(rec.record[idx("WADMPR")]).strip()
        bps = str(rec.record[idx("KDPBPS")]).strip() if "KDPBPS" in fields else ""

        if kk not in TARGET_KOTA and pr not in TARGET_PROVINSI:
            continue

        matched += 1
        geom = rec.shape.__geo_interface__
        if geom["type"] not in ("Polygon", "MultiPolygon"):
            geojson_str = None
        else:
            feature = {
                "type": "Feature",
                "geometry": geom,
                "properties": {"kelurahan": kd, "kecamatan": kc, "kota_kab": kk},
            }
            geojson_str = json.dumps(feature, separators=(",", ":"))

        rows.append({
            "kelurahan": kd,
            "kecamatan": kc,
            "kota_kab":  kk,
            "provinsi":  pr,
            "geojson":   geojson_str,
            "kode_bps":  bps or None,
        })

        if total % 20000 == 0:
            print(f"  Scanned {total:,}, matched {matched:,}...")

    print(f"Selesai scan: {total:,} total, {matched:,} cocok")
    return rows


def push_to_api(rows):
    print(f"\nMengirim {len(rows):,} baris ke {API_BASE}/api/ref-wilayah ...")
    total_inserted = 0
    total_skipped  = 0

    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start:start + BATCH_SIZE]
        r = requests.post(
            f"{API_BASE}/api/ref-wilayah",
            json={"rows": batch},
            timeout=60,
        )
        r.raise_for_status()
        result = r.json()
        total_inserted += result.get("inserted", 0)
        total_skipped  += result.get("skipped", 0)

        done = min(start + BATCH_SIZE, len(rows))
        print(f"  {done:,}/{len(rows):,} — inserted {total_inserted:,}, skipped {total_skipped:,}")
        time.sleep(0.1)

    print(f"\nSelesai: {total_inserted:,} inserted, {total_skipped:,} skipped")


def main():
    tmpdir = tempfile.mkdtemp(prefix="gkj_shp_")
    print(f"Temp dir: {tmpdir}")
    try:
        parts   = download_shp(tmpdir)
        shp_base = extract_shp(tmpdir, parts)
        rows    = scan_shp(shp_base)
        push_to_api(rows)
    finally:
        print(f"\nMembersihkan temp dir {tmpdir}...")
        shutil.rmtree(tmpdir, ignore_errors=True)
        print("Bersih.")


if __name__ == "__main__":
    main()
