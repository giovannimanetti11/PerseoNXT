<template>
    <div class="bg-gradient-to-b from-ghiaccio to-white min-h-screen">
      <div class="container mx-auto px-4 py-12">
        <h1 class="text-4xl font-bold mb-8 text-center text-blu">Cookie Policy</h1>
        <div class="bg-white rounded-lg shadow-lg p-8">
          <p class="text-sm text-gray-600 mb-6">Ultimo aggiornamento: {{ new Date().toLocaleDateString('it-IT') }}</p>
          
          <div class="space-y-8">
            <section v-for="(section, index) in sections" :key="index">
              <h2 class="text-2xl font-semibold mb-4 text-verde">{{ index + 1 }}. {{ section.title }}</h2>
              <div class="prose max-w-none" v-html="section.content"></div>
            </section>
          </div>
  
          <div class="mt-12 pt-8 border-t border-gray-200">
            <h2 class="text-2xl font-semibold mb-4 text-verde">9. Contatti</h2>
            <p>Per domande o chiarimenti su questa Cookie Policy, contattateci a: 
              <a href="mailto:info@Wikiherbalist.com" class="text-blu hover:underline">info@Wikiherbalist.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const sections = [
    {
      title: "Introduzione",
      content: `<p>La presente Cookie Policy spiega come Wikiherbalist utilizza i cookie e tecnologie simili sul nostro sito web. Questa policy è conforme al Regolamento Generale sulla Protezione dei Dati (GDPR) e mira a fornire informazioni chiare e trasparenti sull'uso dei cookie.</p>`
    },
    {
      title: "Cosa sono i cookie?",
      content: `<p>I cookie sono piccoli file di testo che vengono salvati sul vostro dispositivo quando visitate un sito web. Servono a vari scopi, come ricordare le vostre preferenze, analizzare l'uso del sito e personalizzare la vostra esperienza di navigazione.</p>`
    },
    {
      title: "Tipi di cookie che utilizziamo",
      content: `<p>Utilizziamo o potremmo utilizzare i seguenti tipi di cookie:</p>
                <ul class="list-disc pl-6 mt-2">
                  <li><strong>Cookie strettamente necessari:</strong> Essenziali per il funzionamento del sito. Non possono essere disattivati.</li>
                  <li><strong>Cookie analitici/di prestazione:</strong> Ci aiutano a capire come i visitatori interagiscono con il sito, permettendoci di migliorarlo.</li>
                  <li><strong>Cookie funzionali:</strong> Permettono al sito di ricordare le vostre scelte (come la lingua) per fornire funzionalità migliorate e personalizzate.</li>
                  <li><strong>Cookie di targeting/pubblicitari:</strong> Utilizzati per mostrare annunci pubblicitari rilevanti in base ai vostri interessi.</li>
                </ul>`
    },
    {
      title: "Base giuridica per l'utilizzo dei cookie",
      content: `<p>Utilizziamo i cookie sulla base del vostro consenso esplicito, ad eccezione dei cookie strettamente necessari.</p>`
    },
    {
      title: "Cookie di terze parti",
      content: `<p>Alcuni cookie presenti sul nostro sito sono gestiti da terze parti, come Google Analytics per l'analisi del traffico. Questi fornitori di servizi hanno le proprie politiche sulla privacy e sull'uso dei cookie.</p>`
    },
    {
      title: "Durata dei cookie",
      content: `<p>I cookie che utilizziamo hanno diverse durate:</p>
                <ul class="list-disc pl-6 mt-2">
                  <li><strong>Cookie di sessione:</strong> Temporanei, vengono eliminati quando chiudete il browser.</li>
                  <li><strong>Cookie persistenti:</strong> Rimangono sul vostro dispositivo per un periodo specifico o fino a quando non li eliminate manualmente.</li>
                </ul>`
    },
    {
      title: "Gestione delle preferenze dei cookie",
      content: `<p>Potete gestire le vostre preferenze sui cookie in diversi modi:</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Attraverso il banner dei cookie presente sul nostro sito</li>
                  <li>Modificando le impostazioni del vostro browser</li>
                  <li>Utilizzando strumenti di opt-out forniti da terze parti per i loro cookie</li>
                </ul>`
    },
    {
      title: "Impatto della disattivazione dei cookie",
      content: `<p>La disattivazione di alcuni cookie potrebbe influire sulla vostra esperienza di navigazione e limitare alcune funzionalità del nostro sito.</p>`
    },
    {
      title: "Modifiche alla Cookie Policy",
      content: `<p>Ci riserviamo il diritto di modificare questa Cookie Policy in qualsiasi momento. Le modifiche entreranno in vigore immediatamente dopo la pubblicazione sul sito web. Vi invitiamo a controllare periodicamente questa pagina per eventuali aggiornamenti.</p>`
    }
  ];
  
  useHead({
    title: 'Cookie Policy - Wikiherbalist',
    meta: [
      { name: 'description', content: 'Cookie Policy di Wikiherbalist: informazioni dettagliate sull\'utilizzo dei cookie sul nostro sito in conformità con il GDPR.' }
    ]
  })
  </script>