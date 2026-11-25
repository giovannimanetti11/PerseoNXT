<template>
  <section v-if="headings.length" class="detail-gradient flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto mt-4 rounded-2xl print:py-2 print:px-0 print:w-full">
    <h2 :id="titleId" class="font-bold text-xl md:text-2xl flex items-center">
      <Icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black mr-2" />
      Indice
    </h2>
    <ol class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2" :aria-labelledby="titleId">
      <li
        v-for="(heading, index) in headings"
        :key="heading"
        :class="['py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl text-xs md:text-sm hover:bg-celeste cursor-pointer', itemWidth]"
      >
        <a :href="`#section${index + 1}`" class="flex items-center group w-full">
          <span class="flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white text-verde rounded-full mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">
            {{ index + 1 }}
          </span>
          <span class="text-left">{{ heading }}</span>
        </a>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  headings: string[]
  /** Width classes of each entry (monographs use a denser grid). */
  itemWidth?: string
}>(), { itemWidth: 'm-1 w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.5rem)]' })
const titleId = useId()
</script>
