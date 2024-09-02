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
      :url="post.uri"
    >
      <template #mainEntity>
        <SchemaOrgMedicalWebPage
          :about="{
            '@type': 'Substance',
            name: post.title
          }"
          :specialty="['Herbal Medicine', 'Phytotherapy']"
        >
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

    <!-- Schema for tag pages -->
    <SchemaOrgCollectionPage
      v-else-if="isTag && tag"
      :name="tag.name"
      :description="tag.description"
      :url="tag.uri"
    >
      <template #mainEntity>
        <SchemaOrgMedicalEntity :name="tag.name" />
      </template>
    </SchemaOrgCollectionPage>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  post: {
    type: Object,
    default: () => null
  },
  tag: {
    type: Object,
    default: () => null
  }
});

const route = useRoute();
const isPost = computed(() => route.name === 'post' || route.name === '[...uri]');
const isTag = computed(() => route.name === 'tag');

const sections = computed(() => [
  { name: 'Proprietà', cssSelector: '#section-1' },
  { name: 'Nome scientifico', cssSelector: '#section-2' },
  { name: 'Nome comune', cssSelector: '#section-3' },
  { name: 'Parti usate', cssSelector: '#section-4' },
  { name: 'Fitochimica', cssSelector: '#section-5' },
  { name: 'Botanica', cssSelector: '#section-6' },
  { name: 'Raccolta', cssSelector: '#section-7' },
  { name: 'Modalità d\'uso', cssSelector: '#section-8' },
  { name: 'Utilizzo tradizionale', cssSelector: '#section-9' },
  { name: 'Ricerca scientifica', cssSelector: '#section-10' },
  { name: 'Avvertenze e Controindicazioni', cssSelector: '#section-11' },
  { name: 'Riferimenti', cssSelector: '#section-12' }
]);
</script>