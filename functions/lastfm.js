// functions/lastfm.js
export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(context.request.url);
    const showAlbums = url.searchParams.has('albums');
    const showArtists = url.searchParams.has('artists') || (!showAlbums);
    
    // Get custom width from URL params, default to 500
    const customWidth = parseInt(url.searchParams.get('width')) || 500;
    // Calculate height proportionally
    const height = Math.round(customWidth * 0.8);
    
    const method = showAlbums ? 'user.gettopalbums' : 'user.gettopartists';
    
    const lastfmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=${method}&user=russmckendrick&period=7day&limit=10&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!lastfmResponse.ok) {
      throw new Error('Failed to fetch Last.fm data');
    }

    const data = await lastfmResponse.json();
    const items = showAlbums ? data.topalbums.album : data.topartists.artist;

    // Get max plays for color scaling
    const maxPlays = Math.max(...items.map(item => parseInt(item.playcount)));
    
    // Calculate proportional sizes based on custom width
    const fontSize = Math.max(12, Math.round(customWidth / 31.25)); // Scale font size with width
    const titleSize = Math.max(16, Math.round(customWidth / 20.83));
    const rowHeight = Math.max(28, Math.round(customWidth / 13.89));
    const startY = Math.round(customWidth / 7.14);
    const headerHeight = Math.round(customWidth / 10);

    // Generate SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${customWidth}" height="${height}" viewBox="0 0 ${customWidth} ${height}">
        <defs>
          <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#A22C29"/>
            <stop offset="100%" style="stop-color:#902923"/>
          </linearGradient>
        </defs>
        
        <style>
          .title { font: bold ${titleSize}px system-ui, sans-serif; fill: #D6D5C9; }
          .item-name { font: ${fontSize}px system-ui, sans-serif; fill: #D6D5C9; }
          .artist-name { font: ${fontSize}px system-ui, sans-serif; fill: #B9BAA3; }
          .row-bg { transition: opacity 0.3s; }
          .row-bg:hover { opacity: 0.8; }
        </style>
        
        <!-- Background -->
        <rect width="${customWidth}" height="${height}" fill="#0A100D"/>
        
        <!-- Thin separator line -->
        <rect width="${customWidth}" height="1" fill="#0A100D"/>
        
        <!-- Header Background -->
        <rect width="${customWidth}" height="${headerHeight}" fill="url(#headerGrad)"/>
        
        <!-- Title -->
        <text x="25" y="${headerHeight/1.5}" class="title">
          My Last.fm Top ${showAlbums ? 'Albums' : 'Artists'}
        </text>

        <!-- Items List -->
        ${items.map((item, i) => {
          const playCount = parseInt(item.playcount);
          const opacity = 0.3 + (playCount / maxPlays * 0.7);
          
          if (showAlbums) {
            return `
              <g transform="translate(0, ${startY + (i * rowHeight)})">
                <rect class="row-bg" x="0" y="0" width="${customWidth}" height="${rowHeight}" 
                      fill="#A22C29" opacity="${opacity}"/>
                <text x="25" y="${rowHeight/2}" class="item-name">
                  ${item.name} by ${item.artist.name}
                </text>
              </g>
            `;
          } else {
            return `
              <g transform="translate(0, ${startY + (i * rowHeight)})">
                <rect class="row-bg" x="0" y="0" width="${customWidth}" height="${rowHeight}" 
                      fill="#A22C29" opacity="${opacity}"/>
                <text x="25" y="${rowHeight/2}" class="item-name">${item.name}</text>
                <text x="${customWidth - 25}" y="${rowHeight/2}" class="plays" text-anchor="end">
                  ${playCount} plays
                </text>
              </g>
            `;
          }
        }).join('')}
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=1800',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
}