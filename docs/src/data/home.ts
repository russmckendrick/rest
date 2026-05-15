export interface HomeEndpoint {
  title: string;
  href: string;
  path: string;
  description: string;
}

export interface HomeGroup {
  heading: string;
  intro: string;
  endpoints: HomeEndpoint[];
}

export const homeGroups: HomeGroup[] = [
  {
    heading: 'Last.fm endpoints',
    intro: 'SVG endpoints sourced from the Last.fm API. Suitable for embedding in GitHub READMEs, blog posts, or anywhere an image tag is accepted.',
    endpoints: [
      {
        title: 'Weekly charts',
        href: '/docs/lastfm-chart',
        path: '/lastfm-chart',
        description: 'Weekly top artists or albums rendered as an SVG with avatar, gradients, and auto-scaling text.',
      },
      {
        title: 'Last played track',
        href: '/docs/lastfm-last-played',
        path: '/lastfm-last-played',
        description: 'Currently or most recently played track as an SVG with album artwork background.',
      },
      {
        title: 'Artist word cloud',
        href: '/docs/lastfm-wordcloud',
        path: '/lastfm-wordcloud',
        description: 'Typographic cloud of your top artists, sized logarithmically by play count, packed onto the canvas.',
      },
    ],
  },
  {
    heading: 'TRMNL endpoints',
    intro: 'HTML endpoints rendered using the TRMNL Framework v2, suitable for use as polling URLs in TRMNL Private Plugins.',
    endpoints: [
      {
        title: 'Album grid',
        href: '/docs/trmnl-lastfm-grid',
        path: '/trmnl-lastfm-grid',
        description: '2×5 grid of your top 10 album covers from the last week.',
      },
      {
        title: 'Last played',
        href: '/docs/trmnl-lastfm-last-played',
        path: '/trmnl-lastfm-last-played',
        description: 'Large album artwork with track details — your currently or most recently played track.',
      },
      {
        title: 'Profile stats',
        href: '/docs/trmnl-lastfm-stats',
        path: '/trmnl-lastfm-stats',
        description: 'Profile statistics and weekly top five artists.',
      },
    ],
  },
];
