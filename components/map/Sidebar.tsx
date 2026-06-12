'use client'

import { useRouter } from 'next/navigation'
import { Gereja, WargaPerKelurahan } from '@/lib/types'

type Props = {
  gereja: Gereja[]
  tahunList: number[]
  filterTahun: number
  filterGereja: string
  filterKota: string
  kotaList: string[]
  data: WargaPerKelurahan[]
  onTahun: (v: number) => void
  onGereja: (v: string) => void
  onKota: (v: string) => void
  onClose: () => void
  onFlyTo: (latLng: [number, number]) => void
}

export default function Sidebar({
  gereja, tahunList, filterTahun, filterGereja, filterKota, kotaList, data,
  onTahun, onGereja, onKota, onClose, onFlyTo,
}: Props) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const kelurahanDenganJemaat = data
    .filter((d) => d.total_warga > 0)
    .sort((a, b) => a.nama_kelurahan.localeCompare(b.nama_kelurahan))

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-blue-800 leading-tight">Pemetaan Warga</h1>
          <p className="text-xs text-black mt-0.5">GKJ Klasis Jakarta Bagian Timur</p>
        </div>
        <button
          onClick={onClose}
          title="Sembunyikan sidebar"
          className="text-gray-400 hover:text-gray-700 text-lg leading-none ml-2 shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-black uppercase tracking-wide mb-1">
            Tahun
          </label>
          <select
            value={filterTahun}
            onChange={(e) => onTahun(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tahunList.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-black uppercase tracking-wide mb-1">
            Gereja
          </label>
          <select
            value={filterGereja}
            onChange={(e) => onGereja(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Gereja</option>
            {gereja.map((g) => (
              <option key={g.gereja_id} value={g.gereja_id}>{g.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-black uppercase tracking-wide mb-1">
            Kota / Kabupaten
          </label>
          <select
            value={filterKota}
            onChange={(e) => onKota(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Wilayah</option>
            {kotaList.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-black uppercase tracking-wide mb-2">Legenda</p>
          <div className="space-y-1">
            {[
              { color: '#fde0d9', label: 'Sangat sedikit' },
              { color: '#fc9272', label: 'Sedikit' },
              { color: '#fb6a4a', label: 'Sedang' },
              { color: '#de2d26', label: 'Banyak' },
              { color: '#a50f15', label: 'Sangat banyak' },
            ].map((item) => (
              <div key={item.color} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: item.color }} />
                <span className="text-xs text-black">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">⛪</span>
              <span className="text-xs text-black">Lokasi gereja</span>
            </div>
          </div>
        </div>
      </div>

      {filterGereja && (
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-black uppercase tracking-wide mb-2">
            Kelurahan dengan Jemaat ({kelurahanDenganJemaat.length})
          </p>
          {kelurahanDenganJemaat.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Belum ada data untuk gereja ini</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {kelurahanDenganJemaat.map((item) => (
                <li key={item.kelurahan_kode}>
                  <button
                    onClick={() => {
                      if (item.lat && item.lng) onFlyTo([item.lat, item.lng])
                    }}
                    disabled={!item.lat || !item.lng}
                    className="w-full flex justify-between items-baseline gap-1 text-left hover:bg-blue-50 rounded px-1 py-0.5 disabled:cursor-default"
                    title={item.lat ? 'Klik untuk zoom ke lokasi' : 'Koordinat belum tersedia'}
                  >
                    <span className={`text-xs truncate ${item.lat ? 'text-blue-700 underline underline-offset-2' : 'text-black'}`}>
                      {item.nama_kelurahan}
                    </span>
                    <span className="text-xs font-semibold text-black shrink-0">{item.total_warga}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-100 space-y-1">
        <a
          href="/admin/gereja"
          className="block w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-1"
        >
          Admin Panel →
        </a>
        <div className="flex items-center justify-between">
          <a href="/changelog" className="text-xs text-black hover:text-blue-700 underline">Changelog</a>
          <span className="text-xs text-black">v1.5</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-xs text-red-600 hover:text-red-800 py-1 text-center"
        >
          Keluar
        </button>
      </div>
    </aside>
  )
}
