import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gereja_id: string }> }
) {
  const { gereja_id } = await params

  const [gereja] = await sql`SELECT gereja_id, nama FROM gereja WHERE gereja_id = ${gereja_id}`
  if (!gereja) return NextResponse.json({ error: 'Gereja tidak ditemukan' }, { status: 404 })

  const kelompok = await sql`
    SELECT kelompok_id, kode, nama FROM kelompok WHERE gereja_id = ${gereja_id} ORDER BY nama
  `

  const kelurahan = await sql`
    SELECT kode, nama, kecamatan, kota_kab FROM kelurahan ORDER BY nama
  `

  const tahunSekarang = new Date().getFullYear()

  // Buat baris template: satu baris per kombinasi kelurahan × kelompok
  // Jika tidak ada kelompok, satu baris per kelurahan
  type DataRow = Record<string, string | number>
  const dataRows: DataRow[] = []

  if (kelompok.length === 0) {
    for (const kel of kelurahan) {
      dataRows.push({
        tahun: tahunSekarang,
        gereja_id: gereja_id,
        kelurahan_kode: kel.kode as string,
        kelurahan_nama: kel.nama as string,
        kecamatan: kel.kecamatan as string,
        kota_kab: kel.kota_kab as string,
        kelompok_id: '',
        kelompok_nama: '-',
        jumlah_warga: 0,
      })
    }
  } else {
    for (const kp of kelompok) {
      for (const kel of kelurahan) {
        dataRows.push({
          tahun: tahunSekarang,
          gereja_id: gereja_id,
          kelurahan_kode: kel.kode as string,
          kelurahan_nama: kel.nama as string,
          kecamatan: kel.kecamatan as string,
          kota_kab: kel.kota_kab as string,
          kelompok_id: kp.kelompok_id as string,
          kelompok_nama: kp.nama as string,
          jumlah_warga: 0,
        })
      }
    }
  }

  const wb = XLSX.utils.book_new()

  // Sheet 1: Data Warga (template yang diisi)
  const wsData = XLSX.utils.json_to_sheet(dataRows, {
    header: ['tahun', 'kelurahan_kode', 'kelurahan_nama', 'kecamatan', 'kota_kab', 'kelompok_id', 'kelompok_nama', 'jumlah_warga'],
  })

  // Header label yang ramah
  wsData['A1'] = { v: 'Tahun (isi)', t: 's' }
  wsData['B1'] = { v: 'Kode Kelurahan (jangan diubah)', t: 's' }
  wsData['C1'] = { v: 'Nama Kelurahan', t: 's' }
  wsData['D1'] = { v: 'Kecamatan', t: 's' }
  wsData['E1'] = { v: 'Kota/Kab', t: 's' }
  wsData['F1'] = { v: 'ID Kelompok (jangan diubah)', t: 's' }
  wsData['G1'] = { v: 'Nama Kelompok', t: 's' }
  wsData['H1'] = { v: 'Jumlah Warga (isi)', t: 's' }

  wsData['!cols'] = [
    { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 18 },
    { wch: 18 }, { wch: 32 }, { wch: 22 }, { wch: 16 },
  ]

  XLSX.utils.book_append_sheet(wb, wsData, 'Data Warga')

  // Sheet 2: Petunjuk
  const petunjuk = [
    ['PETUNJUK PENGISIAN TEMPLATE DATA WARGA'],
    [''],
    [`Gereja: ${gereja.nama}`],
    [`Template ini berisi semua kelurahan yang terdaftar di sistem.`],
    [''],
    ['KOLOM YANG PERLU DIISI:'],
    ['A - Tahun: Ganti angka tahun sesuai data yang dilaporkan (contoh: 2026)'],
    ['H - Jumlah Warga: Isi angka jumlah warga di kelurahan tersebut'],
    ['    Kosongkan atau isi 0 jika tidak ada warga di kelurahan tersebut'],
    [''],
    ['KOLOM YANG TIDAK BOLEH DIUBAH:'],
    ['B - Kode Kelurahan: ID internal sistem, jangan diubah'],
    ['F - ID Kelompok: ID internal sistem, jangan diubah'],
    [''],
    ['CATATAN:'],
    ['- Baris dengan jumlah_warga = 0 akan diabaikan saat upload'],
    ['- Jika data untuk kombinasi tahun+kelurahan+kelompok sudah ada, data akan diperbarui'],
    ['- Setelah mengisi, simpan file dan upload melalui halaman Admin > Data Warga'],
  ]
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk)
  wsPetunjuk['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk')

  const xlsxBlob = new Blob(
    [Uint8Array.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer)],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  )
  const namaFile = `template-warga-${(gereja.nama as string).replace(/\s+/g, '-').toLowerCase()}-${tahunSekarang}.xlsx`

  return new NextResponse(xlsxBlob, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${namaFile}"`,
    },
  })
}
