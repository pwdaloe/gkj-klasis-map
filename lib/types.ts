export type Role = 'viewer' | 'entry' | 'superadmin' | 'bph'

export type Gereja = {
  gereja_id: string
  nama: string
  alamat: string | null
  lat: number
  lng: number
}

export type Kelurahan = {
  kode: string
  nama: string
  kecamatan: string
  kota_kab: string
  provinsi: string
  lat: number | null
  lng: number | null
  geojson: GeoJSON.Feature | null
}

export type Kelompok = {
  kelompok_id: string
  gereja_id: string
  kode: string
  nama: string
}

export type FaktaWarga = {
  id: string
  tahun: number
  kelurahan_kode: string
  gereja_id: string
  kelompok_id: string | null
  jumlah_warga: number
}

export type WargaPerKelurahan = {
  kelurahan_kode: string
  nama_kelurahan: string
  kecamatan: string
  kota_kab: string
  total_warga: number
  per_gereja: { gereja_id: string; nama_gereja: string; jumlah: number }[]
  gereja_terdekat: { nama: string; jarak_km: number } | null
  geojson: GeoJSON.Feature | null
  lat: number | null
  lng: number | null
}
