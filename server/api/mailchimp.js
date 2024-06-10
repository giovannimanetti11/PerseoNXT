import { apiConfig } from '@config';
import { readBody, eventHandler } from 'h3';

export default eventHandler(async (event) => {
  if (event.req.method === 'POST') {
    try {
      const body = await readBody(event);
      const { email } = body;
      console.log('Email ricevuta per l\'iscrizione:', email);

      if (!apiConfig.MailchimpAPIKey || !apiConfig.MailchimpListID) {
        console.error('Le chiavi di configurazione Mailchimp non sono presenti.');
        throw new Error('Le chiavi di configurazione Mailchimp non sono presenti.');
      }

      console.log('Chiavi di configurazione Mailchimp:', {
        apiKey: apiConfig.MailchimpAPIKey,
        listID: apiConfig.MailchimpListID
      });

      const url = `https://us17.api.mailchimp.com/3.0/lists/${apiConfig.MailchimpListID}/members`;
      const apiKey = apiConfig.MailchimpAPIKey;
      const data = {
        email_address: email,
        status: 'subscribed'
      };

      console.log('Dati da inviare a MailChimp:', JSON.stringify(data));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `apikey ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('Stato della risposta:', response.status);
      const result = await response.json();
      console.log('Risposta da MailChimp:', result);

      if (!response.ok) {
        console.error('Errore nella risposta da MailChimp:', result);
        throw new Error(result.detail || 'Errore durante l\'iscrizione a MailChimp');
      }

      return { statusCode: 200, body: result };
    } catch (error) {
      console.error('Errore durante la chiamata a MailChimp API:', error.message);
      return {
        statusCode: 500,
        body: {
          error: 'Errore durante la chiamata a MailChimp API',
          message: error.message
        }
      };
    }
  } else {
    event.res.setHeader('Allow', ['POST']);
    return {
      statusCode: 405,
      body: { error: 'Metodo non consentito' }
    };
  }
});
