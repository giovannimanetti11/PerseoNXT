/**
 * Migrazione slug WordPress -> nome scientifico
 *
 * Questo script:
 * 1. Legge tutte le piante via GraphQL (slug attuale + nomeScientifico + databaseId)
 * 2. Calcola il nuovo slug dal nome scientifico
 * 3. Aggiorna lo slug WordPress via REST API
 * 4. Stampa le regole Nginx per i redirect 301
 *
 * Uso:
 *   node scripts/migrate-slugs-to-scientific.mjs [--dry-run]
 *
 * Con --dry-run non fa modifiche, stampa solo il piano.
 *
 * Prerequisiti: variabili d'ambiente caricate (o file .env presente)
 *   WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// Carica .env se presente
try {
  const env = readFileSync(resolve(__dir, '../.env'), 'utf8');
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
} catch { /* .env non presente, usa variabili d'ambiente di sistema */ }

const WP_GRAPHQL = process.env.WP_BASE_URL || 'https://admin.wikiherbalist.com/graphql';
const WP_REST    = WP_GRAPHQL.replace('/graphql', '/wp-json/wp/v2');
const USERNAME   = process.env.WP_USERNAME;
const PASSWORD   = process.env.WP_APP_PASSWORD;
const DRY_RUN    = process.argv.includes('--dry-run');

if (!USERNAME || !PASSWORD) {
  console.error('Errore: WP_USERNAME e WP_APP_PASSWORD devono essere impostati.');
  process.exit(1);
}

const AUTH = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

function toScientificSlug(nomeScientifico) {
  // Prendi solo genus + species (prime 2 parole), ignora gli autori
  const words = nomeScientifico.trim().split(/\s+/);
  const genusSpecies = words.slice(0, 2).join(' ');
  return genusSpecies
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // rimuovi caratteri speciali, preserva trattini
    .replace(/\s+/g, '-')            // spazi -> trattini
    .replace(/-+/g, '-')             // trattini multipli -> singolo
    .trim();
}

async function graphql(query, variables = {}) {
  const res = await fetch(WP_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': AUTH },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL error: ${res.status}`);
  return res.json();
}

async function fetchAllPosts() {
  const query = `
    query FetchPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes { databaseId slug nomeScientifico title }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const posts = [];
  let after = null;
  let hasNext = true;

  while (hasNext) {
    const res = await graphql(query, { first: 100, after });
    const { nodes, pageInfo } = res.data.posts;
    posts.push(...nodes);
    hasNext = pageInfo.hasNextPage;
    after = pageInfo.endCursor;
  }

  return posts;
}

async function updateWpSlug(databaseId, newSlug) {
  const res = await fetch(`${WP_REST}/posts/${databaseId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': AUTH,
    },
    body: JSON.stringify({ slug: newSlug }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`REST API error ${res.status}: ${txt}`);
  }
  return res.json();
}

async function main() {
  console.log(`Modalita': ${DRY_RUN ? 'DRY RUN (nessuna modifica)' : 'LIVE'}\n`);

  const posts = await fetchAllPosts();
  console.log(`Trovate ${posts.length} piante.\n`);

  const migrations = [];
  const conflicts = [];

  for (const post of posts) {
    if (!post.nomeScientifico) {
      console.warn(`  SKIP (no nomeScientifico): ${post.slug} - ${post.title}`);
      continue;
    }

    const newSlug = toScientificSlug(post.nomeScientifico);

    if (newSlug === post.slug) {
      console.log(`  OK (gia' corretto): ${post.slug}`);
      continue;
    }

    // Controlla conflitti tra le migrazioni
    if (migrations.some(m => m.newSlug === newSlug)) {
      conflicts.push({ post, newSlug });
      console.warn(`  CONFLITTO: ${post.slug} -> ${newSlug} (gia' usato da un'altra pianta)`);
      continue;
    }

    migrations.push({ post, oldSlug: post.slug, newSlug });
    console.log(`  MIGRA: ${post.slug} -> ${newSlug}`);
  }

  console.log(`\nMigrazioni pianificate: ${migrations.length}`);
  console.log(`Conflitti: ${conflicts.length}`);

  if (!DRY_RUN && migrations.length > 0) {
    console.log('\nAggiornamento WordPress...');
    let ok = 0, fail = 0;

    for (const { post, oldSlug, newSlug } of migrations) {
      try {
        await updateWpSlug(post.databaseId, newSlug);
        console.log(`  OK: ${oldSlug} -> ${newSlug}`);
        ok++;
      } catch (e) {
        console.error(`  FAIL: ${oldSlug} -> ${newSlug}: ${e.message}`);
        fail++;
      }
    }

    console.log(`\nCompletato: ${ok} OK, ${fail} falliti.`);
  }

  // Output regole Nginx per redirect 301
  if (migrations.length > 0) {
    console.log('\n# === Regole Nginx (aggiungi a sites-available/wikiherbalist.com) ===');
    for (const { oldSlug, newSlug } of migrations) {
      console.log(`rewrite ^/${oldSlug}$ /${newSlug} permanent;`);
    }
    console.log('# ===================================================================\n');
  }
}

main().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});
