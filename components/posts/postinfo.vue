<template>
  <div class="flex flex-col relative">
    <div class="flex flex-row">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
      <button @click="speakTitle" class="flex text-5xl ml-4 mb-2 shadow text-white bg-blu rounded-full w-12 h-12 justify-center items-center hover:bg-white hover:text-blu print:hidden">
        <icon name="f7:speaker-1-fill" class="text-4xl" />
      </button>
    </div>
    <p class="text-xl italic text-gray-700">{{ nomeScientifico }}</p>

    <!-- Basionym and synonyms -->
    <div v-if="basionym" class="mt-4">
      <div class="relative inline-block mr-1">
        <span class="text-black">Basionimo</span>
        <icon 
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
    <div v-if="synonyms.length > 0" class="relative mt-2">
      <button @click="toggleSynonyms" class="group flex items-center py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <icon name="bi:list" class="text-xl md:text-3xl group-hover:text-white mr-2" />
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
      <button @click="printPost" class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <icon name="mingcute:print-fill" class="text-xl md:text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Stampa</span>
      </button>
      <button @click="openShareModal" class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <icon name="ic:round-share" class="text-xl md:text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Condividi</span>
      </button>
      <button @click="openCiteModal" class="group flex items-center py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300">
        <icon name="bi:quote" class="text-xl md:text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Cita</span>
      </button>
    </div>
    <p class="mt-4 text-xs text-gray-500">
      Scheda pubblicata il {{ formattedPublishDate }}
    </p>
    <p class="text-xs text-gray-500 mt-2">
      Di: {{ authorName === 'wh_admin' ? 'Editors of Wikiherbalist' : authorName }}
    </p>
    <div class="flex items-center mt-2 text-xs text-gray-500">
      <icon name="ph:clock-fill" class="text-sm text-gray-600 mr-1.5" />
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

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useShare } from '~/composables/useShare';
import { useCite } from '~/composables/useCite';
import { useFetch } from '#app';
import { apiConfig } from '~/config';

const props = defineProps({
  title: String,
  nomeScientifico: String,
  publishDate: String,
  content: String,
  authorName: String
});


// Share composable
const { openShareModal, renderShareModal } = useShare();

// Cite composable
const { openCiteModal, renderCiteModal } = useCite(props.title, props.authorName, props.publishDate);

const showBasionymTooltip = ref(false);
const basionym = ref('');
const synonyms = ref([]);
const showSynonyms = ref(false);
const synonymsList = ref(null);

const publicationCount = ref(0);
const classification = ref(null);

const binomialName = computed(() => props.nomeScientifico.split(' ').slice(0, 2).join(' '));
const pubmedUrl = computed(() => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(binomialName.value)}`);


const readingTime = computed(() => Math.ceil(props.content.split(/\s+/).length / 200));

const formattedPublishDate = computed(() => getFormattedDate(props.publishDate));
const getFormattedDate = dateStr => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'data non disponibile' : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

function speakTitle() {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(props.title);
    utterance.lang = 'it-IT';
    window.speechSynthesis.speak(utterance);
  } else {
    alert('La sintesi vocale non è supportata in questo browser.');
  }
}

const printPost = () => {
  window.print();
};

const toggleSynonyms = () => {
  showSynonyms.value = !showSynonyms.value;
};

// Fetch GBIF data for basionym and synonyms
const fetchGBIFData = async () => {
  try {
    console.log('Fetching data for:', props.nomeScientifico);
    const { data: matchData } = await useFetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(props.nomeScientifico)}`);
    console.log('Match data:', matchData.value);
    
    if (matchData.value.usageKey) {
      const { data: detailsData } = await useFetch(`https://api.gbif.org/v1/species/${matchData.value.usageKey}`);
      console.log('Details data:', detailsData.value);
      
      if (detailsData.value.basionym) {
        basionym.value = detailsData.value.basionym;
        console.log('Basionym set to:', basionym.value);
      } else {
        console.log('No basionym found in the details data');
      }

      const { data: synonymsData } = await useFetch(`https://api.gbif.org/v1/species/${matchData.value.usageKey}/synonyms`);
      console.log('Synonyms data:', synonymsData.value);
      
      synonyms.value = synonymsData.value.results
        .filter(s => s.taxonomicStatus === 'SYNONYM')
        .map(s => s.scientificName || s.canonicalName);
      console.log('Synonyms set to:', synonyms.value);
    }
  } catch (error) {
    console.error('Error fetching GBIF data:', error);
  }
};

const handleClickOutside = (event) => {
  if (synonymsList.value && !synonymsList.value.contains(event.target) && !event.target.closest('button')) {
    showSynonyms.value = false;
  }
  showBasionymTooltip.value = false;
};

onMounted(async () => {
  fetchGBIFData();
  document.addEventListener('click', handleClickOutside);
  
  try {
    const { data: pubMedData } = await useFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: binomialName.value,
        retmode: 'json',
        api_key: apiConfig.pubMedApiKey
      }
    });

    publicationCount.value = pubMedData.value.esearchresult.count;
  } catch (error) {
    console.error('Error fetching data from PubMed:', error);
    publicationCount.value = 'Nessuna pubblicazione trovata';
  }

  try {
    const { data: classificationData } = await useFetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(props.nomeScientifico)}`);
    classification.value = formatClassification(classificationData.value);
  } catch (error) {
    console.error('Error fetching classification data:', error);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function formatClassification(data) {
  const taxonomyMap = {
    kingdom: 'Regno',
    phylum: 'Phylum',
    class: 'Classe',
    order: 'Ordine',
    family: 'Famiglia',
    genus: 'Genere',
    species: 'Specie',
  };
  const formatted = {};
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