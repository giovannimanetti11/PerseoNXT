/**
 * Server-side and client-side content processor using Cheerio
 * Extracts headings (H3/H4) and structures HTML content into sections
 *
 * This runs during useAsyncData fetch, so it executes on both server and client
 * ensuring consistent rendering and preventing hydration mismatches.
 */

interface Section {
  heading: string
  content: string
  subSections: SubSection[]
  className: string
}

interface SubSection {
  heading: string
  content: string
}

interface ProcessedContent {
  headings: string[]
  structuredContent: Section[]
}

export const useContentProcessor = () => {
  /**
   * Process HTML content and extract structured sections
   * @param content - Raw HTML content from WordPress
   * @returns Processed content with headings and sections
   */
  const processContent = async (content: string): Promise<ProcessedContent> => {
    // Safety check
    if (!content || typeof content !== 'string') {
      console.warn('processContent: invalid content')
      return {
        headings: [],
        structuredContent: []
      }
    }

    try {
      // Dynamic import of cheerio (works on both server and client)
      const cheerio = await import('cheerio')
      const $ = cheerio.load(content)

      const extractedHeadings: string[] = []
      const extractedSections: Section[] = []

      // Process main sections
      let currentSection: Section | null = null
      let currentSubSection: SubSection | null = null

      try {
        // First try with 'body > *' selector
        const bodyElements = $('body > *')

        // If no body elements found, try with direct children of the root
        const elements = bodyElements.length ? bodyElements : $('> *')

        elements.each(function(index, element) {
          try {
            const $element = $(element)

            // h3 -> new section
            if (element.tagName && element.tagName.toLowerCase() === 'h3') {
              // Save current section/subsection
              if (currentSection) {
                if (currentSubSection) {
                  currentSection.subSections.push(currentSubSection)
                  currentSubSection = null
                }
                extractedSections.push(currentSection)
              }

              const headingText = $element.text().trim()
              extractedHeadings.push(headingText)

              currentSection = {
                heading: headingText,
                content: '',
                subSections: [],
                className: `post-section-${headingText.toLowerCase()
                  .replace(/[\s,\'\`]+/g, '-')
                  .replace(/[àáâãäå]/g, 'a')
                  .replace(/[èéêë]/g, 'e')
                  .replace(/[ìíîï]/g, 'i')
                  .replace(/[òóôõö]/g, 'o')
                  .replace(/[ùúûü]/g, 'u')}`
              }
            }
            // h4 -> subsection
            else if (element.tagName && element.tagName.toLowerCase() === 'h4') {
              if (currentSubSection && currentSection) {
                // push previous sub
                currentSection.subSections.push(currentSubSection)
              }
              currentSubSection = {
                heading: $element.text().trim(),
                content: ''
              }
            }
            // "Riferimenti" paragraph special case
            else if (element.tagName && element.tagName.toLowerCase() === 'p' && $element.text().trim() === 'Riferimenti') {
              if (currentSection) {
                if (currentSubSection) {
                  currentSection.subSections.push(currentSubSection)
                  currentSubSection = null
                }
                extractedSections.push(currentSection)
              }

              currentSection = null

              // Gather everything after the "Riferimenti" paragraph
              const referenceContent = $element
                .nextAll()
                .map((_, el) => $.html(el))
                .get()
                .join('')

              if (referenceContent.trim()) {
                extractedSections.push({
                  heading: 'Riferimenti',
                  content: referenceContent,
                  subSections: [],
                  className: 'post-section-riferimenti'
                })
              }
            }
            // Append content to current subsection or section
            else if (currentSubSection) {
              currentSubSection.content += $.html(element)
            } else if (currentSection) {
              currentSection.content += $.html(element)
            }
          } catch (elementError) {
            console.warn('Error processing element:', elementError)
            // Continue with next element
          }
        })
      } catch (selectorError) {
        console.error('Error with selector:', selectorError)
        // Fallback: use full html as single section
        const allContent = $.html()
        if (allContent) {
          extractedSections.push({
            heading: 'Contenuto',
            content: allContent,
            subSections: [],
            className: 'post-section-contenuto'
          })
        }
      }

      // Add the last section if exists
      if (currentSection) {
        if (currentSubSection) {
          currentSection.subSections.push(currentSubSection)
        }
        extractedSections.push(currentSection)
      }

      // Ensure at least one section exists
      if (extractedSections.length === 0 && content.trim()) {
        extractedSections.push({
          heading: 'Contenuto',
          content: content,
          subSections: [],
          className: 'post-section-contenuto'
        })
      }

      return {
        headings: extractedHeadings,
        structuredContent: extractedSections
      }

    } catch (error) {
      console.error('Content processing error:', error)
      // Return empty structure on error - better than crashing
      return {
        headings: [],
        structuredContent: [{
          heading: 'Contenuto',
          content: content,
          subSections: [],
          className: 'post-section-contenuto'
        }]
      }
    }
  }

  return {
    processContent
  }
}
