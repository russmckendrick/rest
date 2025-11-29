# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers project that provides Last.fm-powered REST APIs for displaying music listening data. The project consists of serverless functions that generate dynamic SVG visualizations and HTML pages, optimized for various displays including e-ink TRMNL devices.

## Architecture

### Project Structure
```
src/
├── index.ts              # Main router entry point
├── types/                # TypeScript type definitions
│   ├── lastfm.ts         # Last.fm API response types
│   └── request.ts        # Request/handler types
├── utils/                # Shared utilities
│   ├── cors.ts           # CORS headers and response helpers
│   ├── escape.ts         # XML/HTML escaping
│   ├── base64.ts         # Chunked base64 encoding
│   ├── validation.ts     # Input validation
│   ├── lastfm-client.ts  # Last.fm API client
│   └── image.ts          # Image fetching utilities
├── handlers/             # Route handlers
│   ├── lastfm-chart.ts
│   ├── lastfm-last-played.ts
│   ├── trmnl-lastfm-grid.ts
│   ├── trmnl-lastfm-last-played.ts
│   └── trmnl-lastfm-stats.ts
└── templates/            # Template components
    ├── svg/lastfm-logo.ts
    └── html/trmnl-base.ts
```

### API Endpoints
- `/lastfm-chart` - Weekly top artists/albums SVG chart
- `/lastfm-last-played` - Last played track SVG visualization
- `/trmnl-lastfm-grid` - 2x5 album grid for e-ink displays
- `/trmnl-lastfm-last-played` - Last played track for e-ink displays
- `/trmnl-lastfm-stats` - Profile stats for e-ink displays

### Query Parameters
- `username` - Last.fm username (default: 'russmckendrick')
- `width` - Width in pixels, 100-2000 (default: 500)
- `debug` - Enable debug output
- `albums` / `artists` - Toggle chart type

## Development

### Prerequisites
- Node.js 18+
- pnpm

### Commands
```bash
pnpm install          # Install dependencies
pnpm run dev          # Start local dev server
pnpm run typecheck    # Run TypeScript type check
pnpm run lint         # Run ESLint
pnpm run test         # Run tests in watch mode
pnpm run test:run     # Run tests once
pnpm run deploy       # Deploy to Cloudflare
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
1. Create handler in `src/handlers/`
2. Add to exports in `src/handlers/index.ts`
3. Add route in `src/index.ts`

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

Deployment is automated via GitHub Actions on push to `main` branch. Requires these repository secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Manual deployment:
```bash
CLOUDFLARE_API_TOKEN=xxx pnpm run deploy
```
