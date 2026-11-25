import { load } from 'cheerio'
import type { ContentSection, StructuredContent } from '#shared/types/content'
import { slugify } from '#shared/utils/text'

const REFERENCES_HEADING = 'Riferimenti'

function sectionFor(heading: string): ContentSection {
  return { heading, className: `post-section-${slugify(heading)}`, html: '', subsections: [] }
}

/**
 * Splits a WordPress body into sections: every <h3> opens a section, every
 * <h4> a subsection, and a paragraph that only says "Riferimenti" starts the
 * bibliography. Whatever precedes the first <h3> is returned as `intro`.
 */
export function structureContent(html: string | null | undefined): StructuredContent {
  const result: StructuredContent = { intro: '', sections: [] }
  if (!html?.trim()) return result

  const $ = load(html, null, false)
  let section: ContentSection | null = null

  const elements = $.root().children().toArray()
  for (const [index, element] of elements.entries()) {
    const $element = $(element)
    const tag = element.type === 'tag' ? element.tagName.toLowerCase() : ''
    const text = $element.text().trim()

    if (tag === 'h3') {
      section = sectionFor(text)
      result.sections.push(section)
      continue
    }

    if (tag === 'p' && text === REFERENCES_HEADING) {
      const references = elements.slice(index + 1).map((el) => $.html(el)).join('').trim()
      if (references) result.sections.push({ ...sectionFor(REFERENCES_HEADING), html: references })
      return result
    }

    const fragment = $.html(element)
    if (!section) {
      result.intro += fragment
    } else if (tag === 'h4') {
      section.subsections.push({ heading: text, html: '' })
    } else {
      const subsection = section.subsections.at(-1)
      if (subsection) subsection.html += fragment
      else section.html += fragment
    }
  }

  result.intro = result.intro.trim()
  return result
}
