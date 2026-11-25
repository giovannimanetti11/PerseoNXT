import { describe, expect, it } from 'vitest'
import { structureContent } from '../../server/utils/contentStructure'

describe('structureContent', () => {
  it('keeps the text that precedes the first heading as intro', () => {
    const result = structureContent('<p>Introduzione.</p><h3>Botanica</h3><p>Testo.</p>')
    expect(result.intro).toBe('<p>Introduzione.</p>')
    expect(result.sections).toHaveLength(1)
    expect(result.sections[0]).toMatchObject({ heading: 'Botanica', className: 'post-section-botanica', html: '<p>Testo.</p>' })
  })

  it('splits h4 subsections and keeps text before them in the section body', () => {
    const result = structureContent('<h3>Ricerca scientifica</h3><p>Premessa.</p><h4>Studi clinici</h4><p>A.</p><h4>In vitro</h4><p>B.</p>')
    const [section] = result.sections
    expect(section?.html).toBe('<p>Premessa.</p>')
    expect(section?.subsections).toEqual([
      { heading: 'Studi clinici', html: '<p>A.</p>' },
      { heading: 'In vitro', html: '<p>B.</p>' },
    ])
  })

  it('collects everything after the "Riferimenti" paragraph as bibliography', () => {
    const result = structureContent('<h3>Usi</h3><p>Testo.</p><p>Riferimenti</p><ol><li>Fonte 1</li></ol><h3>Ignorato</h3>')
    expect(result.sections.map((section) => section.heading)).toEqual(['Usi', 'Riferimenti'])
    expect(result.sections[1]?.html).toBe('<ol><li>Fonte 1</li></ol><h3>Ignorato</h3>')
  })

  it('builds ASCII class names from accented headings', () => {
    const [section] = structureContent('<h3>Modalità d’uso</h3>').sections
    expect(section?.className).toBe('post-section-modalita-d-uso')
  })

  it('returns an empty structure for empty content', () => {
    expect(structureContent('')).toEqual({ intro: '', sections: [] })
    expect(structureContent(null)).toEqual({ intro: '', sections: [] })
  })
})
