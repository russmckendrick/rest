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
    const username = url.searchParams.get('username') || 'russmckendrick';
    const debug = url.searchParams.has('debug');
    
    // Debug array to collect information
    const debugInfo = [];
    
    // Fetch weekly album chart from Last.fm
    if (debug) debugInfo.push('Fetching weekly album chart...');
    const lastfmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getweeklyalbumchart&user=${encodeURIComponent(username)}&limit=10&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!lastfmResponse.ok) {
      throw new Error('Failed to fetch Last.fm data');
    }

    const data = await lastfmResponse.json();
    if (!data?.weeklyalbumchart?.album) {
      throw new Error('Invalid Last.fm response format');
    }

    const albums = data.weeklyalbumchart.album.slice(0, 10);
    if (debug) debugInfo.push(`Found ${albums.length} albums`);

    // Fetch all album images first
    const albumImages = await Promise.all(albums.map(async (album, index) => {
      if (debug) debugInfo.push(`Processing album ${index + 1}...`);
      
      const artistName = typeof album.artist === 'string' ? album.artist : album.artist?.['#text'] || album.artist?.name;
      
      if (!artistName) {
        if (debug) debugInfo.push(`No valid artist name for album ${index + 1}`);
        return null;
      }

      const albumInfoUrl = `http://ws.audioscrobbler.com/2.0/?method=album.getInfo&artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(album.name)}&api_key=${context.env.LASTFM_API_KEY}&format=json`;
      const albumInfoResponse = await fetch(albumInfoUrl);

      if (!albumInfoResponse.ok) {
        if (debug) debugInfo.push(`Failed to fetch album info for ${album.name}`);
        return null;
      }

      const albumInfo = await albumInfoResponse.json();
      if (!albumInfo?.album?.image) {
        if (debug) debugInfo.push(`No image data for album ${album.name}`);
        return null;
      }

      const albumImageUrl = albumInfo.album.image
        .sort((a, b) => {
          const sizeOrder = { extralarge: 4, large: 3, medium: 2, small: 1 };
          return sizeOrder[b.size] - sizeOrder[a.size];
        })[0]?.['#text'];

      if (!albumImageUrl || 
          albumImageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f') ||
          albumImageUrl.includes('default_album') ||
          albumImageUrl.trim() === '') {
        if (debug) debugInfo.push(`Album ${index + 1} has invalid image URL`);
        return null;
      }

      try {
        const imageResponse = await fetch(albumImageUrl);
        if (!imageResponse.ok) return null;
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        return { 
          dataUrl: `data:${contentType};base64,${base64}`,
          index 
        };
      } catch (error) {
        if (debug) debugInfo.push(`Error fetching image for album ${index + 1}: ${error.message}`);
        return null;
      }
    }));

    // Filter out any failed image fetches
    const validImages = albumImages.filter(img => img !== null);
    if (debug) debugInfo.push(`Successfully fetched ${validImages.length} album images`);

    // Generate TRMNL-compatible HTML markup
    const markup = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://usetrmnl.com/css/latest/plugins.css">
          <script src="https://usetrmnl.com/js/latest/plugins.js"></script>
          <style>
            .album-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              grid-template-rows: repeat(2, 1fr);
              gap: 8px;
              padding: 8px;
              height: calc(100% - 80px);
            }
            .album-cell {
              aspect-ratio: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
              border: 1px solid #eee;
              overflow: hidden;
            }
            .album-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
              filter: grayscale(100%) contrast(200%) brightness(150%);
              image-rendering: pixelated;
              -webkit-font-smoothing: none;
            }
            .title_bar {
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 20px;
              background: #fff;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body class="environment trmnl">
          <div class="screen">
            <div class="view view--full">
              <div class="layout">
                <div class="album-grid">
                  ${validImages.map(({ dataUrl }, index) => `
                    <div class="album-cell">
                      <img class="album-image" src="${dataUrl}" alt="Album ${index + 1}" />
                    </div>
                  `).join('')}
                  ${Array(10 - validImages.length).fill(0).map(() => `
                    <div class="album-cell"></div>
                  `).join('')}
                </div>
              </div>
              
              <div class="title_bar">
                <img class="image" src="https://usetrmnl.com/images/plugins/trmnl--render.svg" />
                <span class="title">Weekly Top Albums</span>
                <span class="instance">${username}'s Last.fm</span>
              </div>
            </div>
          </div>
          ${debug ? `
            <div style="font-family: monospace; font-size: 12px; padding: 10px; background: #f0f0f0; margin-top: 20px; white-space: pre-wrap;">
              ${debugInfo.map(info => `${info}`).join('\n')}
            </div>
          ` : ''}
        </body>
      </html>
    `.trim();

    return new Response(markup, {
      headers: {
        'Content-Type': 'text/html',
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