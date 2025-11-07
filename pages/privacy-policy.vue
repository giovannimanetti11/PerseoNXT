<template>
    <div class="bg-gradient-to-b from-ghiaccio to-white min-h-screen">
      <div class="container mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold mb-8 text-center text-blu">Privacy Policy</h1>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <p class="text-sm text-gray-600 mb-6">Ultimo aggiornamento: Novembre 2024</p>
          
          <div class="space-y-8">
            <section v-for="(section, index) in sections" :key="index">
              <h2 class="text-2xl font-semibold mb-4 text-verde">{{ index + 1 }}. {{ section.title }}</h2>
              <div class="prose max-w-none" v-html="sanitizeHtml(section.content)"></div>
            </section>
          </div>
  
          <div class="mt-12 pt-8 border-t border-gray-200">
            <h2 class="text-2xl font-semibold mb-4 text-verde">11. Contatti</h2>
            <p>Per domande o chiarimenti su questa Privacy Policy, contattateci a: 
              <a href="mailto:info@Wikiherbalist.com" class="text-blu hover:underline">info@Wikiherbalist.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import DOMPurify from 'isomorphic-dompurify'

  const sanitizeHtml = (html) => {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class']
    })
  }

  const sections = [
    {
      title: "Introduzione",
      content: `<p>Benvenuti su Wikiherbalist. La vostra privacy è importante per noi. Questa Privacy Policy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo le vostre informazioni personali quando utilizzate il nostro sito web, in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR).</p>`
    },
    {
      title: "Titolare del trattamento",
      content: `<p>Il titolare del trattamento dei dati personali è Wikiherbalist. Per qualsiasi domanda relativa alla privacy, potete contattarci all'indirizzo email: info@Wikiherbalist.com.</p>`
    },
    {
      title: "Informazioni raccolte",
      content: `<p>Raccogliamo le seguenti informazioni:</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Informazioni di navigazione (indirizzo IP, browser utilizzato, pagine visitate)</li>
                  <li>Informazioni fornite volontariamente (nome, email, commenti)</li>
                  <li>Informazioni di ricerca (query di ricerca)</li>
                </ul>`
    },
    {
      title: "Base giuridica del trattamento",
      content: `<p>Il trattamento dei vostri dati personali si basa su una o più delle seguenti basi giuridiche:</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Il vostro consenso esplicito</li>
                  <li>L'esecuzione di un contratto di cui siete parte</li>
                  <li>Il rispetto di un obbligo legale</li>
                  <li>Il perseguimento del legittimo interesse del titolare del trattamento</li>
                </ul>`
    },
    {
      title: "Utilizzo delle informazioni",
      content: `<p>Utilizziamo le informazioni raccolte per:</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Migliorare il nostro sito web e i nostri servizi</li>
                  <li>Personalizzare l'esperienza utente</li>
                  <li>Rispondere alle richieste degli utenti</li>
                  <li>Inviare newsletter (se l'utente si è iscritto)</li>
                </ul>`
    },
    {
      title: "Condivisione delle informazioni",
      content: `<p>Non vendiamo, scambiamo o trasferiamo le vostre informazioni personali a terzi, ad eccezione di quanto necessario per fornire i nostri servizi o come richiesto dalla legge. Quando condividiamo i dati con terzi, ci assicuriamo che rispettino le normative sulla protezione dei dati.</p>`
    },
    {
      title: "Trasferimento internazionale dei dati",
      content: `<p>I vostri dati personali potrebbero essere trasferiti e conservati su server situati al di fuori dell'UE. In tal caso, adottiamo misure appropriate per garantire che i vostri dati siano trattati in modo sicuro e in conformità con questa Privacy Policy e il GDPR.</p>`
    },
    {
      title: "Cookies e tecnologie simili",
      content: `<p>Utilizziamo cookies e tecnologie simili per migliorare l'esperienza utente e analizzare l'utilizzo del sito. Per maggiori informazioni, consultate la nostra <a href="/cookie-policy" class="text-blu hover:underline">Cookie Policy</a>.</p>`
    },
    {
      title: "Sicurezza",
      content: `<p>Adottiamo misure di sicurezza tecniche e organizzative appropriate per proteggere le vostre informazioni personali da accessi non autorizzati, alterazioni, divulgazioni o distruzioni.</p>`
    },
    {
      title: "Diritti degli utenti",
      content: `<p>In conformità con il GDPR, avete i seguenti diritti:</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Diritto di accesso ai vostri dati personali</li>
                  <li>Diritto di rettifica dei dati inesatti</li>
                  <li>Diritto alla cancellazione dei dati ("diritto all'oblio")</li>
                  <li>Diritto alla limitazione del trattamento</li>
                  <li>Diritto alla portabilità dei dati</li>
                  <li>Diritto di opposizione al trattamento</li>
                  <li>Diritto di non essere sottoposto a una decisione basata unicamente sul trattamento automatizzato</li>
                </ul>
                <p class="mt-2">Per esercitare questi diritti, contattateci all'indirizzo email fornito.</p>`
    },
    {
      title: "Modifiche alla Privacy Policy",
      content: `<p>Ci riserviamo il diritto di modificare questa Privacy Policy in qualsiasi momento. Le modifiche entreranno in vigore immediatamente dopo la pubblicazione sul sito web. Vi invitiamo a controllare periodicamente questa pagina per eventuali aggiornamenti.</p>`
    }
  ];
  
  useHead({
    title: 'Privacy Policy - Wikiherbalist',
    meta: [
      { name: 'description', content: 'Privacy Policy di Wikiherbalist: come raccogliamo, utilizziamo e proteggiamo le tue informazioni personali in conformità con il GDPR.' }
    ]
  })
  </script>
