<template>
  <div @click="handleOutsideClick" @touchstart="handleOutsideClick">
    <!-- Container for the processed content -->
    <div ref="contentContainer" v-html="processedContent"></div>
    
    <!-- Tooltip for displaying additional information -->
    <Teleport to="body">
      <div v-if="activeTooltip" 
           class="keywordsTooltip fixed z-50 bg-white rounded-lg shadow-lg"
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
      <div v-if="activeTooltip && isSmallScreen" 
           class="fixed inset-0 bg-black bg-opacity-50 z-40" 
           @click="hideTooltip" 
           @touchstart="hideTooltip">
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAsyncData } from '#app';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import DOMPurify from 'dompurify';

// Blacklist of terms that should not be linked
const BLACKLISTED_TERMS = ['basilico sacro'];

const router = useRouter();
const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

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
const contentContainer = ref<HTMLElement | null>(null);
const activeTooltip = ref<{ title: string; excerpt: string; slug: string; isGlossary: boolean } | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const processedContent = ref('');
const isSmallScreen = ref(false);
let hideTimeout: number | null = null;

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

// Execute the GraphQL query using useAsyncData
const { data: queryResult } = await useAsyncData(
  'allPostsAndTerms',
  async () => {
    const { data } = await apolloClient.query({ query: FETCH_ALL_POSTS_AND_TERMS });
    return data;
  },
  { server: false }
);

// Function to create the HTML string for internal links
const createLinkString = (item: any, text: string): string => {
  const href = item.isGlossary ? `/glossario/${item.slug}` : `/${item.slug}`;
  const tooltip = encodeURIComponent(JSON.stringify({ 
    title: item.title, 
    excerpt: item.excerpt, 
    slug: item.slug, 
    isGlossary: item.isGlossary 
  }));
  return `<a href="${href}" class="text-blu hover:text-celeste internal-link" data-tooltip="${tooltip}">${text}</a>`;
};

// Function to escape special characters in regular expressions
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to find references section
const findReferencesSection = (node: Node): Element | null => {
  const root = node.getRootNode() as Document;
  const sections = Array.from(root.getElementsByClassName('post-section-riferimenti'));
  if (sections.length > 0) {
    return sections[0];
  }
  return null;
};

// Helper function to check if node is in references section
const isInReferencesSection = (node: Node): boolean => {
  const referencesSection = findReferencesSection(node);
  if (!referencesSection) return false;

  let currentNode = node.parentElement;
  while (currentNode) {
    if (currentNode === referencesSection) {
      return true;
    }
    currentNode = currentNode.parentElement;
  }
  return false;
};

// Main function to process content and add internal links
const processContent = () => {
  console.log('Starting content processing');
  
  if (!queryResult.value) {
    console.log('No query results available');
    return;
  }

  // Map posts and glossary terms
  const posts = queryResult.value.posts?.nodes.map(item => ({ ...item, isGlossary: false })) || [];
  const glossaryTerms = queryResult.value.glossaryTerms?.nodes.map(item => ({ ...item, isGlossary: true })) || [];
  const allItems = [...posts, ...glossaryTerms];

  console.log('Total items to process:', allItems.length);

  let allKeys = allItems
    .filter(item => item.slug !== props.currentSlug)
    .map(item => ({
      singular: item.title.toLowerCase(),
      plural: item.plurale ? item.plurale.toLowerCase() : null,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      isGlossary: item.isGlossary
    }))
    .sort((a, b) => b.singular.length - a.singular.length);

  // Create a temporary DOM element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = props.content;

  // Process nodes recursively
  const processNode = (node: Node) => {
    if (isInReferencesSection(node)) {
      console.log('Skipping references section content');
      return;
    }

    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const originalContent = node.textContent;
      let modifiedContent = originalContent;
      let contentChanged = false;

      allKeys.forEach(item => {
        if (props.globalLinkedWords.has(item.singular.toLowerCase()) ||
            (item.plural && props.globalLinkedWords.has(item.plural.toLowerCase()))) {
          return;
        }

        const regexSingular = new RegExp(`\\b${escapeRegExp(item.singular)}\\b`, 'gi');
        const regexPlural = item.plural ? new RegExp(`\\b${escapeRegExp(item.plural)}\\b`, 'gi') : null;

        regexSingular.lastIndex = 0;
        const matchSingular = regexSingular.exec(modifiedContent);

        let matchPlural = null;
        if (!matchSingular && regexPlural) {
          regexPlural.lastIndex = 0;
          matchPlural = regexPlural.exec(modifiedContent);
        }

        const match = matchSingular || matchPlural;
        
        if (match) {
          // Check for blacklisted terms
          const startIndex = Math.max(0, match.index - 20);
          const endIndex = Math.min(modifiedContent.length, match.index + match[0].length + 20);
          const context = modifiedContent.substring(startIndex, endIndex).toLowerCase();
          
          if (BLACKLISTED_TERMS.some(term => context.includes(term.toLowerCase()))) {
            console.log(`Skipping blacklisted term context: ${context}`);
            return;
          }

          const startPos = match.index;
          const endPos = startPos + match[0].length;
          
          modifiedContent = 
            modifiedContent.substring(0, startPos) +
            createLinkString(item, match[0]) +
            modifiedContent.substring(endPos);
          
          contentChanged = true;
          props.globalLinkedWords.add(item.singular.toLowerCase());
          if (item.plural) {
            props.globalLinkedWords.add(item.plural.toLowerCase());
          }
        }
      });

      if (contentChanged) {
        const span = document.createElement('span');
        span.innerHTML = modifiedContent;
        node.parentNode?.replaceChild(span, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && !['a', 'script', 'style'].includes((node as Element).tagName.toLowerCase())) {
      Array.from(node.childNodes).forEach(child => processNode(child));
    }
  };

  Array.from(tempDiv.childNodes).forEach(node => processNode(node));
  processedContent.value = DOMPurify.sanitize(tempDiv.innerHTML);
};

// Function to show tooltip
const showTooltip = (event: MouseEvent) => {
  clearTimeout(hideTimeout as number);
  const target = (event.target as HTMLElement).closest('.internal-link');
  if (target) {
    const tooltipData = JSON.parse(decodeURIComponent((target as HTMLElement).dataset.tooltip || '{}'));
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
const handleOutsideClick = (event: MouseEvent) => {
  if (activeTooltip.value && !event.target?.closest('.keywordsTooltip') && !(event.target as Element).closest('.internal-link')) {
    hideTooltip();
  }
};

// Function to hide tooltip
const hideTooltip = () => {
  activeTooltip.value = null;
};

// Function to keep tooltip visible
const keepTooltipVisible = () => {
  clearTimeout(hideTimeout as number);
};

// Computed property for tooltip style
const tooltipStyle = computed(() => ({
  position: 'absolute',
  top: `${tooltipPosition.value.y}px`,
  left: isSmallScreen.value ? '50%' : `${tooltipPosition.value.x}px`,
  transform: isSmallScreen.value ? 'translate(-50%, 0)' : 'translate(-50%, 10px)',
  width: isSmallScreen.value ? '90vw' : '600px',
  maxWidth: '90vw',
  maxHeight: '80vh',
  overflowY: 'auto',
  zIndex: 1001
}));

// Function to check if the screen is small
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

// Watch for changes in props and query result
watch(() => props.content, () => {
  console.log('Content changed, reprocessing...');
  processContent();
});

watch(queryResult, () => {
  console.log('Query results updated, reprocessing...');
  processContent();
});

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted');
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  processContent();
  
  const handleInteraction = (event: Event) => {
    const target = (event.target as HTMLElement).closest('.internal-link');
    if (target) {
      if (isSmallScreen.value) {
        event.preventDefault();
        showTooltip(event as MouseEvent);
      } else if (event.type === 'mouseenter') {
        showTooltip(event as MouseEvent);
      }
    }
  };

  if (contentContainer.value) {
    if (isSmallScreen.value) {
      contentContainer.value.addEventListener('click', handleInteraction);
      contentContainer.value.addEventListener('touchstart', handleInteraction);
    } else {
      contentContainer.value.addEventListener('mouseenter', handleInteraction, true);
    }
  }

  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('touchstart', handleOutsideClick);
});

onUnmounted(() => {
  console.log('Component unmounting');
  window.removeEventListener('resize', checkScreenSize);
  if (contentContainer.value) {
    contentContainer.value.removeEventListener('click', handleInteraction);
    contentContainer.value.removeEventListener('touchstart', handleInteraction);
    contentContainer.value.removeEventListener('mouseenter', handleInteraction, true);
  }
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('touchstart', handleOutsideClick);
});

// Helper function for event handling
const handleInteraction = (event: Event) => {
  const target = (event.target as HTMLElement).closest('.internal-link');
  if (target) {
    if (isSmallScreen.value) {
      event.preventDefault();
      showTooltip(event as MouseEvent);
    } else if (event.type === 'mouseenter') {
      showTooltip(event as MouseEvent);
    }
  }
};
</script>