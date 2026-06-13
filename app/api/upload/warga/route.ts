import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import * as XLSX from 'xlsx'
import { getUserFromRequest, logAudit } from '@/lib/audit'

type ParsedRow = {
  tahun: number
  kelurahan_kode: string
  kelurahan_nama: string
  kelompok_id: string | null
  kelompok_nama: string
  jumlah_warga: number
  error?: string
}

// POST /api/upload/warga?preview=1  → parse + validasi, kembalikan preview
// POST /api/upload/warga            → parse + upsert langsung
export async function POST(req: NextRequest) {
  const isPreview = req.nextUrl.searchParams.get('preview') === '1'

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 400 })

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

  // Ambil set kode kelurahan dan kelompok yang valid dari DB
  const kelurahanValid = await sql`SELECT kode FROM kelurahan`
  const kelompokValid = await sql`SELECT kelompok_id FROM kelompok`
  const validKel = new Set(kelurahanValid.map((r) => r.kode as string))
  const validKlp = new Set(kelompokValid.map((r) => r.kelompok_id as string))

  const parsed: ParsedRow[] = []

  for (const row of raw) {
    const tahun = Number(row['tahun'] ?? row['Tahun (isi)'])
    const kelurahan_kode = String(row['kelurahan_kode'] ?? row['Kode Kelurahan (jangan diubah)'] ?? '').trim()
    const kelurahan_nama = String(row['kelurahan_nama'] ?? row['Nama Kelurahan'] ?? '').trim()
    const kelompok_id_raw = String(row['kelompok_id'] ?? row['ID Kelompok (jangan diubah)'] ?? '').trim()
    const kelompok_nama = String(row['kelompok_nama'] ?? row['Nama Kelompok'] ?? '-').trim()
    const jumlah_warga = Number(row['jumlah_warga'] ?? row['Jumlah Warga (isi)'] ?? 0)

    const kelompok_id = kelompok_id_raw || null

    // Skip baris kosong atau 0
    if (!kelurahan_kode && !kelurahan_nama) continue
    if (jumlah_warga === 0) continue

    let error: string | undefined
    if (isNaN(tahun) || tahun < 2020 || tahun > 2050) error = `Tahun tidak valid: ${tahun}`
    else if (!kelurahan_kode) error = 'Kode kelurahan kosong'
    else if (!validKel.has(kelurahan_kode)) error = `Kelurahan tidak dikenal: ${kelurahan_kode}`
    else if (kelompok_id && !validKlp.has(kelompok_id)) error = `Kelompok tidak dikenal: ${kelompok_id}`
    else if (isNaN(jumlah_warga) || jumlah_warga < 0) error = `Jumlah warga tidak valid: ${jumlah_warga}`

    parsed.push({ tahun, kelurahan_kode, kelurahan_nama, kelompok_id, kelompok_nama, jumlah_warga, error })
  }

  const valid = parsed.filter((r) => !r.error)
  const invalid = parsed.filter((r) => r.error)

  if (isPreview) {
    return NextResponse.json({ valid, invalid, total: parsed.length })
  }

  // Simpan semua baris valid
  const user = await getUserFromRequest(req)
  let saved = 0

  for (const row of valid) {
    const [result] = await sql`
      INSERT INTO fakta_warga (tahun, kelurahan_kode, gereja_id, kelompok_id, jumlah_warga)
      SELECT ${row.tahun}, ${row.kelurahan_kode}, kp.gereja_id, ${row.kelompok_id}, ${row.jumlah_warga}
      FROM kelompok kp
      WHERE kp.kelompok_id = ${row.kelompok_id}
      ON CONFLICT (tahun, kelurahan_kode, gereja_id, kelompok_id)
      DO UPDATE SET jumlah_warga = EXCLUDED.jumlah_warga
      RETURNING id, (xmax = 0) AS is_insert
    `.catch(() => [null])

    if (result) {
      saved++
      await logAudit({
        user,
        action: result.is_insert ? 'INSERT' : 'UPDATE',
        tabel: 'fakta_warga',
        recordId: result.id,
        dataBaru: { tahun: row.tahun, kelurahan_kode: row.kelurahan_kode, kelompok_id: row.kelompok_id, jumlah_warga: row.jumlah_warga },
      })
    }
  }

  return NextResponse.json({ saved, skipped: valid.length - saved })
}
