<template>
  <div class="flex flex-col">
    <div class="flex flex-row">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
      <button @click="speakTitle" class="flex text-5xl ml-4 mb-2 shadow text-white bg-blu rounded-full w-12 h-12 justify-center items-center hover:bg-white hover:text-blu print:hidden">
        <icon name="f7:speaker-1-fill" class="text-4xl" />
      </button>
    </div>
    <p class="text-xl italic text-gray-700">{{ nomeScientifico }}</p>
    <div class="postinfo-buttons flex mt-4 print:hidden">
      <button @click="printPost" class="group flex items-center mr-4 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white">
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
    <p class="text-xs text-gray-500 mt-2">
      Di: {{ authorName === 'wh_admin' ? 'Editors of Wikiherbalist' : authorName }}
    </p>
    <div class="flex items-center mt-2 text-xs text-gray-500">
      <icon name="ph:clock-fill" class="text-sm text-gray-600 mr-1.5" />
      <span>Tempo di lettura: {{ readingTime }} min</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: String,
  publishDate: String,
  updateDate: String,
  content: String,
  authorName: String,
  readingTime: Number
});

const printPost = () => {
  const printContents = document.getElementById('post').innerHTML;
  const headContent = document.getElementsByTagName('head')[0].innerHTML;

  const newWindow = window.open('', '_blank');
  newWindow.document.write(`<html><head>${headContent}</head><body>${printContents}</body></html>`);
  newWindow.document.close();
  newWindow.focus();
  newWindow.print();
  newWindow.close();
};

const getFormattedDate = dateStr => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'data non disponibile' : date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formattedPublishDate = computed(() => getFormattedDate(props.publishDate));
const formattedUpdateDate = computed(() => getFormattedDate(props.updateDate));

const speakTitle = () => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(props.title);
    utterance.lang = 'it-IT';
    window.speechSynthesis.speak(utterance);
  } else {
    alert('La sintesi vocale non è supportata in questo browser.');
  }
};
</script>
