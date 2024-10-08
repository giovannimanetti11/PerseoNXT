<template>
  <section class="py-10 mt-6 w-11/12 mx-auto rounded-2xl bg-gradient-to-b from-[#f5f5f5] to-[#e0edfd]">
    <div class="flex flex-col xl:flex-row">
      <!-- Left column -->
      <div class="w-full xl:w-2/5 p-8 xl:ml-6">
        <h3 class="text-3xl font-bold mb-4">Blog</h3>
        <p class="mb-6">
          Esplora un blog ricco di approfondimenti sulle erbe medicinali, 
          le loro proprietà terapeutiche e gli ultimi studi scientifici. 
          Approfondisci le tue conoscenze nel campo della fitoterapia e scopri 
          come le piante possono contribuire al benessere naturale.
        </p>
        <NuxtLink to="/blog" class="inline-block bg-transparent text-blu py-2 px-4 border border-blu rounded-xl hover:text-verde hover:border-verde transition-colors duration-300">
          Vai al blog
        </NuxtLink>
      </div>
      <!-- Right column -->
      <div class="w-full xl:w-3/5 xl:relative xl:h-[625px]">
        <div v-if="loading" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
        </div>
        <div v-else-if="error" class="text-red-500 text-center">
          Si è verificato un errore: {{ error }}
        </div>
        <div v-else class="w-full flex flex-col xl:absolute xl:inset-0">
          <div v-for="(post, index) in posts" :key="post.uri"
               :class="[
                 'blog-card w-11/12 xl:w-7/12 flex flex-col xl:flex-row rounded-2xl shadow transition-all duration-500 ease-in-out m-auto my-2 xl:m-0 cursor-pointer',
                 'md:hover:bg-celeste md:hover:text-white group',
                 { 'xl:z-10 bg-celeste text-white': isXLScreen && post.uri === activePost },
                 { 'bg-white': !isXLScreen || post.uri !== activePost },
                 'xl:absolute'
               ]"
               :style="getTransformation(post, index)"
               @click="toggleActive(post.uri)"
               :aria-label="`Post del blog: ${post.title}`"
               role="article">
            <div class="px-6 py-4 flex flex-col justify-between items-start h-full w-full xl:w-2/4">
              <h4 class="font-bold text-xl mb-auto" :class="{ 'text-black md:group-hover:text-white': !isXLScreen || post.uri !== activePost }">{{ post.title }}</h4>
              <p :class="['blog-details', { 'text-gray-500 md:group-hover:text-white': !isXLScreen || post.uri !== activePost }]">{{ post.authorName }}</p>
              <p :class="['blog-details', { 'text-gray-500 md:group-hover:text-white': !isXLScreen || post.uri !== activePost }]">{{ formatDate(post.date) }}</p>
            </div>
            <div class="flex-col w-full xl:w-2/4 m-auto text-center">
              <NuxtImg 
                :src="post.featuredImage" 
                :alt="post.title" 
                class="rounded-2xl w-11/12 mt-4 m-auto h-auto max-h-32 object-cover"
                width="300"
                height="200"
                loading="lazy"
                format="webp"
              />
              <NuxtLink :to="post.uri" class="block w-11/12 mt-4 mb-4 mx-auto">
                <button :class="[
                  'blog-card-button py-4 w-full rounded-xl transition-colors duration-300',
                  (isXLScreen && post.uri === activePost) ? 'bg-white text-celeste hover:bg-blu hover:text-white' : 'bg-verde text-white hover:bg-blu'
                ]">
                  Leggi di più  →
                </button>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup async>
import { ref, computed } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const posts = ref([]);
const activePost = ref(null);
const isXLScreen = ref(false);
const loading = ref(true);
const error = ref(null);

const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

const BLOG_POSTS_QUERY = gql`
  query BlogPosts {
    blogPosts(first: 3, where: {orderby: {field: DATE, order: DESC}}) {
      nodes {
        authorName
        featuredImage {
          node {
            altText
            sourceUrl(size: MEDIUM)
          }
        }
        title
        uri
        date
      }
    }
  }
`;

try {
  loading.value = true;
  const { data } = await apolloClient.query({ query: BLOG_POSTS_QUERY });
  if (data && data.blogPosts && data.blogPosts.nodes) {
    posts.value = data.blogPosts.nodes.map(post => ({
      ...post,
      featuredImage: post.featuredImage?.node?.sourceUrl || '',
      altText: post.featuredImage?.node?.altText || ''
    }));
  }
  loading.value = false;
} catch (err) {
  console.error('Error fetching blog posts:', err);
  error.value = err.message;
  loading.value = false;
}

const transformations = ref({
  first: 'translate(240px, 0px)',
  second: 'translate(120px, 100px)',
  last: 'translate(290px, 200px)'
});

const toggleActive = (uri) => {
  if (!isXLScreen.value) return;
  
  if (activePost.value === uri) {
    activePost.value = null;
    transformations.value = {
      first: 'translate(240px, 0px)',
      second: 'translate(120px, 100px)',
      last: 'translate(290px, 200px)'
    };
  } else {
    activePost.value = uri;
    const idx = posts.value.findIndex(p => p.uri === uri);
    transformations.value = {
      first: idx === 0 ? 'translate(340px, 0px)' : 'translate(140px, 0px)',
      second: idx === 1 ? 'translate(220px, 100px)' : 'translate(20px, 100px)',
      last: idx === 2 ? 'translate(390px, 200px)' : 'translate(190px, 200px)'
    };
  }
};

const getTransformation = (post, index) => {
  if (!isXLScreen.value) return {};
  
  let transform = '';
  switch (index) {
    case 0: transform = transformations.value.first; break;
    case 1: transform = transformations.value.second; break;
    case 2: transform = transformations.value.last; break;
  }
  
  return { transform };
};

const updateScreenSize = () => {
  isXLScreen.value = window.innerWidth >= 1280;
};

if (process.client) {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
};
</script>

<style scoped>
@media (min-width: 1280px) {
  .blog-card {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s;
  }

  .blog-card:first-child {
    transform: translate(240px, 0px);
  }

  .blog-card:nth-child(2) {
    transform: translate(120px, 100px);
  }

  .blog-card:last-child {
    transform: translate(290px, 200px);
  }

  .blog-card.active {
    z-index: 10;
    animation: bounce 0.5s forwards;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-30px);}
  60% {transform: translateY(-15px);}
}

/* Responsive adjustments */
@media (max-width: 1279px) {
  .blog-card {
    position: static !important;
    transform: none !important;
    margin-bottom: 1rem !important;
  }
  
  .blog-card:last-child {
    margin-bottom: 0 !important;
  }
}
</style>