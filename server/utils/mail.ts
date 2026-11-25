import type { H3Event } from 'h3'
import sgMail from '@sendgrid/mail'

const SITE_MAILBOX = 'info@wikiherbalist.com'

/** Single line, no control characters, capped length. Blocks header injection. */
export function cleanField(value: unknown, maxLength = 500): string {
  return String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLength)
}

/** Multi-line free text: keeps newlines, drops other control characters. */
export function cleanText(value: unknown, maxLength = 5000): string {
  return String(value ?? '').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim().slice(0, maxLength)
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isValidEmail(value: string): boolean {
  return value.length > 3 && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Sends a "label: value" summary to the site mailbox, as text and HTML. */
export async function sendSiteMail(
  event: H3Event,
  subject: string,
  fields: [label: string, value: string][],
  replyTo?: string,
): Promise<void> {
  const apiKey = useRuntimeConfig(event).sendgridApiKey
  if (!apiKey) throw new Error('SENDGRID_API_KEY is not configured')
  sgMail.setApiKey(apiKey)

  await sgMail.send({
    to: SITE_MAILBOX,
    from: SITE_MAILBOX,
    replyTo,
    subject,
    text: fields.map(([label, value]) => `${label}: ${value}`).join('\n'),
    html: fields
      .map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong>: ${escapeHtml(value).replace(/\n/g, '<br>')}</p>`)
      .join('\n'),
  })
}
