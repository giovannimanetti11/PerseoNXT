<template>
  <section class="py-10 w-11/12 mx-auto rounded-2xl bg-gradient-to-b from-[#e0edfd] to-[#f5f5f5]">
    <div class="container mx-auto px-4">
      <!-- Two-way Switch -->
      <div class="mb-6 flex justify-center">
        <div class="bg-white rounded-lg shadow-md p-1 inline-flex">
          <button 
            @click="setView('monographs')" 
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blu focus:ring-offset-2"
            :class="currentView === 'monographs' ? 'bg-blu text-white' : 'text-blu hover:bg-gray-100'"
            :aria-pressed="(currentView === 'monographs').toString()"
            role="tab"
          >
            Monografie
          </button>
          <button 
            @click="setView('properties')" 
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blu focus:ring-offset-2 ml-1"
            :class="currentView === 'properties' ? 'bg-blu text-white' : 'text-blu hover:bg-gray-100'"
            :aria-pressed="(currentView === 'properties').toString()"
            role="tab"
          >
            Proprietà
          </button>
        </div>
      </div>

      <h2 class="text-3xl md:text-4xl font-bold text-center text-black mb-6">
        <span v-if="currentView === 'monographs'">
          Sfoglia le <span class="text-blu">monografie</span> delle piante medicinali
        </span>
        <span v-else>
          Scopri le <span class="text-blu">proprietà terapeutiche</span> delle piante medicinali
        </span>
      </h2>

      <!-- Content area -->
      <Suspense>
        <template #default>
          <div v-if="currentView === 'monographs'">
            <BrowseByLetter />
          </div>
          <div v-else>
            <TagsPosts :searchTerm="searchTerm" />
          </div>
        </template>
        <template #fallback>
          <div class="w-full h-64 flex items-center justify-center">
            <Icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
          </div>
        </template>
      </Suspense>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import BrowseByLetter from '~/components/browse-by-letter.vue';
import TagsPosts from '~/components/tags-posts.vue';

const props = defineProps({
  currentView: {
    type: String,
    required: true
  },
  searchTerm: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['viewChange']);

const setView = (view) => {
  emit('viewChange', view);
};
</script>