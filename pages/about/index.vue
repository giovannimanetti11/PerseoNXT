<template>
  <div class="bg-gray-50 min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div v-if="pending" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      </div>
      <div v-else-if="error" class="text-center text-red-600 font-semibold">
        {{ error.message }}
      </div>
      <div v-else>
        <!-- About Content -->
        <div class="mt-16 mb-20">
          <h1 class="text-4xl sm:text-5xl font-bold text-gray-800 mb-8 text-center">Il progetto Wikiherbalist</h1>
          <div v-html="formattedAboutContent" class="about-content w-full mx-auto bg-white shadow-lg rounded-lg p-6 sm:p-8 text-base sm:text-lg text-gray-700 leading-relaxed"></div>
        </div>

        <!-- Members Section -->
        <div v-if="members.length > 0" class="mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-12 text-center">Staff</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="member in reversedMembers" :key="member.id" class="bg-white shadow-lg rounded-lg overflow-hidden transition duration-300 ease-in-out hover:scale-105">
              <div class="p-6">
                <div class="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 overflow-hidden rounded-full border-4 border-blue-100">
                  <NuxtImg 
                    v-if="member.featuredImage?.node?.sourceUrl" 
                    :src="member.featuredImage.node.sourceUrl" 
                    :alt="member.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                    <span class="text-2xl sm:text-4xl">{{ getInitials(member.title) }}</span>
                  </div>
                </div>
                <h3 class="text-xl font-semibold text-gray-800 text-center mb-2">{{ member.title }}</h3>
                <p v-if="member.affiliation" class="text-sm text-gray-600 text-center mb-3">{{ member.affiliation }}</p>
                <div v-html="formatContent(member.content)" class="text-sm text-gray-600 text-center mt-4 border-t pt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAsyncData } from '#app'
import { useGraphQL } from '~/composables/useGraphQL'
import DOMPurify from 'isomorphic-dompurify'

interface Member {
  id: string
  databaseId: number
  title: string
  content: string
  affiliation: string
  featuredImage?: {
    node: {
      sourceUrl: string
    }
  }
  memberCategories?: {
    nodes: {
      name: string
    }[]
  }
}

interface AboutData {
  pageBy: {
    content: string
  }
  members: {
    nodes: Member[]
  }
}

const FETCH_ABOUT_DATA = `
  query FetchAboutData {
    pageBy(uri: "about") {
      content
    }
    members {
      nodes {
        id
        databaseId
        title
        content
        affiliation
        featuredImage {
          node {
            sourceUrl
          }
        }
        memberCategories {
          nodes {
            name
          }
        }
      }
    }
  }
`

const { query } = useGraphQL()

const { data: aboutData, pending, error } = await useAsyncData<AboutData>('aboutData', async () => {
  const data = await query(FETCH_ABOUT_DATA)
  return data
}, {
  server: true,  // Force SSR only - prevents client-side refetch
  lazy: false
})

const aboutContent = computed(() => aboutData.value?.pageBy?.content || '')
const members = computed(() => aboutData.value?.members?.nodes || [])

const formattedAboutContent = computed(() => formatContent(aboutContent.value))

const reversedMembers = computed(() => [...members.value].reverse())

const formatContent = (content: string): string => {
  if (!content) return ''
  
  // Sanitize first
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class']
  })
  
  // Use a regular expression to add classes
  const formatted = sanitized.replace(/<(h[1-6]|ul|ol|li|a)([^>]*)>/g, (match, tag, attributes) => {
    let classes = ''
    switch (tag) {
      case 'h1':
        classes = 'text-3xl font-bold mt-6 mb-4'
        break
      case 'h2':
        classes = 'text-2xl font-bold mt-6 mb-4'
        break
      case 'h3':
        classes = 'text-xl font-bold mt-6 mb-4'
        break
      case 'h4':
        classes = 'text-lg font-bold mt-6 mb-4'
        break
      case 'ul':
        classes = 'list-disc list-inside my-4 pl-4'
        break
      case 'ol':
        classes = 'list-decimal list-inside my-4 pl-4'
        break
      case 'li':
        classes = 'mb-2'
        break
      case 'a':
        classes = 'text-blu hover:text-celeste underline'
        break
    }
    return `<${tag}${attributes} class="${classes}">`
  })

  return formatted
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

useHead({
  title: 'About'
})
</script>

<style>
  .about-content h4 {
    color: #5E9EF4;
    margin: 10px 0;
  }
</style>
