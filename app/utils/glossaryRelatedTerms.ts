/**
 * Hand-picked "Termini correlati" for glossary pages. Each term links only to
 * concepts discussed together with it (same organ, process or preparation),
 * not to every term of the same broad category.
 */

interface RelatedTerm {
  title: string
  slug: string
}

const TERM_TITLES: Record<string, string> = {
  'glicosidi': 'Glicosidi',
  'tintura-madre': 'Tintura Madre',
  'disseminazione': 'Disseminazione',
  'cere': 'Cere',
  'lipidi': 'Lipidi',
  'corteccia': 'Corteccia',
  'saponine': 'Saponine',
  'quercetina': 'Quercetina',
  'olio-essenziale': 'Olio essenziale',
  'tannini': 'Tannini',
  'flavonoidi': 'Flavonoidi',
  'antociani': 'Antociani',
  'terpene': 'Terpene',
  'dioica': 'Dioica',
  'polifenolo': 'Polifenolo',
  'alcaloide': 'Alcaloide',
  'macerato': 'Macerato',
  'decotto': 'Decotto',
  'fiore': 'Fiore',
  'seme': 'Seme',
  'principio-attivo': 'Principio attivo',
  'droga': 'Droga',
  'tisana': 'Tisana',
  'infuso': 'Infuso',
  'stelo': 'Stelo',
  'frutto': 'Frutto',
  'achenio': 'Achenio',
  'fusto': 'Fusto',
  'tempo-balsamico': 'Tempo balsamico',
  'radice': 'Radice',
  'foglia': 'Foglia',
  'brattea': 'Brattea',
  'rizoma': 'Rizoma'
}

const RELATED_TERMS: Record<string, string[]> = {
  // Organi vegetativi
  'stelo': ['fusto', 'radice', 'foglia', 'fiore'],
  'fusto': ['stelo', 'corteccia', 'radice', 'foglia'],
  'radice': ['rizoma', 'fusto', 'stelo', 'foglia'],
  'foglia': ['stelo', 'fusto', 'brattea', 'fiore'],
  'rizoma': ['radice', 'fusto', 'stelo'],
  'corteccia': ['fusto', 'radice', 'tannini'],

  // Riproduzione e disseminazione
  'brattea': ['foglia', 'fiore', 'seme'],
  'fiore': ['brattea', 'dioica', 'seme', 'frutto'],
  'dioica': ['fiore', 'disseminazione'],
  'seme': ['frutto', 'achenio', 'disseminazione', 'fiore'],
  'frutto': ['achenio', 'seme', 'disseminazione'],
  'achenio': ['frutto', 'seme', 'disseminazione'],
  'disseminazione': ['seme', 'frutto', 'achenio', 'dioica'],

  // Fitochimica
  'flavonoidi': ['antociani', 'polifenolo', 'quercetina', 'tannini'],
  'antociani': ['flavonoidi', 'polifenolo', 'quercetina'],
  'polifenolo': ['flavonoidi', 'antociani', 'tannini', 'quercetina'],
  'quercetina': ['flavonoidi', 'antociani', 'polifenolo'],
  'tannini': ['polifenolo', 'flavonoidi', 'corteccia'],
  'terpene': ['olio-essenziale', 'principio-attivo'],
  'alcaloide': ['principio-attivo', 'droga', 'glicosidi'],
  'saponine': ['glicosidi', 'principio-attivo'],
  'glicosidi': ['saponine', 'alcaloide', 'principio-attivo'],
  'lipidi': ['cere', 'olio-essenziale'],
  'cere': ['lipidi', 'corteccia'],
  'principio-attivo': ['droga', 'alcaloide', 'glicosidi', 'saponine', 'terpene'],
  'droga': ['principio-attivo', 'tempo-balsamico', 'macerato'],

  // Preparazioni erboristiche
  'tisana': ['infuso', 'decotto', 'macerato'],
  'infuso': ['tisana', 'decotto', 'tempo-balsamico'],
  'decotto': ['tisana', 'infuso', 'macerato'],
  'macerato': ['tintura-madre', 'decotto', 'droga'],
  'tintura-madre': ['macerato', 'olio-essenziale', 'droga'],
  'olio-essenziale': ['tintura-madre', 'terpene', 'tempo-balsamico'],
  'tempo-balsamico': ['droga', 'olio-essenziale', 'infuso']
}

/** Curated related terms of a glossary entry, in display order. */
export function relatedGlossaryTerms(slug: string | null | undefined): RelatedTerm[] {
  if (!slug) return []
  return (RELATED_TERMS[slug] ?? []).map((related) => ({ slug: related, title: TERM_TITLES[related] ?? related }))
}
