import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { email, password, nama, role } = await req.json()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({ id: authData.user.id, email, nama, role })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { id, nama, role, aktif } = await req.json()
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ nama, role, aktif })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
