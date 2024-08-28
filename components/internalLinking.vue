<template>
  <div @click="handleOutsideClick" @touchstart="handleOutsideClick">
    <!-- Container for the processed content -->
    <div ref="contentContainer" v-html="processedContent"></div>
    
    <!-- Tooltip for displaying additional information -->
    <Teleport to="body">
      <div v-if="activeTooltip" 
           class="keywordsTooltip fixed z-50 bg-white border border-blu rounded-lg shadow-lg text-sm text-gray-700"
           :style="tooltipStyle" 
           @mouseenter="keepTooltipVisible" 
           @mouseleave="handleMouseLeave"
           @touchstart.stop="keepTooltipVisible">
        <div class="p-6 relative">
          <button v-if="isSmallScreen" @click="hideTooltip" @touchstart.stop="hideTooltip" class="absolute top-2 right-2 text-blu hover:text-celeste">
            <span class="sr-only">Chiudi</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h4 class="text-2xl font-bold text-blu mb-4 mt-0">{{ activeTooltip.title }}</h4>
          <p v-html="activeTooltip.excerpt"></p>
          <button 
            v-if="isSmallScreen"
            @click="goToPost"
            @touchstart.stop="goToPost"
            class="mt-4 w-full bg-verde text-white font-bold py-2 px-4 rounded-xl hover:bg-celeste transition-colors duration-300"
          >
            Vai al post
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="activeTooltip && isSmallScreen" class="fixed inset-0 bg-black bg-opacity-50 z-40" @click="hideTooltip" @touchstart="hideTooltip"></div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRouter } from 'vue-router';
import gql from 'graphql-tag';
import DOMPurify from 'dompurify';

const router = useRouter();

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
const isSmallScreen = ref(false);
let hideTimeout = null;

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

// Function to process individual nodes in the DOM tree
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

// Function to create the HTML string for internal links
const createLinkString = (item, text) => {
  const href = item.isGlossary ? `/glossario/${item.slug}` : `/${item.slug}`;
  const tooltip = encodeURIComponent(JSON.stringify({ title: item.title, excerpt: item.excerpt, slug: item.slug, isGlossary: item.isGlossary }));
  return `<a href="${href}" class="text-blu hover:text-celeste internal-link" data-tooltip="${tooltip}">${text}</a>`;
};

// Function to escape special characters in regular expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to show tooltip
const showTooltip = (event) => {
  clearTimeout(hideTimeout);
  const target = event.target.closest('.internal-link');
  if (target) {
    const tooltipData = JSON.parse(decodeURIComponent(target.dataset.tooltip));
    activeTooltip.value = tooltipData;
    
    const rect = target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const tooltipWidth = isSmallScreen.value ? viewportWidth * 0.9 : 600;

    let left = rect.left + window.pageXOffset + rect.width / 2;
    if (isSmallScreen.value) {
      left = viewportWidth / 2;
    } else if (left < tooltipWidth / 2) {
      left = tooltipWidth / 2;
    } else if (left + tooltipWidth / 2 > viewportWidth) {
      left = viewportWidth - tooltipWidth / 2;
    }

    tooltipPosition.value = {
      x: left,
      y: rect.bottom + window.pageYOffset + 10
    };
  }
};

// Function to handle mouse leave
const handleMouseLeave = () => {
  if (!isSmallScreen.value) {
    startHideTooltipTimer();
  }
};

// Function to start the hide tooltip timer
const startHideTooltipTimer = () => {
  hideTimeout = setTimeout(hideTooltip, 300);
};

// Function to handle outside click
const handleOutsideClick = (event) => {
  if (activeTooltip.value && !event.target.closest('.tooltip-custom') && !event.target.closest('.internal-link')) {
    hideTooltip();
  }
};

// Function to hide tooltip
const hideTooltip = () => {
  activeTooltip.value = null;
};

// Function to keep tooltip visible
const keepTooltipVisible = () => {
  clearTimeout(hideTimeout);
};

// Computed property for tooltip style
const tooltipStyle = computed(() => {
  return {
    position: 'absolute',
    top: `${tooltipPosition.value.y}px`,
    left: isSmallScreen.value ? '50%' : `${tooltipPosition.value.x}px`,
    transform: isSmallScreen.value ? 'translate(-50%, 0)' : 'translate(-50%, 10px)',
    width: isSmallScreen.value ? '90vw' : '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 1001
  };
});

// Function to check if the screen is small (mobile or reduced desktop)
const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 768;
};

// Function to navigate to the post
const goToPost = () => {
  if (activeTooltip.value) {
    const path = activeTooltip.value.isGlossary ? `/glossario/${activeTooltip.value.slug}` : `/${activeTooltip.value.slug}`;
    hideTooltip();
    router.push(path);
  }
};

// Lifecycle hooks
onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  processContent();
  
  const handleInteraction = (event) => {
    const target = event.target.closest('.internal-link');
    if (target) {
      event.preventDefault();
      if (isSmallScreen.value || event.type === 'click' || event.type === 'touchstart') {
        showTooltip(event);
      } else if (event.type === 'mouseenter') {
        showTooltip(event);
      }
    }
  };

  if (contentContainer.value) {
    contentContainer.value.addEventListener('click', handleInteraction);
    contentContainer.value.addEventListener('touchstart', handleInteraction);
    contentContainer.value.addEventListener('mouseenter', handleInteraction, true);
  }

  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('touchstart', handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
  if (contentContainer.value) {
    contentContainer.value.removeEventListener('click', handleInteraction);
    contentContainer.value.removeEventListener('touchstart', handleInteraction);
    contentContainer.value.removeEventListener('mouseenter', handleInteraction, true);
  }
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('touchstart', handleOutsideClick);
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
  max-height: 80vh;
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