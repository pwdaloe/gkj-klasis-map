'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type DashboardData = {
  tahun: number
  tahunTersedia: number[]
  totalWarga: number
  totalGereja: number
  totalKelurahan: number
  perGereja: { gereja_id: string; nama: string; jumlah_warga: number; jumlah_kelurahan: number }[]
  rankingKelurahan: { kelurahan: string; kecamatan: string; kota_kab: string; total_warga: number }[]
  trenPerTahun: { tahun: number; total_warga: number }[]
}

const COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff']

export default function BphPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [tahun, setTahun] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (t?: number) => {
    setLoading(true)
    const url = t ? `/api/dashboard?tahun=${t}` : '/api/dashboard'
    const res = await fetch(url)
    const json: DashboardData = await res.json()
    setData(json)
    setTahun(json.tahun)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">Dashboard Klasis</h1>
          <p className="text-blue-200 text-xs mt-0.5">GKJ Klasis Jakarta Bagian Timur</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-blue-200 hover:text-white">← Peta</Link>
          <Link href="/tentang" className="text-xs text-blue-200 hover:text-white">Tentang</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Selector Tahun */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Tahun:</label>
          {data ? (
            <div className="flex gap-2 flex-wrap">
              {data.tahunTersedia.map((t) => (
                <button key={t} onClick={() => load(t)}
                  className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                    t === tahun
                      ? 'bg-blue-700 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <div className="h-8 w-48 bg-gray-200 rounded-full animate-pulse" />
          )}
        </div>

        {/* Kartu Ringkasan */}
        {loading || !data ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Warga Klasis</p>
              <p className="text-3xl font-bold text-blue-800 mt-2">{data.totalWarga.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-400 mt-1">jiwa terdaftar tahun {data.tahun}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gereja Melaporkan</p>
              <p className="text-3xl font-bold text-blue-800 mt-2">{data.totalGereja}</p>
              <p className="text-xs text-gray-400 mt-1">dari {data.perGereja.length} gereja terdaftar</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kelurahan Ter-data</p>
              <p className="text-3xl font-bold text-blue-800 mt-2">{data.totalKelurahan}</p>
              <p className="text-xs text-gray-400 mt-1">kelurahan dengan data warga</p>
            </div>
          </div>
        )}

        {/* Bar Chart: Perbandingan per Gereja */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Jumlah Warga per Gereja — {tahun}</h2>
          {loading || !data ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(400, data.perGereja.length * 80) }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.perGereja} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                    <XAxis
                      dataKey="nama"
                      tick={{ fontSize: 11 }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={45} />
                    <Tooltip
                      formatter={(val: number) => [val.toLocaleString('id-ID') + ' warga', 'Jumlah']}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="jumlah_warga" radius={[4, 4, 0, 0]}>
                      {data.perGereja.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Tabel Ranking Kelurahan */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Top 20 Kelurahan — Warga Terbanyak ({tahun})</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total warga lintas semua gereja</p>
          </div>
          {loading || !data ? (
            <div className="p-5 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Kelurahan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell">Kecamatan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell">Kota/Kab</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Warga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.rankingKelurahan.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{r.kelurahan}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs hidden sm:table-cell">{r.kecamatan}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs hidden sm:table-cell">{r.kota_kab}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-blue-800">
                      {r.total_warga.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {data.rankingKelurahan.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Belum ada data</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}
