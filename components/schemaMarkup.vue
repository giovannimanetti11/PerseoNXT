<template>
  <div>
    <!-- Schema for posts -->
    <SchemaOrgArticle
      v-if="isPost && post"
      :headline="post.title"
      :image="post.featuredImage?.node?.sourceUrl"
      :datePublished="post.date"
      :dateModified="post.modified"
      :authorName="post.authorName"
      :description="post.excerpt"
      :url="fullUrl"
      :identifier="fullUrl"
      :id="`${fullUrl}/#article`"
      :about="{
        '@type': ['Substance', 'MedicalEntity'],
        name: post.title,
        alternateName: post.nomeScientifico
      }"
      :articleBody="post.content"
      :articleSection="['Fitoterapia', 'Monografia scientifica']"
      :keywords="`${post.nomeScientifico}, ${post.nomeComune}, ${post.partiUsate}`"
      :isPartOf="{
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: siteName,
        url: baseUrl
      }"
      :citation="{
        '@type': 'Citation',
        '@id': `${fullUrl}#references`,
        hasPart: post.references?.map(ref => ({
          '@type': 'ScholarlyArticle',
          name: ref,
          position: ref.match(/^\d+/)?.[0] || '',
          url: ref.match(/https?:\/\/[^\s]+/)?.[0] || undefined
        })) || []
      }"
    >
      <template #mainEntity>
        <SchemaOrgMedicalWebPage
          :about="{
            '@type': ['Substance', 'MedicalEntity'],
            name: post.title,
            alternateName: post.nomeScientifico,
            description: post.excerpt,
            medicineSystem: ['Phytotherapy'],
            relevantSpecialty: ['Phytotherapy'],
            activeIngredient: post.costituenti || '',
            possibleTreatment: post.tags?.nodes?.map(tag => ({
              '@type': 'MedicalTherapy',
              name: tag.name,
              description: tag.description
            })),
            usedParts: post.partiUsate,
            image: post.featuredImage?.node?.sourceUrl,
            mainEntityOfPage: fullUrl,
            review: post.revisionData ? {
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '5',
                bestRating: '5',
                worstRating: '1'
              },
              author: {
                '@type': 'Person',
                name: post.revisionData.reviewer || 'Team Wikiherbalist'
              },
              datePublished: post.revisionData.date
            } : undefined,
            citation: {
              '@type': 'Citation',
              '@id': `${fullUrl}#references`,
              hasPart: post.references?.map(ref => ({
                '@type': 'CreativeWork',
                name: ref,
                position: ref.match(/^\d+/)?.[0] || '',
                url: ref.match(/https?:\/\/[^\s]+/)?.[0] || undefined
              })) || []
            }
          }"
          :specialty="['Phytotherapy']"
          :lastReviewed="post.revisionData?.date"
          :isPartOf="{
            '@type': 'WebSite',
            '@id': baseUrl,
            'name': siteName,
            'url': baseUrl,
            'potentialAction': {
              '@type': 'SearchAction',
              'target': {
                '@type': 'EntryPoint',
                'urlTemplate': `${baseUrl}/search?q={search_term_string}`
              },
              'query-input': 'required name=search_term_string'
            }
          }"
          :identifier="fullUrl"
          :id="fullUrl"
          :breadcrumb="{
            '@type': 'BreadcrumbList',
            'itemListElement': breadcrumbItems
          }"
        >
          <template #description>
            {{ post.seo?.metaDesc || post.excerpt || post.title }}
          </template>
          <template #hasPart>
            <SchemaOrgItemList>
              <SchemaOrgListItem v-for="(section, index) in sections" :key="index">
                <SchemaOrgWebPageElement
                  :name="section.name"
                  :cssSelector="section.cssSelector"
                  :isAccessibleForFree="true"
                />
              </SchemaOrgListItem>
            </SchemaOrgItemList>
          </template>
        </SchemaOrgMedicalWebPage>
      </template>
    </SchemaOrgArticle>

    <!-- Schema for glossary terms -->
    <SchemaOrgGlossaryTerm
      v-else-if="isGlossaryTerm && glossaryTerm"
      :name="glossaryTerm.title"
      :description="glossaryTerm.excerpt"
      :url="fullUrl"
      :identifier="fullUrl"
      :id="fullUrl"
      :isPartOf="{
        '@type': 'WebSite',
        '@id': baseUrl,
        'name': siteName,
        'url': baseUrl
      }"
      :breadcrumb="{
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbItems
      }"
    />

    <!-- Schema for blog posts -->
    <SchemaOrgBlogPosting
      v-else-if="isBlogPost && blogPost"
      :headline="blogPost.title"
      :image="blogPost.featuredImage?.node?.sourceUrl"
      :datePublished="blogPost.date"
      :dateModified="blogPost.modified"
      :authorName="blogPost.authorName"
      :description="blogPost.excerpt"
      :url="fullUrl"
      :identifier="fullUrl"
      :id="fullUrl"
      :isPartOf="{
        '@type': 'WebSite',
        '@id': baseUrl,
        'name': siteName,
        'url': baseUrl
      }"
      :breadcrumb="{
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbItems
      }"
    />

    <!-- Schema for tag pages -->
    <SchemaOrgCollectionPage
      v-else-if="isTag && tag"
      :name="tag.name"
      :description="tag.description"
      :url="fullUrl"
      :identifier="fullUrl"
      :id="fullUrl"
      :isPartOf="{
        '@type': 'WebSite',
        '@id': baseUrl,
        'name': siteName,
        'url': baseUrl
      }"
      :breadcrumb="{
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbItems
      }"
    >
      <template #mainEntity>
        <SchemaOrgMedicalEntity 
          :name="tag.name"
          :description="tag.description"
        />
      </template>
    </SchemaOrgCollectionPage>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
const route = useRoute();

const props = defineProps({
  post: {
    type: Object,
    default: () => null
  },
  glossaryTerm: {
    type: Object,
    default: () => null
  },
  blogPost: {
    type: Object,
    default: () => null
  },
  tag: {
    type: Object,
    default: () => null
  }
});

// Base URLs and site info
const baseUrl = computed(() => 'https://wikiherbalist.com');
const siteName = computed(() => config.public.siteName || 'Wikiherbalist');
const fullUrl = computed(() => `${baseUrl.value}${route.fullPath}`);

// Route type checks
const isPost = computed(() => route.name === 'post' || route.name === '[...uri]');
const isGlossaryTerm = computed(() => route.name === 'glossary-term');
const isBlogPost = computed(() => route.name === 'blog-post');
const isTag = computed(() => route.name === 'tag');

// Breadcrumb generation
const breadcrumbItems = computed(() => {
  const items = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': baseUrl.value
    }
  ];

  let currentPosition = 2;

  // Add parent page if exists
  if (isPost.value) {
    items.push({
      '@type': 'ListItem',
      'position': currentPosition++,
      'name': 'Piante medicinali',
      'item': `${baseUrl.value}/piante-medicinali`
    });
  } else if (isGlossaryTerm.value) {
    items.push({
      '@type': 'ListItem',
      'position': currentPosition++,
      'name': 'Glossario',
      'item': `${baseUrl.value}/glossario`
    });
  } else if (isBlogPost.value) {
    items.push({
      '@type': 'ListItem',
      'position': currentPosition++,
      'name': 'Blog',
      'item': `${baseUrl.value}/blog`
    });
  }

  // Add current page
  const currentPageName = props.post?.title || 
                         props.glossaryTerm?.title || 
                         props.blogPost?.title || 
                         props.tag?.name;

  if (currentPageName) {
    items.push({
      '@type': 'ListItem',
      'position': currentPosition,
      'name': currentPageName,
      'item': fullUrl.value
    });
  }

  return items;
});

// Content sections
const sections = computed(() => [
  { name: 'Proprietà', cssSelector: '#section1' },
  { name: 'Nome scientifico', cssSelector: '#section2' },
  { name: 'Parti usate', cssSelector: '#section3' },
  { name: 'Nome comune', cssSelector: '#section4' },
  { name: 'Fitochimica', cssSelector: '#section5' },
  { name: 'Botanica', cssSelector: '#section6' },
  { name: 'Raccolta', cssSelector: '#section7' },
  { name: "Modalità d'uso", cssSelector: '#section8' },
  { name: 'Utilizzo tradizionale', cssSelector: '#section9' },
  { name: 'Ricerca scientifica', cssSelector: '#section10' },
  { name: 'Avvertenze e Controindicazioni', cssSelector: '#section11' },
  { name: 'Riferimenti', cssSelector: '#section12' }
]);
</script>