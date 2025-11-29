/**
 * Last.fm Charts documentation content
 */

export const lastfmChartContent = {
  title: 'Last.fm Charts',
  description: 'Generate SVG visualizations of your weekly top artists or albums',
  breadcrumb: 'Charts',
  icon: '📊',
  gradient: 'from-violet-500 to-purple-600',
  shadowColor: 'shadow-violet-500/20',

  endpoint: {
    method: 'GET',
    path: '/lastfm-chart',
    description:
      'Generate SVG visualizations of your Last.fm listening history for the last week. Supports both top artists and top albums views.',
  },

  parameters: [
    {
      name: 'artists',
      description: 'Display top artists (default if no view specified)',
    },
    {
      name: 'albums',
      description: 'Display top albums',
    },
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
  ],

  features: [
    {
      icon: '🎨',
      title: 'Dynamic Gradients',
      description: 'Beautiful color gradients for visual appeal',
    },
    {
      icon: '📐',
      title: 'Auto Scaling',
      description: 'Automatic font scaling based on width',
    },
    {
      icon: '👤',
      title: 'User Avatar',
      description: 'Displays your Last.fm profile picture',
    },
    {
      icon: '⚡',
      title: 'Cached',
      description: '30-minute cache for better performance',
    },
  ],

  examples: [
    {
      title: 'Top Artists',
      code: '![Top artists](https://www.russ.rest/lastfm-chart?artists&username=RussMckendrick&width=900)',
      imageSrc: '/lastfm-chart?artists&username=RussMckendrick&width=800',
      imageAlt: 'Top artists example',
    },
    {
      title: 'Top Albums',
      code: '![Top albums](https://www.russ.rest/lastfm-chart?albums&username=RussMckendrick&width=900)',
      imageSrc: '/lastfm-chart?albums&username=RussMckendrick&width=800',
      imageAlt: 'Top albums example',
    },
  ],

  githubUsage: {
    title: 'Use in GitHub README',
    code: '<img src="https://www.russ.rest/lastfm-chart?artists&username=YourUsername&width=900" alt="My top artists this week">',
  },
};
