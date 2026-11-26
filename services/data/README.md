# Wikiherbalist Data

> **Stato: alpha, in fase di test.** L'API oggi è usata solo dal sito wikiherbalist.com e può cambiare senza preavviso. Una versione pubblica, documentata e con limiti d'uso, sarà disponibile a breve.

Servizio che raccoglie dati aperti sulle piante medicinali pubblicate su [wikiherbalist.com](https://wikiherbalist.com). I dati vengono normalizzati, ripuliti dai duplicati ed esposti con un'unica API. Ogni valore conserva la fonte da cui arriva, con link e licenza.

I dati delle fonti non sostituiscono le monografie della redazione: descrivono quanta ricerca esiste e cosa riportano le banche dati, non se una pianta funziona.

## Dati disponibili

Per ogni pianta:

| Area | Contenuto | Fonti |
|---|---|---|
| Tassonomia | nome accettato con autore, famiglia, classificazione da regno a specie, basionimo, sinonimi con fonte, identificativi esterni (GBIF, WFO, Catalogue of Life, Wikidata, NCBI, iNaturalist) | GBIF, World Flora Online, Catalogue of Life, Wikidata |
| Nomi comuni | nomi per lingua (codice ISO 639-1), uniti per grafia, con le fonti | GBIF, Wikidata, iNaturalist |
| Costituenti chimici | composti segnalati nella pianta con InChIKey, CID PubChem, formula, peso molecolare, nome IUPAC e DOI degli articoli che li riportano; elenco paginato e ricercabile | Wikidata (dati LOTUS), PubChem |
| Letteratura | articoli totali, revisioni e meta-analisi, articoli su studi clinici, andamento per anno negli ultimi 20 anni, revisioni e studi più recenti con rivista, anno, tipo di studio, accesso aperto e citazioni | PubMed, Europe PMC |
| Studi clinici registrati | totale e ripartizione per stato e fase; per ogni studio titolo, stato, fase, condizioni, partecipanti, date, promotore, paesi, trattamenti, sintesi del registro e presenza dei risultati; filtro per stato | ClinicalTrials.gov |
| Distribuzione | occorrenze per paese (ISO 3166-1) e per anno, osservazioni iNaturalist | GBIF, iNaturalist |
| Immagini | foto con licenza libera (CC0, CC BY, CC BY-SA), autore e riga di credito pronta | Wikimedia Commons, iNaturalist |
| Sintesi | estratto della voce di Wikipedia in italiano, con licenza | Wikipedia |

Ogni documento riporta anche le fonti usate con la licenza (`sources`) e la data dell'ultima raccolta riuscita per area (`freshness`). I tipi completi sono in [`src/types.ts`](src/types.ts); lo schema OpenAPI è servito da `/v1/openapi.json`.

## API

- `GET /v1/health`, `GET /v1/openapi.json`
- `GET /v1/sources`: fonti, licenze ed errori recenti
- `GET /v1/plants`: elenco delle piante con la copertura per area
- `GET /v1/plants/:slug`: documento unico della pianta (`PlantData`)
- `GET /v1/plants/:slug/compounds?offset=&limit=&q=`
- `GET /v1/plants/:slug/trials?offset=&limit=&status=`
- `GET /v1/plants/:slug/media`
- `POST /v1/admin/refresh/:slug`: nuova raccolta di una pianta, con `Authorization: Bearer $ADMIN_TOKEN`

## Come funziona

1. L'elenco delle piante viene da WordPress tramite GraphQL anonimo (slug e nome scientifico).
2. Con GBIF si cerca la corrispondenza esatta a livello di specie, seguendo i sinonimi fino al nome accettato. Da lì si ricavano gli identificativi delle altre fonti; Wikidata è cercato per ID GBIF.
3. Ogni area si raccoglie da sola: se una fonte non risponde, l'area conserva i dati dell'ultima raccolta riuscita.
4. Le risposte delle fonti sono salvate senza chiavi API, così la normalizzazione si può rifare senza riscaricare.
5. Deduplica: nomi scientifici per nome canonico, nomi comuni per lingua e grafia, composti per InChIKey e poi CID, articoli per PMID, studi per NCT ID.

Ogni host esterno ha un limite di richieste, retry con attesa e un User-Agent con un indirizzo di contatto, come chiedono le fonti. Prove, esclusioni e limiti di ciascuna fonte sono in [docs/sources.md](docs/sources.md).

## Sviluppo

Richiede Node.js 24 e PostgreSQL 16. La configurazione è in `.env` (vedi `.env.example`).

```bash
npm ci
npm run build && npm test && npm run lint
node dist/cli.js migrate
node dist/cli.js collect                # tutte le piante
node dist/cli.js collect curcuma-longa  # solo quelle indicate
node dist/cli.js trials                 # solo gli studi clinici
node dist/cli.js report                 # copertura per area
npm run db:generate                     # nuova migrazione dopo una modifica a src/db/schema.ts
npm start                               # API
```

`deploy/deploy.sh` installa una release accanto alle precedenti, esegue build, test, lint e migrazioni, poi la attiva e torna indietro se `/v1/health` non risponde. `deploy/backup.sh` fa il dump giornaliero del database. Entrambi leggono percorsi e nome del servizio da variabili d'ambiente.

## Licenza

Il codice segue la licenza del repository. I dati restano soggetti alle licenze delle fonti, indicate in ogni risposta.
