import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role client — SERVER ONLY. Bypasses RLS; never import into client components.
// Instantiated lazily so a production `next build` (page-data collection) does not
// require runtime secrets to be present — the client is only created on first use.
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
  }
  return client
}

// Proxy keeps existing `admin.from(...)` call sites unchanged while deferring construction.
export const admin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const c = getClient()
    const value = Reflect.get(c, prop, receiver)
    return typeof value === 'function' ? value.bind(c) : value
  },
})
