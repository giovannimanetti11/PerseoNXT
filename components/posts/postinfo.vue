<template>
  <div class="flex flex-col">
    <h1 class="text-3xl font-bold">{{ title }}</h1>
    <p class="text-xl italic text-gray-700">{{ nomeScientifico }}</p>
    <div class="postinfo-buttons flex mt-4">
      <button class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-verde">
        <icon name="mingcute:print-fill" class="text-3xl group-hover:text-verde" />
        <span class="ml-2 text-base">Stampa</span>
      </button>
      <button class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-verde">
        <icon name="ic:round-share" class="text-3xl group-hover:text-verde" />
        <span class="ml-2 text-base">Condividi</span>
      </button>
      <button class="group flex items-center py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-verde">
        <icon name="bi:quote" class="text-3xl group-hover:text-verde" />
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
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  nomeScientifico: String,
  publishDate: String,
  updateDate: String,
  content: String
});

const getFormattedDate = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'data non disponibile' : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formattedPublishDate = getFormattedDate(props.publishDate);
const formattedUpdateDate = getFormattedDate(props.updateDate);

const wordCount = props.content.split(/\s+/).length;
const readingTime = Math.ceil(wordCount / 200); 
</script>

<style scoped>
</style>
