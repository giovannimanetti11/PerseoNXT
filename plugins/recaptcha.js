import { apiConfig } from '@config';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:mounted', () => {
      if (process.client) {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${apiConfig.recaptchaPublicKey}`;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  
    return {
      provide: {
        recaptcha: {
          async execute(action) {
            await new Promise(resolve => {
              const checkScript = () => {
                if (typeof grecaptcha !== 'undefined') {
                  resolve();
                } else {
                  setTimeout(checkScript, 100);
                }
              };
              checkScript();
            });
            return grecaptcha.execute(apiConfig.recaptchaPublicKey, { action });
          }
        }
      }
    };
  });