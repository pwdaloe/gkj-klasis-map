import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const tahun = searchParams.get('tahun')
  const gereja_id = searchParams.get('gereja_id')
  const format = searchParams.get('format') ?? 'xlsx'

  if (!tahun) return NextResponse.json({ error: 'tahun diperlukan' }, { status: 400 })

  const rows = gereja_id
    ? await sql`
        SELECT fw.tahun, g.nama AS gereja_nama, kp.nama AS kelompok_nama,
          kel.nama AS kelurahan_nama, kel.kecamatan, kel.kota_kab, kel.provinsi,
          fw.jumlah_warga
        FROM fakta_warga fw
        LEFT JOIN gereja g ON g.gereja_id = fw.gereja_id
        LEFT JOIN kelompok kp ON kp.kelompok_id = fw.kelompok_id
        LEFT JOIN kelurahan kel ON kel.kode = fw.kelurahan_kode
        WHERE fw.tahun = ${tahun} AND fw.gereja_id = ${gereja_id}
        ORDER BY g.nama, kel.nama
      `
    : await sql`
        SELECT fw.tahun, g.nama AS gereja_nama, kp.nama AS kelompok_nama,
          kel.nama AS kelurahan_nama, kel.kecamatan, kel.kota_kab, kel.provinsi,
          fw.jumlah_warga
        FROM fakta_warga fw
        LEFT JOIN gereja g ON g.gereja_id = fw.gereja_id
        LEFT JOIN kelompok kp ON kp.kelompok_id = fw.kelompok_id
        LEFT JOIN kelurahan kel ON kel.kode = fw.kelurahan_kode
        WHERE fw.tahun = ${tahun}
        ORDER BY g.nama, kel.nama
      `

  const data = rows.map((r) => ({
    Tahun: r.tahun,
    Gereja: r.gereja_nama ?? '',
    Kelompok: r.kelompok_nama ?? '-',
    Kelurahan: r.kelurahan_nama ?? '',
    Kecamatan: r.kecamatan ?? '',
    'Kota/Kab': r.kota_kab ?? '',
    Provinsi: r.provinsi ?? '',
    'Jumlah Warga': r.jumlah_warga,
  }))

  const filename = gereja_id
    ? `data-warga-${tahun}-${gereja_id}`
    : `data-warga-${tahun}-semua`

  if (format === 'csv') {
    const headers = Object.keys(data[0] ?? { Tahun: '', Gereja: '', Kelompok: '', Kelurahan: '', Kecamatan: '', 'Kota/Kab': '', Provinsi: '', 'Jumlah Warga': '' })
    const csvRows = data.map((r) => headers.map((h) => `"${String(r[h as keyof typeof r] ?? '').replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...csvRows].join('\n')
    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    })
  }

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data Warga')
  const xlsxBlob = new Blob(
    [Uint8Array.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer)],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  )

  return new NextResponse(xlsxBlob, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    },
  })
}
