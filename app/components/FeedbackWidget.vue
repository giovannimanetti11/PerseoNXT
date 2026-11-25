<template>
  <Transition name="fade-slide">
    <div
      v-if="visible"
      class="fixed print:hidden bottom-0 z-50 bg-ghiaccio shadow-lg py-4 px-10 max-w-sm border border-celeste left-1/2 -translate-x-1/2 w-11/12 rounded-t-lg md:rounded-tl-none sm:left-0 sm:translate-x-0 sm:w-auto"
      role="region"
      aria-label="Feedback sulla pagina"
    >
      <button
        v-if="step !== 'done'"
        type="button"
        class="absolute top-2 right-4 text-celeste hover:text-blu"
        aria-label="Chiudi"
        @click="dismiss"
      >
        ✕
      </button>

      <template v-if="step === 'question'">
        <p class="text-xl font-bold mb-4 text-blu">Trovi utile questa pagina?</p>
        <div class="flex space-x-4">
          <button type="button" class="flex-1 font-bold py-3 px-6 rounded-xl transition-colors bg-verde text-white hover:bg-white hover:text-verde" @click="choose('yes')">
            SI
          </button>
          <button type="button" class="flex-1 font-bold py-3 px-6 rounded-xl transition-colors bg-red-500 text-white hover:bg-white hover:text-red-500" @click="choose('no')">
            NO
          </button>
        </div>
      </template>

      <form v-else-if="step === 'comment'" @submit.prevent="send">
        <label for="feedback-comment" class="block text-lg font-semibold mb-3 text-blu">
          Come miglioreresti Wikiherbalist?
        </label>
        <textarea
          id="feedback-comment"
          v-model="comment"
          class="w-full p-3 border border-celeste rounded-xl focus:outline-none focus:ring-2 focus:ring-blu"
          rows="4"
          placeholder="La tua opinione (opzionale, max 200 caratteri)"
          :maxlength="FEEDBACK_COMMENT_MAX"
        ></textarea>
        <div class="flex justify-between items-center mt-2 text-sm">
          <span class="text-gray-500">{{ comment.length }}/{{ FEEDBACK_COMMENT_MAX }} caratteri</span>
          <span v-if="commentError" class="text-red-500">{{ commentError }}</span>
        </div>
        <div class="flex justify-end mt-3">
          <button
            type="submit"
            class="bg-verde text-white font-bold py-2 px-4 rounded-xl hover:bg-white hover:text-verde transition-colors duration-300 disabled:opacity-60"
            :disabled="sending || Boolean(commentError)"
          >
            {{ sending ? 'Invio…' : 'Invia' }}
          </button>
        </div>
      </form>

      <div v-else-if="step === 'done'" class="text-center" role="status">
        <p class="text-xl font-bold mb-2 text-verde">Grazie per il tuo feedback!</p>
        <p class="text-sm text-gray-600">La tua opinione è importante per migliorare il sito.</p>
      </div>

      <div v-else class="text-center" role="alert">
        <p class="text-xl font-bold mb-2 text-red-500">Si è verificato un errore</p>
        <p class="text-sm text-gray-600">{{ errorMessage }}</p>
        <button type="button" class="mt-3 bg-blu text-white font-bold py-2 px-4 rounded-xl hover:bg-celeste transition-colors duration-300" @click="step = 'comment'">
          Riprova
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { FormResponse } from '#shared/types/api'

type Step = 'question' | 'comment' | 'done' | 'error'
type Answer = 'yes' | 'no'

const SHOW_AFTER_MS = 5000
const ASK_AGAIN_AFTER_MS = 60 * 24 * 60 * 60 * 1000

const route = useRoute()
const visible = ref(false)
const step = ref<Step>('question')
const answer = ref<Answer | null>(null)
const comment = ref('')
const sending = ref(false)
const errorMessage = ref('')
let showTimer: ReturnType<typeof setTimeout> | undefined

const commentError = computed(() => {
  const check = checkFeedbackComment(comment.value.trim())
  return check.ok ? '' : FEEDBACK_COMMENT_MESSAGES[check.reason]
})

const answeredKey = (path: string) => `lastFeedback_${path}`
const dismissedKey = (path: string) => `feedbackClosed_${path}`

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // private mode: the widget will simply ask again
  }
}

function schedule(path: string) {
  clearTimeout(showTimer)
  visible.value = false
  step.value = 'question'
  answer.value = null
  comment.value = ''

  if (readStorage(sessionStorage, dismissedKey(path)) === 'true') return
  const answeredAt = Number(readStorage(localStorage, answeredKey(path)) ?? 0)
  if (answeredAt && Date.now() - answeredAt < ASK_AGAIN_AFTER_MS) return
  showTimer = setTimeout(() => { visible.value = true }, SHOW_AFTER_MS)
}

function choose(value: Answer) {
  answer.value = value
  step.value = 'comment'
}

function dismiss() {
  visible.value = false
  writeStorage(sessionStorage, dismissedKey(route.path), 'true')
}

function deviceType(): 'desktop' | 'tablet' | 'mobile' {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet'
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)/.test(ua)) return 'mobile'
  return 'desktop'
}

async function send() {
  if (!answer.value || commentError.value) return
  sending.value = true
  try {
    // CSRF tokens are single use: ask for a fresh one for every submission.
    const { token } = await $fetch<{ token: string }>('/api/csrf-token')
    const result = await $fetch<FormResponse>('/api/submitFeedback', {
      method: 'POST',
      body: { url: route.path, feedback: answer.value, comment: comment.value.trim(), device: deviceType(), csrfToken: token },
    })
    if (!result.success) throw new Error(result.message)
    step.value = 'done'
    writeStorage(localStorage, answeredKey(route.path), String(Date.now()))
    setTimeout(() => { visible.value = false }, 3000)
  } catch (error) {
    errorMessage.value = error instanceof Error && error.message ? error.message : 'Riprova tra qualche minuto.'
    step.value = 'error'
  } finally {
    sending.value = false
  }
}

watch(() => route.path, schedule)
onMounted(() => schedule(route.path))
onBeforeUnmount(() => clearTimeout(showTimer))
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
</style>
