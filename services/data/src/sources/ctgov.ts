import type { ClinicalTrial, TrialIntervention, TrialSummary } from '../types.js'
import { collapseSpaces } from '../normalize/text.js'
import type { SourceContext } from './context.js'

const API = 'https://clinicaltrials.gov/api/v2/studies'
const FIELDS = [
  'NCTId', 'BriefTitle', 'OverallStatus', 'Phase', 'Condition', 'EnrollmentCount', 'StartDate', 'StudyType',
  'CompletionDate', 'BriefSummary', 'InterventionName', 'InterventionType', 'InterventionDescription',
  'LeadSponsorName', 'LocationCountry', 'HasResults',
].join(',')
const MAX_SUMMARY = 4000
const MAX_INTERVENTION = 1200
const PAGE_SIZE = 100
const MAX_PAGES = 5

interface Study {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string }
    statusModule?: { overallStatus?: string; startDateStruct?: { date?: string }; completionDateStruct?: { date?: string } }
    conditionsModule?: { conditions?: string[] }
    designModule?: { studyType?: string; phases?: string[]; enrollmentInfo?: { count?: number } }
    descriptionModule?: { briefSummary?: string }
    armsInterventionsModule?: { interventions?: { name?: string; type?: string; description?: string }[] }
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } }
    contactsLocationsModule?: { locations?: { country?: string }[] }
  }
  hasResults?: boolean
}

/** Keeps paragraphs and list lines, collapses the rest of the whitespace, cuts on a word boundary. */
export function cleanSummary(text: string | undefined, max = MAX_SUMMARY): string | null {
  if (!text) return null
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((line) => line.replace(/[ \t]+/g, ' ').trim())
  const joined = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!joined) return null
  if (joined.length <= max) return joined
  const cut = joined.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40)).trimEnd()}…`
}

function parseInterventions(items: { name?: string; type?: string; description?: string }[] | undefined): TrialIntervention[] {
  const seen = new Set<string>()
  return (items ?? []).flatMap((item) => {
    const name = collapseSpaces(item.name ?? '')
    if (!name || seen.has(name.toLowerCase())) return []
    seen.add(name.toLowerCase())
    return [{ name, type: item.type ?? 'OTHER', description: cleanSummary(item.description, MAX_INTERVENTION) }]
  })
}

export interface StudiesResponse {
  totalCount?: number
  studies?: Study[]
  nextPageToken?: string
}

export function parseStudies(data: StudiesResponse): ClinicalTrial[] {
  return (data.studies ?? []).flatMap((study) => {
    const section = study.protocolSection
    const nctId = section?.identificationModule?.nctId
    if (!nctId || !/^NCT\d{8}$/.test(nctId)) return []
    const enrollment = section?.designModule?.enrollmentInfo?.count
    const countries = (section?.contactsLocationsModule?.locations ?? [])
      .map((location) => collapseSpaces(location.country ?? ''))
      .filter((country) => country.length > 0)
    const sponsor = collapseSpaces(section?.sponsorCollaboratorsModule?.leadSponsor?.name ?? '')
    return [{
      nctId,
      title: collapseSpaces(section?.identificationModule?.briefTitle ?? ''),
      status: section?.statusModule?.overallStatus ?? 'UNKNOWN',
      phases: section?.designModule?.phases ?? [],
      studyType: section?.designModule?.studyType ?? '',
      conditions: (section?.conditionsModule?.conditions ?? []).map(collapseSpaces),
      enrollment: typeof enrollment === 'number' ? enrollment : null,
      startDate: section?.statusModule?.startDateStruct?.date ?? null,
      completionDate: section?.statusModule?.completionDateStruct?.date ?? null,
      summary: cleanSummary(section?.descriptionModule?.briefSummary),
      interventions: parseInterventions(section?.armsInterventionsModule?.interventions),
      sponsor: sponsor || null,
      countries: [...new Set(countries)].sort((a, b) => a.localeCompare(b)),
      hasResults: study.hasResults === true,
      url: `https://clinicaltrials.gov/study/${nctId}`,
    }]
  })
}

function countBy(values: string[]): { key: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

/** Deduplicates by NCT ID (pages can overlap when the registry changes between requests). */
export function summarizeTrials(total: number, trials: ClinicalTrial[]): TrialSummary {
  const unique = [...new Map(trials.map((trial) => [trial.nctId, trial])).values()]
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
  return {
    total: Math.max(total, unique.length),
    byStatus: countBy(unique.map((trial) => trial.status)).map(({ key, count }) => ({ status: key, count })),
    byPhase: countBy(unique.flatMap((trial) => (trial.phases.length ? trial.phases : ['NA']))).map(({ key, count }) => ({ phase: key, count })),
    items: unique,
  }
}

export async function fetchTrials(ctx: SourceContext, binomialName: string): Promise<TrialSummary> {
  const trials: ClinicalTrial[] = []
  let total = 0
  let pageToken: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await ctx.get<StudiesResponse>('ctgov', `studies:${page}`, API, {
      query: { 'query.intr': binomialName, fields: FIELDS, pageSize: PAGE_SIZE, countTotal: page === 0, pageToken },
    })
    if (page === 0) total = data.totalCount ?? 0
    trials.push(...parseStudies(data))
    pageToken = data.nextPageToken
    if (!pageToken) break
  }
  return summarizeTrials(total, trials)
}
