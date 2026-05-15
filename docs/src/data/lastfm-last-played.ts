export const lastfmLastPlayedContent = {
  title: 'Last played track',
  description: 'Dynamic SVG of your most recently played track with album artwork.',

  endpoint: {
    method: 'GET',
    path: '/lastfm-last-played',
    description:
      'Render your most recently played track on Last.fm, complete with album artwork background, gradient overlay, and track details.',
  },

  parameters: [
    { name: 'username', description: 'Last.fm username.', default: 'RussMckendrick' },
    { name: 'width', description: 'Width of the generated SVG in pixels (100–2000).', default: '500' },
    { name: 'debug', description: 'Render debug overlays.', optional: true },
  ],

  examples: [
    {
      title: 'Live example',
      code: '![Last played](https://www.russ.rest/lastfm-last-played?username=RussMckendrick&width=900)',
      imageSrc: '/lastfm-last-played?username=RussMckendrick&width=800',
      imageAlt: 'Last played example',
    },
  ],

  githubUsage: {
    title: 'Embed in a GitHub README',
    code: '<img src="https://www.russ.rest/lastfm-last-played?username=YourUsername&width=600" alt="Currently listening">',
  },
};
