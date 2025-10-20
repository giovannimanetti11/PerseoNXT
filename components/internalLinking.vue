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
import { ref, computed, onMounted, onUnmounted, watch, nextTick, useSSRContext } from 'vue';
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
const isClient = ref(false);
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
const { data: queryResult, error: queryError } = await useAsyncData(
  'allPostsAndTerms',
  async () => {
    try {
      const { data } = await apolloClient.query({
        query: FETCH_ALL_POSTS_AND_TERMS,
        fetchPolicy: 'network-only'
      });
      return data;
    } catch (error) {
      console.error('Error fetching glossary terms:', error);
      // Return empty data structure instead of throwing
      return { posts: { nodes: [] }, glossaryTerms: { nodes: [] } };
    }
  },
  {
    immediate: true,
    server: true,
    lazy: false
  }
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
  return `<a href="${href}" class="text-blu hover:text-celeste internal-link font-bold" data-tooltip="${tooltip}">${text}</a>`;
};

// Function to escape special characters in regular expressions
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to check if a string contains blacklisted terms
const containsBlacklistedTerm = (context: string): boolean => {
  return BLACKLISTED_TERMS.some(term => context.toLowerCase().includes(term.toLowerCase()));
};

// Content cache for memoization
const contentCache = new Map<string, string>();

// Server-side compatible content processing function
const processContentSSR = (content: string, allItems: any[]): string => {
  if (!content) return '';
  
  // Create a cache key based on content and current slug
  const cacheKey = `${content.length}_${props.currentSlug}_${props.globalLinkedWords.size}`;
  
  // Check if we have a cached result
  if (contentCache.has(cacheKey)) {
    console.log('Using cached processed content');
    return contentCache.get(cacheKey) as string;
  }
  
  let processedHtml = content;
  const linkedWords = new Set<string>();
  
  // Prepare items for processing
  const allKeys = allItems
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
  
  // Function to check if a position is inside an HTML tag
  const isInsideHtmlTag = (html: string, position: number): boolean => {
    // Check if the position is inside an <a> tag
    const beforePosition = html.substring(0, position);
    const afterPosition = html.substring(position);
    
    // Count opening <a> and closing </a> tags before the position
    const openTagsBeforeCount = (beforePosition.match(/<a[^>]*>/gi) || []).length;
    const closeTagsBeforeCount = (beforePosition.match(/<\/a>/gi) || []).length;
    
    // If there are more opening tags than closing tags, we're inside an <a> tag
    return openTagsBeforeCount > closeTagsBeforeCount;
  };
  
  // Function to check if a position is inside an attribute value
  const isInsideAttribute = (html: string, position: number): boolean => {
    const beforePosition = html.substring(0, position);
    
    // Check for attribute patterns like alt="..." or title="..." before the position
    const attrPattern = /\s(alt|title|aria-label|placeholder|data-\w+)=["'][^"']*$/i;
    return attrPattern.test(beforePosition);
  };
  
  // Process each keyword
  allKeys.forEach(item => {
    if (props.globalLinkedWords.has(item.singular.toLowerCase()) ||
        (item.plural && props.globalLinkedWords.has(item.plural.toLowerCase()))) {
      return;
    }
    
    // Create simpler regexes that are more likely to match
    const singularPattern = `\\b${escapeRegExp(item.singular)}\\b`;
    const pluralPattern = item.plural ? `\\b${escapeRegExp(item.plural)}\\b` : null;
    
    const regexSingular = new RegExp(singularPattern, 'gi'); // Use global flag to replace all occurrences
    const regexPlural = pluralPattern ? new RegExp(pluralPattern, 'gi') : null;
    
    // Try to match singular form first
    let matched = false;
    
    // Function to replace matches safely
    const replaceMatches = (regex, originalText) => {
      return originalText.replace(regex, (match) => {
        // Skip if inside HTML tag or attribute
        const tempIndex = originalText.indexOf(match);
        if (isInsideHtmlTag(originalText, tempIndex) || isInsideAttribute(originalText, tempIndex)) {
          return match;
        }
        
        // Skip if contains blacklisted term
        const startIndex = Math.max(0, tempIndex - 20);
        const endIndex = Math.min(originalText.length, tempIndex + match.length + 20);
        const matchContext = originalText.substring(startIndex, endIndex);
        
        if (containsBlacklistedTerm(matchContext)) {
          return match;
        }
        
        matched = true;
        return createLinkString(item, match);
      });
    };
    
    // Process singular form
    processedHtml = replaceMatches(regexSingular, processedHtml);
    
    // Process plural form if it exists
    if (regexPlural) {
      processedHtml = replaceMatches(regexPlural, processedHtml);
    }
    
    // If we successfully matched and replaced, update the linked words
    if (matched) {
      linkedWords.add(item.singular.toLowerCase());
      if (item.plural) {
        linkedWords.add(item.plural.toLowerCase());
      }
    }
  });
  
  // Update global linked words
  linkedWords.forEach(word => props.globalLinkedWords.add(word));
  
  // Cache the processed content
  contentCache.set(cacheKey, processedHtml);
  
  // Limit cache size to prevent memory leaks
  if (contentCache.size > 50) {
    const iterator = contentCache.keys();
    const firstKey = iterator.next().value;
    if (firstKey) {
      contentCache.delete(firstKey);
    }
  }
   
  return processedHtml;
};

// Main function to process content and add internal links
const processContent = () => {
  console.log('Starting content processing');
  
  if (!queryResult.value) {
    console.error('No query results available');
    processedContent.value = props.content;
    return;
  }

  // Map posts and glossary terms
  const posts = queryResult.value.posts?.nodes.map(item => ({ ...item, isGlossary: false })) || [];
  const glossaryTerms = queryResult.value.glossaryTerms?.nodes.map(item => ({ ...item, isGlossary: true })) || [];
  const allItems = [...posts, ...glossaryTerms];

  console.log('Total items to process:', allItems.length);
  console.log('Sample items:', allItems.slice(0, 3));
  
  // Process content with SSR-compatible function regardless of whether we're on client or server
  const html = processContentSSR(props.content, allItems);

  // DOMPurify is only available on client-side
  const sanitizedHtml = (typeof window !== 'undefined' && DOMPurify.sanitize) ? DOMPurify.sanitize(html) : html;
  processedContent.value = sanitizedHtml;
};

// Function to show tooltip
const showTooltip = (event: MouseEvent) => {
  if (!isClient.value) return;
  
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
  if (!isClient.value) return;
  
  if (!isSmallScreen.value) {
    startHideTooltipTimer();
  }
};

// Function to start the hide tooltip timer
const startHideTooltipTimer = () => {
  if (!isClient.value) return;
  
  hideTimeout = setTimeout(hideTooltip, 300);
};

// Function to handle outside click
const handleOutsideClick = (event: MouseEvent) => {
  if (!isClient.value) return;
  
  if (activeTooltip.value && !event.target?.closest('.keywordsTooltip') && !(event.target as Element).closest('.internal-link')) {
    hideTooltip();
  }
};

// Function to hide tooltip
const hideTooltip = () => {
  if (!isClient.value) return;
  
  activeTooltip.value = null;
};

// Function to keep tooltip visible
const keepTooltipVisible = () => {
  if (!isClient.value) return;
  
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
  if (!isClient.value) return;
  
  isSmallScreen.value = window.innerWidth < 768;
};

// Function to navigate to the post
const goToPost = () => {
  if (!isClient.value) return;
  
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
  isClient.value = true;
  checkScreenSize();
  
  if (isClient.value) {
    window.addEventListener('resize', checkScreenSize);
    
    // Re-process content to ensure client-side sanitization
    processContent();
    
    // Add event listeners for tooltip functionality
    if (contentContainer.value) {
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
      
      if (isSmallScreen.value) {
        contentContainer.value.addEventListener('click', handleInteraction);
        contentContainer.value.addEventListener('touchstart', handleInteraction);
      } else {
        contentContainer.value.addEventListener('mouseenter', handleInteraction, true);
      }
      
      // Store the handler for cleanup
      (contentContainer.value as any)._interactionHandler = handleInteraction;
    }
    
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
  }
});

onUnmounted(() => {
  console.log('Component unmounting');
  if (isClient.value) {
    window.removeEventListener('resize', checkScreenSize);
    
    if (contentContainer.value) {
      const handler = (contentContainer.value as any)._interactionHandler;
      if (handler) {
        contentContainer.value.removeEventListener('click', handler);
        contentContainer.value.removeEventListener('touchstart', handler);
        contentContainer.value.removeEventListener('mouseenter', handler, true);
      }
    }
    
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('touchstart', handleOutsideClick);
  }
});

// Process content initially
processContent();
</script>