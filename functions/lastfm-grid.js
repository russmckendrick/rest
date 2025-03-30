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
        const imageBlob = await imageResponse.blob();
        return { blob: imageBlob, index };
      } catch (error) {
        if (debug) debugInfo.push(`Error fetching image for album ${index + 1}: ${error.message}`);
        return null;
      }
    }));

    // Filter out any failed image fetches
    const validImages = albumImages.filter(img => img !== null);
    if (debug) debugInfo.push(`Successfully fetched ${validImages.length} album images`);

    // Create canvas and draw the grid
    const canvas = new OffscreenCanvas(800, 480);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 480);

    // Calculate grid dimensions
    const gridCols = 5;
    const gridRows = 2;
    const cellWidth = Math.floor(800 / gridCols);
    const cellHeight = Math.floor(400 / gridRows); // Leave space for title bar
    const padding = 10;

    // Draw album images
    await Promise.all(validImages.map(async ({ blob, index }) => {
      const row = Math.floor(index / gridCols);
      const col = index % gridCols;
      const x = col * cellWidth + padding;
      const y = row * cellHeight + padding;
      const width = cellWidth - (padding * 2);
      const height = cellHeight - (padding * 2);

      const imageBitmap = await createImageBitmap(blob);
      ctx.filter = 'grayscale(100%) contrast(200%) brightness(150%)';
      ctx.drawImage(imageBitmap, x, y, width, height);
    }));

    // Draw title bar
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 400, 800, 80);
    ctx.fillStyle = 'black';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${username}'s Weekly Top Albums`, 400, 445);

    // Convert canvas to base64
    const imageBuffer = await canvas.convertToBlob({ type: 'image/png' });
    const base64String = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(imageBuffer);
    });

    // Generate TRMNL-compatible HTML markup
    const markup = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://usetrmnl.com/css/latest/plugins.css">
          <script src="https://usetrmnl.com/js/latest/plugins.js"></script>
        </head>
        <body class="environment trmnl">
          <div class="screen">
            <div class="view view--full">
              <div class="layout">
                <img src="${base64String}" alt="Album Grid" style="width: 100%; height: 100%; object-fit: contain;" />
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