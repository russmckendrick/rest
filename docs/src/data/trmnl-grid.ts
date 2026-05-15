export const trmnlGridContent = {
  title: 'TRMNL album grid',
  description: '2×5 grid of album covers from the last week, sized for TRMNL e-ink displays.',

  endpoint: {
    method: 'GET',
    path: '/trmnl-lastfm-grid',
    description:
      'Display a 2×5 grid of your top 10 album covers from the last week, optimised for TRMNL e-ink displays using Framework v2.',
  },

  parameters: [
    { name: 'username', description: 'Last.fm username.', default: 'RussMckendrick' },
    { name: 'debug', description: 'Show debug information.', optional: true },
  ],

  preview: {
    url: 'https://www.russ.rest/trmnl-lastfm-grid?username=RussMckendrick',
    linkHref: '/trmnl-lastfm-grid?username=RussMckendrick',
    linkText: 'Open the live HTML output',
  },

  trmnlSetup: {
    steps: [
      'Create a new Private Plugin in your TRMNL dashboard.',
      'Set the polling URL to https://www.russ.rest/trmnl-lastfm-grid?username=YourUsername',
      'Set the refresh interval — 30 minutes or longer is recommended.',
    ],
  },
};
