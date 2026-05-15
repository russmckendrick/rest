# Russ Rest

Last.fm-powered REST APIs for displaying music listening data. Generate dynamic SVG charts and TRMNL e-ink displays of your listening history.

**Documentation:** [www.russ.rest](https://www.russ.rest)

## Examples

### Weekly Top Artists

```markdown
![Top artists](https://www.russ.rest/lastfm-chart?artists&username=RussMckendrick&width=900)
```

![Top artists](https://www.russ.rest/lastfm-chart?artists&username=RussMckendrick&width=900)

### Weekly Top Albums

```markdown
![Top albums](https://www.russ.rest/lastfm-chart?albums&username=RussMckendrick&width=900)
```

![Top albums](https://www.russ.rest/lastfm-chart?albums&username=RussMckendrick&width=900)

### Last Played Track

```markdown
![Last played](https://www.russ.rest/lastfm-last-played?username=RussMckendrick&width=900)
```

![Last played](https://www.russ.rest/lastfm-last-played?username=RussMckendrick&width=900)

### Artist Word Cloud

```markdown
![Word cloud](https://www.russ.rest/lastfm-wordcloud?username=RussMckendrick&width=900)
```

![Word cloud](https://www.russ.rest/lastfm-wordcloud?username=RussMckendrick&width=900)

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/lastfm-chart` | Weekly top artists/albums SVG |
| `/lastfm-last-played` | Last played track SVG |
| `/lastfm-wordcloud` | Typographic artist word cloud SVG |
| `/trmnl-lastfm-grid` | Album grid for TRMNL e-ink |
| `/trmnl-lastfm-last-played` | Last played for TRMNL |
| `/trmnl-lastfm-stats` | Profile stats for TRMNL |

See the [full documentation](https://www.russ.rest) for all parameters and options.

## Development

This is a pnpm workspace with two packages: the Cloudflare Worker (root, `src/`) and the Astro docs site (`docs/`). Astro builds static HTML into `dist/`, which the Worker serves via Workers Static Assets — both halves ship from a single deployment.

```bash
pnpm install
pnpm run dev:docs    # Astro dev server (HMR, no API) — http://localhost:4321
pnpm run dev         # Build docs once, then wrangler dev (full integration)
pnpm run check       # typecheck + lint + tests
pnpm run deploy      # Build docs, deploy worker + assets
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## Author

[Russ McKendrick](https://github.com/russmckendrick)
