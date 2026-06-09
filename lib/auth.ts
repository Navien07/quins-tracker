import { createSupabaseServer } from '@/lib/supabase-server'
import type { User } from '@supabase/supabase-js'

/** Returns the authenticated internal user, or null. Use to gate write APIs. */
export async function requireUser(): Promise<User | null> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
