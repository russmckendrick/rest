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
    
    // Calculate timestamp from 20 years ago
    const tenYearsAgo = Math.floor(Date.now() / 1000) - (20 * 365 * 24 * 60 * 60);
    
    // Debug array to collect information
    const debugInfo = [];
    
    // Fetch recent tracks with 'from' parameter
    if (debug) debugInfo.push('Fetching tracks...');
    const recentTracksResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&limit=1&from=${tenYearsAgo}&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!recentTracksResponse.ok) {
      throw new Error('Failed to fetch Last.fm recent tracks');
    }

    const recentTracks = await recentTracksResponse.json();
    const track = recentTracks.recenttracks.track[0];
    
    if (!track) {
      throw new Error('No tracks found in the last 10 years');
    }

    // Get album art URL from track info and ensure we're getting the largest available image
    if (debug) debugInfo.push('Finding album art URL...');
    const albumImageUrl = track.image
      .sort((a, b) => {
        const sizeOrder = { extralarge: 4, large: 3, medium: 2, small: 1 };
        return sizeOrder[b.size] - sizeOrder[a.size];
      })[0]?.['#text'];
    
    if (debug) debugInfo.push(`Album image URL: ${albumImageUrl || 'none'}`);
    
    // Convert album art to base64
    let albumArtDataUri = '';
    if (albumImageUrl) {
      try {
        if (debug) debugInfo.push('Fetching album art...');
        const imageResponse = await fetch(albumImageUrl);
        if (debug) debugInfo.push(`Image response status: ${imageResponse.status}`);
        
        if (imageResponse.ok) {
          if (debug) debugInfo.push('Converting image to ArrayBuffer...');
          const imageData = await imageResponse.arrayBuffer();
          if (debug) debugInfo.push(`ArrayBuffer size: ${imageData.byteLength} bytes`);
          
          if (debug) debugInfo.push('Converting to base64...');
          const uint8Array = new Uint8Array(imageData);
          
          // Convert to base64 in chunks to avoid call stack size exceeded
          const chunks = [];
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            chunks.push(String.fromCharCode.apply(null, chunk));
          }
          const base64String = btoa(chunks.join(''));
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          if (debug) {
            debugInfo.push(`Content-Type: ${contentType}`);
            debugInfo.push(`Base64 length: ${base64String.length}`);
          }
          
          albumArtDataUri = `data:${contentType};base64,${base64String}`;
          if (debug) debugInfo.push('Data URI created successfully');
        } else {
          if (debug) debugInfo.push(`Failed to fetch image: ${imageResponse.status}`);
        }
      } catch (error) {
        if (debug) debugInfo.push(`Error fetching album art: ${error.message}`);
        console.error('Failed to fetch album art:', error);
      }
    } else {
      if (debug) debugInfo.push('No album image URL found');
    }

    // Generate TRMNL-compatible HTML markup
    const markup = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://usetrmnl.com/css/latest/plugins.css">
          <script src="https://usetrmnl.com/js/latest/plugins.js"></script>
          <style>
            .last-played-container {
              display: flex;
              height: calc(100% - 80px);
              background: #fff;
              padding: 24px;
              align-items: center;
            }
            .album-art {
              width: 300px;
              height: 300px;
              flex-shrink: 0;
              margin-right: 32px;
              border: 2px solid #000;
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #f0f0f0;
            }
            .album-image {
              width: 100%;
              height: 100%;
              object-fit: contain;
              filter: grayscale(100%);
              image-rendering: pixelated;
              -webkit-font-smoothing: none;
              mix-blend-mode: multiply;
            }
            .track-info {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 24px;
            }
            .track-name {
              font-size: 42px;
              font-weight: bold;
              margin-bottom: 16px;
              color: #000;
              line-height: 1.2;
            }
            .artist-name {
              font-size: 32px;
              margin-bottom: 12px;
              color: #000;
              line-height: 1.2;
            }
            .album-name {
              font-size: 28px;
              color: #000;
              line-height: 1.2;
            }
            .title_bar {
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 24px;
              background: #fff;
              border-top: 2px solid #000;
            }
            .title_bar .title {
              font-size: 24px;
              font-weight: bold;
            }
            .title_bar .instance {
              font-size: 20px;
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
                <div class="last-played-container">
                  <div class="album-art">
                    ${albumArtDataUri ? `
                      <img class="image-dither" src="${albumArtDataUri}" alt="Album Art" />
                    ` : ''}
                  </div>
                  <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="artist-name">by ${track.artist['#text']}</div>
                    <div class="album-name">from ${track.album['#text']}</div>
                  </div>
                </div>
              </div>
              
              <div class="title_bar">
                <img class="image" src="https://usetrmnl.com/images/plugins/trmnl--render.svg" />
                <span class="title" style="color: #000;">Last Played</span>
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
        'Cache-Control': 'no-store',
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