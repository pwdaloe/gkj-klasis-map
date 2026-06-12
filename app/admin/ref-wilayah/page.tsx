'use client'

import { useEffect, useState, useCallback } from 'react'

type RefRow = {
  id: number
  kelurahan: string
  kecamatan: string
  kota_kab: string
  provinsi: string
  kode_bps: string | null
  has_geojson: boolean
  sudah_import: boolean
  kode_suggest: string
}

type ApiResponse = {
  data: RefRow[]
  total: number
  page: number
  pages: number
  kota_list: string[]
}

export default function RefWilayahPage() {
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [q, setQ] = useState('')
  const [kota, setKota] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [importingId, setImportingId] = useState<number | null>(null)
  const [importMsg, setImportMsg] = useState<{ id: number; msg: string; ok: boolean } | null>(null)

  // kode override per row (bila user ingin custom)
  const [kodeEdit, setKodeEdit] = useState<{ [id: number]: string }>({})

  const load = useCallback(async (qVal: string, kotaVal: string, pageVal: number) => {
    setLoading(true)
    const params = new URLSearchParams({ q: qVal, kota_kab: kotaVal, page: String(pageVal), limit: '50' })
    const res = await fetch(`/api/ref-wilayah?${params}`)
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }, [])

  useEffect(() => { load(q, kota, page) }, [load, q, kota, page])

  const handleSearch = (val: string) => { setQ(val); setPage(1) }
  const handleKota = (val: string) => { setKota(val); setPage(1) }

  const handleImport = async (row: RefRow) => {
    setImportingId(row.id)
    setImportMsg(null)
    const kodeOverride = kodeEdit[row.id] ?? row.kode_suggest
    const res = await fetch('/api/ref-wilayah/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, kode: kodeOverride }),
    })
    const data = await res.json()
    if (data.error) {
      setImportMsg({ id: row.id, msg: data.error, ok: false })
    } else {
      setImportMsg({ id: row.id, msg: `Berhasil ditambahkan dengan kode "${data.kode}"`, ok: true })
      load(q, kota, page)
    }
    setImportingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black">Referensi Wilayah</h1>
          <p className="text-sm text-gray-600 mt-1">
            Data kelurahan Jabodetabek dari SHP BPS 2020 — gunakan sebagai referensi saat menambah kelurahan baru.
          </p>
        </div>
        {result && (
          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold text-black">{result.total.toLocaleString('id-ID')}</div>
            <div className="text-xs text-gray-500">total kelurahan</div>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari kelurahan / kecamatan..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={kota}
          onChange={(e) => handleKota(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Kota/Kab</option>
          {result?.kota_list.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        {(q || kota) && (
          <button
            onClick={() => { setQ(''); setKota(''); setPage(1) }}
            className="text-xs text-gray-500 hover:text-black underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Summary stats */}
      {result && (
        <div className="flex gap-4 text-sm text-gray-600">
          <span>
            Menampilkan <strong>{result.data.length}</strong> dari <strong>{result.total}</strong> kelurahan
          </span>
          <span>·</span>
          <span>
            <strong className="text-green-700">
              {result.data.filter((r) => r.sudah_import).length}
            </strong> sudah di-import (halaman ini)
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-500 animate-pulse py-8 text-center">Memuat data...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-black">Kelurahan</th>
                <th className="text-left px-4 py-3 font-medium text-black">Kecamatan</th>
                <th className="text-left px-4 py-3 font-medium text-black">Kota/Kab</th>
                <th className="text-center px-3 py-3 font-medium text-black">Polygon</th>
                <th className="text-center px-3 py-3 font-medium text-black">Status</th>
                <th className="text-left px-4 py-3 font-medium text-black">Kode (auto)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {result?.data.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-black font-medium">
                    {row.kelurahan.replace(/^(Kelurahan|Desa)\s+/i, '')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.kecamatan}</td>
                  <td className="px-4 py-3 text-gray-700">{row.kota_kab}</td>
                  <td className="px-3 py-3 text-center">
                    {row.has_geojson ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Ada</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">–</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.sudah_import ? (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Di-import</span>
                    ) : (
                      <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={kodeEdit[row.id] ?? row.kode_suggest}
                      onChange={(e) => setKodeEdit((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                      disabled={row.sudah_import}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {importMsg?.id === row.id && (
                      <span className={`text-xs mr-2 ${importMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
                        {importMsg.msg}
                      </span>
                    )}
                    {!row.sudah_import && (
                      <button
                        onClick={() => handleImport(row)}
                        disabled={importingId === row.id}
                        className="bg-blue-700 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-800 disabled:opacity-50"
                      >
                        {importingId === row.id ? 'Mengimpor...' : 'Import'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {result?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {result.total === 0
                      ? 'Tabel ref_wilayah kosong. Jalankan script Python untuk mengisi data dari SHP BPS 2020.'
                      : 'Tidak ada hasil untuk filter ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {result && result.pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-600">
            Halaman {page} / {result.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(result.pages, p + 1))}
            disabled={page === result.pages}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-medium mb-1">Cara penggunaan</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Cari kelurahan yang ingin ditambahkan ke data aktif menggunakan kotak pencarian di atas.</li>
          <li>Periksa kolom <strong>Kode (auto)</strong> — ubah jika perlu agar sesuai dengan konvensi kode yang sudah ada.</li>
          <li>Klik <strong>Import</strong> untuk menyalin kelurahan beserta polygon-nya ke tabel Kelurahan.</li>
          <li>Kelurahan yang sudah di-import ditandai dengan badge <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Di-import</span>.</li>
        </ol>
      </div>
    </div>
  )
}
