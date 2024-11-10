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
    // Fetch top artists instead of tracks
    const lastfmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=russmckendrick&period=7day&limit=10&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!lastfmResponse.ok) {
      throw new Error('Failed to fetch Last.fm data');
    }

    const data = await lastfmResponse.json();
    const artists = data.topartists.artist;

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
          .artist { font: 14px system-ui, sans-serif; fill: #333; }
          .plays { font: 12px system-ui, sans-serif; fill: #666; }
          .updated { font: 10px system-ui, sans-serif; fill: #999; }
        </style>
        
        <!-- Title -->
        <text x="20" y="30" class="title">My Last.fm Top Artists (Last 7 Days)</text>

        <!-- Artists List -->
        ${artists.map((artist, i) => `
          <g transform="translate(20, ${startY + (i * lineHeight)})">
            <text class="artist">${artist.name}</text>
            <text x="${width - 20}" class="plays" text-anchor="end">${artist.playcount} plays</text>
          </g>
        `).join('')}
        
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