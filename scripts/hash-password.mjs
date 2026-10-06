/**
 * Genera un hash bcrypt per la password admin di Algolia.
 *
 * Uso:
 *   node scripts/hash-password.mjs <password>
 *
 * Poi aggiungi l'output nel file .env come:
 *   ALGOLIA_ACCESS_PASSWORD_HASH=<hash_generato>
 *
 * E rimuovi (o lascia per retrocompat) la variabile:
 *   ALGOLIA_ACCESS_PASSWORD=...
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash-password.mjs <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nAggiungi al file .env:\n');
console.log(`ALGOLIA_ACCESS_PASSWORD_HASH=${hash}`);
console.log('');
