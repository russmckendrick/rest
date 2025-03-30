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
      if (debug) debugInfo.push(`Album ${index + 1} info URL: ${albumInfoUrl}`);
      
      const albumInfoResponse = await fetch(albumInfoUrl);

      if (!albumInfoResponse.ok) {
        if (debug) debugInfo.push(`Failed to fetch album info for ${album.name} (${albumInfoResponse.status}): ${await albumInfoResponse.text()}`);
        return null;
      }

      const albumInfo = await albumInfoResponse.json();
      if (debug && albumInfo.error) {
        debugInfo.push(`Album ${index + 1} info error: ${albumInfo.message}`);
      }
      
      if (!albumInfo?.album?.image) {
        if (debug) debugInfo.push(`No image data for album ${album.name}`);
        // Try getting image from the album chart response instead
        if (Array.isArray(album.image)) {
          const chartImageUrl = album.image
            .sort((a, b) => {
              const sizeOrder = { extralarge: 4, large: 3, medium: 2, small: 1 };
              return sizeOrder[b.size] - sizeOrder[a.size];
            })[0]?.['#text'];
            
          if (chartImageUrl && 
              !chartImageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f') &&
              !chartImageUrl.includes('default_album') &&
              chartImageUrl.trim() !== '') {
            if (debug) debugInfo.push(`Using image URL from chart for album ${index + 1}: ${chartImageUrl}`);
            try {
              const imageResponse = await fetch(chartImageUrl);
              if (!imageResponse.ok) return null;
              const arrayBuffer = await imageResponse.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              const chunks = [];
              const chunkSize = 8192;
              
              for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.slice(i, i + chunkSize);
                chunks.push(String.fromCharCode.apply(null, chunk));
              }
              
              const base64 = btoa(chunks.join(''));
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              return { 
                dataUrl: `data:${contentType};base64,${base64}`,
                index 
              };
            } catch (error) {
              if (debug) debugInfo.push(`Error fetching chart image for album ${index + 1}: ${error.message}`);
            }
          }
        }
        return null;
      }

      const albumImageUrl = albumInfo.album.image
        .sort((a, b) => {
          const sizeOrder = { extralarge: 4, large: 3, medium: 2, small: 1 };
          return sizeOrder[b.size] - sizeOrder[a.size];
        })[0]?.['#text'];

      if (debug) debugInfo.push(`Album ${index + 1} image URL: ${albumImageUrl || 'none'}`);

      if (!albumImageUrl || 
          albumImageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f') ||
          albumImageUrl.includes('default_album') ||
          albumImageUrl.trim() === '') {
        if (debug) debugInfo.push(`Album ${index + 1} has invalid image URL`);
        return null;
      }

      try {
        if (debug) debugInfo.push(`Fetching image for album ${index + 1}...`);
        const imageResponse = await fetch(albumImageUrl);
        if (!imageResponse.ok) {
          if (debug) debugInfo.push(`Failed to fetch image for album ${index + 1} (${imageResponse.status}): ${await imageResponse.text()}`);
          return null;
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const chunks = [];
        const chunkSize = 8192;
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          chunks.push(String.fromCharCode.apply(null, chunk));
        }
        
        const base64 = btoa(chunks.join(''));
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        if (debug) debugInfo.push(`Successfully processed image for album ${index + 1} (${uint8Array.length} bytes)`);
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

    // Create an array of 10 slots, fill with images or null
    const orderedImages = Array(10).fill(null);
    validImages.forEach(img => {
      orderedImages[img.index] = img.dataUrl;
    });

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
              gap: 12px;
              padding: 16px;
              height: calc(100% - 80px);
              background: #fff;
            }
            .album-cell {
              aspect-ratio: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
              border: 1px solid #000;
              overflow: hidden;
              padding: 4px;
            }
            .album-image {
              width: 100%;
              height: 100%;
              object-fit: contain;
              filter: grayscale(100%) contrast(200%) brightness(150%) saturate(0);
              image-rendering: pixelated;
              -webkit-font-smoothing: none;
              mix-blend-mode: multiply;
            }
            .title_bar {
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 20px;
              background: #fff;
              border-top: 1px solid #000;
            }
            /* Force high contrast for e-ink display */
            body {
              background: #fff !important;
              color: #000 !important;
            }
            .screen {
              background: #fff !important;
            }
            .view {
              background: #fff !important;
            }
            .layout {
              background: #fff !important;
            }
            /* Ensure proper image rendering */
            img {
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
          </style>
        </head>
        <body class="environment trmnl">
          <div class="screen">
            <div class="view view--full">
              <div class="layout">
                <!-- Black pixel to establish rendering context -->
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="1" height="1" style="position: absolute; top: 0; left: 0; opacity: 0; pointer-events: none; display: block;" />
              <div class="album-grid">
                  ${orderedImages.map((dataUrl, index) => `
                    <div class="album-cell">
                      ${dataUrl ? `
                        <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #fff;">
                          <img class="album-image" src="${dataUrl}" alt="Album ${index + 1}" />
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="title_bar">
                <img class="image" src="https://usetrmnl.com/images/plugins/trmnl--render.svg" />
                <span class="title" style="color: #000;">Weekly Top Albums</span>
                <span class="instance" style="color: #000;">${username}'s Last.fm</span>
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