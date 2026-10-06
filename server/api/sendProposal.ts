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
    // Read and parse the request body
    const body = await readBody<ProposalBody>(event);
    const {
      postUrl: rawPostUrl,
      nome: rawNome,
      cognome: rawCognome,
      email: rawEmail,
      titoloStudio: rawTitoloStudio,
      affiliazione: rawAffiliazione,
      section: rawSection,
      proposal: rawProposal,
      reason: rawReason,
      recaptchaToken,
    } = body;

    const postUrl = sanitizeField(rawPostUrl);
    const nome = sanitizeField(rawNome);
    const cognome = sanitizeField(rawCognome);
    const email = sanitizeField(rawEmail);
    const titoloStudio = sanitizeField(rawTitoloStudio);
    const affiliazione = sanitizeField(rawAffiliazione);
    const section = sanitizeField(rawSection);
    const proposal = sanitizeField(rawProposal);
    const reason = sanitizeField(rawReason);

    // Validate required fields
    if (
      !postUrl || !nome || !cognome || !email ||
      !titoloStudio || !affiliazione || !section ||
      !proposal || !reason || !recaptchaToken
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

    // Handle failed/low-confidence reCAPTCHA verification
    const recaptchaValid = recaptchaResult.success
      && (!recaptchaResult.action || recaptchaResult.action === 'submit')
      && (typeof recaptchaResult.score !== 'number' || recaptchaResult.score >= 0.5)
      && (!recaptchaResult.hostname || ['wikiherbalist.com', 'www.wikiherbalist.com'].includes(recaptchaResult.hostname));
    if (!recaptchaValid) {
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
        <p><strong>URL del post:</strong> ${escapeHtml(postUrl)}</p>
        <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
        <p><strong>Cognome:</strong> ${escapeHtml(cognome)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Titolo di studio:</strong> ${escapeHtml(titoloStudio)}</p>
        <p><strong>Affiliazione:</strong> ${escapeHtml(affiliazione)}</p>
        <p><strong>Sezione:</strong> ${escapeHtml(section)}</p>
        <p><strong>Proposta:</strong> ${escapeHtml(proposal)}</p>
        <p><strong>Motivazione:</strong> ${escapeHtml(reason)}</p>
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
