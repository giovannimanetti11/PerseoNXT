import { defineEventHandler, readBody } from 'h3';
import type { H3Event } from 'h3';
import sgMail from '@sendgrid/mail';
import { apiConfig } from '@config';

sgMail.setApiKey(apiConfig.sendGridApiKey);

// Interface for the expected request body
interface ProposalBody {
  postUrl: string;
  nome: string;
  cognome: string;
  email: string;
  titoloStudio: string;
  affiliazione: string;
  section: string;
  proposal: string;
  reason: string;
  recaptchaToken: string;
}

// Interface for the reCAPTCHA response
interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Read and parse the request body
    const body = await readBody<ProposalBody>(event);
    const {
      postUrl,
      nome,
      cognome,
      email,
      titoloStudio,
      affiliazione,
      section,
      proposal,
      reason,
      recaptchaToken,
    } = body;

    // Validate required fields
    if (
      !postUrl ||
      !nome ||
      !cognome ||
      !email ||
      !titoloStudio ||
      !affiliazione ||
      !section ||
      !proposal ||
      !reason ||
      !recaptchaToken
    ) {
      throw new Error('Incomplete form data');
    }

    // Perform reCAPTCHA verification
    const recaptchaResponse = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: apiConfig.recaptchaSecretKey,
          response: recaptchaToken,
        }),
      }
    );

    const recaptchaResult: RecaptchaResponse = await recaptchaResponse.json();

    // Handle failed reCAPTCHA verification
    if (!recaptchaResult.success) {
      throw new Error('reCAPTCHA verification failed');
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
      `,
    };

    // Send email via SendGrid
    await sgMail.send(msg);
    return { success: true, message: 'Proposta inviata con successo' };
  } catch {
    // Handle errors gracefully
    return {
      success: false,
      message: 'Si è verificato un errore nell\'invio della proposta',
    };
  }
});
