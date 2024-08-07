<template>
  <div id="post" v-if="blogPost">
    <!-- Main upper blogpost container -->
    <section class="postBlog-info-section flex flex-col md:flex-row py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
      <!-- Container for main blogpost information -->
      <div class="mt-10 md:mt-20 container mx-auto w-full md:w-3/5 px-2 md:px-4 print:mt-8 print:px-0">
        <BlogInfo 
          :title="blogPost.title"
          :publishDate="blogPost.date"
          :authorName="blogPost.authorName"
          :readingTime="readingTime"
        />
      </div>
      <!-- Container for featured image -->
      <div class="flex flex-col w-full md:w-2/5 mt-10 md:mt-20">
        <NuxtImg v-if="blogPost.featuredImage" class="m-auto h-48 md:h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg mb-4" :src="blogPost.featuredImage.node.sourceUrl" :alt="blogPost.featuredImage.node.altText" />
      </div>
    </section>
    
    <!-- Index section -->
    <section class="postBlog-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full">
      <div class="font-bold text-xl md:text-2xl">
        <icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" /> Indice
      </div>
      <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2">
        <li v-for="(heading, index) in headings" :key="index" class="flex text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl m-1 text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.5rem)]">
          <a :href="'#section' + (index + 1)" class="flex items-center group w-full" @click.prevent="smoothScroll('#section' + (index + 1))">
            <div class="circle flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white text-verde rounded-full mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
            <span class="flex-grow text-left">{{ heading }}</span>
          </a>
        </li>
      </ul>
    </section>

    <!-- Start of content sections -->
    <section v-for="(section, index) in sections"
        :class="['blogpost-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full', section.className]"
        :id="'section' + (index + 1)"
        :key="section.heading">
      <div class="flex items-center" v-if="section.heading !== 'Riferimenti'">
        <div class="circle flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 mr-4 bg-blu text-white rounded-full text-base md:text-lg font-bold">
          {{ index + 1 }}
        </div>
        <h3 class="text-xl md:text-2xl">{{ section.heading }}</h3>
      </div>
      <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.heading }}</h3>
      <div class="mt-4">
        <InternalLinking 
          :content="section.content" 
          :current-slug="blogPost.slug"
          :global-linked-words="globalLinkedWords"
        />
      </div>
    </section>
  </div>
  <div v-else class="flex flex-row py-20 px-10 w-11/12 mx-auto rounded-2xl">
    <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste text-center mt-10 mx-auto" />
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import cheerio from 'cheerio';
import BlogInfo from '@/components/blog/bloginfo.vue';
import InternalLinking from '@/components/internalLinking.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const slug = ref(route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri);

const globalLinkedWords = ref(new Set());

// Define GraphQL query
const FETCH_BLOG_POST_BY_SLUG = gql`
query BlogPostBySlug($slug: String!) {
  blogPostBy(slug: $slug) {
    title
    authorName
    date
    content
    slug
    featuredImage {
      node {
        altText
        sourceUrl
      }
    }
  }
}
`;

const { result, error } = useQuery(FETCH_BLOG_POST_BY_SLUG, { slug: slug.value });

const blogPost = computed(() => result.value?.blogPostBy || null);

const headings = ref([]);
const sections = ref([]);
const readingTime = ref(0);

watchEffect(() => {
  if (error.value) {
    console.error("GraphQL Error:", error.value);
  }

  if (blogPost.value && blogPost.value.content) {
    const $ = cheerio.load(blogPost.value.content);
    const extractedHeadings = [];
    const extractedSections = [];
    let wordCount = 0;

    $('h3').each(function (index) {
      const headingText = $(this).text().trim();
      const headingId = `section${index + 1}`;
      $(this).attr('id', headingId);

      extractedHeadings.push(headingText);
      const sectionContent = $(this).nextUntil('h3, p:contains("Riferimenti")').toArray().map(el => $.html(el)).join('');
      extractedSections.push({
        heading: headingText,
        content: sectionContent,
        className: `post-section-${headingText.toLowerCase().replace(/[\s,\'\`]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')}`
      });

      // Add words count for title and content
      wordCount += headingText.split(/\s+/).length;
      wordCount += sectionContent ? sectionContent.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    });

    // Extract "Riferimenti" section
    const referencesElement = $('p:contains("Riferimenti")');
    if (referencesElement.length) {
      const referencesContent = $('<div>').append(referencesElement.nextAll().clone()).html();
      extractedSections.push({
        heading: "Riferimenti",
        content: referencesContent,
        className: "post-section-riferimenti"
      });
    }

    headings.value = extractedHeadings;
    sections.value = extractedSections;
    readingTime.value = Math.ceil(wordCount / 200); // Reading time calculation
  }
});

const smoothScroll = (targetId) => {
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth' });
  } else {
    console.error("Target element not found for smooth scroll:", targetId);
  }
};
</script>

<style scoped>
.postBlog-info-section, .postBlog-index-section {
  background: rgb(245, 245, 245);
  background: linear-gradient(180deg, rgba(224, 237, 253, 1) 0%, rgba(245, 245, 245, 1) 100%);
}

.blogpost-content-section {
  background: rgb(224, 237, 253);
  background: linear-gradient(180deg, rgba(245, 245, 245, 1) 0%, rgba(224, 237, 253, 1) 100%);
}

.circle {
  min-width: 2rem;
  min-height: 2rem;
}

@media (min-width: 768px) {
  .circle {
    min-width: 3rem;
    min-height: 3rem;
  }
}
</style>