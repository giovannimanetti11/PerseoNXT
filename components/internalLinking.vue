<template>
  <div>
    <!-- Container for the processed content -->
    <div ref="contentContainer" v-html="processedContent"></div>
    
    <!-- Tooltip for displaying additional information -->
    <div v-if="activeTooltip" 
         class="keywordsTooltip fixed z-50 bg-white border border-blu rounded-lg shadow-lg text-sm text-gray-700"
         :style="tooltipStyle">
      <div class="p-6">
        <h4 class="text-2xl font-bold text-blu mb-4 mt-0">{{ activeTooltip.title }}</h4>
        <p v-html="activeTooltip.excerpt"></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import DOMPurify from 'dompurify';

// Props definition
const props = defineProps({
  content: {
    type: String,
    required: true
  },
  currentSlug: {
    type: String,
    required: true
  },
  globalLinkedWords: {
    type: Set,
    required: true
  }
});

// Refs for managing component state
const contentContainer = ref(null);
const activeTooltip = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const processedContent = ref('');

// GraphQL query to fetch all posts and glossary terms
const FETCH_ALL_POSTS_AND_TERMS = gql`
  query FetchAllPostsAndTerms {
    posts(first: 1000) {
      nodes {
        title
        slug
        excerpt
      }
    }
    glossaryTerms(first: 1000) {
      nodes {
        title
        slug
        excerpt
        plurale
      }
    }
  }
`;

// Execute the GraphQL query
const { result } = useQuery(FETCH_ALL_POSTS_AND_TERMS);

// Main function to process the content and add internal links
const processContent = () => {
  if (!result.value) return;

  const posts = result.value.posts?.nodes || [];
  const glossaryTerms = result.value.glossaryTerms?.nodes || [];
  const allItems = [...posts, ...glossaryTerms];

  let allKeys = allItems
    .filter(item => item.slug !== props.currentSlug)
    .map(item => ({
      singular: item.title.toLowerCase(),
      plural: item.plurale ? item.plurale.toLowerCase() : null,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      isGlossary: !!item.plurale
    }))
    .sort((a, b) => b.singular.length - a.singular.length);

  // Create a temporary DOM element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = props.content;

  // Process the DOM tree
  processNode(tempDiv, allKeys);

  // Sanitize and set the processed content
  processedContent.value = DOMPurify.sanitize(tempDiv.innerHTML);
};

const processNode = (node, allKeys) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const originalContent = node.textContent;
    let modifiedContent = originalContent;

    allKeys.forEach(item => {
      const regexSingular = new RegExp(`\\b${escapeRegExp(item.singular)}\\b`, 'gi');
      const regexPlural = item.plural ? new RegExp(`\\b${escapeRegExp(item.plural)}\\b`, 'gi') : null;

      // Process both singular and plural forms
      [regexSingular, regexPlural].forEach((regex, index) => {
        if (regex) {
          modifiedContent = modifiedContent.replace(regex, (match) => {
            // Check if either singular or plural form has been linked
            if (!props.globalLinkedWords.has(item.singular.toLowerCase()) && !props.globalLinkedWords.has(item.plural?.toLowerCase())) {
              props.globalLinkedWords.add(item.singular.toLowerCase());
              if (item.plural) {
                props.globalLinkedWords.add(item.plural.toLowerCase());
              }
              return createLinkString(item, match);
            }
            return match;
          });
        }
      });
    });

    // Replace the node only if the content has been modified
    if (modifiedContent !== originalContent) {
      const newNode = document.createElement('span');
      newNode.innerHTML = modifiedContent;
      node.parentNode.replaceChild(newNode, node);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE && !['a', 'script', 'style'].includes(node.tagName.toLowerCase())) {
    Array.from(node.childNodes).forEach(child => processNode(child, allKeys));
  }
};

const createLinkString = (item, text) => {
  const href = item.isGlossary ? `/glossario/${item.slug}` : `/${item.slug}`;
  const tooltip = encodeURIComponent(JSON.stringify({ title: item.title, excerpt: item.excerpt }));
  return `<a href="${href}" class="text-blu hover:text-celeste internal-link" data-tooltip="${tooltip}">${text}</a>`;
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Function to show tooltip
const showTooltip = (event) => {
  const target = event.target.closest('.internal-link');
  if (target) {
    const tooltipData = JSON.parse(decodeURIComponent(target.dataset.tooltip));
    activeTooltip.value = tooltipData;
    
    const rect = target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 600;

    let left = rect.left + window.scrollX + rect.width / 2;
    if (left < tooltipWidth / 2) {
      left = tooltipWidth / 2;
    } else if (left + tooltipWidth / 2 > viewportWidth) {
      left = viewportWidth - tooltipWidth / 2;
    }

    tooltipPosition.value = {
      x: left,
      y: rect.bottom + window.scrollY
    };
  }
};

// Function to hide tooltip
const hideTooltip = () => {
  activeTooltip.value = null;
};

// Computed property for tooltip style
const tooltipStyle = computed(() => {
  return {
    position: 'absolute',
    top: `${tooltipPosition.value.y}px`,
    left: `${tooltipPosition.value.x}px`,
    transform: 'translate(-50%, 10px)',
    width: '600px',
    maxWidth: '90vw',
    zIndex: 1000
  };
});

// Lifecycle hooks
onMounted(() => {
  processContent();
  if (contentContainer.value) {
    contentContainer.value.addEventListener('mouseover', showTooltip);
    contentContainer.value.addEventListener('mouseout', hideTooltip);
  }
});

onUnmounted(() => {
  if (contentContainer.value) {
    contentContainer.value.removeEventListener('mouseover', showTooltip);
    contentContainer.value.removeEventListener('mouseout', hideTooltip);
  }
});

// Watch for changes in props and query result
watch(() => props.content, processContent);
watch(result, processContent);
</script>

<style scoped>
.internal-link {
  cursor: pointer;
}

.keywordsTooltip {
  max-height: 90vh;
  overflow-y: auto;
}

.keywordsTooltip h4 {
  margin-top: 0 !important;
  color: #036297 !important;
}

@media (max-width: 768px) {
  .keywordsTooltip {
    width: 90vw !important;
  }
}
</style>