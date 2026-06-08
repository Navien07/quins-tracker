import { createClient } from '@supabase/supabase-js'

// Service-role client — SERVER ONLY. Bypasses RLS; never import into client components.
export const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
