<template>
  <div class="bg-gray-50 min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      </div>
      <div v-else-if="error" class="text-center text-red-600 font-semibold">
        {{ error }}
      </div>
      <div v-else>
        <!-- About Content -->
        <div class="mt-16 mb-20">
          <h1 class="text-4xl sm:text-5xl font-bold text-gray-800 mb-8 text-center">Il progetto Wikiherbalist</h1>
          <div v-html="formattedAboutContent" class="w-full mx-auto bg-white shadow-lg rounded-lg p-6 sm:p-8 text-base sm:text-lg text-gray-700 leading-relaxed"></div>
        </div>

        <!-- Members Section -->
        <div v-if="members.length > 0" class="mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-12 text-center">Staff</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="member in reversedMembers" :key="member.id" class="bg-white shadow-lg rounded-lg overflow-hidden transition duration-300 ease-in-out hover:scale-105">
              <div class="p-6">
                <div class="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 overflow-hidden rounded-full border-4 border-blue-100">
                  <NuxtImg 
                    v-if="member.featuredImage?.node?.sourceUrl" 
                    :src="member.featuredImage.node.sourceUrl" 
                    :alt="member.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                    <span class="text-2xl sm:text-4xl">{{ getInitials(member.title) }}</span>
                  </div>
                </div>
                <h3 class="text-xl font-semibold text-gray-800 text-center mb-2">{{ member.title }}</h3>
                <p v-if="member.affiliation" class="text-sm text-gray-600 text-center mb-3">{{ member.affiliation }}</p>
                <div v-html="formatContent(member.content)" class="text-sm text-gray-600 text-center mt-4 border-t pt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import DOMPurify from 'dompurify';

const aboutContent = ref('');
const members = ref([]);
const loading = ref(true);
const error = ref(null);

const FETCH_ABOUT_DATA = gql`
  query FetchAboutData {
    pageBy(uri: "about") {
      content
    }
    members {
      nodes {
        id
        databaseId
        title
        content
        affiliation
        featuredImage {
          node {
            sourceUrl
          }
        }
        memberCategories {
          nodes {
            name
          }
        }
      }
    }
  }
`;

const formatContent = (content) => {
  if (!content) return '';
  
  const cleanContent = DOMPurify.sanitize(content);
  const div = document.createElement('div');
  div.innerHTML = cleanContent;

  div.querySelectorAll('h1, h2, h3, h4, h5, h6, ul, ol, li, a').forEach(el => {
    switch (el.tagName.toLowerCase()) {
      case 'h1':
        el.classList.add('text-3xl', 'font-bold', 'mt-6', 'mb-4');
        break;
      case 'h2':
        el.classList.add('text-2xl', 'font-bold', 'mt-6', 'mb-4');
        break;
      case 'h3':
        el.classList.add('text-xl', 'font-bold', 'mt-6', 'mb-4');
        break;
      case 'h4':
        el.classList.add('text-lg', 'font-bold', 'mt-6', 'mb-4');
        break;
      case 'ul':
        el.classList.add('list-disc', 'list-inside', 'my-4', 'pl-4');
        break;
      case 'ol':
        el.classList.add('list-decimal', 'list-inside', 'my-4', 'pl-4');
        break;
      case 'li':
        el.classList.add('mb-2');
        break;
      case 'a':
        el.classList.add('text-blu', 'hover:text-celeste', 'underline');
        break;
    }
  });

  return div.innerHTML;
};

const formattedAboutContent = computed(() => formatContent(aboutContent.value));

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const reversedMembers = computed(() => {
  return [...members.value].reverse();
});

onMounted(async () => {
  const { result, loading: queryLoading, error: queryError } = useQuery(FETCH_ABOUT_DATA);
 
  watch([result, queryLoading, queryError], ([newResult, newLoading, newError]) => {
    loading.value = newLoading;
   
    if (newError) {
      console.error('Error fetching data:', newError);
      error.value = 'Si è verificato un errore nel caricamento dei dati. Si prega di riprovare più tardi.';
    } else if (newResult) {
      aboutContent.value = newResult.pageBy?.content || '';
      members.value = newResult.members?.nodes.map(member => ({
        ...member,
        content: member.content || '',
        affiliation: member.affiliation || 'Affiliazione non specificata',
      })) || [];
    }
  });
});

useHead({
  title: 'About'
})
</script>