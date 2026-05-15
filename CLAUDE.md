# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers project that provides Last.fm-powered REST APIs for displaying music listening data. The project generates dynamic SVG visualizations and HTML pages, optimized for various displays including e-ink TRMNL devices.

**Live Site:** https://www.russ.rest

## Architecture

### Project Structure
This is a pnpm workspace with two packages:
- The **Worker** (`src/`) serves only the API endpoints.
- The **Astro docs site** (`docs/`) builds static HTML into `dist/` and is served via Workers Static Assets from the same deployment.

```
src/                      # Cloudflare Worker (API only)
├── index.ts              # Router entry point — API routes only
├── types/                # TypeScript type definitions
├── utils/                # Shared utilities (cors, escape, base64, validation,
│                         #   lastfm-client, image)
├── handlers/             # Route handlers (one per API endpoint)
└── templates/            # SVG / HTML helpers used by handlers
    ├── svg/lastfm-logo.ts
    └── html/trmnl-base.ts

docs/                     # Astro static site (Solarized Dark)
├── astro.config.mjs      # output: 'static', outDir: '../dist'
├── package.json
├── public/favicon.svg
└── src/
    ├── pages/            # Routes: index.astro, 404.astro, docs/*.astro
    ├── layouts/DocsLayout.astro
    ├── components/       # SiteHeader, SiteFooter, Sidebar, OnThisPage,
    │                     #   EndpointHeader, ParameterTable, CodeBlock
    ├── data/             # TS exports per endpoint (nav, home, *)
    └── styles/global.css # Solarized Dark theme

dist/                     # Astro build output, served by Workers Static Assets
pnpm-workspace.yaml       # declares root + docs as workspaces
```

### API Endpoints
- `/` — Documentation homepage (served from `dist/index.html`)
- `/docs/*` — Per-endpoint documentation pages (served from `dist/docs/*/index.html`)
- `/lastfm-chart` — Weekly top artists/albums SVG chart
- `/lastfm-last-played` — Last played track SVG visualization
- `/lastfm-wordcloud` — Typographic word cloud of top artists, sized by play count
- `/trmnl-lastfm-grid` — 2×5 album grid for TRMNL e-ink displays
- `/trmnl-lastfm-last-played` — Last played track for TRMNL e-ink displays
- `/trmnl-lastfm-stats` — Profile stats for TRMNL e-ink displays

### Query Parameters
- `username` - Last.fm username (default: 'russmckendrick')
- `width` - Width in pixels, 100-2000 (default: 500)
- `debug` - Enable debug output
- `albums` / `artists` - Toggle chart type

## Development

### Prerequisites
- Node.js 18+
- pnpm 10.x (specified in package.json `packageManager` field)

### Commands
```bash
pnpm install            # Install all workspace deps
pnpm run dev:docs       # Astro dev server (HMR, no API) — http://localhost:4321
pnpm run dev:worker     # Wrangler dev only (assumes dist/ is built)
pnpm run dev            # Build docs once, then wrangler dev (API + docs)
pnpm run build          # Build the Astro site
pnpm run deploy         # Build docs, then deploy worker + assets
pnpm run typecheck      # tsc --noEmit on the Worker
pnpm run lint           # ESLint on src/ and test/
pnpm run test:run       # Run vitest once
pnpm run check          # typecheck + lint + tests
```

### Environment Variables
- `LASTFM_API_KEY` - Required Last.fm API key
- `CLOUDFLARE_API_TOKEN` - For deployment (GitHub Actions secret)
- `CLOUDFLARE_ACCOUNT_ID` - For deployment (GitHub Actions secret)

### Local Development
```bash
# Create .dev.vars file with your API key
echo 'LASTFM_API_KEY=your_api_key_here' > .dev.vars

# Start dev server
pnpm run dev
```

## Code Patterns

### Adding New Endpoints
1. Create the handler in `src/handlers/` and export it from `src/handlers/index.ts`.
2. Wire the route into `apiRoutes` in `src/index.ts`.
3. Create a content data file in `docs/src/data/<endpoint>.ts`.
4. Create the Astro page in `docs/src/pages/docs/<endpoint>.astro`.
5. Add the endpoint to `docs/src/data/nav.ts` (sidebar) and `docs/src/data/home.ts` (overview list).

### Handler Structure
```typescript
import type { HandlerContext } from '../types';
import { createSvgResponse } from '../utils/cors';

export async function handleNewEndpoint(ctx: HandlerContext): Promise<Response> {
  const { env, params, debugInfo } = ctx;
  // Implementation...
  return createSvgResponse(svg);
}
```

### Last.fm API
- Use `LastFmClient` class for all API calls (handles HTTPS and URL encoding)
- Located in `src/utils/lastfm-client.ts`

### Security
- All user inputs are validated via `src/utils/validation.ts`
- HTML/XML output is escaped via `src/utils/escape.ts`
- Last.fm API calls use HTTPS with proper URL encoding

## Testing

Tests are in `test/` directory using Vitest:
```bash
pnpm run test:run           # Run all tests
pnpm run test:coverage      # Run with coverage report
```

## Deployment

### GitHub Actions (Automated)
Deployment is automated via GitHub Actions on push to `main` branch. Requires these repository secrets:
- `CLOUDFLARE_API_TOKEN` - Create at https://dash.cloudflare.com/profile/api-tokens
- `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare dashboard sidebar

### Manual Deployment
```bash
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=yyy pnpm run deploy
```

### Wrangler Configuration
The `wrangler.toml` configures:
- Custom domains: `www.russ.rest` and `russ.rest`
- `workers_dev = true` for workers.dev subdomain
- `preview_urls = true` for PR previews

## Tech Stack
- Cloudflare Workers (API + Static Assets)
- Astro 5 (static docs site, Solarized Dark)
- TypeScript (strict mode)
- Vitest for testing
- ESLint 9.x (flat config)
- pnpm 10.x workspaces
