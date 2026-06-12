import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  const rows = await sql`SELECT nama FROM ref_provinsi ORDER BY nama`
  return NextResponse.json(rows)
}
