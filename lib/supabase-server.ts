import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** SSR Supabase client (anon key + cookies). Reads run under the user's session. */
export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies are read-only here.
            // Session refresh is handled by middleware, so this is safe to ignore.
          }
        },
      },
    }
  )
}
