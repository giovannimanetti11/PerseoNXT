<template>
  <div class="flex flex-col relative">
    <div class="flex flex-row items-center">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
    </div>
    <!-- Print, Share, Cite buttons -->
    <div class="postinfo-buttons flex mt-4 print:hidden">
      <button @click="printPost" class="group flex items-center mr-2 py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300 hidden sm:flex">
        <icon name="mingcute:print-fill" class="text-lg md:text-xl group-hover:text-white" />
        <span class="ml-1 md:ml-2 text-base">Stampa</span>
      </button>
      <button @click="openShareModal" class="group flex items-center mr-2 py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <icon name="ic:round-share" class="text-lg md:text-xl group-hover:text-white" />
        <span class="ml-1 md:ml-2 text-base">Condividi</span>
      </button>
      <button @click="openCiteModal" class="group flex items-center py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <icon name="bi:quote" class="text-lg md:text-xl group-hover:text-white" />
        <span class="ml-1 md:ml-2 text-base">Cita</span>
      </button>
    </div>
    <!-- Publication date -->
    <p class="mt-4 text-xs text-gray-500">
      Articolo pubblicato il {{ formattedPublishDate }}
    </p>
    <!-- Author name -->
    <p class="text-xs text-gray-500 mt-2">
      Di: {{ displayAuthorName }}
    </p>
    <!-- Reading time -->
    <div class="flex items-center mt-2 text-xs text-gray-500">
      <Icon name="ph:clock-fill" class="text-sm text-gray-600 mr-1.5" />
      <span>Tempo di lettura: {{ calculatedReadingTime }} min</span>
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

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useShare } from '~/composables/useShare';
import { useCite } from '~/composables/useCite';

interface BlogInfoProps {
  title: string;
  publishDate: string;
  authorName: string;
  content: string;
}

const props = defineProps<BlogInfoProps>();

// Share composable
const { openShareModal, renderShareModal } = useShare();

// Cite composable
const { openCiteModal, renderCiteModal, updateTitle, updateAuthorName, updatePublishDate } = useCite(props.title, props.authorName, props.publishDate);

// Format the publication date
const formattedPublishDate = computed((): string => formatDate(props.publishDate));

// Display author name, handling special cases
const displayAuthorName = computed(() => props.authorName === 'wh_admin' ? 'Editors of Wikiherbalist' : props.authorName);

// Computed property to calculate reading time
const calculatedReadingTime = computed(() => {
  // Remove HTML tags from content
  let cleanContent = props.content.replace(/<[^>]*>/g, '');

  // Remove everything after "Riferimenti"
  const riferimentiIndex = cleanContent.indexOf('Riferimenti');
  if (riferimentiIndex !== -1) {
    cleanContent = cleanContent.substring(0, riferimentiIndex);
  }

  // Count words
  const wordCount = cleanContent.trim().split(/\s+/).length;

  // Calculate reading time (assuming average reading speed of 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);

  // Ensure the reading time is at least 1 minute
  return Math.max(1, readingTime);
});

// Function to format dates to Italian locale
function formatDate(dateStr) {
  if (!dateStr) return 'Data non disponibile';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'Data non disponibile' : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Function to print the post
const printPost = () => {
  if (window.innerWidth >= 640) { 
    window.print();
  }
};

// Update cite modal data on mount and when props change
onMounted(() => {
  updateTitle(props.title);
  updateAuthorName(props.authorName);
  updatePublishDate(props.publishDate);
});

watch(() => ({ ...props }), (newProps) => {
  updateTitle(newProps.title);
  updateAuthorName(newProps.authorName);
  updatePublishDate(newProps.publishDate);
}, { deep: true });

</script>
