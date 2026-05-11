'use client'

import { useEffect, useState } from 'react'
import { Gereja } from '@/lib/types'

const emptyForm = { gereja_id: '', nama: '', alamat: '', lat: '', lng: '' }

export default function AdminGerejaPage() {
  const [list, setList] = useState<Gereja[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/gereja').then((r) => r.json()).then(setList)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch('/api/gereja', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) }),
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); return }
    setMsg(editing ? 'Gereja diperbarui.' : 'Gereja ditambahkan.')
    setForm(emptyForm)
    setEditing(false)
    load()
  }

  const handleEdit = (g: Gereja) => {
    setForm({ gereja_id: g.gereja_id, nama: g.nama, alamat: g.alamat ?? '', lat: String(g.lat), lng: String(g.lng) })
    setEditing(true)
    setMsg('')
  }

  const handleDelete = async (gereja_id: string) => {
    if (!confirm('Hapus gereja ini?')) return
    await fetch(`/api/gereja?gereja_id=${gereja_id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-black">Data Gereja</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-black mb-4">{editing ? 'Edit Gereja' : 'Tambah Gereja'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">
              Kode Gereja (ID) {editing && <span className="text-black">— tidak bisa diubah</span>}
            </label>
            <input
              value={form.gereja_id}
              onChange={(e) => setForm({ ...form, gereja_id: e.target.value })}
              disabled={editing}
              placeholder="contoh: gkj-pondok-gede"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-black mt-0.5">Huruf kecil, spasi jadi tanda hubung (-)</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Nama Gereja</label>
            <input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="contoh: GKJ Pondok Gede"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-black mb-1">Alamat</label>
            <input
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              placeholder="contoh: Jl. Raya Pondok Gede No. 1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Latitude</label>
            <input
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              placeholder="contoh: -6.3250000"
              required
              type="number"
              step="any"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-black mt-0.5">Angka pertama dari Google Maps (negatif)</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Longitude</label>
            <input
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              placeholder="contoh: 106.9350000"
              required
              type="number"
              step="any"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-black mt-0.5">Angka kedua dari Google Maps (positif)</p>
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">
              {editing ? 'Simpan Perubahan' : 'Tambah Gereja'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setForm(emptyForm); setEditing(false) }}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                Batal
              </button>
            )}
            {msg && <span className="text-sm text-green-600 self-center">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Nama</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Alamat</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-black uppercase">Lat</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-black uppercase">Lng</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((g) => (
              <tr key={g.gereja_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-black">{g.gereja_id}</td>
                <td className="px-4 py-3 font-medium text-black">{g.nama}</td>
                <td className="px-4 py-3 text-black">{g.alamat}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-black">{g.lat}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-black">{g.lng}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(g)} className="text-blue-600 hover:text-blue-800 text-xs mr-3">Edit</button>
                  <button onClick={() => handleDelete(g.gereja_id)} className="text-red-500 hover:text-red-700 text-xs">Hapus</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-black text-sm">Belum ada data gereja</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
