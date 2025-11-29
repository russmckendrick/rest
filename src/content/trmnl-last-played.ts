/**
 * TRMNL Last Played documentation content
 */

export const trmnlLastPlayedContent = {
  title: 'TRMNL Last Played',
  description: 'Show your most recently played track on TRMNL e-ink displays',
  breadcrumb: 'TRMNL Last Played',
  icon: '📱',
  gradient: 'from-slate-700 to-slate-900',
  shadowColor: 'shadow-slate-500/20',

  endpoint: {
    method: 'GET',
    path: '/trmnl-lastfm-last-played',
    description:
      'Display your most recently played track from Last.fm with album artwork and track details, optimized for TRMNL e-ink displays.',
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
      icon: '🖼️',
      title: 'Large Album Artwork',
      description: 'Prominent album cover display',
    },
    {
      icon: '🔄',
      title: 'Real-time Updates',
      description: 'No caching for current track info',
    },
    {
      icon: '◼️',
      title: 'High Contrast',
      description: 'Optimized for e-ink readability',
    },
    {
      icon: '📝',
      title: 'Track Details',
      description: 'Artist, track, and album info',
    },
  ],

  preview: {
    url: 'https://www.russ.rest/trmnl-lastfm-last-played?username=RussMckendrick',
    linkHref: '/trmnl-lastfm-last-played?username=RussMckendrick',
    linkText: 'View live example',
  },

  trmnlSetup: {
    title: 'TRMNL Setup',
    steps: [
      'Create a new Private Plugin in your TRMNL dashboard',
      'Set the Polling URL to: https://www.russ.rest/trmnl-lastfm-last-played?username=YourUsername',
      'Set the refresh interval (recommended: 5-15 minutes for real-time updates)',
    ],
  },
};
