<template>
  <div class="flex justify-center mt-14">
    <div class="grid grid-cols-1 px-2 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <div v-for="group in groups" :key="group.letter" class="mb-6 flex flex-row ml-4 md:ml-0">
        <div class="flex items-center justify-center text-xl font-bold w-16 h-16 min-w-16 rounded-full bg-celeste text-white" aria-hidden="true">
          {{ group.letter }}
        </div>
        <ul class="ml-4 flex flex-col gap-4 self-center">
          <li v-for="entry in group.entries" :key="entry.path">
            <NuxtLink :to="entry.path" class="text-black hover:text-blu">
              <span class="block">{{ entry.title }}</span>
              <span v-if="entry.subtitle" class="block italic">{{ entry.subtitle }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface IndexEntry {
  title: string
  subtitle?: string
  path: string
}

const props = defineProps<{ entries: IndexEntry[] }>()

const groups = computed(() => {
  const byLetter = new Map<string, IndexEntry[]>()
  const sorted = [...props.entries].sort((a, b) => a.title.localeCompare(b.title, 'it', { sensitivity: 'base' }))
  for (const entry of sorted) {
    const letter = initialLetter(entry.title)
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), entry])
  }
  return [...byLetter].map(([letter, entries]) => ({ letter, entries }))
})
</script>
