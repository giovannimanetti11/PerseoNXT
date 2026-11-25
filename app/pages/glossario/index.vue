<template>
  <section class="soft-gradient py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Glossario</h1>
    <SiteSearch />
    <LoadingSpinner v-if="pending" />
    <ErrorState v-else-if="error" title="Impossibile caricare il glossario" message="I termini non sono disponibili in questo momento. Ricarica la pagina tra poco." />
    <div v-else-if="groups.length" class="flex justify-center mt-14">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div v-for="group in groups" :key="group.letter" class="mb-6 flex flex-row ml-4 md:ml-0">
          <div class="letter-heading flex items-center justify-center text-xl font-bold w-16 h-16 min-w-16 min-h-16 rounded-full bg-celeste text-white">{{ group.letter }}</div>
          <ul class="ml-4 flex flex-row flex-wrap gap-4 self-center">
            <li v-for="entry in group.entries" :key="entry.path">
              <NuxtLink :to="entry.path" class="text-black hover:text-blu">
                <h2>{{ entry.title }}</h2>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <ErrorState v-else type="empty" title="Nessun termine trovato" message="Il glossario è vuoto." :show-retry="false" :show-contact="false" />
  </section>
  <ContactSection />
</template>

<script setup lang="ts">
import type { WpConnection } from '#shared/types/wordpress'

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

const entries = computed(() => (terms.value ?? []).map((term) => ({
  title: decodeEntities(term.title),
  path: contentPath('glossary', term.slug),
})))

// Terms keep the WordPress order inside each letter, as before.
const groups = computed(() => groupByInitial(entries.value, false))

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
