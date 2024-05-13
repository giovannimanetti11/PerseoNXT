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
            <div v-for="(post, index) in posts" :key="post.uri" @click="toggleActive(post.uri)"
              :class="['blog-card w-7/12 flex flex-row rounded-2xl shadow transition-all m-4 cursor-pointer', post.uri === activePost ? 'active bg-celeste text-white z-10' : 'bg-white shadow text-black hover:bg-celeste hover:text-white']"
              :style="{ transform: getTransformation(post, index) }">
                  <div class="px-6 py-4 flex flex-col justify-between items-start h-full w-2/4">
                      <div class="font-bold text-xl mb-auto">{{ post.title }}</div>
                      <div class="text-gray-500 blog-details">{{ post.authorName }}</div>
                      <div class="text-gray-500 blog-details">{{ post.date }}</div>
                  </div>
                  <div class="flex-col w-2/4 m-auto text-center">
                      <NuxtImg :src="post.featuredImage" :alt="post.altText" class="rounded-2xl w-11/12 mt-4 m-auto h-auto max-h-32 object-cover" />
                      <button class="blog-card-button py-4 bg-verde text-white w-11/12 rounded-xl mt-4 mb-4">
                          Leggi di più  →
                      </button>
                  </div>
              </div>
          </div>
      </div>
  </section>
</template>


<script setup>
import { onMounted, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// Define ref for posts
const posts = ref([]);

const activePost = ref(null);

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
const { result } = useQuery(BLOG_POSTS_QUERY);

// Watch for changes in result
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

// Define ref for active transformations
const transformations = ref({
  first: 'translateX(40px)',
  second: 'translate(-80px, -100px)',
  last: 'translate(90px, -270px)'
});

const toggleActive = (uri) => {
  if (activePost.value === uri) {
    activePost.value = null;
    transformations.value = {
      first: 'translateX(40px)',
      second: 'translate(-80px, -100px)',
      last: 'translate(90px, -270px)'
    };
  } else {
    activePost.value = uri;
    const idx = posts.value.findIndex(p => p.uri === uri);
    transformations.value = {
      first: idx === 0 ? 'translateX(140px)' : 'translateX(-60px)',
      second: idx === 1 ? 'translate(20px, -100px)' : 'translate(-180px, -100px)',
      last: idx === 2 ? 'translate(140px, -270px)' : 'translate(-10px, -270px)'
    };
  }
};


const getTransformation = (post, index) => {
  switch (index) {
    case 0: return transformations.value.first;
    case 1: return transformations.value.second;
    case 2: return transformations.value.last;
    default: return ''; 
  }
};




</script>


<style scoped>
  .section-blog {
    background-image: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 82%);
    max-height: 625px;
  }

  .blog-card:hover .blog-details, .blog-card.active .blog-details {
    color: #fff;
  }

  .blog-card:hover .blog-card-button:hover, .blog-card:hover .blog-card-button, .blog-card.active .blog-card-button {
    background-color: #fff;
    color: #5E9EF4;
  }

  .blog-card:first-child {
    transform: translateX(40px);
  }

  .blog-card:nth-child(2) {
    transform: translate(-80px, -100px);
  }

  .blog-card:last-child {
    transform: translate(90px, -270px);
  }

  .blog-card {
    z-index: 0;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s;
  }

  .blog-card.active {
    z-index: 10;
    animation: bounce 0.5s forwards;
  }

</style>