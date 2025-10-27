import { apiConfig } from '@config';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { defineEventHandler, readBody } from 'h3';
import type { H3Event } from 'h3';
import crypto from 'crypto';

interface RequestBody {
  email: string;
  firstName: string;
  lastName: string;
}

interface SuccessResponse {
  success: true;
  status: string;
  message: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  details: string;
}

export default defineEventHandler(async (event: H3Event): Promise<SuccessResponse | ErrorResponse> => {
  try {
    const body = await readBody<RequestBody>(event);

    if (!apiConfig.MailchimpAPIKey || !apiConfig.MailchimpServerPrefix || !apiConfig.MailchimpListID) {
      throw new Error('Configurazione Mailchimp incompleta');
    }

    mailchimp.setConfig({
      apiKey: apiConfig.MailchimpAPIKey,
      server: apiConfig.MailchimpServerPrefix
    });

    const listId = apiConfig.MailchimpListID;
    const emailLower = body.email.toLowerCase();
    const subscriberHash = crypto.createHash('md5').update(emailLower).digest('hex');

    // Utilizzo di setListMember
    await mailchimp.lists.setListMember(
      listId,
      subscriberHash,
      {
        email_address: body.email,
        status_if_new: 'subscribed',
        merge_fields: {
          FNAME: body.firstName,
          LNAME: body.lastName
        }
      }
    );

    return { success: true, status: 'subscribed_or_updated', message: 'Iscrizione completata con successo' };

  } catch (error: any) {
    console.error('Errore dettagliato:', error);

    let errorDetails = 'Nessun dettaglio disponibile';
    if (error.response) {
      try {
        errorDetails = JSON.stringify(error.response.body);
      } catch {
        errorDetails = error.response.text || error.response.statusText;
      }
    }

    return {
      success: false,
      message: `Errore durante l'operazione: ${error.message}`,
      details: errorDetails
    };
  }
});
