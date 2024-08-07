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
          Esplora gli articoli
        </NuxtLink>
      </div>
      <!-- Right column -->
      <div class="w-full xl:w-3/5 xl:relative xl:h-[625px]">
        <div class="w-full flex flex-col xl:absolute xl:inset-0">
          <div v-for="(post, index) in posts" :key="post.uri"
               :class="[
                 'blog-card w-11/12 xl:w-7/12 flex flex-col xl:flex-row rounded-2xl shadow transition-all duration-500 ease-in-out m-auto my-2 xl:m-0 cursor-pointer',
                 'md:hover:bg-celeste md:hover:text-white',
                 post.uri === activePost ? 'xl:z-10 bg-celeste text-white' : 'bg-white text-black',
                 'xl:absolute'
               ]"
               :style="getTransformation(post, index)"
               @click="toggleActive(post.uri)"
               :aria-label="`Post del blog: ${post.title}`"
               role="article">
            <div class="px-6 py-4 flex flex-col justify-between items-start h-full w-full xl:w-2/4">
              <h4 class="font-bold text-xl mb-auto">{{ post.title }}</h4>
              <p :class="['blog-details', post.uri === activePost || 'md:group-hover:text-white' ? 'text-white' : 'text-gray-500']">{{ post.authorName }}</p>
              <p :class="['blog-details', post.uri === activePost || 'md:group-hover:text-white' ? 'text-white' : 'text-gray-500']">{{ post.date }}</p>
            </div>
            <div class="flex-col w-full xl:w-2/4 m-auto text-center">
              <NuxtImg 
                :src="post.featuredImage" 
                :alt="post.altText" 
                class="rounded-2xl w-11/12 mt-4 m-auto h-auto max-h-32 object-cover"
                width="300"
                height="200"
                loading="lazy"
                format="webp"
              />
              <NuxtLink :to="post.uri" class="block w-11/12 mt-4 mb-4 mx-auto">
                <button :class="[
                  'blog-card-button py-4 w-full rounded-xl transition-colors duration-300',
                  post.uri === activePost ? 'bg-white text-celeste' : 'bg-verde text-white md:hover:bg-blu'
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

<script setup>
import { ref, watch, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// State for blog posts and currently active post
const posts = ref([]);
const activePost = ref(null);

// GraphQL query to fetch blog posts
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

// Execute query and update state
const { result } = useQuery(BLOG_POSTS_QUERY);

watch(result, (newValue) => {
  if (newValue?.blogPosts?.nodes) {
    posts.value = newValue.blogPosts.nodes.map(post => ({
      authorName: post.authorName,
      featuredImage: post.featuredImage.node.sourceUrl,
      altText: post.featuredImage.node.altText,
      title: post.title,
      uri: post.uri,
      date: new Date(post.date).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }));
    activePost.value = posts.value[0]?.uri;
  }
});

const isXLScreen = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 1280; // Tailwind's XL breakpoint
  }
  return false;
});

const transformations = ref({
  first: 'translate(240px, 0px)',
  second: 'translate(120px, 100px)',
  last: 'translate(290px, 200px)'
});

// Handle activation and positioning of blog cards
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
  if (!isXLScreen.value) return '';
  
  switch (index) {
    case 0: return { transform: transformations.value.first };
    case 1: return { transform: transformations.value.second };
    case 2: return { transform: transformations.value.last };
    default: return {}; 
  }
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
</style>