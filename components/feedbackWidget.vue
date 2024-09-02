<template>
  <ClientOnly>
    <Transition name="fade-slide">
      <div
        v-if="showWidget"
        class="fixed print:hidden bottom-0 z-50 bg-ghiaccio shadow-lg py-4 px-10 max-w-sm border border-celeste left-1/2 transform -translate-x-1/2 w-11/12 rounded-tl-lg rounded-tr-lg md:rounded-tl-none sm:left-0 sm:transform-none sm:translate-x-0 sm:w-auto"
      >
        <div v-if="!submitted && !error">
          <template v-if="!showCommentField">
            <button @click="closeWidget" class="absolute top-2 right-4 text-celeste hover:text-blu">
              ✕
            </button>
            <p class="text-xl font-bold mb-4 text-blu">{{ question }}</p>
            <div class="flex space-x-4">
              <button
                v-for="option in options"
                :key="option.value"
                @click="selectFeedback(option.value)"
                :class="[
                  'flex-1 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform',
                  option.class
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </template>
          <template v-else>
            <button @click="closeWidget" class="absolute top-2 right-4 text-celeste hover:text-blu">
              ✕
            </button>
            <p class="text-lg font-semibold mb-3 text-blu">Come miglioreresti Wikiherbalist?</p>
            <textarea 
              v-model="comment" 
              class="w-full p-3 border border-celeste rounded-xl focus:outline-none focus:ring-2 focus:ring-blu"
              rows="4"
              placeholder="La tua opinione (opzionale)"
            ></textarea>
            <div class="flex justify-end mt-3">
              <button 
                @click="submitFeedback" 
                class="bg-verde text-white font-bold py-2 px-4 rounded-xl hover:bg-white hover:text-verde transition-colors duration-300"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Invio in corso...' : 'Invia' }}
              </button>
            </div>
          </template>
        </div>
        <div v-else-if="submitted && !error" class="text-center">
          <p class="text-xl font-bold mb-2 text-verde">Grazie per il tuo feedback!</p>
          <p class="text-sm text-gray-600">La tua opinione è importante per migliorare il sito.</p>
        </div>
        <div v-else-if="error" class="text-center">
          <p class="text-xl font-bold mb-2 text-red-500">Si è verificato un errore</p>
          <p class="text-sm text-gray-600">{{ error }}</p>
          <button @click="resetWidget" class="mt-3 bg-blu text-white font-bold py-2 px-4 rounded-xl hover:bg-celeste transition-colors duration-300">
            Riprova
          </button>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showWidget = ref(false)
const submitted = ref(false)
const showCommentField = ref(false)
const selectedFeedback = ref<string | null>(null)
const comment = ref('')
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const question = ref('Trovi utile questa pagina?')
const options = ref([
  { label: 'SI', value: 'yes', class: 'bg-verde text-white hover:bg-white hover:text-verde' },
  { label: 'NO', value: 'no', class: 'bg-red-500 text-white hover:bg-white hover:text-red-500' }
])

const FEEDBACK_DELAY = 5000 // 5 seconds
const FEEDBACK_COOLDOWN = 60 * 24 * 60 * 60 * 1000 // 60 days in milliseconds

onMounted(() => {
  checkFeedbackStatus()
})

watch(() => route.fullPath, () => {
  resetWidget()
  checkFeedbackStatus()
})

function checkFeedbackStatus() {
  const currentPath = route.fullPath
  const lastFeedbackTime = localStorage.getItem(`lastFeedback_${currentPath}`)
  const isClosedInSession = sessionStorage.getItem(`feedbackClosed_${currentPath}`)

  if (isClosedInSession === 'true') {
    showWidget.value = false
  } else if (lastFeedbackTime) {
    const timeSinceLastFeedback = Date.now() - parseInt(lastFeedbackTime)
    if (timeSinceLastFeedback < FEEDBACK_COOLDOWN) {
      showWidget.value = false
    } else {
      scheduleWidgetDisplay()
    }
  } else {
    scheduleWidgetDisplay()
  }
}

const scheduleWidgetDisplay = () => {
  setTimeout(() => {
    showWidget.value = true
  }, FEEDBACK_DELAY)
}

const selectFeedback = (value: string) => {
  selectedFeedback.value = value
  showCommentField.value = true
}

const submitFeedback = async () => {
  console.log('Submitting feedback...')
  isSubmitting.value = true
  try {
    const payload = {
      url: window.location.href,
      feedback: selectedFeedback.value,
      comment: comment.value,
      device: getDeviceType(),
      userAgent: navigator.userAgent
    }
    console.log('Payload:', payload)

    const response = await fetch('/api/submitFeedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('Response status:', response.status)
    const result = await response.json()
    console.log('Response body:', result)

    if (response.ok && result.success) {
      console.log('Feedback submitted successfully')
      submitted.value = true
      localStorage.setItem(`lastFeedback_${route.fullPath}`, Date.now().toString())
      setTimeout(() => {
        showWidget.value = false
      }, 3000)
    } else {
      throw new Error(result.message || 'Failed to submit feedback')
    }
  } catch (err) {
    console.error('Error submitting feedback:', err)
    error.value = `Si è verificato un errore durante l'invio del feedback: ${(err as Error).message}`
  } finally {
    isSubmitting.value = false
  }
}

const resetWidget = () => {
  showWidget.value = false
  submitted.value = false
  showCommentField.value = false
  selectedFeedback.value = null
  comment.value = ''
  error.value = null
  isSubmitting.value = false
}

const getDeviceType = (): string => {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

const closeWidget = () => {
  showWidget.value = false
  sessionStorage.setItem(`feedbackClosed_${route.fullPath}`, 'true')
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>