import { defineEventHandler } from 'h3'
import { apiConfig } from '@config'

export default defineEventHandler(async (event) => {
  console.log('=== SITEMAP ENDPOINT CALLED ===');
  
  // const config = useRuntimeConfig()

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

  console.log('Static URLs created, attempting GraphQL queries...');
  
  try {
    console.log('Carico configurazione WordPress da @config (static import)');

    const graphqlEndpoint = apiConfig.baseUrl;
    const username = apiConfig.username;
    const appPassword = apiConfig.appPassword;

    if (!graphqlEndpoint || !username || !appPassword) {
      console.error('Credenziali WordPress mancanti in @config');
      return staticUrls;
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

    // BlogPosts: paging fino a completare tutti i risultati
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

    console.log('Blog URLs generati:', blogUrls.length);

    // Posts (monografie): paging
    const postsQuery = `
      query FETCH_POSTS($first: Int!, $after: String) {
        posts(first: $first, after: $after, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
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

    let postNodes: Array<{ slug: string; date?: string; modified?: string; }> = [];
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
      url: `/piante-medicinali/${post.slug}`,
      lastmod: post.modified || post.date || new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.7
    }));

    console.log('Post URLs generati:', postUrls.length);

    // Glossario: paging (allineato a pages/glossario/index.vue -> glossaryTerms)
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

    const glossaryUrls = termNodes
      .map(term => ({
        url: `/glossario/${term.slug}`,
        lastmod: term.modified || term.date || new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.6
      }));

    console.log('Glossario URLs generati:', glossaryUrls.length);

    // Unione finale + filtro anti-Algolia
    const allUrls = [...staticUrls, ...blogUrls, ...postUrls, ...glossaryUrls]
      .filter(item => !/algolia/i.test(item.url));

    console.log('Totale URL in sitemap:', allUrls.length);

    return allUrls;

  } catch (error) {
    console.error('Errore in generazione sitemap:', error);
    return staticUrls;
  }
})