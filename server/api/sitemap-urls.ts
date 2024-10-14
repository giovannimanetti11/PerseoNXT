import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const fetchData = async (query) => {
    const data = await $fetch(config.public.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.appPassword}`).toString('base64')}`
      },
      body: JSON.stringify({ query })
    })
    return data
  }

  const postsQuery = `
    query GetAllPosts {
      posts(first: 1000) {
        nodes {
          uri
          modified
        }
      }
    }
  `

  const termsQuery = `
    query GetAllGlossaryTerms {
      glossaryTerms(first: 1000) {
        nodes {
          uri
          modified
        }
      }
    }
  `

  const blogPostsQuery = `
    query GetAllBlogPosts {
      blogPosts(first: 1000) {
        nodes {
          uri
          modified
        }
      }
    }
  `

  const [postsData, termsData, blogPostsData] = await Promise.all([
    fetchData(postsQuery),
    fetchData(termsQuery),
    fetchData(blogPostsQuery)
  ])

  const urls = [
    { url: '/', lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1 },
    { url: '/disclaimer', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
    { url: '/cookie-policy', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
    { url: '/privacy-policy', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
    { url: '/about', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
    ...postsData.posts.nodes.map(node => ({
      url: node.uri,
      lastmod: node.modified,
      changefreq: 'weekly',
      priority: 0.7,
    })),
    ...termsData.glossaryTerms.nodes.map(node => ({
      url: node.uri,
      lastmod: node.modified,
      changefreq: 'weekly',
      priority: 0.7,
    })),
    ...blogPostsData.blogPosts.nodes.map(node => ({
      url: node.uri,
      lastmod: node.modified,
      changefreq: 'weekly',
      priority: 0.7,
    }))
  ]

  return urls
})