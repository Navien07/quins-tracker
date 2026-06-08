'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const supabase = createSupabaseBrowser()

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setMsg(error.message)
    } else {
      router.replace('/internal')
      router.refresh()
    }
  }

  async function sendMagicLink() {
    if (!email) {
      setMsg('Enter your email first.')
      return
    }
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/internal` },
    })
    setBusy(false)
    setMsg(error ? error.message : 'Check your email for a sign-in link.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-7">
        <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">Internal sign-in</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">Quins Project Tracker — team access only.</p>

        <form onSubmit={signInWithPassword} className="space-y-3">
          <input
            type="email"
            required
            placeholder="you@futureobjects.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[var(--accent-primary)] px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="h-px flex-1 bg-[var(--bg-border)]" />
          or
          <span className="h-px flex-1 bg-[var(--bg-border)]" />
        </div>

        <button
          onClick={sendMagicLink}
          disabled={busy}
          className="w-full rounded-md border border-[var(--bg-border)] px-4 py-2 font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-teal)] disabled:opacity-50"
        >
          Email me a sign-in link
        </button>

        {msg && <p className="mt-4 text-sm text-[var(--text-muted)]">{msg}</p>}
      </div>
    </main>
  )
}
