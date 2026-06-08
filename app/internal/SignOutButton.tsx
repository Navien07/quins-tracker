'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.replace('/internal/login')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bg-border)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
    >
      <LogOut size={14} />
      Sign out
    </button>
  )
}
