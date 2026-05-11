'use client'

import { WargaPerKelurahan } from '@/lib/types'

type Props = {
  item: WargaPerKelurahan | null
  onClose: () => void
}

export default function InfoPanel({ item, onClose }: Props) {
  if (!item) return null

  return (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white rounded-xl shadow-lg p-4 w-72 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-black text-base">{item.nama_kelurahan}</h3>
          <p className="text-xs text-black">{item.kecamatan}, {item.kota_kab}</p>
        </div>
        <button onClick={onClose} className="text-black hover:text-black text-lg leading-none ml-2">×</button>
      </div>

      <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3">
        <span className="text-xs text-blue-600 font-medium">Total Warga</span>
        <p className="text-2xl font-bold text-blue-700">{item.total_warga}</p>
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">Per Gereja</p>
        <div className="space-y-1">
          {item.per_gereja.map((g) => (
            <div key={g.gereja_id} className="flex justify-between text-sm">
              <span className="text-black truncate">{g.nama_gereja}</span>
              <span className="font-semibold text-black ml-2">{g.jumlah}</span>
            </div>
          ))}
        </div>
      </div>

      {item.gereja_terdekat && (
        <div className="border-t pt-2">
          <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">Gereja Terdekat</p>
          <p className="text-sm text-black">{item.gereja_terdekat.nama}</p>
          <p className="text-xs text-black">{item.gereja_terdekat.jarak_km} km (jarak lurus)</p>
        </div>
      )}
    </div>
  )
}
