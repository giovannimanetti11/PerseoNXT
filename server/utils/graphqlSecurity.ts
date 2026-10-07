export class GraphqlSecurityError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export const GRAPHQL_MAX_QUERY_BYTES = 24 * 1024
export const GRAPHQL_MAX_VARIABLES_BYTES = 32 * 1024
export const GRAPHQL_MAX_DEPTH = 16
export const GRAPHQL_MAX_SELECTION_SETS = 200

function stripStringsAndComments(source: string): string {
  let out = ''
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (ch === '#') {
      while (i < source.length && source[i] !== '\n') {
        out += ' '
        i += 1
      }
      continue
    }
    if (source.startsWith('"""', i)) {
      out += '   '
      i += 3
      while (i < source.length && !source.startsWith('"""', i)) {
        out += source[i] === '\n' ? '\n' : ' '
        i += 1
      }
      if (i < source.length) {
        out += '   '
        i += 3
      }
      continue
    }
    if (ch === '"') {
      out += ' '
      i += 1
      while (i < source.length) {
        if (source[i] === '\\') {
          out += ' '
          i += 1
          if (i < source.length) {
            out += ' '
            i += 1
          }
          continue
        }
        const current = source[i]
        out += current === '\n' ? '\n' : ' '
        i += 1
        if (current === '"') break
      }
      continue
    }
    out += ch
    i += 1
  }
  return out
}

export function validateGraphqlReadOnly(query: unknown, variables: unknown) {
  if (typeof query !== 'string') {
    throw new GraphqlSecurityError(400, 'Query is required')
  }
  const normalized = query.trim()
  if (!normalized || Buffer.byteLength(normalized, 'utf8') > GRAPHQL_MAX_QUERY_BYTES) {
    throw new GraphqlSecurityError(413, 'GraphQL query too large')
  }

  if (variables !== undefined && (variables === null || Array.isArray(variables) || typeof variables !== 'object')) {
    throw new GraphqlSecurityError(400, 'GraphQL variables must be an object')
  }
  if (variables !== undefined && Buffer.byteLength(JSON.stringify(variables), 'utf8') > GRAPHQL_MAX_VARIABLES_BYTES) {
    throw new GraphqlSecurityError(413, 'GraphQL variables too large')
  }

  const structural = stripStringsAndComments(normalized)
  if (/\b(?:mutation|subscription)\b/i.test(structural)) {
    throw new GraphqlSecurityError(403, 'Only read-only GraphQL queries are allowed')
  }
  if (/\b__(?:schema|type)\b/.test(structural)) {
    throw new GraphqlSecurityError(403, 'GraphQL introspection is not allowed')
  }

  let depth = 0
  let maxDepth = 0
  let selectionSets = 0
  for (const ch of structural) {
    if (ch === '{') {
      depth += 1
      selectionSets += 1
      maxDepth = Math.max(maxDepth, depth)
      if (maxDepth > GRAPHQL_MAX_DEPTH || selectionSets > GRAPHQL_MAX_SELECTION_SETS) {
        throw new GraphqlSecurityError(413, 'GraphQL query is too complex')
      }
    } else if (ch === '}') {
      depth -= 1
      if (depth < 0) throw new GraphqlSecurityError(400, 'Malformed GraphQL query')
    }
  }
  if (depth !== 0 || selectionSets === 0) {
    throw new GraphqlSecurityError(400, 'Malformed GraphQL query')
  }

  return {
    query: normalized,
    variables: (variables || {}) as Record<string, unknown>
  }
}
