'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin/gereja', label: 'Gereja' },
  { href: '/admin/kelompok', label: 'Kelompok' },
  { href: '/admin/kelurahan', label: 'Kelurahan' },
  { href: '/admin/ref-wilayah', label: 'Ref Wilayah' },
  { href: '/admin/warga', label: 'Data Warga' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/audit-log', label: 'Audit Log' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-800 text-white px-6 py-3 flex items-center gap-6">
        <Link href="/" className="text-sm font-bold tracking-wide">GKJ Klasis JBT</Link>
        <span className="text-blue-300 text-xs">|</span>
        <span className="text-blue-200 text-xs">Admin Panel</span>
        <nav className="ml-4 flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs px-3 py-1.5 rounded hover:bg-blue-700 text-blue-100 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" className="text-xs text-blue-200 hover:text-white">← Peta</Link>
          <button
            onClick={handleLogout}
            className="text-xs text-blue-200 hover:text-white border border-blue-600 px-3 py-1 rounded hover:border-blue-400"
          >
            Keluar
          </button>
        </div>
      </header>
      <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  )
}
