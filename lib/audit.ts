import { NextRequest } from 'next/server'
import sql from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'
export type AuditUser = { id: string | null; nama: string }

export async function getUserFromRequest(req: NextRequest): Promise<AuditUser> {
  const token = req.cookies.get('session')?.value
  if (!token) return { id: null, nama: 'unknown' }
  const user = await verifyToken(token)
  return { id: user?.id ?? null, nama: user?.nama ?? 'unknown' }
}

export async function logAudit(params: {
  user: AuditUser
  action: AuditAction
  tabel: string
  recordId: string
  dataLama?: object | null
  dataBaru?: object | null
}): Promise<void> {
  try {
    const dataLama = params.dataLama != null ? JSON.stringify(params.dataLama) : null
    const dataBaru = params.dataBaru != null ? JSON.stringify(params.dataBaru) : null
    await sql`
      INSERT INTO audit_log (user_id, user_nama, action, tabel, record_id, data_lama, data_baru)
      VALUES (
        ${params.user.id},
        ${params.user.nama},
        ${params.action},
        ${params.tabel},
        ${params.recordId},
        ${dataLama}::jsonb,
        ${dataBaru}::jsonb
      )
    `
  } catch {
    // audit failure tidak boleh memutus operasi utama
  }
}
