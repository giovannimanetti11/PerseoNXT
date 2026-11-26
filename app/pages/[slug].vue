<template>
  <div id="post">
    <section class="detail-gradient w-11/12 mx-auto rounded-2xl px-4 md:px-10 pt-24 md:pt-32 pb-8 md:pb-10 print:py-2 print:px-0 print:w-full">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-start">
        <div class="min-w-0 order-2 lg:order-1">
          <Breadcrumbs class="mb-8" :current-page-name="plant.title" parent-path="/piante-medicinali" parent-name="Piante medicinali" />
          <PlantInfo :plant="plant" />
        </div>
        <div class="min-w-0 order-1 lg:order-2">
          <PlantGallery :featured="plant.featuredImage" :additional="plant.additionalImages" :source-media="extra?.media" :title="plant.title" />
        </div>
      </div>
      <PlantFacts class="mt-8" :plant="plant" :data="extra" :sections="sectionNumbers" />
    </section>

    <div class="w-11/12 mx-auto mt-4 grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)] items-start print:block print:w-full">
      <PlantToc :headings="toc" />

      <div class="min-w-0 -mt-4">
        <NumberedSection v-if="plant.tags.length" heading="Proprietà terapeutiche" :number="numberOf(TAGS)" extra-class="w-full">
          <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4">
            <li
              v-for="tag in plant.tags"
              :key="tag.id"
              class="relative hover:bg-blu hover:text-white text-center bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer"
            >
              <button
                type="button"
                class="w-full h-full py-2 md:py-3 px-3 md:px-4"
                @click="openTag = tag"
                @mouseenter="tag.description ? (openTag = tag) : undefined"
              >
                {{ tag.name }}
              </button>
            </li>
          </ul>
        </NumberedSection>

        <NumberedSection v-if="plant.nomeScientifico" :heading="TAXONOMY" :number="numberOf(TAXONOMY)" extra-class="w-full">
          <PlantTaxonomy :taxonomy="extra?.taxonomy ?? null" :scientific-name="plant.nomeScientifico" />
        </NumberedSection>

        <NumberedSection v-if="showNames" :heading="NAMES" :number="numberOf(NAMES)" extra-class="w-full">
          <PlantNames :parts="plant.partiUsate" :names="plant.nomeComune" :source-names="extra?.commonNames ?? []" />
        </NumberedSection>

        <NumberedSection v-if="showPhytochemistry" heading="Fitochimica" :number="numberOf(CHEMISTRY)" extra-class="w-full post-section-fitochimica">
          <RichContent v-if="plant.costituenti" class="mt-4" :content="plant.costituenti" />
          <PlantCompounds v-if="hasCompounds && extra" :slug="plant.slug" :scientific-name="extra.taxonomy?.acceptedName ?? plant.nomeScientifico" :total="extra.compounds.total" :initial="extra.compounds.items" />
        </NumberedSection>

        <ContentSections :content="plant.content" :toc="toc" section-width="w-full">
          <template #before="{ heading }">
            <template v-if="heading === REFERENCES">
              <NumberedSection v-if="showResearch && !hasResearchHeading" :heading="RESEARCH" :number="numberOf(RESEARCH)" extra-class="w-full">
                <PlantResearch :literature="extra?.literature ?? null" :trials="extra?.trials ?? null" />
              </NumberedSection>
              <DrugInteractions v-if="plant.interazioni" :interactions="plant.interazioni" :number="numberOf(INTERACTIONS)" width="w-full" />
              <NumberedSection v-if="plant.nomeScientifico" :heading="DISTRIBUTION" :number="numberOf(DISTRIBUTION)" extra-class="w-full">
                <PlantDistribution :scientific-name="plant.nomeScientifico" :distribution="extra?.distribution ?? null" />
              </NumberedSection>
            </template>
          </template>
          <template #inside="{ heading }">
            <PlantCompounds
              v-if="heading === CHEMISTRY && hasCompounds && extra"
              :slug="plant.slug"
              :scientific-name="extra.taxonomy?.acceptedName ?? plant.nomeScientifico"
              :total="extra.compounds.total"
              :initial="extra.compounds.items"
            />
          </template>
          <template #after="{ heading }">
            <NumberedSection v-if="heading === RESEARCH_EDITORIAL && showResearch" :heading="RESEARCH" :number="numberOf(RESEARCH)" extra-class="w-full">
              <PlantResearch :literature="extra?.literature ?? null" :trials="extra?.trials ?? null" />
            </NumberedSection>
          </template>
        </ContentSections>

        <template v-if="!hasReferences">
          <NumberedSection v-if="showResearch && !hasResearchHeading" :heading="RESEARCH" :number="numberOf(RESEARCH)" extra-class="w-full">
            <PlantResearch :literature="extra?.literature ?? null" :trials="extra?.trials ?? null" />
          </NumberedSection>
          <DrugInteractions v-if="plant.interazioni" :interactions="plant.interazioni" :number="numberOf(INTERACTIONS)" width="w-full" />
          <NumberedSection v-if="plant.nomeScientifico" :heading="DISTRIBUTION" :number="numberOf(DISTRIBUTION)" extra-class="w-full">
            <PlantDistribution :scientific-name="plant.nomeScientifico" :distribution="extra?.distribution ?? null" />
          </NumberedSection>
        </template>

        <NumberedSection v-if="extra?.sources.length" :heading="SOURCES" :number="numberOf(SOURCES)" extra-class="w-full">
          <PlantSources :data="extra" />
        </NumberedSection>
      </div>
    </div>

    <InfoDialog tooltip :open="openTag !== null" :title="openTag?.name ?? ''" @close="openTag = null">
      <div v-html="sanitizeHtml(openTag?.description)"></div>
    </InfoDialog>

    <ClientOnly>
      <EditProposal :sections="toc" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { WpTag } from '#shared/types/wordpress'
import type { PlantData } from '#shared/types/plantData'

const TAGS = 'Proprietà terapeutiche'
const TAXONOMY = 'Nome scientifico e tassonomia'
const NAMES = 'Parti usate e nomi comuni'
const CHEMISTRY = 'Fitochimica'
const RESEARCH_EDITORIAL = 'Ricerca scientifica'
const RESEARCH = 'La ricerca in numeri'
const INTERACTIONS = 'Interazioni con farmaci'
const DISTRIBUTION = 'Distribuzione e osservazioni'
const REFERENCES = 'Riferimenti'
const SOURCES = 'Fonti dei dati'

const plant = await useContentPage('plant')
const openTag = ref<WpTag | null>(null)

// Open data from the plant data service. Optional: when the service has no
// data or is down, the page shows the editorial content only.
const { data: extra } = await useFetch<PlantData | null>(() => `/api/plant-data/${plant.value.slug}`, {
  key: computed(() => `plant-data-${plant.value.slug}`),
  default: () => null,
})

const headings = computed(() => plant.value.content.sections.map((section) => section.heading))
const hasReferences = computed(() => headings.value.includes(REFERENCES))
const hasResearchHeading = computed(() => headings.value.includes(RESEARCH_EDITORIAL))
const hasCompounds = computed(() => Boolean(extra.value?.compounds.total))
const showResearch = computed(() => Boolean(extra.value?.literature || extra.value?.trials?.total))
const showNames = computed(() => Boolean(plant.value.partiUsate.length || plant.value.nomeComune.length || extra.value?.commonNames.length))
// Constituents have their own field; WordPress bodies written later already contain a Fitochimica section.
const showPhytochemistry = computed(() => (Boolean(plant.value.costituenti) || hasCompounds.value) && !headings.value.includes(CHEMISTRY))

const toc = computed(() => {
  const value = plant.value
  const fixed = [
    value.tags.length && TAGS,
    value.nomeScientifico && TAXONOMY,
    showNames.value && NAMES,
    showPhytochemistry.value && CHEMISTRY,
  ].filter((heading): heading is string => typeof heading === 'string')

  const body: string[] = []
  const tail = [
    showResearch.value && !hasResearchHeading.value && RESEARCH,
    value.interazioni && INTERACTIONS,
    value.nomeScientifico && DISTRIBUTION,
  ].filter((heading): heading is string => typeof heading === 'string')
  for (const heading of headings.value) {
    if (heading === REFERENCES) body.push(...tail)
    body.push(heading)
    if (heading === RESEARCH_EDITORIAL && showResearch.value) body.push(RESEARCH)
  }
  if (!hasReferences.value) body.push(...tail)
  return [...fixed, ...body, ...(extra.value?.sources.length ? [SOURCES] : [])]
})

const numberOf = (heading: string) => toc.value.indexOf(heading) + 1

const sectionNumbers = computed(() => ({
  taxonomy: numberOf(TAXONOMY),
  parts: numberOf(NAMES),
  chemistry: numberOf(CHEMISTRY),
  research: numberOf(RESEARCH),
  distribution: numberOf(DISTRIBUTION),
}))
</script>
