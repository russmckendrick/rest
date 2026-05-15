export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  section: string;
  items: NavItem[];
}

export const nav: NavGroup[] = [
  {
    section: 'Documentation',
    items: [{ label: 'Overview', href: '/' }],
  },
  {
    section: 'Last.fm endpoints',
    items: [
      { label: 'Weekly charts', href: '/docs/lastfm-chart' },
      { label: 'Last played track', href: '/docs/lastfm-last-played' },
      { label: 'Artist word cloud', href: '/docs/lastfm-wordcloud' },
    ],
  },
  {
    section: 'TRMNL endpoints',
    items: [
      { label: 'Album grid', href: '/docs/trmnl-lastfm-grid' },
      { label: 'Last played', href: '/docs/trmnl-lastfm-last-played' },
      { label: 'Profile stats', href: '/docs/trmnl-lastfm-stats' },
    ],
  },
];
