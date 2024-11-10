# Russ Rest

A collection of serverless functions that generate dynamic content, hosted on Cloudflare Workers.

## Last.fm Weekly Artists and Albums

Generate SVG visualizations of your Last.fm listening history for the last week. The function supports displaying both top artists and albums you have been listening too for the last 7 days.

### Usage

Base URL: `https://www.russ.rest/lastfm`

#### Parameters

- `artists` - Display top artists (default if no view parameter is specified)
- `albums` - Display top albums
- `username` - Last.fm username (default: [RussMckendrick](http://last.fm/user/RussMckendrick))
- `width` - Width of the generated SVG in pixels (default: 500)

#### Examples

##### Top Artists

```markdown
![Top artists in the last week](https://www.russ.rest/lastfm?artists&username=RussMckendrick&width=900)
```

![Top artists in the last week](https://www.russ.rest/lastfm?artists&username=RussMckendrick&width=900)

##### Top Albums

```markdown
![Top albums in the last week](https://www.russ.rest/lastfm?albums&username=RussMckendrick&width=900)
```

![Top albums in the last week](https://www.russ.rest/lastfm?albums&username=RussMckendrick&width=900)

### Customization Examples

1. Default width (500px) for a compact view:
```markdown
![Top artists](https://www.russ.rest/lastfm?artists&username=YourUsername)
```

2. Custom width for different layouts:
```markdown
![Top albums](https://www.russ.rest/lastfm?albums&username=YourUsername&width=800)
```

3. Default username with custom width:
```markdown
![Top artists](https://www.russ.rest/lastfm?artists&width=1200)
```

## Last.fm Last Played

Grabs the last thing you scrobbled on LastFM and displays it with cover art.

### Usage

Base URL: `https://www.russ.rest/lastfm-now-playing`

#### Parameters

- `username` - Last.fm username (default: [RussMckendrick](http://last.fm/user/RussMckendrick))
- `width` - Width of the generated SVG in pixels (default: 500)

#### Example

```markdown
![Last Played](https://www.russ.rest/lastfm-now-playing?username=RussMcKendrick&width=900)
```

![Last Played](https://www.russ.rest/lastfm-now-playing?username=RussMcKendrick&width=900)


## License

MIT License - Feel free to use and modify as needed.
