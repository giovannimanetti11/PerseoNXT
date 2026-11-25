# PerseoNXT

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![last commit](https://img.shields.io/github/last-commit/giovannimanetti11/PerseoNXT)

PerseoNXT is the Nuxt frontend of [wikiherbalist.com](https://wikiherbalist.com), an Italian encyclopedia of medicinal plants. Content lives in a headless WordPress (WPGraphQL); this app renders it with server-side rendering.

<p align="center">
<img src="https://github.com/user-attachments/assets/1b48f4bd-8628-4e8f-bea2-8e28bf12b7d6" alt="homepage" width="300">
</p>

## Stack

- Nuxt 4.7 and Vue 3.5, TypeScript in strict mode (no `any`, enforced by ESLint)
- WordPress through WPGraphQL: read-only, anonymous queries
- Algolia for site search, Tailwind CSS 3, OpenLayers for the observation map
- Vitest for unit tests

## Project layout

```
app/                 Vue application (pages, components, composables, utils)
server/api/          Nitro endpoints
  content/           monograph, glossary term and blog post, already split into sections
  graphql.ts         read-only GraphQL proxy used by list pages and link previews
  algolia/           status and sync of the search index (password protected)
  sitemap.xml.ts     sitemap with image entries
server/middleware/   double-slash cleanup, common-name redirects (/zenzero -> /zingiber-officinale)
server/utils/        WordPress client, content splitter, reCAPTCHA, CSRF, rate limiting, mail
shared/              types and helpers used by both app and server
public/media/        logo, default Open Graph image and other static images
```

Monographs live at `/<scientific-slug>`, glossary terms at `/glossario/<slug>`, blog posts at `/blog/<slug>`.

## Development

Requires Node.js 22.22+ or 24.15+.

```bash
npm ci
cp .env.example .env   # fill in the keys you need
npm run dev
```

Checks:

```bash
npm run lint
npm run typecheck
npm run test:unit
```

## Configuration

Every variable is documented in [`.env.example`](.env.example). The values are read when the app is built and stored in the server bundle; at runtime they can be overridden with the matching `NUXT_*` variable (for example `NUXT_SENDGRID_API_KEY`).

Pages and the GraphQL proxy work without any key. Forms need reCAPTCHA plus SendGrid (contacts, proposals), Mailchimp (newsletter) or MySQL (feedback).

## Search index

`/algoliaUpdate` compares WordPress with the Algolia index for plants, glossary terms or blog posts and rewrites the records of the selected type. Records are built on the server with the WordPress slug as `objectID`, which is also the URL segment used by the search box.

## Production

`npm run deploy:production` (see `scripts/deploy-production.sh`) installs from the lockfile in a temporary directory, builds, moves the result to a timestamped release, switches the `.output` symlink, restarts PM2 and rolls back if the health check fails. `WP_CONTENT_PATH` must point to the WordPress `wp-content` directory, which is served from the same domain.

## Contributing

Fork the repository, create a branch, run lint, typecheck and tests, then open a pull request.

## License

The code is released under the MIT License, see [LICENSE](LICENSE). The texts published on wikiherbalist.com are not covered by this license.

## Contact

Giovanni Manetti - [giovanni@perseodesign.com](mailto:giovanni@perseodesign.com)
