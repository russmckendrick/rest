/**
 * TRMNL Stats documentation content
 */

export const trmnlStatsContent = {
  title: 'TRMNL Stats',
  description: 'Display Last.fm profile statistics on TRMNL e-ink displays',
  breadcrumb: 'TRMNL Stats',
  icon: '📈',
  gradient: 'from-slate-700 to-slate-900',
  shadowColor: 'shadow-slate-500/20',

  endpoint: {
    method: 'GET',
    path: '/trmnl-lastfm-stats',
    description:
      'Display your Last.fm profile statistics and top artists in a clean, organized layout optimized for TRMNL e-ink displays.',
  },

  parameters: [
    {
      name: 'username',
      description: 'Last.fm username',
      default: 'RussMckendrick',
    },
    {
      name: 'debug',
      description: 'Show debug information',
      optional: true,
    },
  ],

  features: [
    {
      icon: '👤',
      title: 'Profile Info',
      description: 'User profile information display',
    },
    {
      icon: '📊',
      title: 'Key Statistics',
      description: 'Total plays, playlists, tracks, artists',
    },
    {
      icon: '🏆',
      title: 'Top 5 Artists',
      description: 'Weekly top artists ranking',
    },
    {
      icon: '⚡',
      title: 'Cached',
      description: '30-minute cache for better performance',
    },
  ],

  preview: {
    url: 'https://www.russ.rest/trmnl-lastfm-stats?username=RussMckendrick',
    linkHref: '/trmnl-lastfm-stats?username=RussMckendrick',
    linkText: 'View live example',
  },

  trmnlSetup: {
    title: 'TRMNL Setup',
    steps: [
      'Create a new Private Plugin in your TRMNL dashboard',
      'Set the Polling URL to: https://www.russ.rest/trmnl-lastfm-stats?username=YourUsername',
      'Set the refresh interval as desired (recommended: 30+ minutes)',
    ],
  },
};
