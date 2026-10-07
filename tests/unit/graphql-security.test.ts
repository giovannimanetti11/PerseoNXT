import { describe, expect, it } from 'vitest'
import {
  GraphqlSecurityError,
  validateGraphqlReadOnly
} from '../../server/utils/graphqlSecurity'

function expectSecurityError(fn: () => unknown, status: number) {
  try {
    fn()
    throw new Error('expected security error')
  } catch (error) {
    expect(error).toBeInstanceOf(GraphqlSecurityError)
    expect((error as GraphqlSecurityError).statusCode).toBe(status)
  }
}

describe('GraphQL read-only validation', () => {
  it('accepts normal queries and variables', () => {
    const result = validateGraphqlReadOnly(
      'query Post($slug: String!) { postBy(slug: $slug) { title content } }',
      { slug: 'test' }
    )
    expect(result.variables).toEqual({ slug: 'test' })
  })

  it('rejects mutations and subscriptions', () => {
    expectSecurityError(
      () => validateGraphqlReadOnly('mutation X { updatePost(input: {}) { id } }', {}),
      403
    )
    expectSecurityError(
      () => validateGraphqlReadOnly('subscription X { postChanged { id } }', {}),
      403
    )
  })

  it('rejects privileged introspection', () => {
    expectSecurityError(
      () => validateGraphqlReadOnly('{ __schema { types { name } } }', {}),
      403
    )
  })

  it('does not treat keywords inside strings or comments as operations', () => {
    expect(() => validateGraphqlReadOnly(
      'query X { search(term: "mutation subscription") { title } } # mutation ignored',
      {}
    )).not.toThrow()
  })

  it('rejects malformed and excessively deep selection sets', () => {
    expectSecurityError(() => validateGraphqlReadOnly('{ a { b }', {}), 400)
    const deep = '{' + ' a {'.repeat(17) + ' id ' + '}'.repeat(18)
    expectSecurityError(() => validateGraphqlReadOnly(deep, {}), 413)
  })

  it('requires variables to be an object', () => {
    expectSecurityError(() => validateGraphqlReadOnly('{ posts { id } }', ['x']), 400)
  })
})
