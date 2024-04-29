import LRU from 'lru-cache';
import { apiConfig } from '../config.js'; 

// Create a new cache object
const apiCache = new LRU({
  max: 100, 
  maxAge: 1000 * 60 * 15 // Cache for 15 minutes
});

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('fetchWP', async (endpoint) => {
    const cacheKey = endpoint;

    // Check if the data is in cache
    if (apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    try {
      const response = await $fetch(`${apiConfig.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiConfig.jwtToken}` 
        }
      });

      // Store the response in cache
      apiCache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error fetching data from WordPress:', error);
      return null;
    }
  });
});
