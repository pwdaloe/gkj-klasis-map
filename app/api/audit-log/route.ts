import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const user = token ? await verifyToken(token) : null
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const tabel = searchParams.get('tabel')
  const dari = searchParams.get('dari')
  const sampai = searchParams.get('sampai')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const rows = await sql`
    SELECT
      al.id, al.timestamp, al.user_nama, al.action, al.tabel,
      al.record_id, al.data_lama, al.data_baru
    FROM audit_log al
    WHERE
      (${tabel}::text IS NULL OR al.tabel = ${tabel})
      AND (${dari}::text IS NULL OR al.timestamp >= ${dari}::timestamptz)
      AND (${sampai}::text IS NULL OR al.timestamp <= (${sampai}::timestamptz + interval '1 day'))
    ORDER BY al.timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ total }] = await sql`
    SELECT COUNT(*)::int AS total FROM audit_log
    WHERE
      (${tabel}::text IS NULL OR tabel = ${tabel})
      AND (${dari}::text IS NULL OR timestamp >= ${dari}::timestamptz)
      AND (${sampai}::text IS NULL OR timestamp <= (${sampai}::timestamptz + interval '1 day'))
  `

  return NextResponse.json({ rows, total })
}
