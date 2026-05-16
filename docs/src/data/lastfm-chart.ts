export const lastfmChartContent = {
  title: 'Weekly charts',
  description: 'SVG visualizations of your weekly top artists or albums.',

  endpoint: {
    method: 'GET',
    path: '/lastfm-chart',
    description:
      'Generate an SVG visualisation of your Last.fm listening history for the last week. Supports both top artists and top albums views.',
  },

  parameters: [
    {
      name: 'artists',
      description: 'Display top artists. Default if no view is specified.',
      optional: true,
    },
    { name: 'albums', description: 'Display top albums.', optional: true },
    { name: 'username', description: 'Last.fm username.', default: 'RussMckendrick' },
    {
      name: 'width',
      description: 'Width of the generated SVG in pixels (100–2000).',
      default: '500',
    },
    { name: 'style', description: 'Output style: modern or classic.', default: 'modern' },
  ],

  examples: [
    {
      title: 'Top artists',
      code: '![Top artists](https://www.russ.rest/lastfm-chart?artists&username=RussMckendrick&width=900)',
      imageSrc: '/lastfm-chart?artists&username=RussMckendrick&width=800',
      imageAlt: 'Top artists example',
    },
    {
      title: 'Top albums',
      code: '![Top albums](https://www.russ.rest/lastfm-chart?albums&username=RussMckendrick&width=900)',
      imageSrc: '/lastfm-chart?albums&username=RussMckendrick&width=800',
      imageAlt: 'Top albums example',
    },
  ],

  githubUsage: {
    title: 'Embed in a GitHub README',
    code: '<img src="https://www.russ.rest/lastfm-chart?artists&username=YourUsername&width=900" alt="My top artists this week">',
  },
};
