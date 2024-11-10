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
    // Calculate height using new ratio (roughly 3:1)
    const height = Math.round(customWidth * 0.35);
    
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
    const fontSize = Math.max(12, Math.round(customWidth / 60));  // Reduced font size
    const titleSize = Math.max(14, Math.round(customWidth / 40));  // Reduced title size
    const rowHeight = Math.max(18, Math.round(customWidth / 40));  // Adjusted row height
    const startY = Math.round(customWidth / 16);
    const headerHeight = Math.round(customWidth / 16);
    const logoSize = Math.round(titleSize * 0.8);  // Adjusted logo size

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
          .plays { font: ${fontSize}px system-ui, sans-serif; fill: #B9BAA3; }
          .row-bg { transition: opacity 0.3s; }
          .row-bg:hover { opacity: 0.8; }
        </style>
        
        <!-- Background -->
        <rect width="${customWidth}" height="${height}" fill="#0A100D"/>
        
        <!-- Header Background -->
        <rect width="${customWidth}" height="${headerHeight}" fill="#A22C29"/>
        
        <!-- Header Group -->
        <g transform="translate(25, ${headerHeight/2 + titleSize/3})">
          <!-- Last.fm Logo -->
          <path transform="translate(0, -${titleSize/1.2}) scale(${logoSize/25})" 
                fill="#D6D5C9" 
                d="M14.131 22.948l-1.172-3.193c0 0-1.912 2.131-4.771 2.131-2.537 0-4.333-2.203-4.333-5.729 0-4.511 2.276-6.125 4.515-6.125 3.224 0 4.245 2.089 5.125 4.772l1.161 3.667c1.161 3.561 3.365 6.421 9.713 6.421 4.548 0 7.631-1.391 7.631-5.068 0-2.968-1.697-4.511-4.844-5.244l-2.344-0.511c-1.624-0.371-2.104-1.032-2.104-2.131 0-1.249 0.985-1.984 2.604-1.984 1.767 0 2.704 0.661 2.865 2.24l3.661-0.444c-0.297-3.301-2.584-4.656-6.323-4.656-3.308 0-6.532 1.251-6.532 5.245 0 2.5 1.204 4.077 4.245 4.807l2.484 0.589c1.865 0.443 2.484 1.224 2.484 2.287 0 1.359-1.323 1.921-3.828 1.921-3.703 0-5.244-1.943-6.124-4.625l-1.204-3.667c-1.541-4.765-4.005-6.531-8.891-6.531-5.287-0.016-8.151 3.385-8.151 9.192 0 5.573 2.864 8.595 8.005 8.595 4.14 0 6.125-1.943 6.125-1.943z"/>
          
          <!-- Title Text -->
          <text x="${logoSize * 1.5}" class="title">Top ${showAlbums ? 'Albums' : 'Artists'} Last Week</text>
        </g>

        <!-- Items List -->
        ${items.map((item, i) => {
          const playCount = parseInt(item.playcount);
          const opacity = 0.3 + (playCount / maxPlays * 0.7);
          
          if (showAlbums) {
            return `
              <g transform="translate(0, ${startY + (i * rowHeight)})">
                <rect class="row-bg" x="0" y="0" width="${customWidth}" height="${rowHeight}" 
                      fill="#A22C29" opacity="${opacity}"/>
                <text x="25" y="${rowHeight/2 + fontSize/3}" class="item-name">
                  ${item.name} by ${item.artist.name}
                </text>
              </g>
            `;
          } else {
            return `
              <g transform="translate(0, ${startY + (i * rowHeight)})">
                <rect class="row-bg" x="0" y="0" width="${customWidth}" height="${rowHeight}" 
                      fill="#A22C29" opacity="${opacity}"/>
                <text x="25" y="${rowHeight/2 + fontSize/3}" class="item-name">${item.name}</text>
                <text x="${customWidth - 25}" y="${rowHeight/2 + fontSize/3}" class="plays" text-anchor="end">
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