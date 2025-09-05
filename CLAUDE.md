# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers project that provides Last.fm-powered REST APIs for displaying music listening data. The project consists of serverless functions that generate dynamic SVG visualizations and JSON data feeds, optimized for various displays including e-ink TRMNL devices.

## Architecture

### Cloudflare Workers Structure
- **Entry point**: `functions/_middleware.js` - Routes requests and validates paths
- **Function files**: Each API endpoint is a separate file in the `functions/` directory
- **Environment variables**: Uses `LASTFM_API_KEY` stored in Cloudflare Workers environment

### API Endpoints
All functions follow the same pattern:
- Export an `onRequest` async function that handles HTTP requests
- Include CORS headers for cross-origin requests
- Accept query parameters for customization (username, width, debug, etc.)
- Default username is 'russmckendrick' if not specified
- Return SVG content or JSON data

### Available Functions
1. `lastfm-chart.js` - Weekly artists/albums SVG chart
2. `lastfm-last-played.js` - Last played track SVG visualization
3. `trmnl-lastfm-grid.js` - 2x5 album grid for e-ink displays
4. `trmnl-lastfm-last-played.js` - Last played track for e-ink displays
5. `trmnl-lastfm-stats.js` - Profile stats for e-ink displays

### Common Patterns
- All functions use Last.fm Web Services API
- Base64 encoding for images in SVG generation
- Caching strategies (30 minutes for charts, no cache for real-time data)
- Error handling with friendly user messages
- Debug mode support via `debug` query parameter

## Development

### Local Development
This project uses Cloudflare Workers, so development typically happens through:
- Wrangler CLI for local testing and deployment
- No build process - pure JavaScript ES modules
- No package.json or dependency management needed

### Environment Setup
- Requires `LASTFM_API_KEY` environment variable
- Functions expect this to be available in `context.env`

### Testing
- Manual testing via browser or curl against deployed functions
- Debug mode available on most endpoints with `?debug` parameter
- No automated test suite present

### Code Style
- ES6 modules with `export async function onRequest`
- Async/await pattern throughout
- Consistent error handling and CORS headers
- SVG generation using template strings
- URL parameter parsing with `new URL()` and `searchParams`

## Common Tasks

### Adding New Endpoints
1. Create new `.js` file in `functions/` directory
2. Follow the `onRequest` pattern from existing files
3. Add path to `validPaths` array in `_middleware.js`
4. Include CORS headers and error handling

### Modifying SVG Output
- SVG content is generated as template strings
- Images are converted to base64 data URIs
- Responsive sizing based on width parameters
- Text positioning calculated dynamically

### API Integration
- All Last.fm API calls use `http://ws.audioscrobbler.com/2.0/` base URL
- Common methods: `user.getinfo`, `user.getrecenttracks`, `user.gettopalbums`, `user.gettopartists`
- Always URL encode user inputs for API calls