<template>
    <section class="py-10 mt-6 w-11/12 mx-auto rounded-2xl section-blog flex"> 
        <!-- Left column -->
        <div class="w-2/5 p-8 ml-6">
            <h3 class="text-3xl font-bold mb-4">Blog</h3>
            <p class="mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris suscipit nunc et velit rhoncus, sed fermentum risus feugiat. Aliquam at turpis dictum, hendrerit metus eget, lobortis est.
            </p>
            <button class="bg-transparent text-blu py-2 px-4 border border-blu rounded-xl hover:text-verde hover:border-verde">
            Esplora gli articoli
            </button>
        </div>
        <!-- Right column -->
        <div class="w-3/5 flex flex-wrap justify-around">
            <div class="w-full flex flex-wrap justify-around">
                <div v-for="post in posts" :key="post.uri" @click="toggleActive(post.uri)" :class="['w-7/12 shadow flex flex-row rounded-2xl shadow-lg m-4 cursor-pointer transition duration-300 ease-in-out transform', post.uri === activePost ? 'bg-blu text-white scale-110' : 'bg-white text-black hover:bg-blu hover:text-white']">
                    <div class="px-6 py-4 flex flex-col justify-between items-start h-full w-2/4">
                        <div class="font-bold text-xl mb-auto">{{ post.title }}</div>
                        <div>{{ post.authorName }}</div>
                        <div>{{ post.date }}</div>
                    </div>
                    <div class="flex-col w-2/4 m-auto text-center">
                        <img :src="post.featuredImage" :alt="post.altText" class="rounded-2xl w-11/12 mt-4 m-auto h-auto object-cover">
                        <button class="py-4 bg-verde text-white hover:bg-blu w-11/12 rounded-xl mt-4 mb-4">
                            Leggi di più  →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
  


<script setup>
import { ref, onMounted, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// Define ref for posts
const posts = ref([]);

// GraphQL query for blog posts
const BLOG_POSTS_QUERY = gql`
  query BlogPosts {
    blogPosts(first: 3, where: {orderby: {field: DATE, order: DESC}}) {
      nodes {
        authorName
        featuredImage {
          node {
            altText
            sourceUrl
          }
        }
        title
        uri
        date
      }
    }
  }
`;

// Use Apollo Composable to fetch blog posts
const { result, loading, error } = useQuery(BLOG_POSTS_QUERY);

// Watch for changes in loading and error
watch(loading, (newLoading) => {
  console.log('Stato di caricamento:', newLoading);
});

watch(error, (newError) => {
  if (newError) {
    console.error('Errore durante il fetch dei dati:', newError);
  }
});

// Watch for changes in result
watch(result, (newValue) => {
  if (newValue?.blogPosts?.nodes) {
    posts.value = newValue.blogPosts.nodes.map(post => ({
      authorName: post.authorName,
      featuredImage: post.featuredImage.node.sourceUrl,
      altText: post.featuredImage.node.altText,
      title: post.title,
      uri: post.uri,
      date: new Date(post.date).toLocaleDateString()
    }));
  }
});

// Populate posts on component mount
onMounted(() => {
  console.log('Risultato completo:', result.value);
  if (error.value) {
    console.error('Errore GraphQL:', error.value);
  }
  if (loading.value) {
    console.log('Caricamento in corso...');
  }
});
</script>







<style scoped>
.section-blog {
  background-image: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 82%);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>