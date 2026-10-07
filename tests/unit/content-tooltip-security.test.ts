import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'components/contentTooltip.vue'), 'utf8')

describe('content tooltip XSS regression', () => {
  it('never renders the raw GraphQL excerpt with v-html', () => {
    expect(source).not.toContain('v-html="activeTooltip.excerpt"')
    expect(source.match(/v-html="sanitizedTooltipExcerpt"/g)?.length).toBe(2)
  })

  it('sanitizes tooltip excerpts with DOMPurify and an explicit allowlist', () => {
    expect(source).toContain('const sanitizedTooltipExcerpt = computed')
    expect(source).toContain('DOMPurify.sanitize(excerpt')
    expect(source).toContain('ALLOWED_TAGS:')
    expect(source).toContain('ALLOWED_ATTR:')
  })
})
