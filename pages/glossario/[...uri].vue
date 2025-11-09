<!-- URI TERM -->
 <template>
  <div>
    <!-- Loading state -->
    <div v-if="pending" class="flex justify-center text-center w-full items-center h-64 mt-12" aria-live="polite" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu" aria-label="Caricamento"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" role="alert" aria-live="assertive">Si è verificato un errore: {{ error.message }}</div>

    <!-- Content state -->
    <div v-else-if="glossaryTerm" id="post">
      <!-- Header section -->
      <section class="postGlossario-info-section flex flex-col md:flex-row py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
        <div class="mt-10 md:mt-20 container mx-auto w-full md:w-3/5 px-2 md:px-4 print:mt-8 print:px-0">
          <div class="mb-12">
            <Breadcrumbs
              :currentPageName="glossaryTerm.title"
              parentPath="/glossario"
              parentName="Glossario"
            />
          </div>
          <GlossarioInfo
            :title="glossaryTerm.title"
            :publishDate="glossaryTerm.date"
            :authorName="glossaryTerm.authorName"
            :readingTime="readingTime"
          />
        </div>
        <div class="flex flex-col w-full md:w-2/5 mt-10 md:mt-20">
          <NuxtImg v-if="glossaryTerm?.featuredImage?.node?.sourceUrl"
            class="m-auto h-48 md:h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg mb-4"
            :src="glossaryTerm.featuredImage.node.sourceUrl"
            :alt="glossaryTerm.featuredImage.node.altText || glossaryTerm.title"
            width="240"
            height="240"
            format="webp"
            loading="eager"
          />
        </div>
      </section>

      <!-- Index section - CLIENT SIDE ONLY -->
      <section :class="['postGlossario-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto mt-4 rounded-2xl', { 'hidden': headings.length === 0 }]">
        <div class="font-bold text-xl md:text-2xl flex items-center">
          <Icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" />
          <div id="table-of-contents" class="font-bold text-xl md:text-2xl">Indice</div>
        </div>
        <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2">
          <li v-for="(heading, index) in headings" :key="index" class="flex text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl m-1 text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.5rem)]">
            <a :href="'#section' + (index + 1)" class="flex items-center group w-full" @click.prevent="smoothScroll('#section' + (index + 1))">
              <div class="circle flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 min-w-6 min-h-6 md:min-w-8 md:min-h-8 bg-white text-verde rounded-full mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
              <span class="flex-grow text-left">{{ heading }}</span>
            </a>
          </li>
        </ul>
      </section>

      <!-- Introduction section - Now SSR-rendered -->
      <section :class="['term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4', { 'hidden': !introSection }]">
        <ContentTooltip v-if="introSection" :content="introSection.content" />
      </section>

      <!-- Content sections - Now SSR-rendered -->
      <section v-for="(section, index) in sections"
              :class="['term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4', section.className]"
              :id="'section' + (index + 1)"
              :key="section.heading">
          <div class="flex items-center" v-if="section.heading !== 'Riferimenti'">
            <div class="circle flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 mr-4 bg-blu text-white rounded-full text-base md:text-lg font-bold">
              {{ index + 1 }}
            </div>
            <h3 class="text-xl md:text-2xl">{{ section.heading }}</h3>
          </div>
          <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.heading }}</h3>
          <ContentTooltip v-if="section.content" :content="section.content" class="mt-4" />
        </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useGraphQL } from '~/composables/useGraphQL';
import { useContentProcessor } from '~/composables/useContentProcessor';
import { useHead } from '#app';

// Import critical components directly for better SSR
import ContentTooltip from '~/components/contentTooltip.vue';
import GlossarioInfo from '~/components/glossario/glossarioinfo.vue';
import Breadcrumbs from '~/components/breadcrumbs.vue';

const route = useRoute();
const { query } = useGraphQL();

// State management - intro/reading time still use ref
const introSection = ref(null);
const readingTime = ref(0);

// GraphQL query definition
const FETCH_GLOSSARY_TERM_BY_SLUG = `
  query GetGlossaryTermBySlug($slug: String!) {
    glossaryTermBy(slug: $slug) {
      databaseId
      title
      authorName
      date
      content
      slug
      status
      modified
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
      }
      featuredImage {
        node {
          altText
          caption
          sourceUrl
        }
      }
    }
  }
`;

const { data: glossaryTerm, pending, error } = await useAsyncData(
  `glossary-term-${route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri}`,
  async () => {
    const slug = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;
    const { processContent } = useContentProcessor();

    try {
      const data = await query(FETCH_GLOSSARY_TERM_BY_SLUG, { slug });

      if (!data?.glossaryTermBy) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Pagina non trovata',
          fatal: true
        });
      }

      const term = data.glossaryTermBy;

      // Process content server-side
      const processed = term.content ? await processContent(term.content) : { headings: [], structuredContent: [] };

      return {
        ...term,
        headings: processed.headings,
        structuredContent: processed.structuredContent
      };
    } catch (error) {
      console.error('Error fetching glossary term:', error);
      throw error;
    }
  },
  {
    server: true,
    lazy: false,
    watch: [() => route.params.uri]
  }
);

// Computed properties for processed content (now from server)
const headings = computed(() => glossaryTerm.value?.headings || []);
const sections = computed(() => glossaryTerm.value?.structuredContent || []);

// Handle error/404 - check after fetch completes
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Pagina non trovata',
    fatal: true
  });
}

// Calculate reading time from content
if (glossaryTerm.value?.content) {
  const wordCount = glossaryTerm.value.content
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .length;

  readingTime.value = Math.ceil(wordCount / 200);
}

// Computed for SEO data
const seoTitle = computed(() => glossaryTerm.value?.seo?.title || glossaryTerm.value?.title || '');
const seoDescription = computed(() => glossaryTerm.value?.seo?.metaDesc || '');
const seoImage = computed(() => 
  glossaryTerm.value?.seo?.opengraphImage?.sourceUrl || 
  glossaryTerm.value?.featuredImage?.node?.sourceUrl || 
  'https://wikiherbalist.com/images/default-og-image.jpg'
);

// Computed for featured image
const featuredImage = computed(() => glossaryTerm.value?.featuredImage?.node || null);

// Set meta tags with useHead at top level
useHead({
  title: seoTitle,
  titleTemplate: null, // Disable parent titleTemplate - WordPress already includes " | Wikiherbalist"
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:image', content: seoImage },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
    { name: 'twitter:image', content: seoImage }
  ],
  link: computed(() => {
    const links = [];

    // Add canonical URL
    const baseUrl = 'https://wikiherbalist.com';
    links.push({
      rel: 'canonical',
      href: `${baseUrl}${route.path}`
    });

    // Preload featured image for LCP optimization
    if (featuredImage.value?.sourceUrl) {
      links.push({
        rel: 'preload',
        as: 'image',
        href: featuredImage.value.sourceUrl,
        fetchpriority: 'high'
      });
    }
    return links;
  }),
  script: computed(() => {
    if (!glossaryTerm.value) return [];

    const baseUrl = 'https://wikiherbalist.com';
    const fullUrl = `${baseUrl}${route.fullPath}`;

    // Build breadcrumb list
    const breadcrumbList = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': baseUrl
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Glossario',
          'item': `${baseUrl}/glossario`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': glossaryTerm.value.title,
          'item': fullUrl
        }
      ]
    };

    // Build glossary term schema (DefinedTerm)
    const definedTerm = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      '@id': `${fullUrl}#term`,
      'name': glossaryTerm.value.title,
      'description': glossaryTerm.value.seo?.metaDesc || glossaryTerm.value.title,
      'image': featuredImage.value?.sourceUrl || `${baseUrl}/images/default-og-image.jpg`,
      'inDefinedTermSet': {
        '@type': 'DefinedTermSet',
        'name': 'Glossario di Fitoterapia',
        'url': `${baseUrl}/glossario`
      },
      'datePublished': glossaryTerm.value.date,
      'dateModified': glossaryTerm.value.modified || glossaryTerm.value.date,
      'author': {
        '@type': 'Person',
        'name': glossaryTerm.value.authorName || 'Team Wikiherbalist'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Wikiherbalist',
        'logo': {
          '@type': 'ImageObject',
          'url': `${baseUrl}/media/logo.png`
        }
      },
      'inLanguage': 'it-IT'
    };

    return [
      {
        type: 'application/ld+json',
        children: JSON.stringify(breadcrumbList)
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(definedTerm)
      }
    ];
  })
});

// Content is now processed server-side - no client processing needed

const smoothScroll = (targetId) => {
  if (!process.client) return;
  const element = document.querySelector(targetId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

</script>

<style scoped>
.postGlossario-info-section, .postGlossario-index-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}

.term-section {
  background: rgb(224,237,253) !important;
  background: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 100%) !important;
}

.circle {
  min-width: 2rem;
  min-height: 2rem;
}

.hidden {
  display: none !important;
}

@media (min-width: 768px) {
  .circle {
    min-width: 3rem;
    min-height: 3rem;
  }
}
</style>