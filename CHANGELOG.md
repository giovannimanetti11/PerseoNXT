# Changelog

All notable changes to this project are documented in this file.

## [3.1.0] - 2026-11-25

### Upgrade
- Nuxt 4.6 -> 4.7.0, Vue 3.5.43 -> 3.5.46, vue-router 4 -> 5.5.1, Vite 8, nuxt-schema-org 7, @nuxtjs/robots 7, nuxt-site-config 5, VueUse 15, ESLint 10 with eslint-plugin-vue 10, vue-tsc for `npm run typecheck`
- Nuxt 4 directory layout: `app/`, `server/`, `shared/`; `media/` moved to `public/media/`
- `@nuxtjs/google-fonts` (deprecated) replaced by `@nuxt/fonts`; `@mailchimp/mailchimp_marketing` replaced by a direct call to the Mailchimp API (drops the vulnerable superagent 3)
- Removed unused dependencies: `@nuxtjs/algolia`, `@nuxtjs/recaptcha`, `@vuelidate/*`, `dompurify`, `dom-serializer`, `domhandler`, `htmlparser2`, `h3` (provided by Nuxt), `ts-node`, `unplugin`, `eslint-plugin-unicorn`; `ioredis` is now a declared dependency
- Node.js 22.22+ or 24.15+ required (Nuxt 4.7), CI on Node 24

### Fixed
- Forms (contacts, proposals, newsletter, feedback) read their keys from `process.env` at runtime, where PM2 does not provide them: all secrets now come from `runtimeConfig`
- reCAPTCHA on the client used `process.env.RECAPTCHA_PUBLIC_KEY`, undefined in the browser bundle
- Text before the first `<h3>` (blog and glossary introductions) was dropped and only shipped in the payload
- `/media/*` URLs referenced from code (default Open Graph image, publisher logo, placeholders) returned 404; publisher logo added as `public/media/logo.png`
- Monographs: GBIF, PubMed and classification data used fixed `useAsyncData` keys, so navigating between plants could show the previous plant's values
- Property tags listed at most 10 plants each (WPGraphQL default page size)
- Algolia admin pages compared the password against a placeholder in the browser, then sent an empty password; plant records were posted to the blog endpoint with the wrong schema
- Feedback widget: the single-use CSRF token was not renewed after a submission; comments with typographic apostrophes (’) were rejected
- WordPress outages answered 404 on content pages; they now answer 502 so crawlers retry
- Contact and proposal forms: fields required by the server were optional in the UI
- Sitemap `lastmod` could move to the previous day (UTC conversion of WordPress local dates)
- `pages/[...uri]` served the same monograph under any sub-path (`/zingiber-officinale/x`)
- Mailing list rejected names with accents
- Google Analytics started before consent: Consent Mode now defaults to denied until the banner choice
- Legal pages showed the current month as "last updated"

### Changed
- Content pages fetch `/api/content/{plant|glossary|blog}/{slug}`: WordPress HTML is split into sections on the server (cheerio no longer ships to the browser) and cached for 60 s
- GBIF taxonomy (`/api/taxonomy`) and PubMed count (`/api/pubmed-count`) go through cached server endpoints; the PubMed key stays on the server
- `/algoliaUpdate` handles plants, glossary and blog in one page with status, sync and optional removal of orphaned records; old admin URLs redirect
- One canonical per page, set in `app.vue`; removed the global canonical plugin and duplicated head logic
- Shared components for headers, table of contents, sections, dialogs, share/cite actions and legal pages replace per-page copies
- Common-name redirects use slugs without accents and refresh every 6 hours
- TypeScript everywhere with no `any`; tests cover content splitting, helpers, citations, sitemap, GraphQL guard and blog pagination
- Removed the unserved root `robots.txt` (the module serves `public/_robots.txt`); removed placeholder social links and "coming soon" entries from header and footer; removed the `SearchAction` that pointed to an unsupported `/?q=` URL

### Added
- `robots.txt`: Block aggressive scrapers and training crawlers (CCBot, Bytespider, PetalBot, SemrushBot, DotBot, MJ12bot, DataForSeoBot); GPTBot, Google-Extended and PerplexityBot remain allowed
- `public/llms.txt`: Expanded description with monograph structure, source references, scientific committee info and reuse guidelines
- `public/_robots.txt`: Synced bot blocking rules

### Changed
- `pages/[...uri].vue`: Upgraded monograph schema.org from plain `Article` to `['Article', 'MedicalWebPage']` — adds `specialty`, `medicalAudience`, and `isPartOf` fields for better medical content signals
- `pages/[...uri].vue`: Changed `about` type from `['MedicalEntity', 'Substance']` to `DietarySupplement` with `activeIngredient` and `relevantSpecialty` fields
- `pages/[...uri].vue`: Added `keywords` field to schema, generated dynamically from plant name, scientific name, common names and therapeutic tags
- `pages/[...uri].vue`: Enriched `author` schema with `worksFor` Organization node for stronger E-E-A-T signals
- `pages/[...uri].vue`: Added `isPartOf` WebSite node to schema for better graph connectivity
- `pages/piante-medicinali/index.vue`: Added `ItemList` + `DietarySupplement` JSON-LD schema with all monographs enumerated; added canonical link
- `pages/glossario/index.vue`: Added `ItemList` + `DefinedTermSet` JSON-LD schema with all glossary terms enumerated
- `server/api/sitemap.xml.ts`: Added image sitemap support — `featuredImage` fetched for each monograph, emitted as `<image:image>` nodes in sitemap XML; refactored date formatting and XML escaping helpers

## [3.0.1] - 2026-11-14

### Security
- Dependencies: `npm audit fix` without major upgrades; critical (dompurify, vitest) and high (node-forge, undici, follow-redirects, js-cookie, minimatch, editorconfig) advisories resolved, 0 critical / 0 high remaining
- `overrides`: undici 7.29.1 -> 7.30.2, nested `nuxt` -> undici 8.12.4

### Fixed
- `npm ci` failed on npm 11 during `nuxt prepare` because `nuxt-site-config` was only an optional peer at the tree root; now declared explicitly (`^3.2.21`, same version as the previous production release), so `scripts/deploy-production.sh` builds again from the lockfile

