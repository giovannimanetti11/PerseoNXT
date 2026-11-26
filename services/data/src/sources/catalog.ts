import type { SourceId, SourceInfo } from '../types.js'

export const SOURCES: Record<SourceId, SourceInfo> = {
  gbif: { id: 'gbif', name: 'GBIF', homepage: 'https://www.gbif.org', license: 'CC BY 4.0', licenseUrl: 'https://www.gbif.org/terms' },
  wfo: { id: 'wfo', name: 'World Flora Online', homepage: 'https://www.worldfloraonline.org', license: 'CC BY 4.0', licenseUrl: 'https://www.worldfloraonline.org/termsOfUse' },
  col: { id: 'col', name: 'Catalogue of Life', homepage: 'https://www.catalogueoflife.org', license: 'CC BY 4.0', licenseUrl: 'https://www.catalogueoflife.org/about/citation' },
  wikidata: { id: 'wikidata', name: 'Wikidata', homepage: 'https://www.wikidata.org', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  pubchem: { id: 'pubchem', name: 'PubChem', homepage: 'https://pubchem.ncbi.nlm.nih.gov', license: 'Dati pubblici NCBI', licenseUrl: 'https://www.ncbi.nlm.nih.gov/home/about/policies/' },
  pubmed: { id: 'pubmed', name: 'PubMed', homepage: 'https://pubmed.ncbi.nlm.nih.gov', license: 'Metadati NLM', licenseUrl: 'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html' },
  europepmc: { id: 'europepmc', name: 'Europe PMC', homepage: 'https://europepmc.org', license: 'Metadati Europe PMC', licenseUrl: 'https://europepmc.org/Copyright' },
  ctgov: { id: 'ctgov', name: 'ClinicalTrials.gov', homepage: 'https://clinicaltrials.gov', license: 'Pubblico dominio (USA)', licenseUrl: 'https://clinicaltrials.gov/about-site/terms-conditions' },
  inaturalist: { id: 'inaturalist', name: 'iNaturalist', homepage: 'https://www.inaturalist.org', license: 'Licenza indicata per ogni foto', licenseUrl: 'https://www.inaturalist.org/pages/terms' },
  wikipedia: { id: 'wikipedia', name: 'Wikipedia', homepage: 'https://it.wikipedia.org', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.it' },
  commons: { id: 'commons', name: 'Wikimedia Commons', homepage: 'https://commons.wikimedia.org', license: 'Licenza indicata per ogni file', licenseUrl: 'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia' },
}
