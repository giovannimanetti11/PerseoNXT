# Fonti: verifica del 26/11/2026

Prova su cinque piante di riferimento: *Zingiber officinale*, *Curcuma longa*, *Verbena officinalis*, *Althaea officinalis* e *Arctostaphylos uva-ursi*.

| Fonte | Esito | Note |
|---|---|---|
| GBIF species/occurrence | 5/5, < 0,3 s | Corrispondenza `EXACT` per tutte. Sinonimi da 3 a 55. Facet per paese e anno disponibili. |
| World Flora Online (`matching_rest.php`) | 5/5, ~0,5 s | Restituisce l'ID WFO e il nome completo di autore. Non distingue nome accettato e sinonimo: si usa per l'ID e come controllo incrociato. |
| Catalogue of Life (ChecklistBank 3LR) | 5/5, < 0,3 s | I sinonimi richiedono una seconda chiamata (`/taxon/{id}/synonyms`). Gli "ambiguous synonym" vengono scartati. |
| Wikidata | 5/5 cercando per ID GBIF (P846) | La ricerca per nome (P225) su *Curcuma longa* restituiva un lemma del dizionario (L1370439-S1): **si cerca sempre per ID GBIF**. Composti per specie (P703): da 46 a 719, quasi tutti con InChIKey, CID e riferimento DOI. |
| PubChem PUG REST | ok | Le proprietà si scaricano a gruppi di 150 CID. |
| PubMed E-utilities | 5/5, < 0,6 s | Chiave NCBI già disponibile (10 richieste/s). |
| Europe PMC | instabile | Ricerche da 15 a 40 s e risposte 503 frequenti. Serve **solo come arricchimento facoltativo** (open access, citazioni) per gli articoli già trovati su PubMed. Se fallisce, i dati di PubMed vengono salvati comunque. |
| ClinicalTrials.gov API v2 | 5/5, ~0,2 s | `query.intr` sul binomio. Da 1 a 236 studi. |
| iNaturalist | 5/5 | Con `locale=it` restituisce il nome italiano, se esiste (Zenzero, Curcuma, Verbena comune); altrimenti ricade sull'inglese, che si riconosce confrontandolo con `english_common_name`. Foto solo con licenza `cc0` o `cc-by`, perché il sito è commerciale. Limite di circa 1 richiesta al secondo. |
| Wikipedia (it) REST | ok | Sintesi con licenza CC BY-SA 4.0, da attribuire. |
| Wikimedia Commons | ok | Immagini da Wikidata (P18). Sono ammesse pubblico dominio, CC0, CC BY e CC BY-SA; escluse NC e ND. Dagli URL si tolgono i parametri `utm_*`. |
| POWO / IPNI (Kew) | **esclusa** | Risponde 403 dietro una verifica Cloudflare: non ha un'API pubblica utilizzabile. |

## Limiti noti

- L'areale nativo, cioè la distinzione tra presenza nativa e introdotta, non è disponibile da nessuna fonte gratuita affidabile: POWO è escluso. La distribuzione mostra le osservazioni GBIF per paese e per anno, non l'areale.
- I conteggi PubMed usano la frase esatta sul binomio (`"Zingiber officinale"`), quindi sono più bassi di quelli mostrati in passato, che usavano la ricerca automatica di PubMed.
- I composti di Wikidata/LOTUS sono segnalazioni dalla letteratura: indicano che il composto è stato trovato nella specie, non in quale quantità.
