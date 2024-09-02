import { apiConfig } from '@config';
import mailchimp from '@mailchimp/mailchimp_marketing';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);


    if (!apiConfig.MailchimpAPIKey || !apiConfig.MailchimpServerPrefix || !apiConfig.MailchimpListID) {
      throw new Error('Configurazione Mailchimp incompleta');
    }

    mailchimp.setConfig({
      apiKey: apiConfig.MailchimpAPIKey,
      server: apiConfig.MailchimpServerPrefix
    });

    const listId = apiConfig.MailchimpListID;

    const searchResponse = await mailchimp.searchMembers.search(body.email);

    if (searchResponse.exact_matches.total_items > 0) {
      const updateResponse = await mailchimp.lists.updateListMember(
        listId,
        body.email,
        {
          merge_fields: {
            FNAME: body.firstName,
            LNAME: body.lastName
          }
        }
      );
      return { success: true, status: 'updated', message: 'Profilo aggiornato con successo' };
    } else {
      const addResponse = await mailchimp.lists.addListMember(listId, {
        email_address: body.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: body.firstName,
          LNAME: body.lastName
        }
      });
      return { success: true, status: 'subscribed', message: 'Iscrizione completata con successo' };
    }
  } catch (error) {
    console.error('Errore dettagliato:', error);
    console.error('Stack trace:', error.stack);
    
    let errorDetails = 'Nessun dettaglio disponibile';
    if (error.response) {
      try {
        errorDetails = JSON.stringify(error.response.data);
      } catch (e) {
        errorDetails = error.response.text || error.response.statusText;
      }
    }
    
    // Return the error
    return { 
      success: false, 
      message: `Errore durante l'operazione: ${error.message}`,
      details: errorDetails
    };
  }
});