<template>
  <div class="flex flex-col relative">
    <div class="flex flex-row">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
      <button @click="speakTitle" class="flex text-5xl ml-4 mb-2 shadow text-white bg-blu rounded-full w-12 h-12 justify-center items-center hover:bg-white hover:text-blu print:hidden">
        <Icon name="f7:speaker-1-fill" class="text-4xl" />
      </button>
    </div>
    <p class="text-xl italic text-gray-700">{{ nomeScientifico }}</p>

    <!-- Basionym and synonyms -->
    <div v-if="basionym" class="mt-4">
      <div class="relative inline-block mr-1">
        <span class="text-black">Basionimo</span>
        <Icon 
          name="mdi:information-outline" 
          class="text-blu ml-1 cursor-pointer"
          @mouseenter="showBasionymTooltip = true"
          @mouseleave="showBasionymTooltip = false"
        />
        <div 
          v-if="showBasionymTooltip" 
          class="absolute z-20 bg-white border border-blu rounded-lg shadow-lg p-4 text-sm text-gray-700 w-64 left-1/2 transform -translate-x-1/2 mt-2"
        >
          Il basionimo è il nome scientifico originale su cui si basa un nuovo nome quando una specie viene riclassificata. 
          Nella nomenclatura botanica, il nome dell'autore originale viene messo tra parentesi, seguito dal nome di chi ha effettuato la riclassificazione.
        </div>
      </div>
      <span class="text-black">:</span>
      <span class="italic ml-2 text-gray-700">{{ basionym }}</span>
    </div>
    <div v-if="synonyms.length > 0" class="relative mt-2 sinonimi">
      <button @click="toggleSynonyms" class="group flex items-center py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="bi:list" class="text-xl md:text-3xl group-hover:text-white mr-2" />
        <span class="ml-2 text-base">Sinonimi ({{ synonyms.length }})</span>
      </button>
      <transition name="slide-fade">
        <div v-if="showSynonyms" ref="synonymsList" class="absolute z-10 mt-2 bg-white rounded-md shadow-md p-2 max-h-60 overflow-y-auto w-full">
          <ul>
            <li v-for="synonym in synonyms" :key="synonym" class="italic py-1 border-b last:border-b-0 border-gray-200">
              {{ synonym }}
            </li>
          </ul>
        </div>
      </transition>
    </div>

    <!-- Print, Share, Cite buttons -->
    <div class="postinfo-buttons flex mt-4 print:hidden">
      <button @click="printPost" class="group flex items-center mr-2 py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300 hidden sm:flex">
        <Icon name="mingcute:print-fill" class="text-lg md:text-xl group-hover:text-white" />
        <span class="ml-1 md:ml-2 text-base">Stampa</span>
      </button>
      <button @click="openShareModal" class="group flex items-center mr-2 py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="ic:round-share" class="text-lg md:text-xl group-hover:text-white" />
        <span class="ml-1 md:ml-2 text-base">Condividi</span>
      </button>
      <button @click="openCiteModal" class="group flex items-center py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="bi:quote" class="text-lg md:text-xl group-hover:text-white" />
        <span class="ml-1 md:ml-2 text-base">Cita</span>
      </button>
    </div>
    <p class="mt-4 text-xs text-gray-500">
      Scheda pubblicata il {{ formattedPublishDate }}
    </p>
    <p class="text-xs text-gray-500 mt-2">
      Di: {{ authorName === 'wh_admin' ? 'Editors of Wikiherbalist' : authorName }}
    </p>
    <div class="flex items-center mt-2 text-xs text-gray-500">
      <Icon name="ph:clock-fill" class="text-sm text-gray-600 mr-1.5" />
      <span>Tempo di lettura: {{ readingTime }} min</span>
    </div>
    <div v-if="publicationCount > 0" class="flex flex-row mt-4">
      <a :href="pubmedUrl" target="_blank" class="hover:opacity-80">
        <img src="/media/pubmed_logo.png" alt="PubMed logo" class="h-8 mr-2">
      </a>
      <div>
        <a :href="pubmedUrl" target="_blank" class="text-lg font-bold text-blu link hover:text-celeste">
          {{ publicationCount }}
        </a> pubblicazioni
      </div>
    </div>
    <div v-if="classification" class="mt-6">
      <ul class="max-w-96">
        <li v-for="(item, key) in classification" :key="key" class="px-4 py-2 mt-1.5 bg-white border rounded-lg shadow">
          <span class="text-black">{{ key }}:</span> <a :href="item.link" class="text-blu hover:text-celeste" target="_blank">{{ item.name }}</a>
        </li>
      </ul>
    </div>
    
    <!-- Share Modal -->
    <component :is="renderShareModal" />

    <!-- Cite Modal -->
    <component :is="renderCiteModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useShare } from '~/composables/useShare';
import { useCite } from '~/composables/useCite';
import { useFetch } from '#app';
import { apiConfig } from '~/config';

interface Props {
  title: string;
  nomeScientifico: string;
  publishDate: string;
  content: string;
  authorName: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  nomeScientifico: '',
  publishDate: '',
  content: '',
  authorName: ''
});

// Share composable
const { openShareModal, renderShareModal } = useShare();

// Cite composable
const { openCiteModal, renderCiteModal } = useCite(props.title, props.authorName, props.publishDate);

const showBasionymTooltip = ref(false);
const basionym = ref('');
const synonyms = ref<string[]>([]);
const showSynonyms = ref(false);
const synonymsList = ref<HTMLElement | null>(null);

const publicationCount = ref(0);
const classification = ref<Record<string, { name: string; link: string }> | null>(null);

const binomialName = computed(() => props.nomeScientifico.split(' ').slice(0, 2).join(' '));
const pubmedUrl = computed(() => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(binomialName.value)}`);

const readingTime = computed(() => Math.ceil(props.content.split(/\s+/).length / 200));

const formattedPublishDate = computed(() => getFormattedDate(props.publishDate));
const getFormattedDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'data non disponibile' : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

function speakTitle(): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(props.title);
    utterance.lang = 'it-IT';
    window.speechSynthesis.speak(utterance);
  } else {
    alert('La sintesi vocale non è supportata in questo browser.');
  }
}

const printPost = (): void => {
  if (window.innerWidth >= 640) { 
    window.print();
  }
};

const toggleSynonyms = (): void => {
  showSynonyms.value = !showSynonyms.value;
};

// Fetch GBIF data for basionym and synonyms
const fetchGBIFData = async (): Promise<void> => {
  try {
    console.log('Fetching data for:', props.nomeScientifico);
    const { data: matchData } = await useFetch<{ usageKey: number }>(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(props.nomeScientifico)}`);
    console.log('Match data:', matchData.value);
    
    if (matchData.value?.usageKey) {
      const { data: detailsData } = await useFetch<{ basionym?: string }>(`https://api.gbif.org/v1/species/${matchData.value.usageKey}`);
      console.log('Details data:', detailsData.value);
      
      if (detailsData.value?.basionym) {
        basionym.value = detailsData.value.basionym;
        console.log('Basionym set to:', basionym.value);
      } else {
        console.log('No basionym found in the details data');
      }

      const { data: synonymsData } = await useFetch<{ results: Array<{ taxonomicStatus: string; scientificName: string; canonicalName: string }> }>(`https://api.gbif.org/v1/species/${matchData.value.usageKey}/synonyms`);
      console.log('Synonyms data:', synonymsData.value);
      
      synonyms.value = synonymsData.value?.results
        .filter(s => s.taxonomicStatus === 'SYNONYM')
        .map(s => s.scientificName || s.canonicalName) || [];
      console.log('Synonyms set to:', synonyms.value);
    }
  } catch (error) {
    console.error('Error fetching GBIF data:', error);
  }
};

const handleClickOutside = (event: MouseEvent): void => {
  if (synonymsList.value && !synonymsList.value.contains(event.target as Node) && !event.target?.closest('button')) {
    showSynonyms.value = false;
  }
  showBasionymTooltip.value = false;
};

onMounted(async () => {
  fetchGBIFData();
  document.addEventListener('click', handleClickOutside);
  
  try {
    const { data: pubMedData } = await useFetch<{ esearchresult: { count: number } }>(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: binomialName.value,
        retmode: 'json',
        api_key: apiConfig.pubMedApiKey
      }
    });

    publicationCount.value = pubMedData.value?.esearchresult.count || 0;
  } catch (error) {
    console.error('Error fetching data from PubMed:', error);
    publicationCount.value = 0;
  }

  try {
    const { data: classificationData } = await useFetch<Record<string, string>>(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(props.nomeScientifico)}`);
    classification.value = formatClassification(classificationData.value || {});
  } catch (error) {
    console.error('Error fetching classification data:', error);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function formatClassification(data: Record<string, string>): Record<string, { name: string; link: string }> {
  const taxonomyMap: Record<string, string> = {
    kingdom: 'Regno',
    phylum: 'Phylum',
    class: 'Classe',
    order: 'Ordine',
    family: 'Famiglia',
    genus: 'Genere',
    species: 'Specie',
  };
  const formatted: Record<string, { name: string; link: string }> = {};
  Object.keys(taxonomyMap).forEach(key => {
    if (data[key]) {
      const wikiLink = `https://it.wikipedia.org/wiki/${encodeURIComponent(data[key])}`;
      formatted[taxonomyMap[key]] = { name: data[key], link: wikiLink };
    }
  });
  return formatted;
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>