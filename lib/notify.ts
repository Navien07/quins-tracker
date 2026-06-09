/**
 * Notify the client that a milestone shipped.
 * POSTs a BRAND-SAFE payload (translated milestone label only) to CLIENT_NOTIFY_WEBHOOK
 * if set. Works with Slack/Zapier/Make/email-relay incoming webhooks. No-op otherwise.
 */
export async function notifyClient(milestone: string, url?: string | null): Promise<void> {
  const hook = process.env.CLIENT_NOTIFY_WEBHOOK
  if (!hook) return
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚀 New delivery on MyKASIH Command Centre — Phase 2: ${milestone}`,
        milestone,
        link: url ?? null,
      }),
    })
  } catch {
    // Best-effort only — never block a sync on notification failure.
  }
}
