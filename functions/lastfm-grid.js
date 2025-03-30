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
    
    // Fetch top albums from Last.fm
    const lastfmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${encodeURIComponent(username)}&period=7day&limit=10&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!lastfmResponse.ok) {
      throw new Error('Failed to fetch Last.fm data');
    }

    const data = await lastfmResponse.json();
    const albums = data.topalbums.album;

    // TRMNL screen dimensions
    const screenWidth = 800;
    const screenHeight = 480;
    
    // Calculate grid dimensions
    const gridCols = 5;
    const gridRows = 2;
    const cellWidth = screenWidth / gridCols;
    const cellHeight = screenHeight / gridRows;
    const imageSize = Math.min(cellWidth * 0.9, cellHeight * 0.9); // 90% of cell size
    const imagePadding = (cellWidth - imageSize) / 2;

    // Function to escape XML special characters
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe
        .replace(/[<>&'"]/g, (c) => {
          switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
          }
        });
    };

    // Generate SVG
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="${screenWidth}" height="${screenHeight}" viewBox="0 0 ${screenWidth} ${screenHeight}">
        <style>
          .album-image { filter: grayscale(100%); }
          .album-title { font: 12px 'Inter', system-ui, sans-serif; fill: #000000; text-anchor: middle; }
          .artist-name { font: 10px 'Inter', system-ui, sans-serif; fill: #666666; text-anchor: middle; }
        </style>
        
        <!-- Background -->
        <rect width="${screenWidth}" height="${screenHeight}" fill="#FFFFFF"/>
        
        <!-- Album Grid -->
        ${albums.map((album, index) => {
          const row = Math.floor(index / gridCols);
          const col = index % gridCols;
          const x = col * cellWidth;
          const y = row * cellHeight;
          const imageUrl = album.image.find(img => img.size === 'large')?.['#text'] || '';
          const safeImageUrl = escapeXml(imageUrl);
          const safeAlbumName = escapeXml(album.name);
          const safeArtistName = escapeXml(album.artist.name);
          
          return `
            <g transform="translate(${x}, ${y})">
              ${safeImageUrl ? `
                <image 
                  href="${safeImageUrl}"
                  x="${imagePadding}"
                  y="${imagePadding}"
                  width="${imageSize}"
                  height="${imageSize}"
                  class="album-image"
                />` : ''}
              <text x="${cellWidth/2}" y="${cellHeight - 20}" class="album-title">${safeAlbumName}</text>
              <text x="${cellWidth/2}" y="${cellHeight - 5}" class="artist-name">${safeArtistName}</text>
            </g>
          `;
        }).join('')}
      </svg>
    `.trim();

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