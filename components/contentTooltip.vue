<template>
  <div ref="contentContainer" v-html="sanitizedContent"></div>
  
  <Teleport to="body" v-if="isClient">
    <div 
      v-if="activeTooltip && !isSmallScreen"
      class="keywordsTooltip fixed bg-white border border-blu rounded-lg shadow-xl z-50"
      :style="tooltipStyle"
      @mouseenter="keepTooltipVisible"
      @mouseleave="startHideTooltipTimer"
    >
      <div class="p-6 relative">
        <h4 class="text-2xl font-bold text-blu mb-4 mt-0">{{ activeTooltip.title }}</h4>
        <p v-html="activeTooltip.excerpt"></p>
      </div>
    </div>

    <div 
      v-if="activeTooltip && isSmallScreen"
      class="keywordsTooltip fixed bg-white border border-blu rounded-lg shadow-xl z-50"
      :style="tooltipStyle"
      @touchstart.stop="keepTooltipVisible"
    >
      <div class="p-6 relative">
        <button @click="hideTooltip" @touchstart.stop="hideTooltip" class="absolute top-2 right-2 text-blu hover:text-celeste">
          <span class="sr-only">Chiudi</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h4 class="text-2xl font-bold text-blu mb-4 mt-0">{{ activeTooltip.title }}</h4>
        <p v-html="activeTooltip.excerpt"></p>
        <button 
          @click="goToPost"
          @touchstart.stop="goToPost"
          class="mt-4 w-full bg-verde text-white font-bold py-2 px-4 rounded-xl hover:bg-celeste transition-colors duration-300"
        >
          Vai alla pagina
        </button>
      </div>
    </div>
  </Teleport>

  <Teleport to="body" v-if="isClient">
    <div 
      v-if="activeTooltip && isSmallScreen" 
      class="fixed inset-0 bg-black bg-opacity-50 z-40" 
      @click="hideTooltip" 
      @touchstart="hideTooltip"
    ></div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import DOMPurify from 'isomorphic-dompurify';

const props = defineProps<{
  content: string;
}>();

const router = useRouter();
const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

const contentContainer = ref<HTMLElement | null>(null);
const activeTooltip = ref<{ title: string; excerpt: string; slug: string; isGlossary: boolean } | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const isSmallScreen = ref(false);
const isClient = ref(false);
const isScrolling = ref(false);
let hideTimeout: number | null = null;
let scrollTimeout: number | null = null;
let mouseEnterTimeout: number | null = null;

const sanitizedContent = computed(() => {
  if (!props.content) return '';
  return DOMPurify.sanitize(props.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style'],
    ALLOW_DATA_ATTR: false
  });
});

const FETCH_TOOLTIP_DATA = gql`
  query FetchTooltipData($slug: String!) {
    postBy(slug: $slug) {
      title
      excerpt
      slug
    }
    glossaryTermBy(slug: $slug) {
      title
      excerpt
      slug
    }
  }
`;

const showTooltip = async (event: MouseEvent | Event) => {
  if (!isClient.value || isScrolling.value) {
    event.preventDefault();
    return;
  }
  
  clearTimeout(hideTimeout as number);
  const target = (event.target as HTMLElement).closest('a');
  
  if (target && target.getAttribute('href')) {
    const href = target.getAttribute('href') || '';
    
    // Skip external links
    if (href.startsWith('http') && !href.includes('wikiherbalist.com')) return;
    if (href.startsWith('//') && !href.includes('wikiherbalist.com')) return;
    
    // Extract slug from absolute or relative link
    let slug = href;
    if (href.includes('wikiherbalist.com')) {
      const url = new URL(href);
      slug = url.pathname;
    }
    slug = slug.replace(/^\//, '').replace(/^glossario\//, '');
    const isGlossary = href.includes('/glossario/');
    
    try {
      const { data } = await apolloClient.query({
        query: FETCH_TOOLTIP_DATA,
        variables: { slug },
        fetchPolicy: 'cache-first'
      });
      
      const tooltipData = isGlossary ? data.glossaryTermBy : data.postBy;
      
      if (tooltipData) {
        const linkText = target.textContent?.trim() || tooltipData.title;
        const sentenceCaseTitle = linkText.charAt(0).toUpperCase() + linkText.slice(1).toLowerCase();
        
        activeTooltip.value = {
          title: sentenceCaseTitle,
          excerpt: tooltipData.excerpt,
          slug: tooltipData.slug,
          isGlossary
        };
        
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
    } catch (error) {
      // Link not found, ignore
    }
  }
};

const handleMouseLeave = () => {
  if (mouseEnterTimeout) clearTimeout(mouseEnterTimeout);
  
  if (!isClient.value || isSmallScreen.value) return;
  startHideTooltipTimer();
};

const startHideTooltipTimer = () => {
  if (!isClient.value) return;
  hideTimeout = setTimeout(hideTooltip, 300);
};

const hideTooltip = () => {
  if (!isClient.value) return;
  activeTooltip.value = null;
};

const keepTooltipVisible = () => {
  if (!isClient.value) return;
  clearTimeout(hideTimeout as number);
};

const tooltipStyle = computed(() => ({
  position: 'absolute',
  top: `${tooltipPosition.value.y}px`,
  left: isSmallScreen.value ? '50%' : `${tooltipPosition.value.x}px`,
  transform: isSmallScreen.value ? 'translate(-50%, 0)' : 'translate(-50%, 10px)',
  width: isSmallScreen.value ? '90vw' : '600px',
  maxWidth: '90vw',
  maxHeight: '80vh',
  overflowY: 'auto',
}));

const goToPost = () => {
  if (!isClient.value || !activeTooltip.value) return;
  const path = activeTooltip.value.isGlossary ? `/glossario/${activeTooltip.value.slug}` : `/${activeTooltip.value.slug}`;
  hideTooltip();
  router.push(path);
};

const checkScreenSize = () => {
  if (!isClient.value) return;
  isSmallScreen.value = window.innerWidth < 768;
};

const handleScroll = () => {
  hideTooltip();
  isScrolling.value = true;
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = window.setTimeout(() => {
    isScrolling.value = false;
  }, 200);
};

const handleClick = (event: Event) => {
  if (!isSmallScreen.value) return;
  
  const target = (event.target as HTMLElement).closest('a');
  if (target && !isScrolling.value) {
    event.preventDefault();
    showTooltip(event);
  }
};

const handleMouseEnter = (event: Event) => {
  if (isSmallScreen.value) return;
  
  const target = (event.target as HTMLElement).closest('a');
  if (target && !isScrolling.value) {
    showTooltip(event);
  }
};

const attachEventListeners = () => {
  if (!isClient.value || !contentContainer.value) return;
  
  contentContainer.value.removeEventListener('click', handleClick, true);
  contentContainer.value.removeEventListener('mouseenter', handleMouseEnter, true);
  contentContainer.value.removeEventListener('mouseleave', handleMouseLeave, true);
  if (isSmallScreen.value) {
    contentContainer.value.addEventListener('click', handleClick, true);
  } else {
    contentContainer.value.addEventListener('mouseenter', handleMouseEnter, true);
  }
  contentContainer.value.addEventListener('mouseleave', handleMouseLeave, true);
};

onMounted(() => {
  isClient.value = true;
  checkScreenSize();
  
  if (isClient.value) {
    window.addEventListener('resize', () => {
      checkScreenSize();
      attachEventListeners();
    });
    window.addEventListener('scroll', handleScroll, { passive: true });
    nextTick(() => {
      attachEventListeners();
    });
  }
});

watch(() => props.content, async () => {
  if (isClient.value) {
    await nextTick();
    attachEventListeners();
  }
});

onUnmounted(() => {
  if (isClient.value) {
    window.removeEventListener('resize', checkScreenSize);
    window.removeEventListener('scroll', handleScroll);
    if (contentContainer.value) {
      contentContainer.value.removeEventListener('click', handleClick, true);
      contentContainer.value.removeEventListener('mouseenter', handleMouseEnter, true);
      contentContainer.value.removeEventListener('mouseleave', handleMouseLeave, true);
    }
  }
  if (scrollTimeout) clearTimeout(scrollTimeout);
  if (hideTimeout) clearTimeout(hideTimeout);
  if (mouseEnterTimeout) clearTimeout(mouseEnterTimeout);
});
</script>

<style scoped>
.keywordsTooltip {
  pointer-events: auto;
}
</style>
