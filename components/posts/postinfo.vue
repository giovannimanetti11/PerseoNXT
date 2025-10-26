<template>
  <div class="flex flex-col relative">
    <div class="flex flex-row items-center">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
      <div v-if="isVerified" class="relative ml-2">
        <img
          src="/media/icon_verified.svg"
          alt="Verified"
          class="w-6 h-6 cursor-help"
          @mouseenter="showVerifiedTooltip = true"
          @mouseleave="showVerifiedTooltip = false"
        />
        <div
          v-if="showVerifiedTooltip"
          class="absolute z-20 bg-white border border-blu rounded-lg shadow-lg p-2 text-sm text-gray-700 w-48 left-1/2 transform -translate-x-1/2 mt-2"
        >
          Ultima revisione: {{ formattedRevisionDate }}
        </div>
      </div>
      <button @click="speakTitle" class="flex ml-2 shadow text-white bg-blu rounded-full w-6 h-6 justify-center items-center hover:bg-white hover:text-blu print:hidden" aria-label="Leggi il titolo ad alta voce">
        <Icon name="f7:speaker-1-fill" class="text-xl" aria-hidden="true" />
      </button>
    </div>
    <p class="text-xl italic text-gray-700">{{ nomeScientifico }}</p>

    <!-- Basionym and synonyms -->
    <ClientOnly>
      <div v-if="basionym" class="mt-4">
        <div class="relative inline-block mr-1">
          <span class="text-black">Basionimo</span>
          <Icon 
            name="mdi:information-outline" 
            class="text-blu ml-1 cursor-pointer"
            @mouseenter="showBasionymTooltip = true"
            @mouseleave="showBasionymTooltip = false"
            aria-label="Informazioni sul basionimo"
          />
          <div 
            v-if="showBasionymTooltip" 
            class="absolute z-20 bg-white border border-blu rounded-lg shadow-lg p-4 text-sm text-gray-700 w-64 left-1/2 transform -translate-x-1/2 mt-2"
            role="tooltip"
          >
            Il basionimo è il nome scientifico originale su cui si basa un nuovo nome quando una specie viene riclassificata. 
            Nella nomenclatura botanica, il nome dell'autore originale viene messo tra parentesi, seguito dal nome di chi ha effettuato la riclassificazione.
          </div>
        </div>
        <span class="text-black">:</span>
        <span class="italic ml-2 text-gray-700">{{ basionym }}</span>
      </div>
      <div v-if="synonyms.length > 0" class="relative mt-2 sinonimi">
        <button @click="toggleSynonyms" class="group flex items-center py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300" :aria-expanded="showSynonyms">
          <Icon name="bi:list" class="text-xl md:text-3xl group-hover:text-white mr-2" aria-hidden="true" />
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
    </ClientOnly>

    <!-- Print, Share, Cite buttons -->
    <div class="postinfo-buttons flex mt-4 print:hidden">
      <button @click="printPost" class="group flex items-center mr-2 py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300 hidden sm:flex">
        <Icon name="mingcute:print-fill" class="text-lg md:text-xl group-hover:text-white" aria-hidden="true" />
        <span class="ml-1 md:ml-2 text-base">Stampa</span>
      </button>
      <button @click="openShareModal" class="group flex items-center mr-2 py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="ic:round-share" class="text-lg md:text-xl group-hover:text-white" aria-hidden="true" />
        <span class="ml-1 md:ml-2 text-base">Condividi</span>
      </button>
      <button @click="openCiteModal" class="group flex items-center py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <Icon name="bi:quote" class="text-lg md:text-xl group-hover:text-white" aria-hidden="true" />
        <span class="ml-1 md:ml-2 text-base">Cita</span>
      </button>
    </div>
    <p class="mt-4 text-xs text-gray-500">
      Scheda pubblicata il {{ formattedPublishDate }}
      <template v-if="formattedModifiedDate !== formattedPublishDate">
        e modificata il {{ formattedModifiedDate }}
      </template>
    </p>

    <p class="text-xs text-gray-500 mt-2">
      Di: {{ displayAuthorName }}
    </p>
    <div class="flex items-center mt-2 text-xs text-gray-500">
      <Icon name="ph:clock-fill" class="text-sm text-gray-600 mr-1.5" aria-hidden="true" />
      <span>Tempo di lettura: {{ readingTime }} min</span>
    </div>
    <ClientOnly>
      <div v-if="publicationCount > 0" class="flex flex-row mt-4">
        <a :href="pubmedUrl" target="_blank" rel="noopener noreferrer" class="hover:opacity-80">
          <img
            src="/media/pubmed_logo.png"
            alt="PubMed logo"
            width="100"
            height="32"
            class="h-8 mr-2"
          >
        </a>
        <div>
          <a :href="pubmedUrl" target="_blank" rel="noopener noreferrer" class="text-lg font-bold text-blu link hover:text-celeste">
            {{ publicationCount }}
          </a> pubblicazioni
        </div>
      </div>
      <div v-if="classification" class="mt-6">
        <ul class="max-w-96">
          <li v-for="(item, key) in classification" :key="key" class="px-4 py-2 mt-1.5 bg-white border rounded-lg shadow">
            <span class="text-black">{{ key }}:</span> <a :href="item.link" class="text-blu hover:text-celeste" target="_blank" rel="noopener noreferrer">{{ item.name }}</a>
          </li>
        </ul>
      </div>
    </ClientOnly>
    
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useShare } from '~/composables/useShare';
import { useCite } from '~/composables/useCite';
import { useAsyncData } from '#app';
import { apiConfig } from '~/config';

interface Props {
  title: string;
  nomeScientifico: string;
  publishDate: string;
  content: string;
  authorName: string;
  modifiedDate?: string;
  revisionData?: { date: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  nomeScientifico: '',
  publishDate: '',
  content: '',
  authorName: '',
  modifiedDate: '',
  revisionData: () => []
});

const showVerifiedTooltip = ref(false);
const showBasionymTooltip = ref(false);
const showSynonyms = ref(false);
const synonymsList = ref<HTMLElement | null>(null);

const isVerified = computed(() => props.revisionData && props.revisionData.length > 0);

const formattedPublishDate = computed(() => getFormattedDate(props.publishDate));
const formattedModifiedDate = computed(() => getFormattedDate(props.modifiedDate));

const formattedRevisionDate = computed(() => {
  if (props.revisionData && props.revisionData.length > 0) {
    const latestRevision = props.revisionData[props.revisionData.length - 1];
    return getFormattedDate(latestRevision.date);
  }
  return 'data non disponibile';
});

function getFormattedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? 'data non disponibile'
    : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

const displayAuthorName = computed(() => {
  if (props.authorName === 'wh_admin') {
    return 'Editors of Wikiherbalist';
  }
  return props.authorName.replace(/&#8217;/g, "'");
});

// Share composable
const { openShareModal, renderShareModal } = useShare();

// Cite composable
const { openCiteModal, renderCiteModal } = useCite(props.title, props.authorName, props.publishDate);

const binomialName = computed(() => props.nomeScientifico.split(' ').slice(0, 2).join(' '));
const pubmedUrl = computed(() => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(binomialName.value)}`);

const readingTime = computed(() => Math.ceil(props.content.split(/\s+/).length / 200));

function speakTitle(): void {
  if (process.client && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(props.title);
    utterance.lang = 'it-IT';
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('La sintesi vocale non è supportata in questo browser o sul server.');
  }
}

const printPost = (): void => {
  if (process.client && window.innerWidth >= 640) { 
    window.print();
  }
};

const toggleSynonyms = (): void => {
  showSynonyms.value = !showSynonyms.value;
};

// Updated to use the new proxy middleware
const { data: gbifData } = useAsyncData(
  'gbifData',
  async () => {
    try {
      // First, get the taxon key
      const matchResponse = await $fetch(`/api/gbif/v1/species/match`, {
        params: { name: props.nomeScientifico },
        headers: { 'Accept': 'application/json' }
      });

      if (!matchResponse?.usageKey) {
        return { basionym: null, synonyms: [] };
      }

      // Then get the species details and synonyms in parallel
      const [detailsResponse, synonymsResponse] = await Promise.all([
        $fetch(`/api/gbif/v1/species/${matchResponse.usageKey}`),
        $fetch(`/api/gbif/v1/species/${matchResponse.usageKey}/synonyms`)
      ]);

      return {
        basionym: detailsResponse.basionym,
        synonyms: (synonymsResponse.results || [])
          .filter((s: any) => s.taxonomicStatus === 'SYNONYM')
          .map((s: any) => s.scientificName || s.canonicalName)
      };
    } catch (error) {
      console.error('Error fetching GBIF data:', error);
      return { basionym: null, synonyms: [] };
    }
  },
  {
    server: true,
    lazy: true
  }
);

const basionym = computed(() => gbifData.value?.basionym || '');
const synonyms = computed(() => gbifData.value?.synonyms || []);

const { data: pubMedData } = useAsyncData(
  'pubMedData',
  async () => {
    if (!binomialName.value) return 0;
    
    try {
      const response = await $fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
        params: {
          db: 'pubmed',
          term: binomialName.value,
          retmode: 'json',
          api_key: apiConfig.pubMedApiKey
        }
      });
      return response?.esearchresult?.count || 0;
    } catch (error) {
      console.error('Error fetching PubMed data:', error);
      return 0;
    }
  },
  {
    server: true,
    lazy: true
  }
);

const publicationCount = computed(() => pubMedData.value || 0);

// Classification data fetching
const { data: classificationData } = useAsyncData(
  'classificationData',
  async () => {
    if (!props.nomeScientifico) return null;
    
    try {
      const response = await $fetch('https://api.gbif.org/v1/species/match', {
        params: {
          name: props.nomeScientifico,
          strict: true,
          verbose: true
        }
      });

      if (!response) return null;

      const taxonomyMap: Record<string, string> = {
        kingdom: 'Regno',
        phylum: 'Phylum',
        class: 'Classe',
        order: 'Ordine',
        family: 'Famiglia',
        genus: 'Genere',
        species: 'Specie',
      };

      return Object.entries(taxonomyMap).reduce((acc, [key, italianName]) => {
        if (response[key]) {
          acc[italianName] = {
            name: response[key],
            link: `https://it.wikipedia.org/wiki/${encodeURIComponent(response[key])}`
          };
        }
        return acc;
      }, {} as Record<string, { name: string; link: string }>);
    } catch (error) {
      console.error('Error fetching classification data:', error);
      return null;
    }
  },
  {
    server: false,
    lazy: true,
    watch: [() => props.nomeScientifico]
  }
);

const classification = computed(() => classificationData.value);

const handleClickOutside = (event: MouseEvent): void => {
  if (synonymsList.value && !synonymsList.value.contains(event.target as Node) && !event.target?.closest('button')) {
    showSynonyms.value = false;
  }
  showBasionymTooltip.value = false;
};

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('click', handleClickOutside);
  }
});
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

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.z-20 {
  z-index: 20;
}
</style>