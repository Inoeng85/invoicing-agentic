export interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export interface EmailSendResult {
  ok: boolean
  providerId?: string
  error?: string
}

export type EmailSender = (input: SendEmailInput) => Promise<EmailSendResult>

let emailSender: EmailSender = async (input) => {
  console.info('[email:log]', { to: input.to, subject: input.subject })
  return { ok: true, providerId: 'log' }
}

export function setEmailSender(sender: EmailSender) {
  emailSender = sender
}

export async function sendEmail(input: SendEmailInput): Promise<EmailSendResult> {
  return emailSender(input)
}
