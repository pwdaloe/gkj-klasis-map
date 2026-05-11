'use client'

import { useEffect, useState } from 'react'

type UserProfile = {
  id: string
  email: string
  nama: string | null
  role: 'viewer' | 'entry' | 'superadmin'
  aktif: boolean
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  viewer: 'View Only',
  entry: 'Entry Data',
  superadmin: 'Super Admin',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [form, setForm] = useState({ email: '', password: '', nama: '', role: 'viewer' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nama: '', role: 'viewer', aktif: true })

  const load = () => fetch('/api/users').then((r) => r.json()).then(setUsers)
  useEffect(() => { load() }, [])

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(''); setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); return }
    setMsg('User berhasil ditambahkan.')
    setForm({ email: '', password: '', nama: '', role: 'viewer' })
    load()
  }

  const handleEdit = (u: UserProfile) => {
    setEditId(u.id)
    setEditForm({ nama: u.nama ?? '', role: u.role, aktif: u.aktif })
  }

  const handleSimpanEdit = async (id: string) => {
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); return }
    setEditId(null)
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-black">Manajemen User</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-black mb-4">Tambah User Baru</h3>
        <form onSubmit={handleTambah} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">Nama</label>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama lengkap" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nama@email.com" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 karakter" required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="viewer">View Only</option>
              <option value="entry">Entry Data</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">
              Tambah User
            </button>
            {msg && <span className="text-xs text-green-600">{msg}</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Nama</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Role</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-black uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <>
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-black">{u.nama ?? '-'}</td>
                  <td className="px-4 py-3 text-black">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium
                      ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'entry' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-black'}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.aktif
                      ? <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Aktif</span>
                      : <span className="inline-block bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Nonaktif</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => editId === u.id ? setEditId(null) : handleEdit(u)}
                      className="text-blue-600 hover:text-blue-800 text-xs underline">
                      {editId === u.id ? 'Batal' : 'Edit'}
                    </button>
                  </td>
                </tr>
                {editId === u.id && (
                  <tr key={u.id + '-edit'} className="bg-blue-50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-end gap-3 flex-wrap">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Nama</label>
                          <input value={editForm.nama}
                            onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Role</label>
                          <select value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                            <option value="viewer">View Only</option>
                            <option value="entry">Entry Data</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Status</label>
                          <select value={editForm.aktif ? 'aktif' : 'nonaktif'}
                            onChange={(e) => setEditForm({ ...editForm, aktif: e.target.value === 'aktif' })}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                          </select>
                        </div>
                        <button onClick={() => handleSimpanEdit(u.id)}
                          className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-800">
                          Simpan
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
