import { apiConfig } from '../config.js';

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('fetchWP', async (endpoint) => {
    try {
      const response = await $fetch(`${apiConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiConfig.jwtToken}`
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching data from WordPress:', error);
      return null;
    }
  });
});
