'use client'

import { useEffect, useRef, useState } from 'react'
import { Gereja, Kelompok, Kelurahan } from '@/lib/types'

const emptyForm = { tahun: new Date().getFullYear(), kelurahan_kode: '', gereja_id: '', kelompok_id: '', jumlah_warga: 0 }

type RawRow = {
  id: string
  tahun: number
  kelurahan_kode: string
  gereja_id: string
  kelompok_id: string | null
  jumlah_warga: number
  kelurahan: { nama: string } | null
  gereja: { nama: string } | null
}

type SortKey = 'kelurahan' | 'gereja' | 'jumlah'
type SortDir = 'asc' | 'desc'

export default function AdminWargaPage() {
  const [list, setList] = useState<RawRow[]>([])
  const [gereja, setGereja] = useState<Gereja[]>([])
  const [kelompok, setKelompok] = useState<Kelompok[]>([])
  const [kelurahan, setKelurahan] = useState<Kelurahan[]>([])
  const [form, setForm] = useState(emptyForm)
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [msg, setMsg] = useState('')

  // Autocomplete kelurahan
  const [kelSearch, setKelSearch] = useState('')
  const [kelDropdown, setKelDropdown] = useState(false)
  const kelRef = useRef<HTMLDivElement>(null)

  // Filter & search tabel
  const [search, setSearch] = useState('')
  const [filterGereja, setFilterGereja] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('kelurahan')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editJumlah, setEditJumlah] = useState(0)

  // Upload batch
  type PreviewRow = { tahun: number; kelurahan_nama: string; kelompok_nama: string; jumlah_warga: number; error?: string }
  const [showUpload, setShowUpload] = useState(false)
  const [uploadGereja, setUploadGereja] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ valid: PreviewRow[]; invalid: PreviewRow[] } | null>(null)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadKelompok = (gereja_id: string) => {
    if (!gereja_id) { setKelompok([]); return }
    fetch(`/api/kelompok?gereja_id=${gereja_id}`).then((r) => r.json()).then(setKelompok)
  }

  const loadList = () => {
    fetch(`/api/warga?tahun=${filterTahun}&mode=raw`)
      .then((r) => r.json())
      .then(setList)
  }

  useEffect(() => {
    fetch('/api/gereja').then((r) => r.json()).then(setGereja)
    fetch('/api/kelurahan').then((r) => r.json()).then(setKelurahan)
  }, [])

  useEffect(() => { loadList() }, [filterTahun])

  // Tutup dropdown kelurahan saat klik luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (kelRef.current && !kelRef.current.contains(e.target as Node)) {
        setKelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const kelFiltered = kelurahan.filter((k) =>
    k.nama.toLowerCase().includes(kelSearch.toLowerCase()) ||
    k.kota_kab.toLowerCase().includes(kelSearch.toLowerCase())
  ).slice(0, 8)

  const handlePilihKelurahan = (k: Kelurahan) => {
    setForm({ ...form, kelurahan_kode: k.kode })
    setKelSearch(`${k.nama} — ${k.kota_kab}`)
    setKelDropdown(false)
  }

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    const res = await fetch('/api/warga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        kelompok_id: form.kelompok_id || null,
        jumlah_warga: Number(form.jumlah_warga),
      }),
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); return }
    setMsg('Data warga disimpan.')
    setForm(emptyForm)
    setKelSearch('')
    loadList()
  }

  const handleEdit = (row: RawRow) => {
    setEditId(row.id)
    setEditJumlah(row.jumlah_warga)
  }

  const handleSimpanEdit = async (id: string) => {
    const res = await fetch('/api/warga', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, jumlah_warga: editJumlah }),
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); return }
    setEditId(null)
    loadList()
  }

  const handleHapus = async (id: string, nama: string) => {
    if (!confirm(`Hapus data warga untuk "${nama}"?`)) return
    await fetch(`/api/warga?id=${id}`, { method: 'DELETE' })
    loadList()
  }

  const handleExport = (format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ tahun: String(filterTahun), format })
    if (filterGereja) params.set('gereja_id', filterGereja)
    const a = document.createElement('a')
    a.href = `/api/export/warga?${params}`
    a.download = `data-warga-${filterTahun}.${format}`
    a.click()
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'

  const handlePreviewUpload = async () => {
    if (!uploadFile) return
    setUploading(true); setUploadMsg(''); setPreview(null)
    const fd = new FormData(); fd.append('file', uploadFile)
    const res = await fetch('/api/upload/warga?preview=1', { method: 'POST', body: fd })
    const data = await res.json()
    setPreview(data)
    setUploading(false)
  }

  const handleKonfirmasiUpload = async () => {
    if (!uploadFile || !preview) return
    setUploading(true); setUploadMsg('')
    const fd = new FormData(); fd.append('file', uploadFile)
    const res = await fetch('/api/upload/warga', { method: 'POST', body: fd })
    const data = await res.json()
    setUploadMsg(`Berhasil menyimpan ${data.saved} baris data.`)
    setPreview(null); setUploadFile(null)
    loadList()
    setUploading(false)
  }

  const filtered = list
    .filter((row) => {
      const namaKel = row.kelurahan?.nama ?? row.kelurahan_kode
      const namaGer = row.gereja?.nama ?? row.gereja_id
      const matchSearch = !search ||
        namaKel.toLowerCase().includes(search.toLowerCase()) ||
        namaGer.toLowerCase().includes(search.toLowerCase())
      const matchGereja = !filterGereja || row.gereja_id === filterGereja
      return matchSearch && matchGereja
    })
    .sort((a, b) => {
      let va = '', vb = ''
      if (sortKey === 'kelurahan') { va = a.kelurahan?.nama ?? ''; vb = b.kelurahan?.nama ?? '' }
      if (sortKey === 'gereja') { va = a.gereja?.nama ?? ''; vb = b.gereja?.nama ?? '' }
      if (sortKey === 'jumlah') return sortDir === 'asc' ? a.jumlah_warga - b.jumlah_warga : b.jumlah_warga - a.jumlah_warga
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-black">Data Warga</h2>

      {/* Form Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-black mb-1">Input / Update Data Warga</h3>
        <p className="text-xs text-black mb-4">Jika data untuk kombinasi tahun + kelurahan + gereja sudah ada, data akan diperbarui otomatis.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">Tahun</label>
            <input type="number" value={form.tahun}
              onChange={(e) => setForm({ ...form, tahun: Number(e.target.value) })}
              min={2020} max={2050} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Autocomplete Kelurahan */}
          <div className="relative" ref={kelRef}>
            <label className="block text-xs font-medium text-black mb-1">Kelurahan</label>
            <input
              type="text"
              value={kelSearch}
              onChange={(e) => { setKelSearch(e.target.value); setKelDropdown(true); setForm({ ...form, kelurahan_kode: '' }) }}
              onFocus={() => setKelDropdown(true)}
              placeholder="Ketik nama kelurahan..."
              required={!form.kelurahan_kode}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {/* Hidden input untuk validasi */}
            <input type="text" required value={form.kelurahan_kode} readOnly className="sr-only" tabIndex={-1} />
            {kelDropdown && kelSearch && kelFiltered.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {kelFiltered.map((k) => (
                  <button key={k.kode} type="button"
                    onMouseDown={() => handlePilihKelurahan(k)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm">
                    <span className="font-medium text-black">{k.nama}</span>
                    <span className="text-xs text-black ml-2">— {k.kota_kab}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">Gereja</label>
            <select value={form.gereja_id}
              onChange={(e) => { setForm({ ...form, gereja_id: e.target.value, kelompok_id: '' }); loadKelompok(e.target.value) }}
              required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">-- Pilih Gereja --</option>
              {gereja.map((g) => <option key={g.gereja_id} value={g.gereja_id}>{g.nama}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">Kelompok <span className="font-normal">(opsional)</span></label>
            <select value={form.kelompok_id}
              onChange={(e) => setForm({ ...form, kelompok_id: e.target.value })}
              disabled={kelompok.length === 0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100">
              <option value="">-- Tanpa Kelompok --</option>
              {kelompok.map((k) => <option key={k.kelompok_id} value={k.kelompok_id}>{k.nama}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">Jumlah Warga</label>
            <input type="number" value={form.jumlah_warga}
              onChange={(e) => setForm({ ...form, jumlah_warga: Number(e.target.value) })}
              min={0} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="flex items-end">
            <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">
              Simpan
            </button>
            {msg && <span className="text-xs text-green-600 ml-3">{msg}</span>}
          </div>
        </form>
      </div>

      {/* Upload Batch */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => { setShowUpload(!showUpload); setPreview(null); setUploadMsg('') }}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-black hover:bg-gray-50"
        >
          <span>Upload Data Batch (Excel)</span>
          <span className="text-gray-400">{showUpload ? '▲' : '▼'}</span>
        </button>

        {showUpload && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-4">
            {/* Step 1: Download template */}
            <div>
              <p className="text-xs font-semibold text-black mb-2">1. Download template untuk gereja Anda</p>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={uploadGereja} onChange={(e) => setUploadGereja(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm min-w-[200px]">
                  <option value="">-- Pilih Gereja --</option>
                  {gereja.map((g) => <option key={g.gereja_id} value={g.gereja_id}>{g.nama}</option>)}
                </select>
                {uploadGereja && (
                  <a href={`/api/template/${uploadGereja}`} download
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50">
                    ↓ Download Template
                  </a>
                )}
              </div>
            </div>

            {/* Step 2: Upload file */}
            <div>
              <p className="text-xs font-semibold text-black mb-2">2. Upload file yang sudah diisi</p>
              <input type="file" accept=".xlsx,.xls"
                onChange={(e) => { setUploadFile(e.target.files?.[0] ?? null); setPreview(null) }}
                className="text-sm text-gray-600" />
              {uploadFile && !preview && (
                <button onClick={handlePreviewUpload} disabled={uploading}
                  className="ml-3 text-xs px-3 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">
                  {uploading ? 'Memproses...' : 'Cek Preview'}
                </button>
              )}
            </div>

            {/* Step 3: Preview */}
            {preview && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-black">
                  3. Preview — {preview.valid.length} baris valid, {preview.invalid.length} baris error
                </p>
                {preview.invalid.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-2">Baris yang tidak valid (akan dilewati):</p>
                    <table className="w-full text-xs">
                      <thead><tr className="text-left text-red-600">
                        <th className="pb-1 pr-4">Kelurahan</th><th className="pb-1 pr-4">Kelompok</th><th className="pb-1">Error</th>
                      </tr></thead>
                      <tbody>{preview.invalid.map((r, i) => (
                        <tr key={i} className="text-red-700">
                          <td className="pr-4">{r.kelurahan_nama}</td>
                          <td className="pr-4">{r.kelompok_nama}</td>
                          <td>{r.error}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {preview.valid.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-700 mb-2">Baris valid (akan disimpan):</p>
                    <table className="w-full text-xs">
                      <thead><tr className="text-left text-green-700">
                        <th className="pb-1 pr-4">Tahun</th><th className="pb-1 pr-4">Kelurahan</th>
                        <th className="pb-1 pr-4">Kelompok</th><th className="pb-1">Jumlah</th>
                      </tr></thead>
                      <tbody>{preview.valid.slice(0, 20).map((r, i) => (
                        <tr key={i} className="text-green-800">
                          <td className="pr-4">{r.tahun}</td>
                          <td className="pr-4">{r.kelurahan_nama}</td>
                          <td className="pr-4">{r.kelompok_nama}</td>
                          <td>{r.jumlah_warga}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                    {preview.valid.length > 20 && (
                      <p className="text-xs text-green-600 mt-1">...dan {preview.valid.length - 20} baris lainnya</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={handleKonfirmasiUpload} disabled={uploading || preview.valid.length === 0}
                    className="text-xs px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                    {uploading ? 'Menyimpan...' : `Simpan ${preview.valid.length} Baris Valid`}
                  </button>
                  <button onClick={() => { setPreview(null); setUploadFile(null) }}
                    className="text-xs text-gray-500 hover:text-black underline">
                    Batal
                  </button>
                </div>
              </div>
            )}

            {uploadMsg && <p className="text-xs text-green-600 font-medium">{uploadMsg}</p>}
          </div>
        )}
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-black">Hasil Data Tahun</h3>
            <div className="flex items-center gap-2">
              <select value={filterTahun}
                onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                {[2024, 2025, 2026, 2027, 2028].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button onClick={() => handleExport('xlsx')}
                className="text-xs px-3 py-1.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50">
                ↓ Excel
              </button>
              <button onClick={() => handleExport('csv')}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-400 text-gray-600 hover:bg-gray-50">
                ↓ CSV
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kelurahan atau gereja..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <select value={filterGereja}
              onChange={(e) => setFilterGereja(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Semua Gereja</option>
              {gereja.map((g) => <option key={g.gereja_id} value={g.gereja_id}>{g.nama}</option>)}
            </select>
          </div>
          <p className="text-xs text-black">{filtered.length} baris ditampilkan</p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th onClick={() => handleSort('kelurahan')}
                className="text-left px-4 py-3 text-xs font-semibold text-black uppercase cursor-pointer hover:bg-gray-100 select-none">
                Kelurahan{sortIcon('kelurahan')}
              </th>
              <th onClick={() => handleSort('gereja')}
                className="text-left px-4 py-3 text-xs font-semibold text-black uppercase cursor-pointer hover:bg-gray-100 select-none">
                Gereja{sortIcon('gereja')}
              </th>
              <th onClick={() => handleSort('jumlah')}
                className="text-right px-4 py-3 text-xs font-semibold text-black uppercase cursor-pointer hover:bg-gray-100 select-none">
                Jumlah{sortIcon('jumlah')}
              </th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row) => (
              <>
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-black">{row.kelurahan?.nama ?? row.kelurahan_kode}</td>
                  <td className="px-4 py-3 text-black">{row.gereja?.nama ?? row.gereja_id}</td>
                  <td className="px-4 py-3 text-right font-semibold text-black">{row.jumlah_warga}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => editId === row.id ? setEditId(null) : handleEdit(row)}
                      className="text-blue-600 hover:text-blue-800 text-xs underline">
                      {editId === row.id ? 'Batal' : 'Edit'}
                    </button>
                    <button onClick={() => handleHapus(row.id, row.kelurahan?.nama ?? row.kelurahan_kode)}
                      className="text-red-500 hover:text-red-700 text-xs underline">
                      Hapus
                    </button>
                  </td>
                </tr>
                {editId === row.id && (
                  <tr key={row.id + '-edit'} className="bg-blue-50">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-black">Jumlah Warga:</label>
                        <input type="number" value={editJumlah} min={0}
                          onChange={(e) => setEditJumlah(Number(e.target.value))}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28" />
                        <button onClick={() => handleSimpanEdit(row.id)}
                          className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-800">
                          Simpan
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-black text-sm">
                  {list.length === 0 ? `Belum ada data untuk tahun ${filterTahun}` : 'Tidak ada data yang sesuai filter'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
