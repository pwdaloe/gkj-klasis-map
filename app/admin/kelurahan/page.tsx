'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Kelurahan } from '@/lib/types'

type RefSuggest = { id: number; kelurahan: string; kecamatan: string; kota_kab: string; provinsi: string }

export default function AdminKelurahanPage() {
  const [list, setList] = useState<Kelurahan[]>([])
  const [provinsiList, setProvinsiList] = useState<string[]>([])
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeResult, setGeocodeResult] = useState('')
  const [form, setForm] = useState({ kode: '', nama: '', kecamatan: '', kota_kab: '', provinsi: '' })
  const [msg, setMsg] = useState('')
  const [suggestions, setSuggestions] = useState<RefSuggest[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editKoord, setEditKoord] = useState<string | null>(null)
  const [koordForm, setKoordForm] = useState({ lat: '', lng: '' })
  const [koordMsg, setKoordMsg] = useState('')
  const [editGeoJSON, setEditGeoJSON] = useState<string | null>(null)
  const [geojsonText, setGeojsonText] = useState('')
  const [geojsonMsg, setGeojsonMsg] = useState('')

  const load = () => fetch('/api/kelurahan').then((r) => r.json()).then(setList)
  useEffect(() => { load() }, [])
  useEffect(() => {
    fetch('/api/provinsi')
      .then((r) => r.json())
      .then((rows: { nama: string }[]) => setProvinsiList(rows.map((r) => r.nama)))
  }, [])

  const handleNamaChange = (nama: string) => {
    setForm((f) => ({ ...f, nama }))
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (nama.length < 3) { setSuggestions([]); setShowSuggest(false); return }
    suggestTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/ref-wilayah?q=${encodeURIComponent(nama)}&limit=6`)
      const json = await res.json()
      setSuggestions(json.data ?? [])
      setShowSuggest(true)
    }, 300)
  }

  const handlePickSuggest = (s: RefSuggest) => {
    const namaStripped = s.kelurahan.replace(/^(Kelurahan|Desa)\s+/i, '').trim()
    const kodeAuto = namaStripped.toLowerCase().replace(/\s+/g, '-')
    setForm({ kode: kodeAuto, nama: namaStripped, kecamatan: s.kecamatan, kota_kab: s.kota_kab, provinsi: s.provinsi })
    setSuggestions([])
    setShowSuggest(false)
  }

  const handleTambah = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const res = await fetch('/api/kelurahan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); return }
    setMsg('Kelurahan ditambahkan. Jalankan geocoding untuk mengisi koordinat.')
    setForm({ kode: '', nama: '', kecamatan: '', kota_kab: '', provinsi: '' })
    load()
  }

  const handleGeocodeSatu = async (kode: string) => {
    setGeocodeResult(`Geocoding ${kode}...`)
    const res = await fetch(`/api/geocode?kode=${kode}`)
    const data = await res.json()
    if (data.error) { setGeocodeResult('Gagal: ' + data.error); return }
    setGeocodeResult(`Berhasil: ${kode} → (${data.lat}, ${data.lng})`)
    load()
  }

  const handleGeocodeAll = async () => {
    setGeocoding(true)
    setGeocodeResult('Menjalankan geocoding semua kelurahan... (ini bisa memakan waktu beberapa menit)')
    const res = await fetch('/api/geocode', { method: 'POST' })
    const data = await res.json()
    setGeocodeResult(`Selesai: ${data.updated} berhasil, ${data.failed?.length ?? 0} gagal`)
    setGeocoding(false)
    load()
  }

  const handleBukaEditKoord = (k: Kelurahan) => {
    setEditKoord(k.kode)
    setKoordForm({ lat: k.lat?.toString() ?? '', lng: k.lng?.toString() ?? '' })
    setKoordMsg('')
  }

  const handleSimpanKoord = async (kode: string, namaKelurahan: string) => {
    const lat = parseFloat(koordForm.lat)
    const lng = parseFloat(koordForm.lng)
    if (isNaN(lat) || isNaN(lng)) {
      setKoordMsg('Koordinat tidak valid.')
      return
    }
    const kel = list.find((k) => k.kode === kode)
    if (!kel) return
    const res = await fetch('/api/kelurahan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kode, nama: kel.nama, kecamatan: kel.kecamatan, kota_kab: kel.kota_kab, provinsi: kel.provinsi, lat, lng }),
    })
    const data = await res.json()
    if (data.error) { setKoordMsg('Error: ' + data.error); return }
    setKoordMsg('')
    setEditKoord(null)
    setGeocodeResult(`Koordinat ${namaKelurahan} disimpan: (${lat}, ${lng})`)
    load()
  }

  const handleBukaEditGeoJSON = (k: Kelurahan) => {
    setEditGeoJSON(k.kode)
    setGeojsonText(k.geojson ? JSON.stringify(k.geojson, null, 2) : '')
    setGeojsonMsg('')
  }

  const handleSimpanGeoJSON = async (kode: string) => {
    const kel = list.find((k) => k.kode === kode)
    if (!kel) return
    let parsed: object | null = null
    if (geojsonText.trim()) {
      try {
        parsed = JSON.parse(geojsonText)
      } catch {
        setGeojsonMsg('JSON tidak valid. Periksa format GeoJSON.')
        return
      }
      const t = (parsed as any)?.type
      if (!['Feature', 'FeatureCollection', 'Polygon', 'MultiPolygon'].includes(t)) {
        setGeojsonMsg(`Tipe "${t}" tidak didukung. Gunakan Feature, FeatureCollection, Polygon, atau MultiPolygon.`)
        return
      }
      // Validasi tipe geometry di dalam Feature / FeatureCollection
      const geometries: string[] = t === 'FeatureCollection'
        ? (parsed as any).features?.map((f: any) => f?.geometry?.type) ?? []
        : t === 'Feature' ? [(parsed as any)?.geometry?.type] : [t]
      const invalid = geometries.filter((g) => !['Polygon', 'MultiPolygon'].includes(g))
      if (invalid.length > 0) {
        setGeojsonMsg(`Geometry berisi tipe "${invalid[0]}" — harus Polygon atau MultiPolygon. Di geojson.io, gunakan tool polygon (segi empat/bentuk bebas), bukan line.`)
        return
      }
    }
    const res = await fetch('/api/kelurahan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kode, nama: kel.nama, kecamatan: kel.kecamatan,
        kota_kab: kel.kota_kab, provinsi: kel.provinsi,
        lat: kel.lat, lng: kel.lng,
        geojson: parsed,
      }),
    })
    const data = await res.json()
    if (data.error) { setGeojsonMsg('Error: ' + data.error); return }
    setEditGeoJSON(null)
    setGeojsonMsg('')
    setGeocodeResult(`GeoJSON ${kel.nama} berhasil disimpan.`)
    load()
  }

  // Filter & pagination
  const [search, setSearch] = useState('')
  const [filterKotaKab, setFilterKotaKab] = useState('')
  const [filterKecamatan, setFilterKecamatan] = useState('')
  const [filterGeocode, setFilterGeocode] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  // Edit data kelurahan
  const [editData, setEditData] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nama: '', kecamatan: '', kota_kab: '', provinsi: '' })

  const kotaKabList = [...new Set(list.map((k) => k.kota_kab).filter(Boolean))].sort()
  const kecamatanList = [...new Set(
    list.filter((k) => !filterKotaKab || k.kota_kab === filterKotaKab)
      .map((k) => k.kecamatan).filter(Boolean)
  )].sort()

  const handleBukaEditData = (k: Kelurahan) => {
    setEditData(k.kode)
    setEditForm({ nama: k.nama, kecamatan: k.kecamatan, kota_kab: k.kota_kab, provinsi: k.provinsi ?? '' })
  }

  const handleSimpanEditData = async (kode: string) => {
    const kel = list.find((k) => k.kode === kode)
    if (!kel) return
    const res = await fetch('/api/kelurahan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kode, ...editForm, lat: kel.lat, lng: kel.lng }),
    })
    const data = await res.json()
    if (data.error) { setKoordMsg('Error: ' + data.error); return }
    setEditData(null)
    load()
  }

  const filtered = list.filter((k) => {
    const matchSearch = !search ||
      k.nama.toLowerCase().includes(search.toLowerCase()) ||
      k.kode.toLowerCase().includes(search.toLowerCase())
    const matchKota = !filterKotaKab || k.kota_kab === filterKotaKab
    const matchKec = !filterKecamatan || k.kecamatan === filterKecamatan
    const matchGeocode = !filterGeocode ||
      (filterGeocode === 'sudah' && k.lat) ||
      (filterGeocode === 'belum' && !k.lat)
    return matchSearch && matchKota && matchKec && matchGeocode
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const belumGeocode = list.filter((k) => !k.lat).length
  const sudahGeocode = list.filter((k) => k.lat).length
  const sudahGeojson = list.filter((k) => k.geojson).length
  const belumGeojson = list.filter((k) => !k.geojson).length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-black">Data Kelurahan</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-black">{list.length}</p>
          <p className="text-xs text-black mt-1">Total Kelurahan</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{sudahGeocode}</p>
          <p className="text-xs text-black mt-1">Sudah ter-geocode</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{belumGeocode}</p>
          <p className="text-xs text-black mt-1">Belum ter-geocode</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{sudahGeojson}</p>
          <p className="text-xs text-black mt-1">Ada polygon <span className="text-gray-400">/ {belumGeojson} belum</span></p>
        </div>
      </div>

      {belumGeocode > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-800">{belumGeocode} kelurahan belum punya koordinat</p>
            <p className="text-xs text-orange-600 mt-0.5">Koordinat (lat/lng) diperlukan untuk menghitung gereja terdekat.</p>
          </div>
          <button
            onClick={handleGeocodeAll}
            disabled={geocoding}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            {geocoding ? 'Sedang berjalan...' : 'Geocode Semua'}
          </button>
        </div>
      )}
      {geocodeResult && (
        <p className="text-sm text-black bg-gray-100 rounded-lg px-4 py-2">{geocodeResult}</p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-black mb-4">Tambah Kelurahan Baru</h3>
        <form onSubmit={handleTambah} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">Kode (ID)</label>
            <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })}
              placeholder="contoh: bambu-apus" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <p className="text-xs text-black mt-0.5">Huruf kecil, spasi jadi tanda hubung (-)</p>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-black mb-1">Nama Kelurahan</label>
            <input
              value={form.nama}
              onChange={(e) => handleNamaChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
              placeholder="contoh: Bambu Apus"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {showSuggest && suggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg text-xs max-h-52 overflow-y-auto">
                {suggestions.map((s) => {
                  const nama = s.kelurahan.replace(/^(Kelurahan|Desa)\s+/i, '')
                  return (
                    <li
                      key={s.id}
                      onMouseDown={() => handlePickSuggest(s)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-black">{nama}</span>
                      <span className="text-gray-500 ml-2">{s.kecamatan}, {s.kota_kab}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Kecamatan</label>
            <input value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })}
              placeholder="contoh: Cipayung" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Kota / Kabupaten</label>
            <input value={form.kota_kab} onChange={(e) => setForm({ ...form, kota_kab: e.target.value })}
              placeholder="contoh: Jakarta atau Bekasi" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Provinsi</label>
            <select value={form.provinsi} onChange={(e) => setForm({ ...form, provinsi: e.target.value })}
              required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">-- Pilih --</option>
              {provinsiList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">
              Tambah Kelurahan
            </button>
            {msg && <span className="text-xs text-green-600 ml-3">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filter & Search */}
        <div className="px-4 py-3 border-b border-gray-200 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              placeholder="Cari nama atau kode kelurahan..."
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <select value={filterKotaKab}
              onChange={(e) => { setFilterKotaKab(e.target.value); setFilterKecamatan(''); resetPage() }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Semua Kota/Kab</option>
              {kotaKabList.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterKecamatan}
              onChange={(e) => { setFilterKecamatan(e.target.value); resetPage() }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Semua Kecamatan</option>
              {kecamatanList.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterGeocode}
              onChange={(e) => { setFilterGeocode(e.target.value); resetPage() }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Semua Status</option>
              <option value="sudah">Sudah Geocode</option>
              <option value="belum">Belum Geocode</option>
            </select>
          </div>
          <p className="text-xs text-black">
            {filtered.length} kelurahan ditemukan
            {filtered.length > PAGE_SIZE && ` — halaman ${page} dari ${totalPages}`}
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Kelurahan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Kecamatan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Kota/Kab</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-black uppercase">Geocode</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-black uppercase">Polygon</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((k) => (
              <React.Fragment key={k.kode}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-black">{k.kode}</td>
                  <td className="px-4 py-3 font-medium text-black">{k.nama}</td>
                  <td className="px-4 py-3 text-black">{k.kecamatan}</td>
                  <td className="px-4 py-3 text-black">{k.kota_kab}</td>
                  <td className="px-4 py-3 text-center">
                    {k.lat ? (
                      <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">OK</span>
                    ) : (
                      <span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {k.geojson ? (
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Ada</span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">Kosong</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!k.lat && (
                      <button onClick={() => handleGeocodeSatu(k.kode)}
                        className="text-blue-600 hover:text-blue-800 text-xs">
                        Geocode
                      </button>
                    )}
                    <button
                      onClick={() => editKoord === k.kode ? setEditKoord(null) : handleBukaEditKoord(k)}
                      className="text-black hover:text-gray-700 text-xs underline"
                    >
                      {editKoord === k.kode ? 'Batal' : 'Input Manual'}
                    </button>
                    <button
                      onClick={() => editData === k.kode ? setEditData(null) : handleBukaEditData(k)}
                      className="text-green-600 hover:text-green-800 text-xs underline"
                    >
                      {editData === k.kode ? 'Batal Edit' : 'Edit Data'}
                    </button>
                    <button
                      onClick={() => editGeoJSON === k.kode ? setEditGeoJSON(null) : handleBukaEditGeoJSON(k)}
                      className="text-purple-600 hover:text-purple-800 text-xs underline"
                    >
                      {editGeoJSON === k.kode ? 'Batal' : 'GeoJSON'}
                    </button>
                  </td>
                </tr>
                {editData === k.kode && (
                  <tr className="bg-green-50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Nama Kelurahan</label>
                          <input
                            value={editForm.nama}
                            onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Kecamatan</label>
                          <input
                            value={editForm.kecamatan}
                            onChange={(e) => setEditForm({ ...editForm, kecamatan: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Kota / Kabupaten</label>
                          <input
                            value={editForm.kota_kab}
                            onChange={(e) => setEditForm({ ...editForm, kota_kab: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Provinsi</label>
                          <select
                            value={editForm.provinsi}
                            onChange={(e) => setEditForm({ ...editForm, provinsi: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                          >
                            <option value="">-- Pilih --</option>
                            {provinsiList.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => handleSimpanEditData(k.kode)}
                          className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800"
                        >
                          Simpan
                        </button>
                        {koordMsg && <span className="text-xs text-red-600">{koordMsg}</span>}
                      </div>
                    </td>
                  </tr>
                )}
                {editKoord === k.kode && (
                  <tr className="bg-blue-50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex items-end gap-3">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">
                            Latitude <span className="font-normal text-black">(angka pertama dari Google Maps)</span>
                          </label>
                          <input
                            value={koordForm.lat}
                            onChange={(e) => setKoordForm({ ...koordForm, lat: e.target.value })}
                            placeholder="contoh: -6.234567"
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-44"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">
                            Longitude <span className="font-normal text-black">(angka kedua dari Google Maps)</span>
                          </label>
                          <input
                            value={koordForm.lng}
                            onChange={(e) => setKoordForm({ ...koordForm, lng: e.target.value })}
                            placeholder="contoh: 106.987654"
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-44"
                          />
                        </div>
                        <button
                          onClick={() => handleSimpanKoord(k.kode, k.nama)}
                          className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-800"
                        >
                          Simpan
                        </button>
                        {koordMsg && <span className="text-xs text-red-600">{koordMsg}</span>}
                        <p className="text-xs text-black ml-2">
                          Cara ambil koordinat: buka Google Maps → klik kanan lokasi kelurahan → salin dua angka yang muncul
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {editGeoJSON === k.kode && (
                  <tr className="bg-purple-50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-black">
                            Paste GeoJSON polygon
                          </label>
                          <span className="text-xs text-gray-500">
                            (Feature, FeatureCollection, Polygon, atau MultiPolygon) — kosongkan untuk hapus polygon
                          </span>
                        </div>
                        <textarea
                          value={geojsonText}
                          onChange={(e) => setGeojsonText(e.target.value)}
                          rows={6}
                          placeholder={'{\n  "type": "Feature",\n  "geometry": { "type": "Polygon", "coordinates": [...] },\n  "properties": {}\n}'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleSimpanGeoJSON(k.kode)}
                            className="bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-800"
                          >
                            Simpan
                          </button>
                          {geojsonMsg && <span className="text-xs text-red-600">{geojsonMsg}</span>}
                          <a
                            href="https://geojson.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline"
                          >
                            Buat polygon di geojson.io →
                          </a>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Sebelumnya
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...'
                    ? <span key={`dots-${i}`} className="text-xs px-2 py-1.5 text-black">…</span>
                    : <button key={p} onClick={() => setPage(p as number)}
                        className={`text-xs px-3 py-1.5 border rounded-lg ${page === p ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 hover:bg-gray-50 text-black'}`}>
                        {p}
                      </button>
                )}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
