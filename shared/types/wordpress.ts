// Shapes returned by the WPGraphQL schema of admin.wikiherbalist.com.
// Only the fields the frontend requests are declared.

export interface WpImage {
  sourceUrl: string
  altText?: string | null
  caption?: string | null
  title?: string | null
}

export interface WpImageEdge {
  node: WpImage | null
}

export interface WpSeo {
  title?: string | null
  metaDesc?: string | null
  opengraphTitle?: string | null
  opengraphDescription?: string | null
  opengraphImage?: { sourceUrl: string | null } | null
}

export interface WpTag {
  id: string
  name: string
  description?: string | null
}

export interface WpPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

export interface WpConnection<T> {
  nodes: T[]
  pageInfo?: WpPageInfo
}

export interface GraphqlResponse<T> {
  data?: T | null
  errors?: { message: string }[]
}
