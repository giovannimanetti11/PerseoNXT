import type { ClassificationRank, SourceId, StudyType } from '#shared/types/plantData'

const numbers = new Intl.NumberFormat('it-IT')
export const formatNumber = (value: number) => numbers.format(value)

let regionNames: Intl.DisplayNames | null = null
/** "BR" -> "Brasile"; the code itself when the runtime has no Italian region names. */
export function countryName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(['it'], { type: 'region' })
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

/** "C17H26O4" -> [["C"], ["17", sub], ...]: digits are rendered as subscripts. */
export function formulaParts(formula: string): { text: string; sub: boolean }[] {
  return (formula.match(/\d+|\D+/g) ?? []).map((text) => ({ text, sub: /^\d+$/.test(text) }))
}

export const RANK_LABELS: Record<ClassificationRank['rank'], string> = {
  kingdom: 'Regno', phylum: 'Phylum', class: 'Classe', order: 'Ordine', family: 'Famiglia', genus: 'Genere', species: 'Specie',
}

export const SOURCE_SHORT: Partial<Record<SourceId, string>> = {
  gbif: 'GBIF', col: 'COL', wfo: 'WFO', wikidata: 'Wikidata', inaturalist: 'iNaturalist',
}

export const STUDY_TYPES: Partial<Record<StudyType, { label: string; classes: string }>> = {
  'meta-analysis': { label: 'Meta-analisi', classes: 'bg-verde text-white' },
  'systematic-review': { label: 'Revisione sistematica', classes: 'bg-blu text-white' },
  review: { label: 'Revisione', classes: 'bg-ghiaccio text-blu' },
  rct: { label: 'Studio randomizzato', classes: 'bg-celeste text-white' },
  'clinical-trial': { label: 'Studio clinico', classes: 'bg-ghiaccio text-blu' },
}

const TRIAL_STATUS: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: 'Completato', color: '#0DA6A4' },
  RECRUITING: { label: 'In reclutamento', color: '#5E9EF4' },
  NOT_YET_RECRUITING: { label: 'Non ancora avviato', color: '#9DB8D6' },
  ACTIVE_NOT_RECRUITING: { label: 'In corso', color: '#036297' },
  ENROLLING_BY_INVITATION: { label: 'Su invito', color: '#7FA7C9' },
  TERMINATED: { label: 'Interrotto', color: '#C77D5C' },
  WITHDRAWN: { label: 'Ritirato', color: '#B9A290' },
  SUSPENDED: { label: 'Sospeso', color: '#D4A648' },
  UNKNOWN: { label: 'Stato sconosciuto', color: '#B8C0C8' },
}

const UNKNOWN_STATUS = { label: 'Stato sconosciuto', color: '#B8C0C8' }
export const trialStatus = (status: string) => TRIAL_STATUS[status] ?? UNKNOWN_STATUS

const PHASES: Record<string, string> = {
  EARLY_PHASE1: 'Fase 1 iniziale', PHASE1: 'Fase 1', PHASE2: 'Fase 2', PHASE3: 'Fase 3', PHASE4: 'Fase 4', NA: 'Non applicabile',
}

export const trialPhases = (phases: string[]) => (phases.length ? phases.map((phase) => PHASES[phase] ?? phase).join(', ') : 'Non applicabile')
