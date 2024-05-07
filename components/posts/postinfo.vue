<template>
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">{{ title }}</h1>
    <p class="text-xl italic text-gray-700">{{ nomeScientifico }}</p>
    <div class="postinfo-buttons flex mt-4">
      <button class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white">
        <icon name="mingcute:print-fill" class="text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Stampa</span>
      </button>
      <button class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white">
        <icon name="ic:round-share" class="text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Condividi</span>
      </button>
      <button class="group flex items-center py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white">
        <icon name="bi:quote" class="text-3xl group-hover:text-white" />
        <span class="ml-2 text-base">Cita</span>
      </button>
    </div>
    <p class="mt-4 text-xs text-gray-500">
      Scheda pubblicata il {{ formattedPublishDate }} e aggiornata il {{ formattedUpdateDate }}
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
      <ul>
        <li v-for="(item, key) in classification" :key="key" class="px-4 py-2 mt-1.5 bg-white border rounded-lg shadow">
          <span class="text-black">{{ key }}:</span> <a :href="item.link" class="text-blu hover:text-celeste" target="_blank">{{ item.name }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiConfig } from '../config';
import { useFetch } from '#app';

const props = defineProps({
  title: String,
  nomeScientifico: String,
  publishDate: String,
  updateDate: String,
  content: String
});

const publicationCount = ref(null);
const classification = ref(null);

const binomialName = computed(() => props.nomeScientifico.split(' ').slice(0, 2).join(' '));

const pubmedUrl = computed(() => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(binomialName.value)}`);

onMounted(async () => {
  const { data, error } = await useFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`, {
    params: {
      db: 'pubmed',
      term: binomialName.value,
      retmode: 'json',
      api_key: apiConfig.pubMedApiKey
    }
  });

  if (error.value) {
    console.error('Error fetching data from PubMed:', error.value);
    publicationCount.value = 'Nessuna pubblicazione trovata';
  } else {
    publicationCount.value = data.value.esearchresult.count;
  }

  const { data: classificationData, error: classificationError } = await useFetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(props.nomeScientifico)}`);
  
  if (!classificationError.value && classificationData.value) {
    classification.value = formatClassification(classificationData.value);
  }
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

const getFormattedDate = dateStr => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'data non disponibile' : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formattedPublishDate = getFormattedDate(props.publishDate);
const formattedUpdateDate = getFormattedDate(props.updateDate);
const wordCount = props.content.split(/\s+/).length;
const readingTime = Math.ceil(wordCount / 200); // Calculate reading time based on word count
</script>
