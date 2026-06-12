export default function ChangelogPage() {
  const logs = [
    {
      versi: '1.7',
      tanggal: '2026-06-12',
      fitur: [
        'Tabel referensi wilayah ref_wilayah — 471 kelurahan Jabodetabek dari data SHP BPS 2020',
        'Halaman admin Ref Wilayah — browse, search, dan filter kelurahan per kota/kabupaten',
        'Tombol Import per kelurahan — salin ke daftar kelurahan aktif beserta polygon otomatis',
        'Kode kelurahan di-generate otomatis dari nama, bisa diubah sebelum import',
        'Badge status import (Sudah / Belum) di setiap baris tabel referensi',
        'Autocomplete nama kelurahan dari ref_wilayah saat menambah kelurahan baru di admin panel',
        'Script Python populate_ref_wilayah.py untuk mengisi ulang data referensi dari SHP',
      ],
    },
    {
      versi: '1.6',
      tanggal: '2026-06-12',
      fitur: [
        'Migrasi database dari Supabase ke PostgreSQL self-hosted di VPS (klasis.purwandaru.com)',
        'Perbaikan rendering polygon kelurahan — geojson TEXT dari database kini di-parse sebelum dikirim ke peta',
        'MapView mendukung tipe geometry FeatureCollection selain Polygon dan MultiPolygon',
        'Geocoding diperbaiki: hanya menyimpan polygon bertipe Polygon/MultiPolygon, bukan Point atau LineString',
        'Fitur input GeoJSON manual per kelurahan di admin panel — paste langsung dari geojson.io',
        'Validasi tipe geometry pada input GeoJSON (tolak LineString, Point, dll dengan pesan jelas)',
        'Kolom status Polygon (Ada/Kosong) dan kartu ringkasan jumlah polygon di admin Kelurahan',
        'Import massal polygon kelurahan dari data SHP BPS 2020 — 15+ kelurahan terisi polygon otomatis',
        'Tambah polygon Jatiwaringin dari SHP BPS 2020 (82 warga)',
        'Tambah polygon 3 kelurahan via Overpass API (Halim Perdanakusuma, Jatirasa, Jatisari)',
      ],
    },
    {
      versi: '1.5',
      tanggal: '2026-05-11',
      fitur: [
        'Sidebar dapat disembunyikan dan dibuka kembali di semua device (tombol ✕ dan ☰)',
        'Di browser mobile, sidebar otomatis tersembunyi saat pertama dibuka',
        'Overview bar di atas peta — tampilkan tahun, jumlah gereja, kelurahan ter-data, dan total warga',
        'Daftar kelurahan di sidebar hanya menampilkan kelurahan yang ada jemaatnya saat gereja dipilih',
        'Klik nama kelurahan di sidebar untuk zoom dan fly ke lokasi di peta',
      ],
    },
    {
      versi: '1.4',
      tanggal: '2026-05-11',
      fitur: [
        'Autocomplete field Kelurahan pada input Data Warga — ketik nama untuk filter dropdown',
        'Search box pada tabel Data Warga — cari berdasarkan nama kelurahan atau gereja',
        'Filter gereja pada tabel Data Warga',
        'Sortir kolom pada tabel (Kelurahan, Gereja, Jumlah Warga)',
        'Fitur Edit jumlah warga langsung dari baris tabel',
        'Fitur Hapus data warga per baris dengan konfirmasi',
        'Filter Search, Kecamatan, Kota/Kabupaten, dan Status Geocode pada daftar Kelurahan',
        'Pagination pada daftar Kelurahan (20 baris per halaman)',
        'Edit data inline per baris Kelurahan — ubah nama, kecamatan, kota/kab, dan provinsi langsung dari tabel',
      ],
    },
    {
      versi: '1.3',
      tanggal: '2026-05-11',
      fitur: [
        'Sistem login dengan email dan password',
        'Tiga level akses: View Only (peta), Entry Data (admin), Super Admin (semua fitur)',
        'Halaman manajemen user — tambah, edit role, aktifkan/nonaktifkan user',
        'Proteksi route: /admin hanya untuk Entry & Super Admin, / untuk semua user login',
        'Tombol Keluar di sidebar peta dan admin panel',
        'Vercel Analytics untuk tracking pengunjung',
      ],
    },
    {
      versi: '1.1',
      tanggal: '2026-05-11',
      fitur: [
        'Tambah pilihan provinsi dinamis dari database (DKI Jakarta, Jawa Barat, Banten)',
        'Input koordinat manual untuk kelurahan yang tidak ditemukan oleh geocoding otomatis',
        'Peta menampilkan semua kelurahan ber-polygon meski belum ada data warga (tampil abu-abu)',
        'Daftar kelurahan muncul di sidebar kiri saat filter gereja dipilih',
        'Perbaikan tampilan warna teks — semua teks menggunakan warna hitam',
        'Penambahan halaman Changelog ini',
      ],
    },
    {
      versi: '1.0',
      tanggal: '2026-05-10',
      fitur: [
        'Peta interaktif kelurahan dengan warna berdasarkan jumlah warga',
        'Filter berdasarkan tahun, gereja, dan kota/kabupaten',
        'Marker lokasi gereja di peta',
        'Info panel kelurahan (klik polygon) — detail warga per gereja dan gereja terdekat',
        'Geocoding otomatis koordinat & polygon kelurahan via Nominatim (OpenStreetMap)',
        'Halaman admin: Gereja, Kelompok, Kelurahan, Data Warga',
        'Backend API: gereja, kelompok, kelurahan, warga, geocode',
        'Integrasi Supabase sebagai database',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black">Changelog</h1>
          <p className="text-sm text-black mt-1">Pemetaan Warga GKJ Klasis Jakarta Bagian Timur</p>
        </div>

        <div className="space-y-8">
          {logs.map((log) => (
            <div key={log.versi} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-blue-700 text-white text-sm font-bold px-3 py-1 rounded-full">
                  v{log.versi}
                </span>
                <span className="text-sm text-black">{log.tanggal}</span>
              </div>
              <ul className="space-y-2">
                {log.fitur.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-black">
                    <span className="text-blue-700 mt-0.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-sm text-blue-700 hover:text-blue-900">← Kembali ke Peta</a>
        </div>
      </div>
    </div>
  )
}
