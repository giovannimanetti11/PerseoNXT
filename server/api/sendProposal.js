import { defineEventHandler, readBody } from 'h3';
import sgMail from '@sendgrid/mail';
import { apiConfig } from '@config';

// Set SendGrid API key
sgMail.setApiKey(apiConfig.sendGridApiKey);

export default defineEventHandler(async (event) => {
  try {
    // Read and parse the body from the request event
    const body = await readBody(event);
    const { postUrl, nome, cognome, email, titoloStudio, affiliazione, section, proposal, reason, recaptchaToken } = body;

    // Perform reCAPTCHA verification
    const recaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: apiConfig.recaptchaSecretKey,
        response: recaptchaToken
      })
    }).then(res => res.json());

    // Handle failed reCAPTCHA verification
    if (!recaptchaResponse.success) {
      throw new Error('Verifica reCAPTCHA fallita');
    }

    // Setup email message content
    const msg = {
      to: 'info@wikiherbalist.com',
      from: 'info@wikiherbalist.com',
      subject: 'Nuova proposta di modifica per Wikiherbalist',
      text: `
        Nuova proposta di modifica:
        URL del post: ${postUrl}
        Nome: ${nome}
        Cognome: ${cognome}
        Email: ${email}
        Titolo di studio: ${titoloStudio}
        Affiliazione: ${affiliazione}
        Sezione: ${section}
        Proposta: ${proposal}
        Motivazione: ${reason}
      `,
      html: `
        <h1>Nuova proposta di modifica</h1>
        <p><strong>URL del post:</strong> ${postUrl}</p>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Cognome:</strong> ${cognome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Titolo di studio:</strong> ${titoloStudio}</p>
        <p><strong>Affiliazione:</strong> ${affiliazione}</p>
        <p><strong>Sezione:</strong> ${section}</p>
        <p><strong>Proposta:</strong> ${proposal}</p>
        <p><strong>Motivazione:</strong> ${reason}</p>
      `
    };

    // Send email via SendGrid
    await sgMail.send(msg);
    return { success: true, message: 'Proposta inviata con successo' };
  } catch (error) {
    console.error('Errore nell\'invio della proposta:', error);
    return { success: false, message: 'Si è verificato un errore nell\'invio della proposta' };
  }
});