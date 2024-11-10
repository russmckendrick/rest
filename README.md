# Russ Rest

A collection of serverless functions that generate dynamic content, hosted on Cloudflare Workers.

## Last.fm Integration

Generate SVG visualizations of your Last.fm listening history. The function supports displaying both top artists and albums from the last week.

### Usage

Base URL: `https://www.russ.rest/lastfm`

#### Parameters

- `artists` - Display top artists (default if no view parameter is specified)
- `albums` - Display top albums
- `username` - Last.fm username (default: russmckendrick)
- `width` - Width of the generated SVG in pixels (default: 500)

#### Examples

##### Top Artists

```markdown
![Top artists in the last week](https://www.russ.rest/lastfm?artists&username=russmckendrick&width=1000)
```

![Top artists in the last week](https://www.russ.rest/lastfm?artists&username=russmckendrick&width=1000)

##### Top Albums

```markdown
![Top albums in the last week](https://www.russ.rest/lastfm?albums&username=russmckendrick&width=1000)
```

![Top albums in the last week](https://www.russ.rest/lastfm?albums&username=russmckendrick&width=1000)

### Customization Examples

1. Default width (500px) for a compact view:
```markdown
![Top artists](https://www.russ.rest/lastfm?artists&username=yourusername)
```

2. Custom width for different layouts:
```markdown
![Top albums](https://www.russ.rest/lastfm?albums&username=yourusername&width=800)
```

3. Default username with custom width:
```markdown
![Top artists](https://www.russ.rest/lastfm?artists&width=1200)
```

## License

MIT License - Feel free to use and modify as needed.