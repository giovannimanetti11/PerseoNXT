import { apiConfig } from '@config';

// Define a Nuxt plugin to handle Google reCAPTCHA loading and execution
export default defineNuxtPlugin((nuxtApp) => {
  let recaptchaScript;

  // Function to load the reCAPTCHA script only once
  const loadRecaptcha = () => {
    if (!recaptchaScript) {
      recaptchaScript = document.createElement('script');
      recaptchaScript.src = `https://www.google.com/recaptcha/api.js?render=${apiConfig.recaptchaPublicKey}`;
      recaptchaScript.async = true;
      document.head.appendChild(recaptchaScript);
    }
  };

  if (process.client) {
    nuxtApp.hook('app:mounted', () => {
      // Load reCAPTCHA on first user interaction to save resources
      window.addEventListener('mousemove', loadRecaptcha, { once: true });
      window.addEventListener('touchstart', loadRecaptcha, { once: true });
      window.addEventListener('scroll', loadRecaptcha, { once: true });
    });
  }

  // Provide the reCAPTCHA execution method to the entire app
  return {
    provide: {
      recaptcha: {
        async execute(action) {
          if (!window.grecaptcha) {
            await new Promise(resolve => {
              const checkRecaptcha = setInterval(() => {
                if (window.grecaptcha) {
                  clearInterval(checkRecaptcha);
                  resolve();
                }
              }, 100);
            });
          }
          return window.grecaptcha.execute(apiConfig.recaptchaPublicKey, { action });
        }
      }
    }
  };
});