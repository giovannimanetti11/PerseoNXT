// Import LRU cache library and API configuration
import LRU from 'lru-cache';
import { apiConfig } from '../config.js';

const apiCache = new LRU({
  max: 500,                 // Cache up to 100 items
  maxAge: 1000 * 60 * 60    // Items expire after 60 minutes
});

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('fetchWP', async (endpoint, { useCache = true } = {}) => {
    const cacheKey = endpoint;
    if (useCache && apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    try {
      const response = await $fetch(`${apiConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiConfig.jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (useCache) {
        apiCache.set(cacheKey, response);
      }
      return response;
    } catch (error) {
      console.error('Error fetching data from WordPress:', error);
      return null;
    }
  });
});
