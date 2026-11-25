<template>
  <section class="soft-gradient py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Glossario</h1>
    <SiteSearch />
    <LoadingSpinner v-if="pending" />
    <ErrorState v-else-if="error" title="Impossibile caricare il glossario" message="I termini non sono disponibili in questo momento. Ricarica la pagina tra poco." />
    <LetterIndex v-else-if="entries.length" :entries="entries" />
    <ErrorState v-else type="empty" title="Nessun termine trovato" message="Il glossario è vuoto." :show-retry="false" :show-contact="false" />
  </section>
  <ContactSection />
</template>

<script setup lang="ts">
import type { WpConnection } from '#shared/types/wordpress'
import type { IndexEntry } from '~/components/LetterIndex.vue'

const ALL_TERMS = `
  query AllGlossaryTerms {
    glossaryTerms(first: 500) { nodes { title slug } }
  }
`

const { query } = useGraphQL()

const { data: terms, pending, error } = await useAsyncData('all-glossary-terms', async () => {
  const { glossaryTerms } = await query<{ glossaryTerms: WpConnection<{ title: string; slug: string }> }>(ALL_TERMS)
  return glossaryTerms.nodes
})

const entries = computed<IndexEntry[]>(() => (terms.value ?? []).map((term) => ({
  title: decodeEntities(term.title),
  path: contentPath('glossary', term.slug),
})))

const description = 'Glossario dei termini di botanica, fitochimica e fitoterapia usati nelle schede delle piante medicinali.'

useSeoMeta({
  title: 'Glossario',
  description,
  ogTitle: 'Glossario | Wikiherbalist',
  ogDescription: description,
  twitterTitle: 'Glossario | Wikiherbalist',
  twitterDescription: description,
})

useHead(() => ({
  script: entries.value.length
    ? [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          name: 'Glossario di fitoterapia e botanica',
          url: `${SITE_URL}/glossario`,
          inLanguage: 'it-IT',
          hasDefinedTerm: entries.value.map((entry) => ({
            '@type': 'DefinedTerm',
            name: entry.title,
            url: `${SITE_URL}${entry.path}`,
          })),
        }),
      }]
    : [],
}))
</script>
