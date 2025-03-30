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

    if (debug) debugInfo.push('Raw API Response:', JSON.stringify(data.weeklyalbumchart.album[0], null, 2));

    const albums = data.weeklyalbumchart.album.slice(0, 10);
    if (debug) debugInfo.push(`Found ${albums.length} albums`);

    // Fetch and convert images to base64
    const processedAlbums = await Promise.all(albums.map(async (album, index) => {
      if (debug) debugInfo.push(`Processing album ${index + 1}...`);
      
      // Extract artist name properly
      const artistName = typeof album.artist === 'string' ? album.artist : album.artist?.['#text'] || album.artist?.name;
      
      if (debug) {
        debugInfo.push(`Album ${index + 1} data:`);
        debugInfo.push(`- Name: ${album.name}`);
        debugInfo.push(`- Artist (raw): ${JSON.stringify(album.artist)}`);
        debugInfo.push(`- Artist (extracted): ${artistName}`);
        debugInfo.push(`- Playcount: ${album.playcount}`);
      }

      if (!artistName) {
        if (debug) debugInfo.push(`No valid artist name for album ${index + 1}`);
        return null;
      }

      // Fetch album info to get the image URL
      const albumInfoUrl = `http://ws.audioscrobbler.com/2.0/?method=album.getInfo&artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(album.name)}&api_key=${context.env.LASTFM_API_KEY}&format=json`;
      if (debug) debugInfo.push(`Album info URL: ${albumInfoUrl}`);
      
      const albumInfoResponse = await fetch(albumInfoUrl);

      if (!albumInfoResponse.ok) {
        if (debug) debugInfo.push(`Failed to fetch album info for ${album.name}: ${albumInfoResponse.status}`);
        return null;
      }

      const albumInfo = await albumInfoResponse.json();
      if (debug && albumInfo.error) {
        debugInfo.push(`Album info error: ${albumInfo.message}`);
      }
      
      if (!albumInfo?.album?.image) {
        if (debug) debugInfo.push(`No image data for album ${album.name}`);
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
          if (debug) debugInfo.push(`Failed to fetch image for album ${index + 1}: ${imageResponse.status}`);
          return null;
        }

        // Convert to base64 in chunks to avoid call stack size exceeded
        const imageData = await imageResponse.arrayBuffer();
        if (debug) debugInfo.push(`Image size for album ${index + 1}: ${imageData.byteLength} bytes`);
        
        const uint8Array = new Uint8Array(imageData);
        const chunks = [];
        const chunkSize = 8192;
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          chunks.push(String.fromCharCode.apply(null, chunk));
        }
        
        const base64String = btoa(chunks.join(''));
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        if (debug) debugInfo.push(`Successfully processed image for album ${index + 1}`);
        return `data:${contentType};base64,${base64String}`;
      } catch (error) {
        if (debug) debugInfo.push(`Error processing album ${index + 1}: ${error.message}`);
        console.error('Failed to fetch image:', error);
        return null;
      }
    }));

    if (debug) debugInfo.push(`Processed ${processedAlbums.filter(t => t !== null).length} images successfully`);

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
              gap: 10px;
              padding: 10px;
            }
            .album-cell {
              aspect-ratio: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
              border: 1px solid #eee;
            }
            .album-image {
              width: 100%;
              height: 100%;
              object-fit: contain;
              filter: grayscale(100%) contrast(100%);
            }
            .debug-info {
              font-family: monospace;
              font-size: 12px;
              padding: 10px;
              background: #f0f0f0;
              margin-top: 20px;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body class="environment trmnl">
          <div class="screen">
            <div class="view view--full">
              <div class="layout">
                <div class="album-grid">
                  ${processedAlbums.map((imageData) => {
                    return imageData ? `
                      <div class="album-cell">
                        <img class="image-dither" src="${imageData}" alt="" />
                      </div>
                    ` : `
                      <div class="album-cell"></div>
                    `;
                  }).join('')}
                </div>
              </div>
              
              <div class="title_bar">
                <img class="image" src="https://usetrmnl.com/images/plugins/trmnl--render.svg" />
                <span class="title">Weekly Top Albums</span>
                <span class="instance">${username}'s Last.fm</span>
              </div>

              ${debug ? `
                <div class="debug-info">
                  ${debugInfo.map(info => `${info}`).join('\n')}
                </div>
              ` : ''}
            </div>
          </div>
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