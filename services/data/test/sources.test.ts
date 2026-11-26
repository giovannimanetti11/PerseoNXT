import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseColMatch, parseColSynonyms, parseWfoMatch } from '../src/sources/checklists.js'
import { parseStudies, summarizeTrials } from '../src/sources/ctgov.js'
import { parseMatch, parseOccurrences, parseSynonyms, parseTaxon, parseVernacular } from '../src/sources/gbif.js'
import { parseTaxon as parseInatTaxon, photoAuthor, pickTaxon } from '../src/sources/inaturalist.js'
import { enrichWithEuropePmc, parseSummaries, publicationYear, studyTypes } from '../src/sources/literature.js'
import { parseProperties } from '../src/sources/pubchem.js'
import { parseCompounds, parseDois, parseEntity, parseQids } from '../src/sources/wikidata.js'
import { cleanCommonsUrl, isAllowedCommonsLicense, parseCommons, parseSummary } from '../src/sources/wikimedia.js'

const fixture = <T>(name: string): T => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')) as T

describe('GBIF', () => {
  it('accepts exact species matches and rejects higher ranks', () => {
    expect(parseMatch(fixture('gbif-match-zingiber'))).toEqual({ key: 2757280, synonymOf: null })
    expect(parseMatch({ usageKey: 1, matchType: 'HIGHERRANK', rank: 'GENUS' })).toBeNull()
    expect(parseMatch({ usageKey: 5, matchType: 'EXACT', rank: 'SPECIES', status: 'SYNONYM', acceptedUsageKey: 9 })).toEqual({ key: 5, synonymOf: 9 })
  })

  it('builds the taxon with authorship and classification', () => {
    const taxon = parseTaxon(fixture('gbif-match-zingiber'), fixture('gbif-species-zingiber'))
    expect(taxon).toMatchObject({ key: 2757280, canonical: 'Zingiber officinale', authorship: 'Roscoe', family: 'Zingiberaceae' })
    expect(taxon.classification.map((item) => item.rank)).toEqual(['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'])
  })

  it('keeps synonyms only, with a link to each record', () => {
    const synonyms = parseSynonyms(fixture('gbif-synonyms-zingiber'))
    expect(synonyms.length).toBeGreaterThan(10)
    expect(synonyms).toContainEqual(expect.objectContaining({ canonical: 'Amomum zingiber', authorship: 'L.' }))
    expect(synonyms[0]?.sources[0]?.url).toMatch(/^https:\/\/www\.gbif\.org\/species\/\d+$/)
  })

  it('maps Italian and English vernacular names only', () => {
    const names = parseVernacular(fixture('gbif-vernacular-zingiber'), 2757280)
    expect(new Set(names.map((name) => name.lang))).toEqual(new Set(['it', 'en']))
    expect(names.some((name) => name.name === 'zenzero' && name.lang === 'it')).toBe(true)
  })

  it('sorts country and year facets', () => {
    const distribution = parseOccurrences(fixture('gbif-occurrence-zingiber'))
    expect(distribution.occurrences).toBeGreaterThan(1000)
    expect(distribution.countries[0]?.count).toBeGreaterThanOrEqual(distribution.countries[1]?.count ?? 0)
    const years = distribution.byYear.map((item) => item.year)
    expect(years).toEqual([...years].sort((a, b) => a - b))
  })
})

describe('checklists', () => {
  it('reads the WFO identifier', () => {
    expect(parseWfoMatch(fixture('wfo-match-zingiber'))).toMatchObject({ id: 'wfo-0000617397', fullName: 'Zingiber officinale Roscoe' })
    expect(parseWfoMatch({ match: null, candidates: [{}, {}] })).toBeNull()
  })

  it('reads Catalogue of Life and drops ambiguous synonyms', () => {
    const match = parseColMatch(fixture('col-match-zingiber'))
    expect(match).toMatchObject({ id: '5D5GX', canonical: 'Zingiber officinale', accepted: true })
    const synonyms = parseColSynonyms(fixture('col-synonyms-zingiber'), '5D5GX')
    expect(synonyms.some((name) => name.canonical === 'Amomum angustifolium')).toBe(false)
    expect(synonyms).toContainEqual(expect.objectContaining({ canonical: 'Zingiber zingiber', authorship: '(L.) H.Karst.' }))
  })
})

describe('Wikidata', () => {
  it('finds the taxon item and its identifiers', () => {
    expect(parseQids(fixture('wikidata-qid-zingiber'))).toEqual(['Q35625'])
    const entity = parseEntity(fixture('wikidata-entity-zingiber'), 'Q35625')
    expect(entity).toMatchObject({ qid: 'Q35625', ncbi: '94328', inaturalist: 122971, itWikiTitle: 'Zingiber officinale' })
    expect(entity?.images.length).toBeGreaterThan(0)
    expect(entity?.commonNames.every((name) => name.lang === 'it' || name.lang === 'en')).toBe(true)
  })

  it('merges compound rows by item and keeps each reference item once', () => {
    const raw = fixture<{ results: { bindings: unknown[] } }>('wikidata-compounds-verbena')
    const compounds = parseCompounds(fixture('wikidata-compounds-verbena'))
    expect(compounds.length).toBeLessThan(raw.results.bindings.length)
    expect(new Set(compounds.map((item) => item.wikidataId)).size).toBe(compounds.length)
    expect(compounds.every((item) => item.inchikey && new Set(item.referenceItems).size === item.referenceItems.length)).toBe(true)
  })

  it('reads DOIs from the scholarly graph, lowercased', () => {
    const dois = parseDois(fixture('wikidata-dois-verbena'))
    expect(dois.size).toBeGreaterThan(5)
    expect([...dois.values()].every((doi) => doi.startsWith('10.') && doi === doi.toLowerCase())).toBe(true)
  })
})

describe('PubChem', () => {
  it('parses properties with numeric weights', () => {
    const [dopamine] = parseProperties(fixture('pubchem-zingiber'))
    expect(dopamine).toEqual({ cid: 681, title: 'Dopamine', formula: 'C8H11NO2', molecularWeight: 153.18, iupacName: '4-(2-aminoethyl)benzene-1,2-diol', inchikey: 'VYFYYTLLBUKUHU-UHFFFAOYSA-N' })
  })
})

describe('literature', () => {
  it('classifies publication types', () => {
    expect(studyTypes(['Journal Article', 'Systematic Review', 'Meta-Analysis'])).toEqual(['meta-analysis', 'systematic-review'])
    expect(studyTypes(['Randomized Controlled Trial'])).toEqual(['rct'])
    expect(studyTypes(['Clinical Trial, Phase II'])).toEqual(['clinical-trial'])
    expect(studyTypes(['Journal Article'])).toEqual(['other'])
  })

  it('uses the online date for articles published ahead of print', () => {
    expect(publicationYear({ sortpubdate: '2027/02/10 00:00', pubdate: '2027 Feb 10', epubdate: '2026 Nov 3' })).toBe(2026)
    expect(publicationYear({ pubdate: '2024 Spring' })).toBe(2024)
    expect(publicationYear({})).toBeNull()
  })

  it('parses PubMed summaries and enriches them from Europe PMC by PMID', () => {
    const records = parseSummaries(fixture('pubmed-summary-zingiber'))
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((record) => record.pmid && record.url.endsWith(`/${record.pmid}/`))).toBe(true)
    const enriched = enrichWithEuropePmc(records, fixture('europepmc-zingiber'))
    expect(enriched.some((record) => record.sources.includes('europepmc') && record.citations !== null)).toBe(true)
    expect(enriched.map((record) => record.pmid)).toEqual(records.map((record) => record.pmid))
  })
})

describe('ClinicalTrials.gov', () => {
  it('parses studies and deduplicates by NCT ID', () => {
    const studies = parseStudies(fixture('ctgov-zingiber'))
    expect(studies.length).toBe(20)
    const summary = summarizeTrials(236, [...studies, ...studies.slice(0, 5)])
    expect(summary.items.length).toBe(20)
    expect(summary.total).toBe(236)
    expect(summary.byStatus.reduce((sum, item) => sum + item.count, 0)).toBe(20)
  })

  it('reads summary, interventions, sponsor and countries', () => {
    const [trial] = parseStudies({
      studies: [{
        hasResults: true,
        protocolSection: {
          identificationModule: { nctId: 'NCT07403305', briefTitle: 'Thermal water' },
          statusModule: { overallStatus: 'NOT_YET_RECRUITING', completionDateStruct: { date: '2026-10-31' } },
          descriptionModule: { briefSummary: 'First  line.\r\n\r\n\r\n* Arm I\n* Arm II ' },
          armsInterventionsModule: { interventions: [
            { type: 'OTHER', name: 'Hydropinotherapy', description: 'Thermal water with bay leaf (Laurus nobilis).' },
            { type: 'OTHER', name: 'hydropinotherapy' },
          ] },
          sponsorCollaboratorsModule: { leadSponsor: { name: 'Instituto Politécnico de Bragança' } },
          contactsLocationsModule: { locations: [{ country: 'Portugal' }, { country: 'Portugal' }, { country: 'Brazil' }] },
        },
      }],
    })
    expect(trial?.summary).toBe('First line.\n\n* Arm I\n* Arm II')
    expect(trial?.interventions).toEqual([{ name: 'Hydropinotherapy', type: 'OTHER', description: 'Thermal water with bay leaf (Laurus nobilis).' }])
    expect(trial?.sponsor).toBe('Instituto Politécnico de Bragança')
    expect(trial?.countries).toEqual(['Brazil', 'Portugal'])
    expect(trial?.completionDate).toBe('2026-10-31')
    expect(trial?.hasResults).toBe(true)
  })
})

describe('iNaturalist', () => {
  it('matches the exact species only', () => {
    expect(pickTaxon(fixture('inat-search-zingiber'), 'Zingiber officinale')?.id).toBe(122971)
    expect(pickTaxon(fixture('inat-search-zingiber'), 'Zingiber zerumbet')).toBeNull()
  })

  it('keeps CC0 and CC BY photos only, with a credit line', () => {
    const data = fixture<{ results: Parameters<typeof parseInatTaxon>[0][] }>('inat-taxon-zingiber')
    const taxon = parseInatTaxon(data.results[0] ?? {})
    expect(taxon?.photos.length).toBeGreaterThan(0)
    expect(taxon?.photos.every((photo) => ['CC0 1.0', 'CC BY 4.0'].includes(photo.license))).toBe(true)
    expect(taxon?.photos[0]?.credit).toMatch(/^Foto: .+, CC (BY 4\.0|0 1\.0), iNaturalist$/)
    expect(taxon?.commonNames).toContainEqual(expect.objectContaining({ name: 'Zenzero', lang: 'it' }))
  })

  it('extracts the author from the attribution', () => {
    expect(photoAuthor('(c) Greg III Espera, some rights reserved (CC BY), uploaded by Greg III Espera')).toBe('Greg III Espera')
    expect(photoAuthor('(c) Jane, no rights reserved, uploaded by Jane')).toBe('Jane')
  })
})

describe('Wikimedia', () => {
  it('reads the Italian summary', () => {
    expect(parseSummary(fixture('wikipedia-zingiber'))).toMatchObject({ url: 'https://it.wikipedia.org/wiki/Zingiber_officinale', license: 'CC BY-SA 4.0' })
    expect(parseSummary({ type: 'disambiguation', extract: 'x', content_urls: { desktop: { page: 'u' } } })).toBeNull()
  })

  it('filters Commons licenses and strips tracking parameters', () => {
    expect(isAllowedCommonsLicense('CC BY-SA 3.0')).toBe(true)
    expect(isAllowedCommonsLicense('Public domain')).toBe(true)
    expect(isAllowedCommonsLicense('CC BY-NC-SA 4.0')).toBe(false)
    expect(isAllowedCommonsLicense('All rights reserved')).toBe(false)
    expect(cleanCommonsUrl('https://upload.wikimedia.org/a.jpg?utm_source=x&utm_campaign=y')).toBe('https://upload.wikimedia.org/a.jpg')
    const images = parseCommons(fixture('commons-zingiber'))
    expect(images.length).toBeGreaterThan(0)
    expect(images.every((image) => !image.url.includes('utm_') && !image.author.includes('<'))).toBe(true)
  })
})
