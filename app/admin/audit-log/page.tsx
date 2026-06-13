'use client'

import { useEffect, useState, useCallback } from 'react'

type AuditRow = {
  id: string
  timestamp: string
  user_nama: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  tabel: string
  record_id: string
  data_lama: object | null
  data_baru: object | null
}

const ACTION_STYLE: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-600',
}

const TABEL_OPTIONS = ['fakta_warga', 'gereja', 'kelompok', 'kelurahan', 'user_profiles']
const LIMIT = 50

function JsonBlock({ data }: { data: object | null }) {
  if (!data) return <span className="text-gray-400 text-xs italic">—</span>
  return (
    <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterTabel, setFilterTabel] = useState('')
  const [filterDari, setFilterDari] = useState('')
  const [filterSampai, setFilterSampai] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (off = 0) => {
    setLoading(true)
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
    if (filterTabel) params.set('tabel', filterTabel)
    if (filterDari) params.set('dari', filterDari)
    if (filterSampai) params.set('sampai', filterSampai)
    const res = await fetch(`/api/audit-log?${params}`)
    const data = await res.json()
    setRows(data.rows ?? [])
    setTotal(data.total ?? 0)
    setOffset(off)
    setLoading(false)
  }, [filterTabel, filterDari, filterSampai])

  useEffect(() => { load(0) }, [load])

  const totalPages = Math.ceil(total / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-black">Audit Log</h2>
        <span className="text-xs text-gray-500">{total} entri</span>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-black mb-1">Tabel</label>
          <select value={filterTabel} onChange={(e) => setFilterTabel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm min-w-[140px]">
            <option value="">Semua tabel</option>
            {TABEL_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">Dari</label>
          <input type="date" value={filterDari} onChange={(e) => setFilterDari(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">Sampai</label>
          <input type="date" value={filterSampai} onChange={(e) => setFilterSampai(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => { setFilterTabel(''); setFilterDari(''); setFilterSampai('') }}
          className="text-xs text-gray-500 hover:text-black underline pb-1.5">
          Reset
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Memuat...</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Tidak ada data</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Waktu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Aksi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Tabel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-black uppercase">Record ID</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <>
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-black font-medium">{r.user_nama}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${ACTION_STYLE[r.action]}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">{r.tabel}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600 max-w-[180px] truncate">{r.record_id}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline">
                        {expandedId === r.id ? 'Tutup' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr key={r.id + '-detail'} className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Data Lama</p>
                            <JsonBlock data={r.data_lama} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Data Baru</p>
                            <JsonBlock data={r.data_baru} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Halaman {currentPage} dari {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => load(offset - LIMIT)} disabled={offset === 0}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              ← Sebelumnya
            </button>
            <button onClick={() => load(offset + LIMIT)} disabled={offset + LIMIT >= total}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
