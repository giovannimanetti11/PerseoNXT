# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- `robots.txt`: Block aggressive scrapers and training crawlers (CCBot, Bytespider, PetalBot, SemrushBot, DotBot, MJ12bot, DataForSeoBot); AI search assistants (GPTBot, Google-Extended, PerplexityBot) remain allowed for GEO visibility
- `public/llms.txt`: Expanded GEO-oriented description with full monograph structure, source references, scientific committee info and usage guidelines for AI systems
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

