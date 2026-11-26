<template>
  <div id="post">
    <section class="detail-gradient flex flex-col md:flex-row py-20 px-2 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
      <div class="w-full md:w-2/5 md:mt-28 mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
        <Breadcrumbs class="mb-12" :current-page-name="plant.title" parent-path="/piante-medicinali" parent-name="Piante medicinali" />
        <PlantInfo :plant="plant" />
      </div>
      <div class="w-full md:w-3/5 flex flex-col order-1 md:order-2 mb-8 md:mb-0">
        <!-- Block wrapper: the gallery floats right, which a flex parent would ignore. -->
        <div class="md:mr-16 mb-8">
          <PlantGallery :featured="plant.featuredImage" :additional="plant.additionalImages" />
        </div>
        <LazyObservationsMap v-if="plant.nomeScientifico" :nome-scientifico="plant.nomeScientifico" class="mt-8 md:mt-0 pb-4" />
      </div>
    </section>

    <TableOfContents :headings="toc" item-width="w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0" />

    <NumberedSection v-if="plant.tags.length" heading="Proprietà terapeutiche" :number="numberOf('Proprietà terapeutiche')">
      <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4">
        <li
          v-for="tag in plant.tags"
          :key="tag.id"
          class="relative hover:bg-blu hover:text-white text-center bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0"
        >
          <button
            type="button"
            class="w-full h-full py-2 md:py-4 px-2 md:px-4"
            @click="openTag = tag"
            @mouseenter="tag.description ? (openTag = tag) : undefined"
          >
            {{ tag.name }}
          </button>
        </li>
      </ul>
    </NumberedSection>

    <div class="flex flex-col md:flex-row w-11/12 mx-auto print:w-full gap-4 md:gap-8">
      <div class="flex flex-col w-full md:w-1/2">
        <NumberedSection v-if="plant.nomeScientifico" heading="Nome scientifico" :number="numberOf('Nome scientifico')" extra-class="w-full">
          <p class="text-center italic mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm w-full md:w-2/5">
            {{ plant.nomeScientifico }}
          </p>
        </NumberedSection>
        <NumberedSection v-if="plant.partiUsate.length" heading="Parti usate" :number="numberOf('Parti usate')" extra-class="w-full">
          <ul class="flex flex-wrap gap-2 md:gap-4">
            <li v-for="part in plant.partiUsate" :key="part" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm w-full sm:w-2/5">
              {{ part }}
            </li>
          </ul>
        </NumberedSection>
      </div>
      <NumberedSection v-if="plant.nomeComune.length" heading="Nome comune" :number="numberOf('Nome comune')" extra-class="w-full md:w-1/2">
        <ul class="flex flex-wrap gap-2 md:gap-4">
          <li v-for="name in plant.nomeComune" :key="name" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm w-full sm:w-2/5">
            {{ name }}
          </li>
        </ul>
      </NumberedSection>
    </div>

    <NumberedSection v-if="showPhytochemistry" heading="Fitochimica" :number="numberOf('Fitochimica')" extra-class="w-11/12 post-section-fitochimica">
      <RichContent class="mt-4" :content="plant.costituenti" />
    </NumberedSection>

    <ContentSections :content="plant.content" :toc="toc">
      <template #before="{ heading }">
        <DrugInteractions
          v-if="plant.interazioni && heading === REFERENCES"
          :interactions="plant.interazioni"
          :number="numberOf(INTERACTIONS)"
        />
      </template>
    </ContentSections>
    <DrugInteractions
      v-if="plant.interazioni && !hasReferences"
      :interactions="plant.interazioni"
      :number="numberOf(INTERACTIONS)"
    />

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

const REFERENCES = 'Riferimenti'
const INTERACTIONS = 'Interazioni con farmaci'

const plant = await useContentPage('plant')
const openTag = ref<WpTag | null>(null)

const headings = computed(() => plant.value.content.sections.map((section) => section.heading))
const hasReferences = computed(() => headings.value.includes(REFERENCES))
// Constituents have their own field; WordPress bodies written later already contain a Fitochimica section.
const showPhytochemistry = computed(() => Boolean(plant.value.costituenti) && !headings.value.includes('Fitochimica'))

const toc = computed(() => {
  const value = plant.value
  const fixed = [
    value.tags.length && 'Proprietà terapeutiche',
    value.nomeScientifico && 'Nome scientifico',
    value.partiUsate.length && 'Parti usate',
    value.nomeComune.length && 'Nome comune',
    showPhytochemistry.value && 'Fitochimica',
  ].filter((heading): heading is string => typeof heading === 'string')

  const body = [...headings.value]
  if (value.interazioni) {
    const at = body.indexOf(REFERENCES)
    body.splice(at === -1 ? body.length : at, 0, INTERACTIONS)
  }
  return [...fixed, ...body]
})

const numberOf = (heading: string) => toc.value.indexOf(heading) + 1
</script>
