/** PubMed (counts, recent reviews and trials) and Europe PMC (open access, citations). */
import type { Literature, Publication, StudyType } from '../types.js'
import { collapseSpaces, normalizeDoi } from '../normalize/text.js'
import type { SourceContext } from './context.js'

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const EUROPE_PMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'
const YEARS = 20
const RECENT = 8

export const REVIEW_FILTER = '(systematic review[pt] OR meta-analysis[pt] OR review[pt])'
export const TRIAL_FILTER = '(randomized controlled trial[pt] OR clinical trial[pt])'

/** Exact phrase on all fields: also matches MeSH indexing, unlike [tiab]. */
export const pubmedTerm = (binomial: string) => `"${binomial.replace(/"/g, '')}"`

export interface ESearchResponse {
  esearchresult?: { count?: string; idlist?: string[] }
}

interface ESummaryItem {
  uid?: string
  title?: string
  fulljournalname?: string
  source?: string
  sortpubdate?: string
  pubdate?: string
  epubdate?: string
  pubtype?: string[]
  articleids?: { idtype?: string; value?: string }[]
}

export interface ESummaryResponse {
  result?: { uids?: string[] } & Record<string, ESummaryItem | string[] | undefined>
}

export interface EuropePmcResponse {
  resultList?: { result?: { pmid?: string; pmcid?: string; isOpenAccess?: string; citedByCount?: number }[] }
}

const PUBTYPES: [string, StudyType][] = [
  ['meta-analysis', 'meta-analysis'],
  ['systematic review', 'systematic-review'],
  ['review', 'review'],
  ['randomized controlled trial', 'rct'],
  ['clinical trial', 'clinical-trial'],
]

export function studyTypes(pubtypes: string[]): StudyType[] {
  const lower = pubtypes.map((type) => type.toLowerCase())
  const types = PUBTYPES.filter(([label]) => lower.some((type) => type === label || type.startsWith(`${label},`) || type.startsWith(`${label} `)))
    .map(([, type]) => type)
  return types.length ? [...new Set(types)] : ['other']
}

const yearOf = (value: string | undefined) => {
  const year = Number(value?.match(/\b(19|20)\d{2}\b/)?.[0])
  return Number.isInteger(year) && year > 0 ? year : null
}

/**
 * Articles published online ahead of print carry the date of a future issue
 * ("2027 Feb 10"): the earlier of online and print date is the one readers expect.
 */
export function publicationYear(item: { sortpubdate?: string; pubdate?: string; epubdate?: string }): number | null {
  const years = [item.epubdate, item.pubdate, item.sortpubdate].map(yearOf).filter((year): year is number => year !== null)
  return years.length ? Math.min(...years) : null
}

export const parseCount = (data: ESearchResponse) => Number(data.esearchresult?.count ?? 0) || 0
export const parseIds = (data: ESearchResponse) => data.esearchresult?.idlist ?? []

export function parseSummaries(data: ESummaryResponse): Publication[] {
  const result = data.result
  if (!result) return []
  return (result.uids ?? []).flatMap((uid) => {
    const item = result[uid]
    if (!item || Array.isArray(item)) return []
    const id = (type: string) => item.articleids?.find((article) => article.idtype === type)?.value ?? null
    const doi = id('doi')
    const pmcid = id('pmc')
    const year = publicationYear(item)
    return [{
      pmid: uid,
      doi: doi ? normalizeDoi(doi) : null,
      pmcid,
      title: collapseSpaces(item.title ?? '').replace(/\.$/, ''),
      journal: collapseSpaces(item.fulljournalname ?? item.source ?? ''),
      year,
      types: studyTypes(item.pubtype ?? []),
      openAccess: pmcid ? true : null,
      citations: null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
      sources: ['pubmed'],
    }]
  })
}

/** Adds open access and citation counts from Europe PMC to PubMed records, matched by PMID. */
export function enrichWithEuropePmc(publications: Publication[], data: EuropePmcResponse): Publication[] {
  const byPmid = new Map((data.resultList?.result ?? []).filter((item) => item.pmid).map((item) => [item.pmid, item]))
  return publications.map((publication) => {
    const extra = publication.pmid ? byPmid.get(publication.pmid) : undefined
    if (!extra) return publication
    return {
      ...publication,
      pmcid: publication.pmcid ?? extra.pmcid ?? null,
      openAccess: extra.isOpenAccess === 'Y' ? true : publication.openAccess ?? (extra.isOpenAccess === 'N' ? false : null),
      citations: typeof extra.citedByCount === 'number' ? extra.citedByCount : null,
      sources: [...new Set([...publication.sources, 'europepmc' as const])],
    }
  })
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

function esearch(ctx: SourceContext, requestKey: string, term: string, extra: Record<string, string | number> = {}) {
  return ctx.get<ESearchResponse>('pubmed', requestKey, `${EUTILS}/esearch.fcgi`, {
    query: { db: 'pubmed', retmode: 'json', retmax: 0, term, ...extra, ...(ctx.ncbiApiKey ? { api_key: ctx.ncbiApiKey } : {}) },
  })
}

async function summaries(ctx: SourceContext, ids: string[]): Promise<Publication[]> {
  if (!ids.length) return []
  const data = await ctx.get<ESummaryResponse>('pubmed', `summary:${ids[0]}+${ids.length}`, `${EUTILS}/esummary.fcgi`, {
    query: { db: 'pubmed', retmode: 'json', id: ids.join(','), ...(ctx.ncbiApiKey ? { api_key: ctx.ncbiApiKey } : {}) },
  })
  return parseSummaries(data)
}

/** Europe PMC is optional: when it fails the PubMed data is returned as is. */
async function enrich(ctx: SourceContext, publications: Publication[]): Promise<Publication[]> {
  const pmids = publications.map((publication) => publication.pmid).filter((pmid): pmid is string => Boolean(pmid))
  if (!pmids.length) return publications
  try {
    const data = await ctx.get<EuropePmcResponse>('europepmc', `pmids:${pmids[0]}+${pmids.length}`, EUROPE_PMC, {
      query: { format: 'json', resultType: 'lite', pageSize: 100, query: pmids.map((pmid) => `EXT_ID:${pmid} AND SRC:MED`).join(' OR ') },
    })
    return enrichWithEuropePmc(publications, data)
  } catch {
    return publications
  }
}

export async function fetchLiterature(ctx: SourceContext, binomialName: string): Promise<Literature> {
  const term = pubmedTerm(binomialName)
  const reviewTerm = `${term} AND ${REVIEW_FILTER}`
  const trialTerm = `${term} AND ${TRIAL_FILTER}`

  const total = parseCount(await esearch(ctx, 'count', term))
  const reviews = await esearch(ctx, 'reviews', reviewTerm, { retmax: RECENT, sort: 'pub_date' })
  const trials = await esearch(ctx, 'trials', trialTerm, { retmax: RECENT, sort: 'pub_date' })

  const lastYear = new Date().getUTCFullYear()
  const byYear: Literature['byYear'] = []
  // Without articles there is nothing to split by year.
  if (total > 0) {
    for (let year = lastYear - YEARS + 1; year <= lastYear; year++) {
      const count = parseCount(await esearch(ctx, `year:${year}`, term, { datetype: 'pdat', mindate: year, maxdate: year }))
      byYear.push({ year, count })
    }
  }

  const reviewIds = parseIds(reviews)
  const trialIds = parseIds(trials).filter((id) => !reviewIds.includes(id))
  const records = await enrich(ctx, await summaries(ctx, [...reviewIds, ...trialIds]))
  const pick = (ids: string[]) => ids.flatMap((id) => records.filter((record) => record.pmid === id))

  return {
    query: term,
    total,
    reviews: parseCount(reviews),
    trials: parseCount(trials),
    byYear,
    recentReviews: pick(reviewIds),
    recentTrials: pick(parseIds(trials)),
  }
}
