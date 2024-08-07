<template>
  <div class="flex flex-col relative">
    <div class="flex flex-row">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
    </div>
    <div class="postinfo-buttons flex mt-4 print:hidden">
      <button @click="printPost" class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border border-blu rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="mingcute:print-fill" class="text-xl md:text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Stampa</span>
      </button>
      <button @click="openShareModal" class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border border-blu rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="ic:round-share" class="text-xl md:text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Condividi</span>
      </button>
      <button @click="openCiteModal" class="group flex items-center py-2 px-4 bg-white shadow text-blu border border-blu rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="bi:quote" class="text-xl md:text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Cita</span>
      </button>
    </div>
    <p class="mt-4 text-xs text-gray-500">
      Articolo pubblicato il {{ formattedPublishDate }}
    </p>
    <p class="text-xs text-gray-500 mt-2">
      Di: {{ displayAuthorName }}
    </p>
    <div class="flex items-center mt-2 text-xs text-gray-500">
      <Icon name="ph:clock-fill" class="text-sm text-gray-600 mr-1.5" />
      <span>Tempo di lettura: {{ readingTime }} min</span>
    </div>
    
    <!-- Share Modal -->
    <ClientOnly>
      <component :is="renderShareModal" />
    </ClientOnly>

    <!-- Cite Modal -->
    <ClientOnly>
      <component :is="renderCiteModal" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useShare } from '~/composables/useShare';
import { useCite } from '~/composables/useCite';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  publishDate: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  readingTime: {
    type: Number,
    required: true
  }
});

const { openShareModal, renderShareModal } = useShare();
const { openCiteModal, renderCiteModal, updateTitle, updateAuthorName, updatePublishDate } = useCite(props.title, props.authorName, props.publishDate);

const formattedPublishDate = computed(() => formatDate(props.publishDate));
const displayAuthorName = computed(() => props.authorName === 'wh_admin' ? 'Editors of Wikiherbalist' : props.authorName);

function formatDate(dateStr) {
  if (!dateStr) return 'Data non disponibile';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'Data non disponibile' : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

const printPost = () => {
  if (process.client) {
    window.print();
  }
};

onMounted(() => {
  updateTitle(props.title);
  updateAuthorName(props.authorName);
  updatePublishDate(props.publishDate);
});

watch(() => props.title, (newTitle) => {
  updateTitle(newTitle);
});

watch(() => props.authorName, (newAuthorName) => {
  updateAuthorName(newAuthorName);
});

watch(() => props.publishDate, (newPublishDate) => {
  updatePublishDate(newPublishDate);
});
</script>