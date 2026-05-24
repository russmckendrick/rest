export const trmnlHeatmapContent = {
  title: 'TRMNL listening heatmap',
  description: 'GitHub-style 12-week scrobble heatmap rendered for TRMNL e-ink displays.',

  endpoint: {
    method: 'GET',
    path: '/trmnl-lastfm-heatmap',
    description:
      'Visualise the last twelve weeks of listening as a heatmap — twelve columns (one per week), seven rows (Monday to Sunday), with cells shaded by daily scrobble count. Optimised for TRMNL e-ink displays.',
  },

  parameters: [
    { name: 'username', description: 'Last.fm username.', default: 'RussMckendrick' },
    { name: 'debug', description: 'Show debug information.', optional: true },
  ],

  preview: {
    url: 'https://www.russ.rest/trmnl-lastfm-heatmap?username=RussMckendrick',
    linkHref: '/trmnl-lastfm-heatmap?username=RussMckendrick',
    linkText: 'Open the live HTML output',
  },

  trmnlSetup: {
    steps: [
      'Create a new Private Plugin in your TRMNL dashboard.',
      'Set the polling URL to https://www.russ.rest/trmnl-lastfm-heatmap?username=YourUsername',
      'Set the refresh interval — once or twice a day is plenty; daily totals only change at day boundaries.',
    ],
  },
};
