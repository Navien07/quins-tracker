// Client notifications when a milestone ships. BRAND-SAFE: only the translated
// milestone label + the client's own tracker link ever leave this file — never a
// raw commit/branch/repo URL. All channels are optional and best-effort.

export interface NotifyResult {
  resend: 'sent' | 'error' | 'skipped'
  webhook: 'sent' | 'error' | 'skipped'
}

/** The client's own share link, built from env (never an internal GitHub URL). */
function clientViewLink(): string | null {
  const base = process.env.TRACKER_PUBLIC_URL
  const token = process.env.CLIENT_SHARE_TOKEN
  if (!base || !token) return null
  return `${base.replace(/\/$/, '')}/view/${token}`
}

function emailHtml(milestone: string, link: string | null): string {
  const button = link
    ? `<a href="${link}" style="display:inline-block;background:#2E7D32;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px">View the tracker</a>`
    : ''
  return `<!doctype html><html><body style="margin:0;background:#0D1117;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D1117;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#161B22;border:1px solid #21262D;border-radius:16px;overflow:hidden">
        <tr><td style="padding:28px 28px 8px">
          <div style="color:#7D8590;font-size:13px;letter-spacing:.04em;text-transform:uppercase">MyKASIH Command Centre — Phase 2</div>
          <div style="color:#E6EDF3;font-size:22px;font-weight:600;margin-top:10px">🚀 A new delivery is live</div>
        </td></tr>
        <tr><td style="padding:8px 28px 4px">
          <div style="background:#0D1117;border:1px solid #21262D;border-radius:10px;padding:16px">
            <div style="color:#3FB950;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase">Delivered</div>
            <div style="color:#E6EDF3;font-size:17px;margin-top:6px;line-height:1.4">${milestone}</div>
          </div>
        </td></tr>
        ${button ? `<tr><td style="padding:20px 28px 8px">${button}</td></tr>` : ''}
        <tr><td style="padding:18px 28px 28px">
          <div style="border-top:1px solid #21262D;padding-top:16px;color:#7D8590;font-size:12px">Prepared by Iceberg AI Solutions</div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}

async function sendResend(milestone: string, link: string | null): Promise<NotifyResult['resend']> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const to = (process.env.CLIENT_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!key || !from || to.length === 0) return 'skipped'
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: `New delivery — MyKASIH Command Centre (Phase 2)`,
        html: emailHtml(milestone, link),
      }),
    })
    return r.ok ? 'sent' : 'error'
  } catch {
    return 'error'
  }
}

async function sendWebhook(milestone: string, link: string | null): Promise<NotifyResult['webhook']> {
  const hook = process.env.CLIENT_NOTIFY_WEBHOOK
  if (!hook) return 'skipped'
  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚀 New delivery on MyKASIH Command Centre — Phase 2: ${milestone}`,
        milestone,
        link,
      }),
    })
    return r.ok ? 'sent' : 'error'
  } catch {
    return 'error'
  }
}

/** Notify the client of a shipped milestone across all configured channels. */
export async function notifyClient(milestone: string): Promise<NotifyResult> {
  const link = clientViewLink()
  const [resend, webhook] = await Promise.all([sendResend(milestone, link), sendWebhook(milestone, link)])
  return { resend, webhook }
}

function digestHtml(items: { label: string; at: string }[], overall: number, link: string | null): string {
  const rows = items
    .map(
      (m) => `<div style="background:#0D1117;border:1px solid #21262D;border-radius:10px;padding:14px;margin-bottom:10px">
        <div style="color:#3FB950;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase">Delivered</div>
        <div style="color:#E6EDF3;font-size:15px;margin-top:5px;line-height:1.4">${m.label}</div>
      </div>`,
    )
    .join('')
  const button = link
    ? `<a href="${link}" style="display:inline-block;background:#2E7D32;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px">View the tracker</a>`
    : ''
  return `<!doctype html><html><body style="margin:0;background:#0D1117;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D1117;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#161B22;border:1px solid #21262D;border-radius:16px;overflow:hidden">
        <tr><td style="padding:28px 28px 8px">
          <div style="color:#7D8590;font-size:13px;letter-spacing:.04em;text-transform:uppercase">MyKASIH Command Centre — Phase 2</div>
          <div style="color:#E6EDF3;font-size:22px;font-weight:600;margin-top:10px">📦 Your weekly delivery summary</div>
          <div style="color:#7D8590;font-size:14px;margin-top:6px">Overall progress: <span style="color:#00897B;font-weight:700">${overall}%</span></div>
        </td></tr>
        <tr><td style="padding:14px 28px 4px">${rows}</td></tr>
        ${button ? `<tr><td style="padding:14px 28px 8px">${button}</td></tr>` : ''}
        <tr><td style="padding:18px 28px 28px">
          <div style="border-top:1px solid #21262D;padding-top:16px;color:#7D8590;font-size:12px">Prepared by Iceberg AI Solutions</div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}

/** Weekly digest email: everything shipped in the period + overall %. */
export async function sendWeeklyDigest(
  items: { label: string; at: string }[],
  overall: number,
): Promise<NotifyResult['resend']> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const to = (process.env.CLIENT_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!key || !from || to.length === 0) return 'skipped'
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: 'Weekly progress — MyKASIH Command Centre (Phase 2)',
        html: digestHtml(items, overall, clientViewLink()),
      }),
    })
    return r.ok ? 'sent' : 'error'
  } catch {
    return 'error'
  }
}
