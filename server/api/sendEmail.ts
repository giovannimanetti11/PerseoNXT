import { readBody, defineEventHandler } from 'h3';
import type { H3Event } from 'h3';
import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { apiConfig } from '@config';

sgMail.setApiKey(apiConfig.sendGridApiKey);

interface ContactForm {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  richiesta: string;
  recaptchaToken: string;
}

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

// Strip CRLF characters to prevent header injection
function sanitizeField(value: string): string {
  return String(value).replace(/[\r\n\t]/g, ' ').trim();
}

// Escape HTML entities for safe inclusion in HTML email body
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const form = await readBody<ContactForm>(event);

    // Validate form data
    if (
      !form.nome ||
      !form.cognome ||
      !form.email ||
      !form.telefono ||
      !form.richiesta ||
      !form.recaptchaToken
    ) {
      throw new Error('Dati del modulo non completi');
    }

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: apiConfig.recaptchaSecretKey,
        response: form.recaptchaToken,
      }),
    });

    const recaptchaResult: RecaptchaResponse = await recaptchaResponse.json();

    const recaptchaValid = recaptchaResult.success
      && (!recaptchaResult.action || recaptchaResult.action === 'submit')
      && (typeof recaptchaResult.score !== 'number' || recaptchaResult.score >= 0.5)
      && (!recaptchaResult.hostname || ['wikiherbalist.com', 'www.wikiherbalist.com'].includes(recaptchaResult.hostname));

    if (!recaptchaValid) {
      console.error('Recaptcha verification failed');
      throw new Error('Recaptcha verification failed');
    }

    const nome = sanitizeField(form.nome);
    const cognome = sanitizeField(form.cognome);
    const email = sanitizeField(form.email);
    const telefono = sanitizeField(form.telefono);
    const richiesta = sanitizeField(form.richiesta);

    const msg: MailDataRequired = {
      to: 'info@wikiherbalist.com',
      from: 'info@wikiherbalist.com',
      subject: 'Nuova richiesta dal Form contatti di Wikiherbalist.com',
      text: `Nome: ${nome}, Cognome: ${cognome}, Email: ${email}, Telefono: ${telefono}, Richiesta: ${richiesta}`,
      html: `
        <p><strong>Nome</strong>: ${escapeHtml(nome)}</p>
        <p><strong>Cognome</strong>: ${escapeHtml(cognome)}</p>
        <p><strong>Email</strong>: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p><strong>Telefono</strong>: ${escapeHtml(telefono)}</p>
        <p><strong>Richiesta</strong>: ${escapeHtml(richiesta)}</p>
      `,
    };

    await sgMail.send(msg);
    return { success: true, message: 'La tua richiesta è stata inviata con successo.' };
  } catch (error: any) {
    console.error('Error in sendEmail handler:', error);
    return { success: false, message: "Si è verificato un errore nell'invio della richiesta." };
  }
});
