/**
 * Utility to fetch all routes from WordPress for pre-rendering
 * This is used during build time to generate static pages
 */

export async function getAllRoutesForPrerender(): Promise<string[]> {
  try {
    const config = useRuntimeConfig()
    const graphqlEndpoint = config.wpBaseUrl
    const username = config.wpUsername
    const appPassword = config.wpAppPassword

    if (!graphqlEndpoint || !username || !appPassword) {
      console.warn('WordPress credentials not configured, using static routes only')
      return getStaticRoutes()
    }

    const authorization = `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`

    const fetchGraphQL = async (query: string, variables?: Record<string, any>) => {
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization
        },
        body: JSON.stringify({ query, variables })
      })

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`)
      }

      return await response.json()
    }

    const routes: string[] = [...getStaticRoutes()]

    // Fetch blog posts
    console.log('Fetching blog posts for prerender...')
    const blogQuery = `
      query FETCH_BLOG_POSTS($first: Int!, $after: String) {
        blogPosts(first: $first, after: $after) {
          nodes {
            slug
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `

    let blogHasNext = true
    let blogAfter: string | null = null
    while (blogHasNext) {
      const res = await fetchGraphQL(blogQuery, { first: 100, after: blogAfter })
      const nodes = res?.data?.blogPosts?.nodes || []
      routes.push(...nodes.map((post: any) => `/blog/${post.slug}`))
      blogHasNext = Boolean(res?.data?.blogPosts?.pageInfo?.hasNextPage)
      blogAfter = res?.data?.blogPosts?.pageInfo?.endCursor || null
    }

    // Fetch posts (monographs)
    console.log('Fetching plant monographs for prerender...')
    const postsQuery = `
      query FETCH_POSTS($first: Int!, $after: String) {
        posts(first: $first, after: $after, where: { status: PUBLISH }) {
          nodes {
            slug
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `

    let postHasNext = true
    let postAfter: string | null = null
    while (postHasNext) {
      const res = await fetchGraphQL(postsQuery, { first: 100, after: postAfter })
      const nodes = res?.data?.posts?.nodes || []
      routes.push(...nodes.map((post: any) => `/piante-medicinali/${post.slug}`))
      postHasNext = Boolean(res?.data?.posts?.pageInfo?.hasNextPage)
      postAfter = res?.data?.posts?.pageInfo?.endCursor || null
    }

    // Fetch glossary terms
    console.log('Fetching glossary terms for prerender...')
    const glossaryQuery = `
      query FETCH_GLOSSARY_TERMS($first: Int!, $after: String) {
        glossaryTerms(first: $first, after: $after) {
          nodes {
            slug
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `

    let termHasNext = true
    let termAfter: string | null = null
    while (termHasNext) {
      const res = await fetchGraphQL(glossaryQuery, { first: 100, after: termAfter })
      const nodes = res?.data?.glossaryTerms?.nodes || []
      routes.push(...nodes.map((term: any) => `/glossario/${term.slug}`))
      termHasNext = Boolean(res?.data?.glossaryTerms?.pageInfo?.hasNextPage)
      termAfter = res?.data?.glossaryTerms?.pageInfo?.endCursor || null
    }

    console.log(`✓ Total routes for prerender: ${routes.length}`)
    return routes

  } catch (error) {
    console.error('Error fetching routes for prerender:', error)
    console.log('Falling back to static routes only')
    return getStaticRoutes()
  }
}

function getStaticRoutes(): string[] {
  return [
    '/',
    '/disclaimer',
    '/privacy-policy',
    '/cookie-policy',
    '/donazioni',
    '/about',
    '/piante-medicinali',
    '/glossario',
    '/blog'
  ]
}
