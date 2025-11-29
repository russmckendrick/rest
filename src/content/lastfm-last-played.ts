/**
 * Last Played Track documentation content
 */

export const lastfmLastPlayedContent = {
  title: 'Last Played Track',
  description: 'Create a dynamic SVG showing your most recently played track',
  breadcrumb: 'Last Played',
  icon: '🎵',
  gradient: 'from-pink-500 to-rose-600',
  shadowColor: 'shadow-pink-500/20',

  endpoint: {
    method: 'GET',
    path: '/lastfm-last-played',
    description:
      'Create a dynamic visualization of your most recently played track on Last.fm, complete with album artwork background and track details.',
  },

  parameters: [
    {
      name: 'username',
      description: 'Last.fm username',
      default: 'RussMckendrick',
    },
    {
      name: 'width',
      description: 'Width of generated SVG in pixels',
      default: '500',
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
      title: 'Album Artwork Background',
      description: 'Dynamic background using album cover',
    },
    {
      icon: '🔄',
      title: 'Real-time Updates',
      description: 'No caching for up-to-date information',
    },
    {
      icon: '✨',
      title: 'Gradient Overlay',
      description: 'Better text visibility on any artwork',
    },
    {
      icon: '📐',
      title: 'Auto Text Scaling',
      description: 'Responsive text based on width',
    },
  ],

  examples: [
    {
      title: 'Example',
      code: '![Last Played](https://www.russ.rest/lastfm-last-played?username=RussMckendrick&width=900)',
      imageSrc: '/lastfm-last-played?username=RussMckendrick&width=800',
      imageAlt: 'Last played example',
    },
  ],

  githubUsage: {
    title: 'Use in GitHub README',
    code: '<img src="https://www.russ.rest/lastfm-last-played?username=YourUsername&width=600" alt="Currently listening">',
  },
};
