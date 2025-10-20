<template>
  <nav aria-label="Breadcrumb" class="text-sm">
    <ol class="list-none p-0 inline-flex">
      <li class="flex items-center">
        <NuxtLink to="/" class="text-blu hover:text-celeste transition-colors duration-300">
          Home
        </NuxtLink>
        <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400 mx-2" />
      </li>
      <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
        <NuxtLink 
          v-if="index < breadcrumbs.length - 1" 
          :to="crumb.path" 
          class="text-blu hover:text-celeste transition-colors duration-300"
        >
          {{ crumb.name }}
        </NuxtLink>
        <span 
          v-else 
          class="text-gray-500"
          aria-current="page"
        >
          {{ crumb.name }}
        </span>
        <Icon 
          v-if="index < breadcrumbs.length - 1" 
          name="heroicons:chevron-right" 
          class="w-5 h-5 text-gray-400 mx-2" 
        />
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
currentPageName: {
  type: String,
  required: true
},
parentPath: {
  type: String,
  default: ''
},
parentName: {
  type: String,
  default: ''
}
});

const breadcrumbs = computed(() => {
const crumbs = [];

if (props.parentPath && props.parentName) {
  crumbs.push({
    path: props.parentPath,
    name: props.parentName
  });
}

crumbs.push({
  path: route.path,
  name: props.currentPageName
});

return crumbs;
});
</script>