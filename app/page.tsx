'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/map/Sidebar'
import InfoPanel from '@/components/map/InfoPanel'
import { WargaPerKelurahan, Gereja } from '@/lib/types'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

const TAHUN_LIST = [2024, 2025, 2026, 2027, 2028]

export default function HomePage() {
  const [gereja, setGereja] = useState<Gereja[]>([])
  const [data, setData] = useState<WargaPerKelurahan[]>([])
  const [kotaList, setKotaList] = useState<string[]>([])
  const [filterTahun, setFilterTahun] = useState(2026)
  const [filterGereja, setFilterGereja] = useState('')
  const [filterKota, setFilterKota] = useState('')
  const [selected, setSelected] = useState<WargaPerKelurahan | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [focusLatLng, setFocusLatLng] = useState<[number, number] | null>(null)

  // Collapse sidebar by default on mobile
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [])

  useEffect(() => {
    fetch('/api/gereja')
      .then((r) => r.json())
      .then(setGereja)
  }, [])

  useEffect(() => {
    fetch('/api/kelurahan')
      .then((r) => r.json())
      .then((rows: any[]) => {
        const kota = [...new Set(rows.map((r) => r.kota_kab).filter(Boolean))].sort()
        setKotaList(kota as string[])
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ tahun: String(filterTahun) })
    if (filterGereja) params.set('gereja_id', filterGereja)
    if (filterKota) params.set('kota_kab', filterKota)
    fetch(`/api/warga?${params}`)
      .then((r) => r.json())
      .then((rows) => { setData(rows); setLoading(false) })
  }, [filterTahun, filterGereja, filterKota])

  const handleSelect = useCallback((item: WargaPerKelurahan) => setSelected(item), [])

  const totalWarga = data.reduce((sum, d) => sum + d.total_warga, 0)
  const kelurahanTerdata = data.filter((d) => d.total_warga > 0).length

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {sidebarOpen && (
        <Sidebar
          gereja={gereja}
          tahunList={TAHUN_LIST}
          filterTahun={filterTahun}
          filterGereja={filterGereja}
          filterKota={filterKota}
          kotaList={kotaList}
          data={data}
          onTahun={setFilterTahun}
          onGereja={setFilterGereja}
          onKota={setFilterKota}
          onClose={() => setSidebarOpen(false)}
          onFlyTo={setFocusLatLng}
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Overview bar */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Tampilkan sidebar"
              className="mr-2 text-gray-500 hover:text-gray-800 text-lg leading-none"
            >
              ☰
            </button>
          )}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-500">Tahun</span>
              <span className="text-xs font-bold text-black">{filterTahun}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-500">Gereja</span>
              <span className="text-xs font-bold text-black">{gereja.length}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-500">Kelurahan ter-data</span>
              <span className="text-xs font-bold text-black">{kelurahanTerdata}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-500">Total Warga</span>
              <span className="text-xs font-bold text-black">{totalWarga.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-xs text-gray-400">v1.6</span>
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 z-[2000] bg-white/60 flex items-center justify-center">
              <div className="text-sm text-black animate-pulse">Memuat data peta...</div>
            </div>
          )}
          <MapView
            data={data}
            gereja={gereja}
            onSelectKelurahan={handleSelect}
            focusLatLng={focusLatLng}
          />
          <InfoPanel item={selected} onClose={() => setSelected(null)} />
        </div>
      </main>
    </div>
  )
}
