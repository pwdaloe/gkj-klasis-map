import Link from 'next/link'
import { Suspense } from 'react'
import sql from '@/lib/db'

async function DaftarGereja() {
  const gereja = await sql`SELECT gereja_id, nama FROM gereja ORDER BY nama`
  return (
    <ul className="divide-y divide-gray-100">
      {gereja.map((g) => (
        <li key={g.gereja_id as string} className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-gray-800">{g.nama as string}</span>
          <a
            href={`/api/template/${g.gereja_id}`}
            download
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 transition-colors"
          >
            ↓ Download Template
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Pemetaan Warga GKJ Klasis JBT</h1>
          <p className="text-blue-200 text-xs mt-0.5">GKJ Klasis Jakarta Bagian Timur</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-blue-200 hover:text-white">Lihat Peta</Link>
          <Link href="/login"
            className="text-xs px-3 py-1.5 border border-blue-400 rounded-lg hover:bg-blue-700 text-white">
            Masuk
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="text-5xl">⛪</div>
          <h2 className="text-2xl font-bold text-gray-900">Aplikasi Pemetaan Warga Jemaat</h2>
          <p className="text-gray-600 text-base max-w-xl mx-auto">
            Alat bantu visual untuk memantau persebaran geografis warga jemaat
            dari seluruh gereja anggota GKJ Klasis Jakarta Bagian Timur.
          </p>
        </section>

        {/* Tentang */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Tentang Aplikasi</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Aplikasi ini dibangun untuk membantu GKJ Klasis Jakarta Bagian Timur dalam
            memantau dan menganalisis sebaran geografis warga jemaat. Data jumlah warga
            per kelurahan dicatat setiap tahun oleh masing-masing gereja, lalu divisualisasikan
            dalam peta interaktif dengan gradasi warna berdasarkan kepadatan.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Aplikasi ini digunakan oleh petugas administrasi gereja, pengurus klasis (BPH),
            dan Badan Pengelola Harian untuk mendukung perencanaan pelayanan berbasis data wilayah.
          </p>
        </section>

        {/* Fitur */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Fitur Utama</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🗺️', judul: 'Peta Interaktif', desc: 'Visualisasi persebaran warga per kelurahan dengan gradasi warna. Klik polygon untuk detail per gereja.' },
              { icon: '📊', judul: 'Dashboard Laporan', desc: 'Ringkasan statistik klasis, perbandingan antar gereja, dan ranking kelurahan — dioptimasi untuk mobile.' },
              { icon: '📥', judul: 'Input & Upload Batch', desc: 'Petugas gereja dapat mengisi template Excel dan mengupload data warga secara massal.' },
              { icon: '📤', judul: 'Export Data', desc: 'Export data warga ke format Excel atau CSV untuk keperluan laporan dan analisis.' },
              { icon: '🔍', judul: 'Filter Multi-Level', desc: 'Filter berdasarkan tahun, gereja, dan kota/kabupaten. Klik nama kelurahan untuk zoom ke peta.' },
              { icon: '🔒', judul: 'Akses Berbasis Peran', desc: 'Tiga level akses: Viewer, Entry Data, dan Super Admin. BPH mendapat akses dashboard khusus.' },
            ].map((f) => (
              <div key={f.judul} className="flex gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.judul}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Download Template */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Download Template Data Warga</h3>
          <p className="text-sm text-gray-600 mb-4">
            Pilih gereja Anda dan download template Excel. Isi kolom jumlah warga, lalu upload
            melalui menu <strong>Admin → Data Warga → Upload Batch</strong>.
          </p>
          <Suspense fallback={<p className="text-sm text-gray-400">Memuat daftar gereja...</p>}>
            <DaftarGereja />
          </Suspense>
        </section>

        {/* Cara Akses */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Cara Mendapatkan Akses</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Akses ke aplikasi ini diberikan oleh administrator klasis. Jika gereja Anda
            belum memiliki akun, hubungi pengurus GKJ Klasis Jakarta Bagian Timur untuk
            mendapatkan akun dan password awal.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-xs text-blue-800">
              Sudah punya akun? <Link href="/login" className="font-semibold underline hover:text-blue-900">Masuk ke aplikasi →</Link>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 pb-4 space-y-1">
          <p>GKJ Klasis Jakarta Bagian Timur</p>
          <div className="flex justify-center gap-4">
            <Link href="/" className="hover:text-gray-600">Peta Interaktif</Link>
            <Link href="/changelog" className="hover:text-gray-600">Changelog</Link>
            <Link href="/login" className="hover:text-gray-600">Masuk</Link>
          </div>
        </footer>

      </main>
    </div>
  )
}
