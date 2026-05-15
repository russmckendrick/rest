export const trmnlLastPlayedContent = {
  title: 'TRMNL last played',
  description: 'Currently-listening track for TRMNL e-ink displays.',

  endpoint: {
    method: 'GET',
    path: '/trmnl-lastfm-last-played',
    description:
      'Display your most recently played track from Last.fm with album artwork and track details, optimised for TRMNL e-ink displays.',
  },

  parameters: [
    { name: 'username', description: 'Last.fm username.', default: 'RussMckendrick' },
    { name: 'debug', description: 'Show debug information.', optional: true },
  ],

  preview: {
    url: 'https://www.russ.rest/trmnl-lastfm-last-played?username=RussMckendrick',
    linkHref: '/trmnl-lastfm-last-played?username=RussMckendrick',
    linkText: 'Open the live HTML output',
  },

  trmnlSetup: {
    steps: [
      'Create a new Private Plugin in your TRMNL dashboard.',
      'Set the polling URL to https://www.russ.rest/trmnl-lastfm-last-played?username=YourUsername',
      'Set the refresh interval — 5–15 minutes is recommended for current-track freshness.',
    ],
  },
};
