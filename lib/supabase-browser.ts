import { createBrowserClient } from '@supabase/ssr'

/** Browser Supabase client for the login page and client components. */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
