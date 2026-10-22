<template>
  <main>
    <section class="wiki-reference-gradient py-14 w-11/12 m-auto rounded-2xl">
      <div class="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div class="mx-auto mt-16 max-w-4xl text-center sm:mt-20">
          <p class="mb-3 text-xs font-bold uppercase tracking-widest text-blu sm:text-sm">Entra nella redazione</p>
          <h1 class="text-3xl font-bold leading-tight text-gray-900 sm:text-5xl">Lavora con noi</h1>
          <p class="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-gray-700 sm:mt-6 sm:text-lg">
            Wikiherbalist è un progetto di divulgazione dedicato alle piante medicinali,
            alla fitoterapia e all'informazione scientifica. Cerchiamo persone competenti
            che vogliano contribuire, come volontarie e volontari, alla qualità dei nostri contenuti.
          </p>
          <NuxtLink
            to="/#section-contacts"
            class="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-verde bg-verde px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-transparent hover:text-verde focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blu sm:mt-8 sm:w-auto"
          >
            Proponi la tua collaborazione <span class="ml-2" aria-hidden="true">→</span>
          </NuxtLink>
        </div>

        <section aria-labelledby="profili-title" class="mt-12 border-t border-blu/15 pt-10 sm:mt-14 sm:pt-12">
          <h2 id="profili-title" class="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Chi cerchiamo</h2>
          <p class="mx-auto mt-3 max-w-3xl text-center leading-relaxed text-gray-700">
            Cerchiamo soprattutto collaboratori e collaboratrici per la redazione e la revisione scientifica:
            professionisti, ricercatori e persone con una preparazione verificabile nelle discipline pertinenti.
          </p>
          <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <article
              v-for="profile in profiles"
              :key="profile.title"
              class="rounded-2xl border border-blu/15 bg-blu/5 p-5 transition-colors duration-200 hover:border-verde/40 sm:p-6"
            >
              <h3 class="text-lg font-bold leading-snug text-blu sm:text-xl">{{ profile.title }}</h3>
              <p class="mt-3 leading-relaxed text-gray-700">{{ profile.description }}</p>
            </article>
          </div>
        </section>

        <section class="mt-12 grid grid-cols-1 gap-5 border-t border-blu/15 pt-10 sm:gap-6 sm:pt-12 lg:grid-cols-2">
          <div class="rounded-2xl border border-blu/15 bg-blu/5 p-5 sm:p-8">
            <h2 class="text-2xl font-bold text-blu">Di cosa ti occuperai</h2>
            <ul class="mt-5 space-y-3 leading-relaxed text-gray-700">
              <li v-for="activity in activities" :key="activity" class="flex items-start gap-3">
                <span class="mt-1 font-bold text-verde" aria-hidden="true">✓</span>
                <span>{{ activity }}</span>
              </li>
            </ul>
            <p class="mt-5 leading-relaxed text-gray-700">
              Impegno, argomenti e modalità della collaborazione vengono concordati in base
              alle competenze e alla disponibilità di ciascuno.
            </p>
          </div>

          <div class="rounded-2xl border border-blu/15 bg-blu/5 p-5 sm:p-8">
            <h2 class="text-2xl font-bold text-blu">Una collaborazione volontaria</h2>
            <p class="mt-5 leading-relaxed text-gray-700">
              Wikiherbalist opera come associazione di volontariato. Questa proposta
              <strong>non è un'offerta di lavoro retribuito</strong>: le attività sono svolte
              gratuitamente, senza stipendio né compensi.
            </p>
            <p class="mt-4 leading-relaxed text-gray-700">
              Se per le attività concordate vengono sostenute spese necessarie,
              <strong>possono essere rimborsate le spese effettivamente sostenute e documentate</strong>,
              entro i limiti e alle condizioni stabiliti preventivamente dall'associazione.
              Non sono previsti rimborsi forfettari.
            </p>
            <p class="mt-4 text-sm leading-relaxed text-gray-600">
              Per approfondire la disciplina del volontariato e dei rimborsi spese consulta
              l'<a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2017-07-03;117~art17=" target="_blank" rel="noopener noreferrer" class="font-semibold text-blu underline underline-offset-2 hover:text-verde">articolo 17 del Codice del Terzo settore</a>.
            </p>
          </div>
        </section>

        <section id="candidatura" aria-labelledby="candidatura-title" class="mt-12 scroll-mt-28 border-t border-blu/15 pt-10 text-center sm:pt-12">
          <div class="mx-auto max-w-3xl">
            <h2 id="candidatura-title" class="text-3xl font-bold text-gray-900 sm:text-4xl">Vuoi collaborare con noi?</h2>
            <p class="mt-4 leading-relaxed text-gray-700">
              Scrivici indicando il tuo ambito professionale o di studio, le principali competenze,
              gli argomenti che vorresti approfondire e la tua disponibilità.
              Se hai già pubblicato articoli o altri lavori divulgativi, puoi aggiungere i relativi link.
            </p>
            <NuxtLink
              to="/#section-contacts"
              class="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-verde bg-verde px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-transparent hover:text-verde focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blu sm:w-auto"
            >
              Scrivi alla redazione <span class="ml-2" aria-hidden="true">→</span>
            </NuxtLink>
            <p class="mt-4 text-sm leading-relaxed text-gray-600">
              In alternativa: <a href="mailto:info@wikiherbalist.com" class="font-semibold text-blu underline underline-offset-2 hover:text-verde">info@wikiherbalist.com</a>.
              Per il trattamento dei dati personali consulta la nostra
              <NuxtLink to="/privacy-policy" class="font-semibold text-blu underline underline-offset-2 hover:text-verde">Privacy Policy</NuxtLink>.
            </p>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>


<script setup lang="ts">
const profiles = [
  { title: 'Farmacisti', description: 'Per approfondimenti su principi attivi, interazioni, sicurezza d’uso e valutazione delle evidenze.' },
  { title: 'Biologi e biotecnologi', description: 'Per contenuti di biologia vegetale, fisiologia, sostanze naturali e ricerca scientifica.' },
  { title: 'Botanici, agronomi ed erboristi', description: 'Per identificazione delle specie, botanica applicata, descrizioni delle piante e tradizioni d’uso.' },
  { title: 'Medici e altri professionisti sanitari', description: 'Per verificare l’accuratezza delle informazioni sugli aspetti clinici, sui rischi e sulle precauzioni.' },
  { title: 'Chimici e ricercatori', description: 'Per leggere criticamente la letteratura e approfondire composizione, analisi e studi sulle piante medicinali.' },
  { title: 'Redattori e divulgatori scientifici', description: 'Per scrivere, revisionare e rendere accessibili articoli fondati su fonti scientifiche attendibili.' },
]

const activities = [
  'Scrivere e aggiornare articoli e schede sulle piante medicinali.',
  'Verificare fonti, bibliografia e correttezza scientifica dei contenuti.',
  'Revisionare testi per chiarezza, precisione e accessibilità.',
  'Proporre approfondimenti e nuovi temi da trattare.',
]

useHead({
  title: 'Lavora con noi - Collaborazioni volontarie',
  meta: [
    { name: 'description', content: 'Collabora volontariamente con Wikiherbalist. Cerchiamo redattori scientifici, farmacisti, biologi, botanici e altri esperti. Nessuno stipendio; possibili rimborsi delle spese documentate.' },
    { property: 'og:title', content: 'Lavora con noi | Wikiherbalist' },
    { property: 'og:description', content: 'Cerchiamo redattori e professionisti scientifici per collaborazioni di volontariato. Scopri come contribuire a Wikiherbalist.' },
    { property: 'og:type', content: 'website' },
  ],
  link: [{ rel: 'canonical', href: 'https://wikiherbalist.com/lavora-con-noi' }],
})
</script>
