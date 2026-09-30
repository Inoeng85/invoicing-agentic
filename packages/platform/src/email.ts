import { setEmailSender, type SendEmailInput, type EmailSendResult } from '@invoicing/domain'

import type { ValidatedEnv } from './env.ts'

async function sendViaResend(
  input: SendEmailInput,
  apiKey: string,
  from: string,
): Promise<EmailSendResult> {
  let response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!response.ok) {
    let body = await response.text()
    return { ok: false, error: `Resend ${response.status}: ${body}` }
  }

  let data = (await response.json()) as { id?: string }
  return { ok: true, providerId: data.id ?? 'resend' }
}

function parseAllowlist(): Set<string> | null {
  let raw = process.env.EMAIL_ALLOWLIST?.trim()
  if (!raw) return null
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function configureEmailFromEnv(env: Pick<ValidatedEnv, 'emailProvider' | 'emailApiKey' | 'emailFrom'>) {
  if (env.emailProvider === 'log') {
    return
  }

  if (env.emailProvider === 'resend') {
    let apiKey = env.emailApiKey
    let from = env.emailFrom
    if (!apiKey || !from) {
      console.error('EMAIL_API_KEY and EMAIL_FROM required when EMAIL_PROVIDER=resend')
      process.exit(1)
    }

    let allowlist = parseAllowlist()
    setEmailSender(async (input) => {
      if (allowlist && !allowlist.has(input.to.trim().toLowerCase())) {
        console.info('[email:blocked]', { to: input.to, reason: 'not on EMAIL_ALLOWLIST' })
        return { ok: false, error: 'Recipient not allowed in this environment' }
      }
      return sendViaResend(input, apiKey, from)
    })
  }
}
