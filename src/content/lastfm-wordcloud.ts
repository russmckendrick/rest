/**
 * Last.fm Word Cloud documentation content
 */

export const lastfmWordcloudContent = {
  title: 'Last.fm Word Cloud',
  description: 'A typographic word cloud of your most-played artists, sized by play count',
  breadcrumb: 'Word Cloud',
  icon: '☁️',
  gradient: 'from-amber-500 to-orange-600',
  shadowColor: 'shadow-amber-500/20',

  endpoint: {
    method: 'GET',
    path: '/lastfm-wordcloud',
    description:
      'Generates an SVG word cloud from your Last.fm top artists. Names are sized logarithmically by play count and packed onto the canvas with a spiral layout, with ~20% of artists rendered vertically for visual variety.',
  },

  parameters: [
    {
      name: 'username',
      description: 'Last.fm username',
      default: 'RussMckendrick',
    },
    {
      name: 'width',
      description: 'Width of generated SVG in pixels (height is width / 1.6)',
      default: '500',
    },
    {
      name: 'period',
      description: 'Time range: overall, 7day, 1month, 3month, 6month, 12month',
      default: 'overall',
    },
    {
      name: 'limit',
      description: 'Number of artists to include (25–200)',
      default: '75',
    },
    {
      name: 'debug',
      description: 'Render bounding boxes around each artist for layout debugging',
      optional: true,
    },
  ],

  features: [
    {
      icon: '🌀',
      title: 'Spiral Packing',
      description: 'Largest artists at the center, smaller names spiral outward filling the canvas',
    },
    {
      icon: '📐',
      title: 'Log-Scaled Sizing',
      description: 'Logarithmic font scaling so a few heavy hitters don\'t crush the long tail',
    },
    {
      icon: '🔁',
      title: 'Mixed Orientation',
      description: 'About a fifth of names rotate vertically for a denser, more varied look',
    },
    {
      icon: '⚡',
      title: 'Cached',
      description: '30-minute cache for fast repeat loads',
    },
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
    title: 'Use in GitHub README',
    code: '<img src="https://www.russ.rest/lastfm-wordcloud?username=YourUsername&width=900" alt="My most-played artists">',
  },
};
