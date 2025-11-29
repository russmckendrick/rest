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

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/lastfm-chart` | Weekly top artists/albums SVG |
| `/lastfm-last-played` | Last played track SVG |
| `/trmnl-lastfm-grid` | Album grid for TRMNL e-ink |
| `/trmnl-lastfm-last-played` | Last played for TRMNL |
| `/trmnl-lastfm-stats` | Profile stats for TRMNL |

See the [full documentation](https://www.russ.rest) for all parameters and options.

## Development

```bash
pnpm install
pnpm run dev
```

## License

MIT License - See [LICENSE](LICENSE) for details.

## Author

[Russ McKendrick](https://github.com/russmckendrick)
