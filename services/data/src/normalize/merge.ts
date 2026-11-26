import type { CommonName, Compound, Provenance, ScientificName } from '../types.js'
import type { PubchemCompound } from '../sources/pubchem.js'
import type { WikidataCompound } from '../sources/wikidata.js'
import { commonNameKey, nameKey } from './text.js'

function mergeProvenance(a: Provenance[], b: Provenance[]): Provenance[] {
  const seen = new Set<string>()
  return [...a, ...b].filter((item) => {
    const key = `${item.source}|${item.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Union of the synonyms from every checklist, one entry per name. The accepted
 * name and the basionym are left out: they have their own fields.
 */
export function mergeSynonyms(lists: ScientificName[][], accepted: string, basionym: ScientificName | null): ScientificName[] {
  const excluded = new Set([nameKey(accepted), ...(basionym ? [nameKey(basionym.canonical)] : [])])
  const byKey = new Map<string, ScientificName>()
  for (const name of lists.flat()) {
    const key = nameKey(name.canonical)
    if (!key || excluded.has(key)) continue
    const current = byKey.get(key)
    if (!current) {
      byKey.set(key, { ...name, sources: [...name.sources] })
      continue
    }
    current.sources = mergeProvenance(current.sources, name.sources)
    if (!current.authorship && name.authorship) current.authorship = name.authorship
  }
  return [...byKey.values()].sort((a, b) => a.canonical.localeCompare(b.canonical))
}

/** Same basionym from several sources: keeps the first and merges provenance. */
export function mergeBasionym(candidates: (ScientificName | null)[]): ScientificName | null {
  const found = candidates.filter((item): item is ScientificName => item !== null)
  const first = found[0]
  if (!first) return null
  const sameName = found.filter((item) => nameKey(item.canonical) === nameKey(first.canonical))
  return {
    ...first,
    authorship: sameName.find((item) => item.authorship)?.authorship ?? '',
    sources: sameName.reduce<Provenance[]>((acc, item) => mergeProvenance(acc, item.sources), []),
  }
}

/**
 * Common names grouped by language and spelling. The displayed form is the one
 * most sources use, so "Ginger", "ginger" and "GINGER" become one entry.
 */
export function mergeCommonNames(lists: CommonName[][], scientificName: string): CommonName[] {
  const scientific = commonNameKey(scientificName)
  const groups = new Map<string, { forms: Map<string, number>; lang: string; sources: Provenance[]; order: number }>()
  let order = 0
  for (const name of lists.flat()) {
    const key = commonNameKey(name.name)
    if (!key || key === scientific) continue
    const groupKey = `${name.lang}|${key}`
    const group = groups.get(groupKey) ?? { forms: new Map(), lang: name.lang, sources: [], order: order++ }
    group.forms.set(name.name, (group.forms.get(name.name) ?? 0) + 1)
    group.sources = mergeProvenance(group.sources, name.sources)
    groups.set(groupKey, group)
  }
  return [...groups.values()]
    .map((group) => {
      const [form] = [...group.forms].sort((a, b) => b[1] - a[1])[0] ?? ['']
      return { name: form, lang: group.lang, sources: group.sources, weight: group.sources.length, order: group.order }
    })
    .sort((a, b) => (a.lang === b.lang ? 0 : a.lang === 'it' ? -1 : 1) || b.weight - a.weight || a.order - b.order)
    .map(({ name, lang, sources }) => ({ name, lang, sources }))
}

/**
 * Compounds keyed by InChIKey: two Wikidata items for the same structure (it
 * happens with stereoisomer duplicates) become one compound. Items without an
 * InChIKey fall back to the PubChem CID, then to the Wikidata item.
 */
export function mergeCompounds(items: WikidataCompound[], pubchem: Map<number, PubchemCompound>): Compound[] {
  const byKey = new Map<string, Compound>()
  for (const item of items) {
    const chem = item.pubchemCid ? pubchem.get(item.pubchemCid) : undefined
    const inchikey = item.inchikey ?? chem?.inchikey ?? ''
    const key = inchikey || (item.pubchemCid ? `cid:${item.pubchemCid}` : `wd:${item.wikidataId}`)
    const current = byKey.get(key)
    if (current) {
      current.references = [...new Set([...current.references, ...item.references])]
      current.pubchemCid ??= item.pubchemCid
      if (!current.formula && chem?.formula) current.formula = chem.formula
      continue
    }
    byKey.set(key, {
      inchikey,
      pubchemCid: item.pubchemCid,
      wikidataId: item.wikidataId,
      // PubChem titles are common names ("Shogaol"); Wikidata labels are often IUPAC strings.
      name: chem?.title || item.label || inchikey || item.wikidataId,
      formula: chem?.formula ?? '',
      molecularWeight: chem?.molecularWeight ?? null,
      iupacName: chem?.iupacName ?? '',
      references: [...item.references],
    })
  }
  return [...byKey.values()].sort((a, b) => b.references.length - a.references.length || a.name.localeCompare(b.name))
}
