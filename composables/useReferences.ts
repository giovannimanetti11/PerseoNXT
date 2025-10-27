interface Reference {
  authors: string
  year: string
  title: string
  journal?: string
  publisher?: string
  doi?: string
}

export function useReferences() {
  const parseReferences = (referencesHtml: string): Reference[] => {
    const references: Reference[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(referencesHtml, 'text/html')
    const items = doc.querySelectorAll('ol > li')

    items.forEach(item => {
      const text = item.textContent || ''
      
      // Parse DOI
      const doiMatch = text.match(/https:\/\/doi\.org\/(.+)$/)
      const doi = doiMatch ? doiMatch[1] : undefined

      // Parse authors and year
      const yearMatch = text.match(/\((\d{4})\)/)
      const year = yearMatch ? yearMatch[1] : ''
      
      // Split by year to get authors
      const parts = text.split(yearMatch?.[0] || '')
      const authors = parts[0].trim().replace(/\.$/, '')

      // Parse title and journal
      const remainingText = parts[1] || ''
      const titleMatch = remainingText.match(/\.(.*?)\./i)
      const title = titleMatch ? titleMatch[1].trim() : ''

      // Parse journal or publisher
      const journalMatch = remainingText.match(/\.(.*?),/)
      const journal = journalMatch ? journalMatch[1].trim().replace(/^In /, '') : undefined

      // Parse publisher for books
      const publisherMatch = remainingText.match(/\.\s*([^\.]+)\.$/)
      const publisher = publisherMatch ? publisherMatch[1].trim() : undefined

      references.push({
        authors,
        year,
        title,
        journal,
        publisher,
        doi
      })
    })

    return references
  }

  return {
    parseReferences
  }
} 