# 🎵 Russ Rest

A collection of serverless functions that generate dynamic content, hosted on Cloudflare Workers. Perfect for displaying your Last.fm listening habits in your GitHub profile, blog, or website!

## 🎨 TRMNL Last.fm Album Grid

Display a 2x5 grid of your top 10 album covers from the last week, optimized for TRMNL e-ink displays.

### 🚀 Usage

Base URL: `https://www.russ.rest/trmnl-lastfm-grid`

#### 📝 Parameters

- `username` - Last.fm username (default: [RussMckendrick](http://last.fm/user/RussMckendrick))

#### 🌟 Features

- 2x5 grid layout of album covers
- Grayscale images optimized for e-ink display
- Album titles and artist names
- 30-minute cache for better performance
- CORS enabled for web integration

#### 📊 Example

Visit https://www.russ.rest/trmnl-lastfm-grid?username=RussMcKendrick or https://www.russ.rest/trmnl-lastfm-grid?username=RussMcKendrick&debug

## 🎧 Last.fm Weekly Artists and Albums

Generate beautiful SVG visualizations of your Last.fm listening history for the last week. The function supports displaying both top artists and albums you've been listening to for the last 7 days.

### 🚀 Usage

Base URL: `https://www.russ.rest/lastfm-chart`

#### 📝 Parameters

- `artists` - Display top artists (default if no view parameter is specified)
- `albums` - Display top albums
- `username` - Last.fm username (default: [RussMckendrick](http://last.fm/user/RussMckendrick))
- `width` - Width of the generated SVG in pixels (default: 500)

#### 🌟 Features

- Dynamic color gradients for visual appeal
- Automatic font scaling based on width
- User avatar display
- Responsive design
- CORS enabled for web integration
- Cached responses (30 minutes) for better performance

#### 📊 Examples

##### Top Artists

```markdown
![Top artists in the last week](https://www.russ.rest/lastfm-chart?artists&username=RussMckendrick&width=900)
```

![Top artists in the last week](https://www.russ.rest/lastfm-chart?artists&username=RussMckendrick&width=900)

##### Top Albums

```markdown
![Top albums in the last week](https://www.russ.rest/lastfm-chart?albums&username=RussMckendrick&width=900)
```

![Top albums in the last week](https://www.russ.rest/lastfm-chart?albums&username=RussMckendrick&width=900)

### 🎨 Customization Examples

1. Default width (500px) for a compact view:
```markdown
![Top artists](https://www.russ.rest/lastfm-chart?artists&username=YourUsername)
```

2. Custom width for different layouts:
```markdown
![Top albums](https://www.russ.rest/lastfm-chart?albums&username=YourUsername&width=800)
```

3. Default username with custom width:
```markdown
![Top artists](https://www.russ.rest/lastfm-chart?artists&width=1200)
```

## 🎼 Last.fm Last Played

Create a dynamic visualization of your most recently played track on Last.fm, complete with cover art and track details.

### 🚀 Usage

Base URL: `https://www.russ.rest/lastfm-last-played`

#### 📝 Parameters

- `username` - Last.fm username (default: [RussMckendrick](http://last.fm/user/RussMckendrick))
- `width` - Width of the generated SVG in pixels (default: 500)
- `debug` - Prints out debug information (optional)

#### 🌟 Features

- Dynamic background using album artwork
- Automatic text scaling
- Gradient overlay for better text visibility
- Real-time updates
- CORS enabled
- No caching for up-to-date information

#### 📊 Example

```markdown
![Last Played](https://www.russ.rest/lastfm-last-played?username=RussMcKendrick&width=900)
```

![Last Played](https://www.russ.rest/lastfm-last-played?username=RussMcKendrick&width=900)

## 📱 Last.fm Ticker API

Get a JSON feed of your recent Last.fm scrobbles, perfect for creating custom displays or integrations. For example [https://www.russ.fm/](https://www.russ.fm/).

### 🚀 Usage

Base URL: `https://www.russ.rest/ticker`

#### 📝 Parameters

- `username` - Last.fm username (default: [RussMckendrick](http://last.fm/user/RussMckendrick))

#### 🌟 Features

- Returns last 100 tracks
- Includes "now playing" status
- JSON formatted response
- CORS enabled
- 60-second cache for optimal performance

#### 📊 Example Response

```json
{
  "tracks": [
    {
      "name": "Track Name",
      "artist": "Artist Name",
      "nowPlaying": true,
      "timestamp": 1699999999
    },
    // ... more tracks
  ]
}
```

## 🛠️ Technical Details

- Built on Cloudflare Workers
- SVG generation for visual components
- Base64 encoded images for optimal delivery
- Automatic scaling and responsive design
- Error handling with friendly messages
- Cross-Origin Resource Sharing (CORS) enabled

## 📄 License

MIT License - Feel free to use and modify as needed. See [LICENSE](LICENSE) for more details.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 👨‍💻 Author

Created and maintained by [Russ McKendrick](https://github.com/russmckendrick)
