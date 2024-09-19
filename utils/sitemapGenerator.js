import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core/index.js';
import fetch from 'node-fetch';
import gql from 'graphql-tag';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiConfig } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Apollo Client instance
const client = new ApolloClient({
  link: new HttpLink({
    uri: apiConfig.baseUrl,
    fetch,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiConfig.username}:${apiConfig.appPassword}`).toString('base64')}`
    }
  }),
  cache: new InMemoryCache()
});

// GraphQL query to fetch all slugs
const GET_ALL_SLUGS = gql`
  query GetAllSlugs {
    posts(first: 1000) {
      nodes {
        slug
      }
    }
    blogPosts(first: 1000) {
      nodes {
        slug
      }
    }
    glossaryTerms(first: 1000) {
      nodes {
        slug
      }
    }
  }
`;

async function generateSitemap() {
  try {
    const { data } = await client.query({ query: GET_ALL_SLUGS });

    const postUrls = data.posts.nodes.map(post => `https://wikiherbalist.com/${post.slug}`);
    const blogUrls = data.blogPosts.nodes.map(post => `https://wikiherbalist.com/blog/${post.slug}`);
    const glossaryUrls = data.glossaryTerms.nodes.map(term => `https://wikiherbalist.com/glossario/${term.slug}`);

    const staticUrls = [
      'https://wikiherbalist.com',
      'https://wikiherbalist.com/about',
      'https://wikiherbalist.com/piante-medicinali',
      'https://wikiherbalist.com/glossario',
      'https://wikiherbalist.com/blog',
      'https://wikiherbalist.com/disclaimer',
      'https://wikiherbalist.com/cookie-policy',
      'https://wikiherbalist.com/privacy-policy'
    ];

    const allUrls = [...staticUrls, ...postUrls, ...blogUrls, ...glossaryUrls];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${allUrls.map(url => `
      <url>
        <loc>${url}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.5</priority>
      </url>`).join('')}
    </urlset>`;

    const publicDir = path.join(__dirname, '..', 'public');
    
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)){
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save sitemap.xml in the public folder
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully');

    // Create or update robots.txt
    const robotsTxtPath = path.join(publicDir, 'robots.txt');
    let robotsTxtContent = 'User-agent: *\nAllow: /\n\n';
    
    if (fs.existsSync(robotsTxtPath)) {
      robotsTxtContent = fs.readFileSync(robotsTxtPath, 'utf-8');
    }
    
    if (!robotsTxtContent.includes('Sitemap: https://wikiherbalist.com/sitemap.xml')) {
      robotsTxtContent += 'Sitemap: https://wikiherbalist.com/sitemap.xml\n';
    }
    
    fs.writeFileSync(robotsTxtPath, robotsTxtContent);
    console.log('robots.txt created or updated with sitemap URL');

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

generateSitemap();