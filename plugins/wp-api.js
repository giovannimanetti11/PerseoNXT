// Import LRU cache library and API configuration
import LRU from 'lru-cache';
import { apiConfig } from '../config.js';

// Create a new cache object with a specified size and expiration time
const apiCache = new LRU({
  max: 100,                 // Cache up to 100 items
  maxAge: 1000 * 60 * 15    // Items expire after 15 minutes
});

// Export the fetchWP function to be used across the application
export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('fetchWP', async (endpoint) => {
    const cacheKey = endpoint;
    // Check the cache first
    if (apiCache.has(cacheKey)) {
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

      // Cache the fetched response
      apiCache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error fetching data from WordPress:', error);
      return null;
    }
  });
});
