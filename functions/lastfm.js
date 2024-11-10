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
    // Get URL parameters to determine what to display
    const url = new URL(context.request.url);
    const showAlbums = url.searchParams.has('albums');
    const showArtists = url.searchParams.has('artists') || (!showAlbums); // default to artists if no parameter

    // Determine which API endpoint to use
    const method = showAlbums ? 'user.gettopalbums' : 'user.gettopartists';
    
    const lastfmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=${method}&user=russmckendrick&period=7day&limit=10&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!lastfmResponse.ok) {
      throw new Error('Failed to fetch Last.fm data');
    }

    const data = await lastfmResponse.json();
    const items = showAlbums ? data.topalbums.album : data.topartists.artist;

    // SVG dimensions
    const width = 400;
    const height = 320;
    const lineHeight = 28;
    const startY = 50;

    // Generate SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <style>
          .title { font: bold 16px system-ui, sans-serif; fill: #1db954; }
          .item-name { font: 14px system-ui, sans-serif; fill: #333; }
          .artist-name { font: 12px system-ui, sans-serif; fill: #666; font-style: italic; }
          .plays { font: 12px system-ui, sans-serif; fill: #666; }
          .updated { font: 10px system-ui, sans-serif; fill: #999; }
        </style>
        
        <!-- Title -->
        <text x="20" y="30" class="title">
          My Last.fm Top ${showAlbums ? 'Albums' : 'Artists'} (Last 7 Days)
        </text>

        <!-- Items List -->
        ${items.map((item, i) => {
          if (showAlbums) {
            // For albums, show both album name and artist
            return `
              <g transform="translate(20, ${startY + (i * lineHeight)})">
                <text class="item-name">${item.name}</text>
                <text y="15" class="artist-name">${item.artist.name}</text>
                <text x="${width - 20}" y="7" class="plays" text-anchor="end">${item.playcount} plays</text>
              </g>
            `;
          } else {
            // For artists, show just the name and plays
            return `
              <g transform="translate(20, ${startY + (i * lineHeight)})">
                <text class="item-name">${item.name}</text>
                <text x="${width - 20}" class="plays" text-anchor="end">${item.playcount} plays</text>
              </g>
            `;
          }
        }).join('')}
        
        <!-- Updated timestamp -->
        <text x="${width - 20}" y="${height - 10}" class="updated" text-anchor="end">
          Updated: ${new Date().toLocaleString()}
        </text>
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