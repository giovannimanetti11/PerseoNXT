import { defineEventHandler, setResponseHeaders, getRequestURL } from 'h3'
import { useApiConfig } from '../config'

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

    // Static URLs that are always included in the sitemap
    const staticUrls = [
      { url: '/', lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1 },
      { url: '/disclaimer', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
      { url: '/cookie-policy', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
      { url: '/privacy-policy', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
      { url: '/about', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
      { url: '/piante-medicinali', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
      { url: '/glossario', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
      { url: '/blog', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
      { url: '/donazioni', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
    ];

    // Fetch all URLs from GraphQL directly
    let urls = [...staticUrls];
    try {
      console.log('Loading WordPress configuration from runtimeConfig...');

      const apiConfig = useApiConfig(event);
      const graphqlEndpoint = apiConfig.baseUrl;
      const username = apiConfig.username;
      const appPassword = apiConfig.appPassword;

      if (!graphqlEndpoint || !username || !appPassword) {
        console.error('WordPress credentials missing in runtimeConfig', {
          hasEndpoint: !!graphqlEndpoint,
          hasUsername: !!username,
          hasPassword: !!appPassword
        });
        throw new Error('WordPress credentials not configured');
      }

      const authorization = `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`;

      const fetchWithRetry = async (input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number }, retries = 2): Promise<any> => {
        const { timeoutMs = 30000, ...rest } = init;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(input, { ...rest, signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (err) {
          clearTimeout(timer);
          if (retries > 0) {
            console.log(`Retrying... (${retries} attempts left)`);
            return await fetchWithRetry(input, init, retries - 1);
          }
          throw err;
        }
      };

      const fetchGraphQL = async (query: string, variables?: Record<string, any>) => {
        return await fetchWithRetry(graphqlEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authorization
          },
          body: JSON.stringify({ query, variables }),
          timeoutMs: 30000
        }, 2);
      };

      // BlogPosts: paging until all results are fetched
      const blogQuery = `
        query FETCH_BLOG_POSTS($first: Int!, $after: String) {
          blogPosts(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
            nodes {
              slug
              date
              modified
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      let blogNodes: Array<{ slug: string; date?: string; modified?: string; }> = [];
      let blogHasNext = true;
      let blogAfter: string | null = null;
      while (blogHasNext) {
        const res: any = await fetchGraphQL(blogQuery, { first: 100, after: blogAfter });
        const conn = res?.data?.blogPosts;
        const nodes = conn?.nodes || [];
        blogNodes.push(...nodes);
        blogHasNext = Boolean(conn?.pageInfo?.hasNextPage);
        blogAfter = conn?.pageInfo?.endCursor || null;
      }

      const blogUrls = blogNodes.map(post => ({
        url: `/blog/${post.slug}`,
        lastmod: post.modified || post.date || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.7
      }));

      console.log('Blog URLs generated:', blogUrls.length);

      // Posts (monographs): paging - include featuredImage for image sitemap
      const postsQuery = `
        query FETCH_POSTS($first: Int!, $after: String) {
          posts(first: $first, after: $after, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
            nodes {
              slug
              date
              modified
              title
              featuredImage {
                node {
                  sourceUrl
                  altText
                  title
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      let postNodes: Array<{ slug: string; date?: string; modified?: string; title?: string; featuredImage?: { node?: { sourceUrl?: string; altText?: string; title?: string } } }> = [];
      let postHasNext = true;
      let postAfter: string | null = null;
      while (postHasNext) {
        const res: any = await fetchGraphQL(postsQuery, { first: 100, after: postAfter });
        const conn = res?.data?.posts;
        const nodes = conn?.nodes || [];
        postNodes.push(...nodes);
        postHasNext = Boolean(conn?.pageInfo?.hasNextPage);
        postAfter = conn?.pageInfo?.endCursor || null;
      }

      const postUrls = postNodes.map(post => ({
        url: `/${post.slug}`,
        lastmod: post.modified || post.date || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
        image: post.featuredImage?.node?.sourceUrl ? {
          loc: post.featuredImage.node.sourceUrl,
          title: post.featuredImage.node.altText || post.featuredImage.node.title || post.title || '',
          caption: post.title || ''
        } : undefined
      }));

      console.log('Post URLs generated:', postUrls.length);

      // Glossary: paging (aligned with pages/glossario/index.vue -> glossaryTerms)
      const glossaryQuery = `
        query FETCH_GLOSSARY_TERMS($first: Int!, $after: String) {
          glossaryTerms(first: $first, after: $after) {
            nodes {
              slug
              date
              modified
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      let termNodes: Array<{ slug: string; date?: string; modified?: string; }> = [];
      let termHasNext = true;
      let termAfter: string | null = null;
      while (termHasNext) {
        const res: any = await fetchGraphQL(glossaryQuery, { first: 100, after: termAfter });
        if (res?.errors) {
          console.error('GraphQL errors (glossaryTerms):', JSON.stringify(res.errors));
        }
        const conn = res?.data?.glossaryTerms;
        const nodes = conn?.nodes || [];
        termNodes.push(...nodes);
        termHasNext = Boolean(conn?.pageInfo?.hasNextPage);
        termAfter = conn?.pageInfo?.endCursor || null;
      }

      const glossaryUrls = termNodes.map(term => ({
        url: `/glossario/${term.slug}`,
        lastmod: term.modified || term.date || new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.6
      }));

      console.log('Glossary URLs generated:', glossaryUrls.length);

      // Final merge + anti-Algolia filter
      urls = [...staticUrls, ...blogUrls, ...postUrls, ...glossaryUrls]
        .filter(item => !/algolia/i.test(item.url));

      console.log('Total URLs in sitemap:', urls.length);

    } catch (error) {
      console.error('Error fetching sitemap URLs from GraphQL:', error);
      console.log('Using static URLs only');
      // urls already contains staticUrls
    }
    
    // Generate the XML sitemap with image support
    const formatDate = (raw: string | undefined): string => {
      try {
        const d = new Date(raw || '');
        return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
      } catch {
        return new Date().toISOString().split('T')[0];
      }
    };

    const escapeXml = (str: string): string =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls.map((url: any) => {
    const loc = `${baseUrl}${url.url.startsWith('/') ? url.url : '/' + url.url}`;
    const imageTag = url.image?.loc ? `
    <image:image>
      <image:loc>${escapeXml(url.image.loc)}</image:loc>${url.image.title ? `
      <image:title>${escapeXml(url.image.title)}</image:title>` : ''}${url.image.caption ? `
      <image:caption>${escapeXml(url.image.caption)}</image:caption>` : ''}
    </image:image>` : '';
    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${formatDate(url.lastmod)}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || 0.5}</priority>${imageTag}
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