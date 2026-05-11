import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    const value = (_supabase as any)[prop]
    return typeof value === 'function' ? value.bind(_supabase) : value
  },
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }
    const value = (_supabaseAdmin as any)[prop]
    return typeof value === 'function' ? value.bind(_supabaseAdmin) : value
  },
})
