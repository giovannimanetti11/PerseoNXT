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
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
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

    if (!recaptchaResult.success) {
      console.error('Recaptcha verification failed:', recaptchaResult);
      throw new Error('Recaptcha verification failed');
    }

    const msg: MailDataRequired = {
      to: 'info@wikiherbalist.com',
      from: 'info@wikiherbalist.com',
      subject: 'Nuova richiesta dal Form contatti di Wikiherbalist.com',
      text: `Nome: ${form.nome}, Cognome: ${form.cognome}, Email: ${form.email}, Telefono: ${form.telefono}, Richiesta: ${form.richiesta}`,
      html: `
        <p><strong>Nome</strong>: ${form.nome}</p>
        <p><strong>Cognome</strong>: ${form.cognome}</p>
        <p><strong>Email</strong>: <a href="mailto:${form.email}">${form.email}</a></p>
        <p><strong>Telefono</strong>: ${form.telefono}</p>
        <p><strong>Richiesta</strong>: ${form.richiesta}</p>
      `,
    };

    await sgMail.send(msg);
    return { success: true, message: 'La tua richiesta è stata inviata con successo.' };
  } catch (error: any) {
    console.error('Error in sendEmail handler:', error);
    return { success: false, message: "Si è verificato un errore nell'invio della richiesta." };
  }
});
