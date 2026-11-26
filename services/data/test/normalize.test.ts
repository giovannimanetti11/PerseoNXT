import { describe, expect, it } from 'vitest'
import { mergeBasionym, mergeCommonNames, mergeCompounds, mergeSynonyms } from '../src/normalize/merge.js'
import { binomial, commonNameKey, nameKey, normalizeDoi, stripHtml, withoutAuthorship } from '../src/normalize/text.js'
import type { PubchemCompound } from '../src/sources/pubchem.js'
import type { ScientificName } from '../src/types.js'

const gbif = (canonical: string, authorship = ''): ScientificName => ({ canonical, authorship, kind: 'synonym', sources: [{ source: 'gbif', url: `g/${canonical}` }] })
const col = (canonical: string, authorship = ''): ScientificName => ({ canonical, authorship, kind: 'synonym', sources: [{ source: 'col', url: `c/${canonical}` }] })

describe('text', () => {
  it('builds name keys that ignore case, accents and hybrid markers', () => {
    expect(nameKey('Mentha x piperita')).toBe(nameKey('Mentha × piperita'))
    expect(nameKey('Mentha ×piperita')).toBe('mentha × piperita')
    expect(nameKey('Althæa  Officinalis')).toBe(nameKey('althæa officinalis'))
    expect(commonNameKey('Uva-ursina')).toBe(commonNameKey('uva ursina'))
  })

  it('splits names and normalizes identifiers', () => {
    expect(withoutAuthorship('Zingiber officinale Roscoe', 'Roscoe')).toBe('Zingiber officinale')
    expect(binomial('Arctostaphylos uva-ursi (L.) Spreng.')).toBe('Arctostaphylos uva-ursi')
    expect(normalizeDoi('https://doi.org/10.1016/J.JEP.2026.1')).toBe('10.1016/j.jep.2026.1')
    expect(stripHtml('<a href="x">Jane &amp; John</a>')).toBe('Jane & John')
  })
})

describe('synonyms', () => {
  it('unions checklists, merges provenance and excludes accepted name and basionym', () => {
    const basionym: ScientificName = { canonical: 'Amomum zingiber', authorship: 'L.', kind: 'basionym', sources: [] }
    const merged = mergeSynonyms(
      [[gbif('Zingiber officinale'), gbif('Amomum zingiber', 'L.'), gbif('Zingiber blancoi')], [col('Zingiber blancoi', 'Hassk.'), col('Zingiber cholmondeleyi')]],
      'Zingiber officinale',
      basionym,
    )
    expect(merged.map((name) => name.canonical)).toEqual(['Zingiber blancoi', 'Zingiber cholmondeleyi'])
    const blancoi = merged[0]
    expect(blancoi?.authorship).toBe('Hassk.')
    expect(blancoi?.sources.map((item) => item.source)).toEqual(['gbif', 'col'])
  })

  it('merges the basionym provenance', () => {
    const merged = mergeBasionym([
      { canonical: 'Arbutus uva-ursi', authorship: '', kind: 'basionym', sources: [{ source: 'gbif', url: 'a' }] },
      null,
      { canonical: 'Arbutus uva-ursi', authorship: 'L.', kind: 'basionym', sources: [{ source: 'col', url: 'b' }] },
    ])
    expect(merged).toEqual({ canonical: 'Arbutus uva-ursi', authorship: 'L.', kind: 'basionym', sources: [{ source: 'gbif', url: 'a' }, { source: 'col', url: 'b' }] })
    expect(mergeBasionym([null])).toBeNull()
  })
})

describe('common names', () => {
  it('groups spellings, picks the most used form and lists Italian first', () => {
    const merged = mergeCommonNames([
      [
        { name: 'Ginger', lang: 'en', sources: [{ source: 'gbif', url: '1' }] },
        { name: 'ginger', lang: 'en', sources: [{ source: 'wikidata', url: '2' }] },
        { name: 'ginger', lang: 'en', sources: [{ source: 'inaturalist', url: '3' }] },
        { name: 'zenzero', lang: 'it', sources: [{ source: 'gbif', url: '1' }] },
      ],
      [{ name: 'Zingiber officinale', lang: 'it', sources: [{ source: 'inaturalist', url: '3' }] }],
    ], 'Zingiber officinale')
    expect(merged.map((name) => [name.lang, name.name])).toEqual([['it', 'zenzero'], ['en', 'ginger']])
    expect(merged[1]?.sources).toHaveLength(3)
  })
})

describe('compounds', () => {
  it('deduplicates by InChIKey, then CID, then Wikidata item', () => {
    const pubchem = new Map<number, PubchemCompound>([
      [442793, { cid: 442793, title: '(6)-Gingerol', formula: 'C17H26O4', molecularWeight: 294.4, iupacName: 'x', inchikey: 'NLDDIKRKFXEWBK-AWEZNQCLSA-N' }],
    ])
    const merged = mergeCompounds([
      { wikidataId: 'Q1', label: '(5S)-5-hydroxy-...', inchikey: 'NLDDIKRKFXEWBK-AWEZNQCLSA-N', pubchemCid: 442793, references: ['10.1/a'], referenceItems: [] },
      // Duplicate Wikidata item for the same structure, found by CID only.
      { wikidataId: 'Q2', label: 'gingerol', inchikey: null, pubchemCid: 442793, references: ['10.1/b', '10.1/a'], referenceItems: [] },
      { wikidataId: 'Q3', label: 'unknown resin', inchikey: null, pubchemCid: null, references: [], referenceItems: [] },
    ], pubchem)
    expect(merged).toHaveLength(2)
    expect(merged[0]).toMatchObject({ name: '(6)-Gingerol', inchikey: 'NLDDIKRKFXEWBK-AWEZNQCLSA-N', references: ['10.1/a', '10.1/b'] })
    expect(merged[1]).toMatchObject({ name: 'unknown resin', inchikey: '', wikidataId: 'Q3' })
  })
})
