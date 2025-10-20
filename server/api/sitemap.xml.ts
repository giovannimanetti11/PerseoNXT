import { defineEventHandler, setResponseHeaders, getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  console.log('=== SITEMAP.XML ENDPOINT CALLED ===');
  
  try {
    // Set the response headers for XML content with proper caching
    const isDev = process.env.NODE_ENV !== 'production'
    const cacheControl = isDev
      ? 'no-store'
      : 'public, max-age=3600, s-maxage=86400'
    setResponseHeaders(event, {
      'content-type': 'application/xml',
      'cache-control': cacheControl,
      'x-content-type-options': 'nosniff'
    })
    
    // Compute base URL from current request
    const { origin } = getRequestURL(event)
    const baseUrl = origin || 'https://wikiherbalist.com'
    
    // Fetch all URLs from the sitemap-urls endpoint with a timeout
    let urls;
    try {
      console.log('Attempting to fetch from /api/sitemap-urls...');

      // Set a timeout for the fetch operation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const { origin } = getRequestURL(event);
      const res = await fetch(`${origin}/api/sitemap-urls`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const response = await res.json();
      console.log('Response from sitemap-urls count:', Array.isArray(response) ? response.length : 'invalid');

      if (Array.isArray(response) && response.length > 0) {
        urls = response;
        console.log('Using URLs from sitemap-urls endpoint, count:', urls.length);
      } else {
        throw new Error('Invalid response format from sitemap-urls');
      }
    } catch (error) {
      console.error('Error fetching sitemap URLs:', error);
      console.log('Using fallback URLs');
      
      // Provide fallback URLs for critical pages
      urls = [
        { url: '/', lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1 },
        { url: '/about', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
        { url: '/blog', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
        { url: '/glossario', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
        { url: '/piante-medicinali', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
        { url: '/disclaimer', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
        { url: '/cookie-policy', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
        { url: '/privacy-policy', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
        { url: '/donazioni', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 }
      ];
    }
    
    // Generate the XML sitemap with proper formatting for lastmod dates
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls.map(url => {
    // Ensure lastmod is properly formatted
    let lastmod = url.lastmod || new Date().toISOString();
    // Make sure lastmod is a valid ISO date string
    if (typeof lastmod === 'string' && lastmod.trim() !== '') {
      try {
        // Try to format as YYYY-MM-DD
        const date = new Date(lastmod);
        if (!isNaN(date.getTime())) {
          lastmod = date.toISOString().split('T')[0];
        }
      } catch (e) {
        // If there's an error, use current date
        lastmod = new Date().toISOString().split('T')[0];
      }
    } else {
      lastmod = new Date().toISOString().split('T')[0];
    }
    
    return `
  <url>
    <loc>${baseUrl}${url.url.startsWith('/') ? url.url : '/' + url.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || 0.5}</priority>
  </url>`;
  }).join('')}
</urlset>`
    
    // Return the XML content
    return xml;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Set error response headers
    setResponseHeaders(event, {
      'content-type': 'application/xml',
      'cache-control': 'no-cache'
    });
    
    // Return a minimal sitemap with just the homepage in case of error
    const { origin } = getRequestURL(event);
    const baseUrl = origin || 'https://wikiherbalist.com';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  }
})