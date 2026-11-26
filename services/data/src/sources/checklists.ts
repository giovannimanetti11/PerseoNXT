/** World Flora Online and Catalogue of Life (ChecklistBank): accepted name and synonyms. */
import type { ScientificName } from '../types.js'
import { collapseSpaces, withoutAuthorship } from '../normalize/text.js'
import type { SourceContext } from './context.js'

// ---------------------------------------------------------------------------
// World Flora Online
// ---------------------------------------------------------------------------

export interface WfoMatchResponse {
  match?: { wfo_id?: string; full_name_plain?: string } | null
  candidates?: unknown[]
}

export interface WfoMatch {
  id: string
  fullName: string
  url: string
}

/** Only an unambiguous match is kept: with candidates and no match, WFO could not decide. */
export function parseWfoMatch(data: WfoMatchResponse): WfoMatch | null {
  const id = data.match?.wfo_id
  const fullName = collapseSpaces(data.match?.full_name_plain ?? '')
  return id && fullName ? { id, fullName, url: `https://www.worldfloraonline.org/taxon/${id}` } : null
}

export async function fetchWfo(ctx: SourceContext, scientificName: string): Promise<WfoMatch | null> {
  const data = await ctx.get<WfoMatchResponse>('wfo', 'match', 'https://list.worldfloraonline.org/matching_rest.php', {
    query: { input_string: scientificName },
  })
  return parseWfoMatch(data)
}

// ---------------------------------------------------------------------------
// Catalogue of Life (latest release, dataset 3LR)
// ---------------------------------------------------------------------------

const COL = 'https://api.checklistbank.org/dataset/3LR'

export interface ColMatchResponse {
  type?: string
  usage?: { id?: string; name?: string; authorship?: string; status?: string; rank?: string } | null
}

interface ColName {
  scientificName?: string
  authorship?: string
}

interface ColSynonym {
  id?: string
  status?: string
  name?: ColName
}

export interface ColSynonymsResponse {
  homotypic?: ColSynonym[]
  heterotypic?: ColSynonym[]
  /** Heterotypic synonyms grouped by basionym: same names as `heterotypic`. */
  heterotypicGroups?: ColSynonym[][]
}

export interface ColMatch {
  id: string
  canonical: string
  authorship: string
  accepted: boolean
}

export function parseColMatch(data: ColMatchResponse): ColMatch | null {
  const usage = data.usage
  if (!usage?.id || !usage.name || data.type === 'none') return null
  if (usage.rank && !['species', 'subspecies', 'variety', 'form'].includes(usage.rank)) return null
  return {
    id: usage.id,
    canonical: collapseSpaces(usage.name),
    authorship: collapseSpaces(usage.authorship ?? ''),
    accepted: usage.status === 'accepted',
  }
}

const colTaxonUrl = (id: string) => `https://www.catalogueoflife.org/data/taxon/${id}`

export function parseColSynonyms(data: ColSynonymsResponse, acceptedId: string): ScientificName[] {
  const all = [...(data.homotypic ?? []), ...(data.heterotypic ?? [])]
  return all.flatMap((synonym) => {
    const full = collapseSpaces(synonym.name?.scientificName ?? '')
    if (!full) return []
    // "ambiguous synonym" and "misapplied" names are not synonyms of this plant only.
    if (synonym.status && synonym.status !== 'synonym') return []
    const authorship = collapseSpaces(synonym.name?.authorship ?? '')
    return [{
      canonical: withoutAuthorship(full, authorship),
      authorship,
      kind: 'synonym' as const,
      sources: [{ source: 'col' as const, url: colTaxonUrl(synonym.id ?? acceptedId) }],
    }]
  })
}

export async function fetchCol(ctx: SourceContext, scientificName: string) {
  const data = await ctx.get<ColMatchResponse>('col', 'match', `${COL}/match/nameusage`, { query: { q: scientificName } })
  const match = parseColMatch(data)
  if (!match?.accepted) return match ? { match, synonyms: [] } : null
  const synonyms = await ctx.get<ColSynonymsResponse>('col', 'synonyms', `${COL}/taxon/${encodeURIComponent(match.id)}/synonyms`)
  return { match, synonyms: parseColSynonyms(synonyms, match.id) }
}
