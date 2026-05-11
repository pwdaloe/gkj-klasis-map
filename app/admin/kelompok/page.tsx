'use client'

import { useEffect, useState } from 'react'
import { Gereja, Kelompok } from '@/lib/types'

const emptyForm = { kelompok_id: '', gereja_id: '', kode: '', nama: '' }

export default function AdminKelompokPage() {
  const [list, setList] = useState<Kelompok[]>([])
  const [gereja, setGereja] = useState<Gereja[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/kelompok').then((r) => r.json()).then(setList)
  useEffect(() => {
    load()
    fetch('/api/gereja').then((r) => r.json()).then(setGereja)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch('/api/kelompok', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { setMsg('Error: ' + data.error); return }
    setMsg(editing ? 'Kelompok diperbarui.' : 'Kelompok ditambahkan.')
    setForm(emptyForm)
    setEditing(false)
    load()
  }

  const handleEdit = (k: Kelompok) => {
    setForm({ kelompok_id: k.kelompok_id, gereja_id: k.gereja_id, kode: k.kode, nama: k.nama })
    setEditing(true)
    setMsg('')
  }

  const handleDelete = async (kelompok_id: string) => {
    if (!confirm('Hapus kelompok ini?')) return
    await fetch(`/api/kelompok?kelompok_id=${kelompok_id}`, { method: 'DELETE' })
    load()
  }

  const gerejaMap = Object.fromEntries(gereja.map((g) => [g.gereja_id, g.nama]))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-black">Data Kelompok</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-black mb-4">{editing ? 'Edit Kelompok' : 'Tambah Kelompok'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">Gereja</label>
            <select
              value={form.gereja_id}
              onChange={(e) => setForm({ ...form, gereja_id: e.target.value })}
              required
              disabled={editing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">-- Pilih Gereja --</option>
              {gereja.map((g) => (
                <option key={g.gereja_id} value={g.gereja_id}>{g.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Kode Kelompok</label>
            <input
              value={form.kode}
              onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
              placeholder="contoh: CIPAYUNG"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-black mt-0.5">Huruf kapital, unik per gereja</p>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-black mb-1">Nama Kelompok</label>
            <input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="contoh: Kelompok Cipayung"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">
              {editing ? 'Simpan Perubahan' : 'Tambah Kelompok'}
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Gereja</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Nama Kelompok</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((k) => (
              <tr key={k.kelompok_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-black">{gerejaMap[k.gereja_id] ?? k.gereja_id}</td>
                <td className="px-4 py-3 font-mono text-xs text-black">{k.kode}</td>
                <td className="px-4 py-3 font-medium text-black">{k.nama}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(k)} className="text-blue-600 hover:text-blue-800 text-xs mr-3">Edit</button>
                  <button onClick={() => handleDelete(k.kelompok_id)} className="text-red-500 hover:text-red-700 text-xs">Hapus</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-black text-sm">Belum ada data kelompok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
