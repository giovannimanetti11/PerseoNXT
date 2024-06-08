import { readBody } from 'h3';
import sgMail from '@sendgrid/mail';
import { apiConfig } from '@config';

sgMail.setApiKey(apiConfig.sendGridApiKey);

export default defineEventHandler(async (event) => {
  try {
    const form = await readBody(event);

    // Verifica reCAPTCHA
    const recaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: apiConfig.recaptchaSecretKey,
        response: form.recaptchaToken
      })
    }).then(res => res.json());

    if (!recaptchaResponse.success) {
      console.error('Recaptcha verification failed:', recaptchaResponse);
      throw new Error('Recaptcha verification failed');
    }

    const msg = {
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
      `
    };

    await sgMail.send(msg);
    return { success: true, message: 'La tua richiesta è stata inviata con successo.' };
  } catch (error) {
    console.error('Error in sendEmail handler:', error);
    return { success: false, message: 'Si è verificato un errore nell\'invio della richiesta.' };
  }
});
