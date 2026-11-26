import { collapseSpaces } from '../normalize/text.js'
import type { SourceContext } from './context.js'

const API = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'
const PROPERTIES = 'Title,MolecularFormula,MolecularWeight,IUPACName,InChIKey'
/** PUG REST accepts long CID lists, but the URL must stay under ~2000 characters. */
const BATCH = 150

export interface PubchemPropertiesResponse {
  PropertyTable?: {
    Properties?: {
      CID: number
      Title?: string
      MolecularFormula?: string
      MolecularWeight?: string | number
      IUPACName?: string
      InChIKey?: string
    }[]
  }
}

export interface PubchemCompound {
  cid: number
  title: string
  formula: string
  molecularWeight: number | null
  iupacName: string
  inchikey: string
}

export const pubchemUrl = (cid: number) => `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`

export function parseProperties(data: PubchemPropertiesResponse): PubchemCompound[] {
  return (data.PropertyTable?.Properties ?? []).map((item) => {
    const weight = Number(item.MolecularWeight)
    return {
      cid: item.CID,
      title: collapseSpaces(item.Title ?? ''),
      formula: item.MolecularFormula ?? '',
      molecularWeight: Number.isFinite(weight) && weight > 0 ? weight : null,
      iupacName: collapseSpaces(item.IUPACName ?? ''),
      inchikey: (item.InChIKey ?? '').toUpperCase(),
    }
  })
}

export async function fetchPubchemProperties(ctx: SourceContext, cids: number[]): Promise<Map<number, PubchemCompound>> {
  const unique = [...new Set(cids)].filter((cid) => Number.isInteger(cid) && cid > 0)
  const result = new Map<number, PubchemCompound>()
  for (let start = 0; start < unique.length; start += BATCH) {
    const batch = unique.slice(start, start + BATCH)
    const data = await ctx.get<PubchemPropertiesResponse>(
      'pubchem',
      `properties:${batch[0]}+${batch.length}`,
      `${API}/compound/cid/${batch.join(',')}/property/${PROPERTIES}/JSON`,
    )
    for (const compound of parseProperties(data)) result.set(compound.cid, compound)
  }
  return result
}
