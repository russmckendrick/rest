export const trmnlStatsContent = {
  title: 'TRMNL profile stats',
  description: 'Last.fm profile statistics rendered for TRMNL e-ink displays.',

  endpoint: {
    method: 'GET',
    path: '/trmnl-lastfm-stats',
    description:
      'Display your Last.fm profile statistics — total plays, tracks, artists — plus your weekly top five, in a layout optimised for TRMNL e-ink displays.',
  },

  parameters: [
    { name: 'username', description: 'Last.fm username.', default: 'RussMckendrick' },
    { name: 'debug', description: 'Show debug information.', optional: true },
  ],

  preview: {
    url: 'https://www.russ.rest/trmnl-lastfm-stats?username=RussMckendrick',
    linkHref: '/trmnl-lastfm-stats?username=RussMckendrick',
    linkText: 'Open the live HTML output',
  },

  trmnlSetup: {
    steps: [
      'Create a new Private Plugin in your TRMNL dashboard.',
      'Set the polling URL to https://www.russ.rest/trmnl-lastfm-stats?username=YourUsername',
      'Set the refresh interval — 30 minutes or longer is recommended.',
    ],
  },
};
