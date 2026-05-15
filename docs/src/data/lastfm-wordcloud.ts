export const lastfmWordcloudContent = {
  title: 'Artist word cloud',
  description: 'Typographic word cloud of your most-played artists, sized by play count.',

  endpoint: {
    method: 'GET',
    path: '/lastfm-wordcloud',
    description:
      'Generates an SVG word cloud from your Last.fm top artists. Names are sized logarithmically by play count and packed onto the canvas with a spiral layout, with roughly a fifth of artists rendered vertically for visual variety.',
  },

  parameters: [
    { name: 'username', description: 'Last.fm username.', default: 'RussMckendrick' },
    { name: 'width', description: 'Width of the generated SVG in pixels (height is width / 1.6).', default: '500' },
    { name: 'period', description: 'Time range: overall, 7day, 1month, 3month, 6month, 12month.', default: 'overall' },
    { name: 'limit', description: 'Number of artists to include (25–200).', default: '75' },
    { name: 'debug', description: 'Render bounding boxes around each artist for layout debugging.', optional: true },
  ],

  examples: [
    {
      title: 'All-time top artists',
      code: '![Word cloud](https://www.russ.rest/lastfm-wordcloud?username=RussMckendrick&width=900)',
      imageSrc: '/lastfm-wordcloud?username=RussMckendrick&width=900',
      imageAlt: 'Word cloud of all-time top artists',
    },
    {
      title: 'Last 12 months, denser',
      code: '![Last year](https://www.russ.rest/lastfm-wordcloud?username=RussMckendrick&period=12month&limit=120&width=900)',
      imageSrc: '/lastfm-wordcloud?username=RussMckendrick&period=12month&limit=120&width=900',
      imageAlt: 'Word cloud of last 12 months',
    },
  ],

  githubUsage: {
    title: 'Embed in a GitHub README',
    code: '<img src="https://www.russ.rest/lastfm-wordcloud?username=YourUsername&width=900" alt="My most-played artists">',
  },
};
