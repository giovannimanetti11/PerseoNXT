<template>
  <LegalDocument
    title="Cookie policy"
    updated="novembre 2026"
    :description="description"
    :sections="sections"
  />
</template>

<script setup lang="ts">
import type { LegalSection } from '~/components/LegalDocument.vue'

const description = "Cookie Policy di Wikiherbalist: informazioni dettagliate sull'utilizzo dei cookie sul nostro sito in conformità con il GDPR."

const sections: LegalSection[] = [
    {
      title: "Introduzione",
      content: `<p>La presente Cookie Policy spiega come Wikiherbalist utilizza i cookie e tecnologie simili sul nostro sito web. Questa policy è conforme al Regolamento Generale sulla Protezione dei Dati (GDPR) e mira a fornire informazioni chiare e trasparenti sull'uso dei cookie.</p>`
    },
    {
      title: "Cosa sono i cookie?",
      content: `<p>I cookie sono piccoli file di testo che vengono salvati sul vostro dispositivo quando visitate un sito web. Servono a vari scopi, come ricordare le vostre preferenze, analizzare l'uso del sito e personalizzare la vostra esperienza di navigazione.</p>`
    },
    {
      title: "Cookie utilizzati su questo sito",
      content: `<p>Wikiherbalist utilizza i seguenti cookie:</p>
                <table class="w-full mt-4 border-collapse">
                  <thead>
                    <tr class="bg-ghiaccio">
                      <th class="border border-gray-300 px-4 py-2 text-left">Nome Cookie</th>
                      <th class="border border-gray-300 px-4 py-2 text-left">Tipo</th>
                      <th class="border border-gray-300 px-4 py-2 text-left">Scopo</th>
                      <th class="border border-gray-300 px-4 py-2 text-left">Durata</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2"><strong>wikiherbalist_cookie_consent</strong></td>
                      <td class="border border-gray-300 px-4 py-2">Essenziale</td>
                      <td class="border border-gray-300 px-4 py-2">Memorizza le preferenze dell'utente sui cookie</td>
                      <td class="border border-gray-300 px-4 py-2">365 giorni</td>
                    </tr>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2"><strong>csrf_key</strong></td>
                      <td class="border border-gray-300 px-4 py-2">Essenziale</td>
                      <td class="border border-gray-300 px-4 py-2">Protegge l'invio del modulo "Trovi utile questa pagina?"</td>
                      <td class="border border-gray-300 px-4 py-2">30 minuti</td>
                    </tr>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2"><strong>_ga</strong></td>
                      <td class="border border-gray-300 px-4 py-2">Analitico</td>
                      <td class="border border-gray-300 px-4 py-2">Google Analytics - Distingue gli utenti</td>
                      <td class="border border-gray-300 px-4 py-2">2 anni</td>
                    </tr>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2"><strong>_ga_*</strong></td>
                      <td class="border border-gray-300 px-4 py-2">Analitico</td>
                      <td class="border border-gray-300 px-4 py-2">Google Analytics - Mantiene lo stato della sessione</td>
                      <td class="border border-gray-300 px-4 py-2">2 anni</td>
                    </tr>
                    <tr>
                      <td class="border border-gray-300 px-4 py-2"><strong>_gid</strong></td>
                      <td class="border border-gray-300 px-4 py-2">Analitico</td>
                      <td class="border border-gray-300 px-4 py-2">Google Analytics - Distingue gli utenti</td>
                      <td class="border border-gray-300 px-4 py-2">24 ore</td>
                    </tr>
                  </tbody>
                </table>`
    },
    {
      title: "Base giuridica per l'utilizzo dei cookie",
      content: `<p>Utilizziamo i cookie sulla base del vostro consenso esplicito, ad eccezione dei cookie strettamente necessari. Finché non date il consenso dal banner, Google Analytics funziona in modalità senza cookie (Consent Mode) e i cookie <code>_ga</code> non vengono creati.</p>`
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
  ]
</script>
