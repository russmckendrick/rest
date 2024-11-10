// wrangler.toml configuration:
// name = "lastfm-chart"
// main = "src/worker.js"
// compatibility_date = "2024-01-01"
// [vars]
// LASTFM_API_KEY = "your-api-key-here"

export default {
  async fetch(request, env) {
    // Configure CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {
      // Fetch top tracks from Last.fm API
      const lastfmResponse = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=russmckendrick&period=7day&limit=10&api_key=${env.LASTFM_API_KEY}&format=json`
      );

      if (!lastfmResponse.ok) {
        throw new Error('Failed to fetch Last.fm data');
      }

      const data = await lastfmResponse.json();
      const tracks = data.toptracks.track;

      // Calculate the maximum playcount for scaling
      const maxPlays = Math.max(...tracks.map(track => parseInt(track.playcount)));
      
      // SVG dimensions and styles
      const width = 800;
      const height = 400;
      const padding = 60;
      const barHeight = (height - padding * 2) / tracks.length;
      const barPadding = 5;

      // Generate SVG
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <style>
            .chart-text { font: 12px system-ui, sans-serif; fill: #333; }
            .chart-title { font: bold 16px system-ui, sans-serif; fill: #1db954; }
            .chart-bar { fill: #1db954; transition: fill 0.3s; }
            .chart-bar:hover { fill: #1ed760; }
          </style>
          
          <!-- Title -->
          <text x="10" y="30" class="chart-title">My Last.fm Top Tracks (Last 7 Days)</text>

          <!-- Bars and labels -->
          ${tracks.map((track, i) => {
            const barWidth = (parseInt(track.playcount) / maxPlays) * (width - padding * 2 - 100);
            const yPos = padding + (i * barHeight);
            
            return `
              <g transform="translate(0, ${yPos})">
                <rect
                  x="${padding}"
                  y="${barPadding}"
                  width="${barWidth}"
                  height="${barHeight - barPadding * 2}"
                  class="chart-bar"
                />
                <text
                  x="${padding + barWidth + 5}"
                  y="${barHeight / 2 + 5}"
                  class="chart-text"
                >${track.playcount} plays</text>
                <text
                  x="${padding - 5}"
                  y="${barHeight / 2 + 5}"
                  class="chart-text"
                  text-anchor="end"
                >${track.name.substring(0, 30)}${track.name.length > 30 ? '...' : ''}</text>
              </g>
            `;
          }).join('')}
          
          <!-- Last updated timestamp -->
          <text
            x="${width - 10}"
            y="${height - 10}"
            class="chart-text"
            text-anchor="end"
          >Updated: ${new Date().toLocaleString()}</text>
        </svg>
      `;

      // Return the SVG with appropriate headers
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
  },
};
