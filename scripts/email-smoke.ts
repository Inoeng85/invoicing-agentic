/**
 * G-04 smoke — kirim email uji jika Resend dikonfigurasi.
 *   EMAIL_PROVIDER=resend EMAIL_API_KEY=… EMAIL_FROM=… EMAIL_SMOKE_TO=you@example.com npm run email:smoke
 */
import { bootstrapPlatform } from '@invoicing/platform'
import { sendEmail } from '@invoicing/domain'

bootstrapPlatform('api')

let to = process.env.EMAIL_SMOKE_TO?.trim()
if (!to) {
  console.error('Set EMAIL_SMOKE_TO to a recipient (use EMAIL_ALLOWLIST in staging).')
  process.exit(1)
}

let result = await sendEmail({
  to,
  subject: 'Invoicing MVP — email smoke test',
  html: '<p>Smoke test OK.</p>',
})

if (!result.ok) {
  console.error('Send failed:', result.error)
  process.exit(1)
}

console.log('email:smoke PASS', result.providerId ?? '')
