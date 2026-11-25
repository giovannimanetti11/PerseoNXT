export default defineNuxtPlugin(() => {
  if (document.querySelector("script[data-perseo-first-party-analytics]")) return

  const script = document.createElement("script")
  script.src = "/__perseo-analytics/tracker.js?v=20260927b"
  script.defer = true
  script.dataset.persistence = "none"
  script.dataset.perseoFirstPartyAnalytics = "1"
  document.head.appendChild(script)
})
