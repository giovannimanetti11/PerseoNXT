<template>
  <div class="bg-gradient-to-b from-ghiaccio to-white min-h-screen">
    <div class="container mx-auto px-4 py-12">
      <h1 class="text-4xl font-bold mb-8 text-center text-blu">Disclaimer</h1>
      <div class="bg-white rounded-lg shadow-lg p-8">
        <p class="text-sm text-gray-600 mb-6">Ultimo aggiornamento: {{ new Date().toLocaleDateString('it-IT') }}</p>

        <div class="space-y-8">
          <section v-for="(section, index) in sections" :key="index">
            <h2 class="text-2xl font-semibold mb-4 text-verde">{{ index + 1 }}. {{ section.title }}</h2>
            <div class="prose max-w-none" v-html="sanitizeHtml(section.content)"></div>
          </section>
        </div>

        <div class="mt-12 pt-8 border-t border-gray-200">
          <h2 class="text-2xl font-semibold mb-4 text-verde">11. Contatti</h2>
          <p>Per domande o chiarimenti su questo disclaimer, contattateci a: 
            <a href="mailto:info@wikiherbalist.com" class="text-blu hover:underline">info@wikiherbalist.com</a>
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
    title: "Scopo informativo",
    content: `<p>Le informazioni contenute in questo sito sono fornite a scopo <strong>puramente informativo</strong> e non intendono sostituire in alcun modo il parere di un medico o di un professionista del settore. L'autore di questo sito web non è un medico né un farmacista e non offre consulenze mediche.</p>`
  },
  {
    title: "Accuratezza delle informazioni",
    content: `<p>Tutte le informazioni contenute in questo sito sono basate su ricerche e fonti affidabili, selezionate con cura e per quanto possibile aggiornate ed ufficiali. Tuttavia, non possiamo garantire la completezza, l'accuratezza o l'aggiornamento di tali informazioni. L'utilizzo di queste informazioni avviene a proprio rischio e pericolo.</p>`
  },
  {
    title: "Limitazione di responsabilità",
    content: `<p>L'autore di questo sito web non è responsabile per eventuali errori o omissioni nelle informazioni contenute in questo sito, né per eventuali danni o conseguenze derivanti dall'uso o dall'affidamento su tali informazioni.</p>`
  },
  {
    title: "Ricerca scientifica e applicazione pratica",
    content: `<p><strong>È importante evidenziare che gran parte delle ricerche sulle piante medicinali si basa per lo più su studi condotti in vitro o in vivo, il più delle volte su animali.</strong> <em>L'efficacia comprovata a livello biochimico in esperimenti in vitro di una determinata sostanza non garantisce che possa essere utile nella terapia umana.</em> Questo può essere dovuto, ad esempio, alla necessità di assumere quantità eccessive affinché gli effetti desiderati si manifestino in modo efficace e vantaggioso nel corpo umano.</p>`
  },
  {
    title: "Consulenza medica",
    content: `<p>Si consiglia <strong>vivamente</strong> di consultare sempre un medico o un professionista del settore prima di utilizzare qualsiasi prodotto o di intraprendere qualsiasi trattamento o terapia basata sulle informazioni contenute in questo sito.</p>`
  },
  {
    title: "Prodotti di terze parti",
    content: `<p>Il sito web wikiherbalist.com non vende direttamente prodotti erboristici, ma potrebbe promuovere prodotti presenti su siti terzi. L'autore di questo sito non ha alcun controllo sui prodotti venduti su siti terzi e non può assumersi alcuna responsabilità in merito alla loro qualità, sicurezza o efficacia.</p>`
  },
  {
    title: "Rischi dell'automedicazione",
    content: `<p><strong>Assumere un prodotto naturale che ha effetti terapeutici senza il controllo medico, per agire su una patologia in atto, pensando che, in quanto naturale, non possa far male ma produca solo effetti positivi, può rivelarsi una scelta stupida e pericolosa.</strong> Alcune piante non sono prive di effetti collaterali e alcune hanno anche tossicità potenzialmente letale.</p>`
  },
  {
    title: "Diritto d'autore",
    content: `<p>Tutti i contenuti presenti all'interno di questo sito, salvo diversa specificazione, sono proprietà di Wikiherbalist e sono protetti dalla normativa sul diritto d'autore. È consentita la citazione di parti del sito, a condizione che sia chiaramente indicata la fonte e sia inserito un link alla stessa.</p>`
  },
  {
    title: "Link a siti esterni",
    content: `<p>Wikiherbalist non è responsabile in relazione a quanto contenuto nei collegamenti ipertestuali ad altri siti web connessi al sito, in quanto totalmente estranei a qualsiasi forma di controllo da parte dell'autore.</p>`
  },
  {
    title: "Modifiche al disclaimer",
    content: `<p>Ci riserviamo il diritto di modificare questo disclaimer in qualsiasi momento. Le modifiche entreranno in vigore immediatamente dopo la pubblicazione sul sito web.</p>`
  }
];

useHead({
  title: 'Disclaimer',
  meta: [
    { name: 'description', content: 'Disclaimer di Wikiherbalist: avvertenze e limitazioni di responsabilità. Informazioni importanti sull\'uso dei contenuti del sito.' }
  ]
})
</script>
