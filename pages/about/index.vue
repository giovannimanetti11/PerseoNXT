<template>
    <section class="about-page-section py-14 w-11/12 m-auto rounded-2xl">
      <div v-if="error" class="text-center text-red-500">Errore nel caricamento dei dati.</div>
      <div v-else-if="aboutContent" class="content-container py-14 mt-20 w-11/12 m-auto rounded-2xl">
        <div v-html="aboutContent" class="text-lg leading-8 p-10"></div>
      </div>
      <div v-else class="flex flex-row py-20 px-10 w-11/12 mx-auto rounded-2xl">
        <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste text-center mt-10 mx-auto" />
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { useQuery } from '@vue/apollo-composable';
  import gql from 'graphql-tag';
  
  const aboutContent = ref(null);
  const error = ref(null);
  
  const FETCH_ABOUT_PAGE = gql`
    query FetchAboutPage {
      pageBy(uri: "about") {
        content
      }
    }
  `;
  
  onMounted(() => {
    const { result, error: queryError } = useQuery(FETCH_ABOUT_PAGE);
    
  
    watch(result, (newResult) => {
        console.log("query:", newResult);
        if (newResult && newResult.pageBy) {
            aboutContent.value = newResult.pageBy.content;
        } else {
            console.error("Errore o struttura dati inattesa:", newResult);
        }
    });
  
    watch(queryError, (newError) => {
      if (newError) {
        error.value = newError;
      }
    });
  });
  </script>
  
  <style scoped>
    .about-page-section {
      background: rgb(245, 245, 245);
      background: linear-gradient(180deg, rgba(245, 245, 245, 1) 0%, rgba(224, 237, 253, 1) 82%);
    }
  </style>
  