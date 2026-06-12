'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { WargaPerKelurahan, Gereja } from '@/lib/types'

type Props = {
  data: WargaPerKelurahan[]
  gereja: Gereja[]
  onSelectKelurahan: (item: WargaPerKelurahan) => void
  focusLatLng?: [number, number] | null
}

function getColor(total: number, max: number): string {
  if (max === 0) return '#f0f0f0'
  const ratio = total / max
  if (ratio === 0) return '#f7f7f7'
  if (ratio < 0.2) return '#fde0d9'
  if (ratio < 0.4) return '#fc9272'
  if (ratio < 0.6) return '#fb6a4a'
  if (ratio < 0.8) return '#de2d26'
  return '#a50f15'
}

export default function MapView({ data, gereja, onSelectKelurahan, focusLatLng }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<L.Layer[]>([])

  useEffect(() => {
    if (!focusLatLng || !mapRef.current) return
    mapRef.current.flyTo(focusLatLng, 14, { duration: 1 })
  }, [focusLatLng])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapRef.current = L.map(containerRef.current).setView([-6.28, 106.93], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(mapRef.current)
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Hapus layer lama
    layersRef.current.forEach((l) => map.removeLayer(l))
    layersRef.current = []

    const max = Math.max(...data.map((d) => d.total_warga), 0)

    // Polygon kelurahan
    data.forEach((item) => {
      if (!item.geojson) return
      const geomType = (item.geojson as any)?.geometry?.type ?? (item.geojson as any)?.type
      if (!geomType || !['Polygon', 'MultiPolygon', 'FeatureCollection'].includes(geomType)) return
      const layer = L.geoJSON(item.geojson as any, {
        style: {
          fillColor: getColor(item.total_warga, max),
          fillOpacity: 0.7,
          color: '#555',
          weight: 1,
        },
      })
      layer.on('click', () => onSelectKelurahan(item))
      layer.on('mouseover', () => {
        layer.setStyle({ weight: 2, color: '#222' })
      })
      layer.on('mouseout', () => {
        layer.setStyle({ weight: 1, color: '#555' })
      })
      layer.addTo(map)
      layersRef.current.push(layer)
    })

    // Marker gereja
    const gerejaIcon = L.divIcon({
      html: '<div style="background:#1d4ed8;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)">⛪</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      className: '',
    })
    gereja.forEach((g) => {
      const marker = L.marker([g.lat, g.lng], { icon: gerejaIcon })
      marker.bindTooltip(`<b>${g.nama}</b><br>${g.alamat ?? ''}`, { permanent: false })
      marker.addTo(map)
      layersRef.current.push(marker)
    })
  }, [data, gereja, onSelectKelurahan])

  return <div ref={containerRef} className="w-full h-full" />
}
