/**
 * TRMNL Album Grid documentation content
 */

export const trmnlGridContent = {
  title: 'TRMNL Album Grid',
  description: 'Display a 2x5 grid of album covers optimized for e-ink displays',
  breadcrumb: 'TRMNL Grid',
  icon: '🖼️',
  gradient: 'from-slate-700 to-slate-900',
  shadowColor: 'shadow-slate-500/20',

  endpoint: {
    method: 'GET',
    path: '/trmnl-lastfm-grid',
    description:
      'Display a 2x5 grid of your top 10 album covers from the last week, optimized for TRMNL e-ink displays using Framework v2.',
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
      icon: '🔲',
      title: '2x5 Grid Layout',
      description: 'Display 10 albums in an organized grid',
    },
    {
      icon: '🖤',
      title: 'E-ink Optimized',
      description: 'Grayscale images for perfect e-ink display',
    },
    {
      icon: '📝',
      title: 'Album Details',
      description: 'Titles and artist names included',
    },
    {
      icon: '⚡',
      title: 'Cached',
      description: '30-minute cache for better performance',
    },
  ],

  preview: {
    url: 'https://www.russ.rest/trmnl-lastfm-grid?username=RussMckendrick',
    linkHref: '/trmnl-lastfm-grid?username=RussMckendrick',
    linkText: 'View live example',
  },

  trmnlSetup: {
    title: 'TRMNL Setup',
    steps: [
      'Create a new Private Plugin in your TRMNL dashboard',
      'Set the Polling URL to: https://www.russ.rest/trmnl-lastfm-grid?username=YourUsername',
      'Set the refresh interval as desired (recommended: 30+ minutes)',
    ],
  },
};
