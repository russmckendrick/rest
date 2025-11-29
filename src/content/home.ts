/**
 * Homepage content
 */

export const homeContent = {
  title: 'Russ Rest API',
  description: 'Last.fm-powered REST APIs for displaying music listening data',
  hero: {
    headline: 'Last.fm REST APIs',
    subheadline:
      'SVG charts and TRMNL displays for your listening history.',
    primaryCta: { label: 'View Endpoints', href: '#endpoints' },
    secondaryCta: { label: 'Documentation', href: '/docs/lastfm-chart' },
  },
  livePreview: {
    label: 'Live Preview',
    imageSrc: '/lastfm-chart?albums&username=RussMckendrick&width=900',
    imageAlt: 'Live chart example',
  },
  endpoints: [
    {
      title: 'Last.fm Charts',
      path: '/lastfm-chart',
      description:
        'Weekly top artists or albums with dynamic gradients and your avatar.',
      icon: '📊',
      gradient: 'from-violet-500 to-purple-600',
      linkColor: 'text-violet-600 hover:text-violet-700',
      badge: { label: 'SVG', color: 'bg-emerald-50 text-emerald-700' },
      docsPath: '/docs/lastfm-chart',
    },
    {
      title: 'Last Played Track',
      path: '/lastfm-last-played',
      description:
        'Real-time display of your currently playing track with album art.',
      icon: '🎵',
      gradient: 'from-pink-500 to-rose-600',
      linkColor: 'text-pink-600 hover:text-pink-700',
      badge: { label: 'SVG', color: 'bg-emerald-50 text-emerald-700' },
      docsPath: '/docs/lastfm-last-played',
    },
    {
      title: 'Album Grid',
      path: '/trmnl-lastfm-grid',
      description:
        '2x5 grid of top 10 album covers optimized for e-ink displays.',
      icon: '🖼️',
      gradient: 'from-slate-700 to-slate-900',
      linkColor: 'text-slate-600 hover:text-slate-900',
      badge: { label: 'TRMNL', color: 'bg-slate-100 text-slate-700' },
      docsPath: '/docs/trmnl-lastfm-grid',
    },
    {
      title: 'Last Played',
      path: '/trmnl-lastfm-last-played',
      description: 'Large album artwork with track details for e-ink displays.',
      icon: '📱',
      gradient: 'from-slate-700 to-slate-900',
      linkColor: 'text-slate-600 hover:text-slate-900',
      badge: { label: 'TRMNL', color: 'bg-slate-100 text-slate-700' },
      docsPath: '/docs/trmnl-lastfm-last-played',
    },
    {
      title: 'Profile Stats',
      path: '/trmnl-lastfm-stats',
      description: 'Profile statistics and top artists for e-ink displays.',
      icon: '📈',
      gradient: 'from-slate-700 to-slate-900',
      linkColor: 'text-slate-600 hover:text-slate-900',
      badge: { label: 'TRMNL', color: 'bg-slate-100 text-slate-700' },
      docsPath: '/docs/trmnl-lastfm-stats',
    },
  ],
  quickStart: {
    title: 'Quick Start',
    description: 'Add your Last.fm username to any endpoint:',
    example: 'https://www.russ.rest/lastfm-chart?artists&username=YourUsername',
    note: 'If no username is provided, the default user (RussMckendrick) is used.',
  },
  techStack: [
    { icon: '☁️', name: 'Cloudflare', detail: 'Workers' },
    { icon: '📘', name: 'TypeScript', detail: 'Strict Mode' },
    { icon: '🎧', name: 'Last.fm', detail: 'API' },
    { icon: '🖥️', name: 'TRMNL', detail: 'Framework v2' },
  ],
};
