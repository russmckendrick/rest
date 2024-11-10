// functions/lastfmnowplaying.js
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
    const customWidth = parseInt(url.searchParams.get('width')) || 500;
    
    // Fetch recent tracks
    const recentTracksResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&limit=1&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!recentTracksResponse.ok) {
      throw new Error('Failed to fetch Last.fm recent tracks');
    }

    const recentTracks = await recentTracksResponse.json();
    const track = recentTracks.recenttracks.track[0];
    
    if (!track) {
      throw new Error('No recent tracks found');
    }

    // Get album art URL from track info
    const albumImageUrl = track.image.find(img => img.size === 'extralarge')?.['#text'] || 
                         track.image.find(img => img.size === 'large')?.['#text'];
    
    // Convert album art to base64
    let albumArtDataUri = '';
    if (albumImageUrl) {
      try {
        const imageResponse = await fetch(albumImageUrl);
        if (imageResponse.ok) {
          const imageData = await imageResponse.arrayBuffer();
          const base64String = btoa(String.fromCharCode(...new Uint8Array(imageData)));
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          albumArtDataUri = `data:${contentType};base64,${base64String}`;
        }
      } catch (error) {
        console.error('Failed to fetch album art:', error);
      }
    }

    // Function to escape XML special characters
    const escapeXml = (unsafe) => {
      return unsafe.replace(/[<>&'"/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case "'": return '&apos;';
          case '"': return '&quot;';
        }
      });
    };

    // Calculate dimensions
    const height = Math.round(customWidth * 0.3); // 3:1 aspect ratio
    const artSize = height;
    const contentPadding = Math.round(height * 0.1);
    const titleSize = Math.max(16, Math.round(height * 0.15));
    const fontSize = Math.max(12, Math.round(height * 0.08));

    const isNowPlaying = track['@attr']?.nowplaying === 'true';
    const trackName = escapeXml(track.name);
    const artistName = escapeXml(track.artist['#text']);
    const albumName = escapeXml(track.album['#text']);

    // Generate SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${customWidth}" height="${height}" viewBox="0 0 ${customWidth} ${height}">
        <defs>
          <!-- Background gradient -->
          <linearGradient id="overlay" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#800000" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#800000" stop-opacity="0.85"/>
          </linearGradient>
          
          <!-- Text shadow filter -->
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="1" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.7"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <style>
          .info { font: bold ${fontSize * 1.5}px system-ui, sans-serif; fill: #D6D5C9; filter: url(#shadow); letter-spacing: -0.5px; }
          .secondary { font: ${fontSize * 1.2}px system-ui, sans-serif; fill: #B9BAA3; filter: url(#shadow); }
          .now-playing { font: bold ${fontSize}px system-ui, sans-serif; fill: #FF8888; filter: url(#shadow); animation: pulse 2s infinite; }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
        </style>
        
        <!-- Background Image with Album Art -->
        ${albumArtDataUri ? `
        <image 
          href="${escapeXml(albumArtDataUri)}" 
          x="0" 
          y="0" 
          width="${customWidth}" 
          height="${height}"
          preserveAspectRatio="xMidYMid slice"
        />` : ''}
        
        <!-- Gradient Overlay -->
        <rect width="${customWidth}" height="${height}" fill="url(#overlay)"/>
        
        <!-- Album Art (Left Side) -->
        ${albumArtDataUri ? `
        <image 
          href="${escapeXml(albumArtDataUri)}" 
          x="0" 
          y="0" 
          width="${artSize}" 
          height="${height}"
        />` : `
        <rect 
          x="0" 
          y="0" 
          width="${artSize}" 
          height="${height}" 
          fill="#666666"
        />`}

        <!-- Content (Right Side) -->
        <g transform="translate(${artSize + contentPadding * 1.5}, ${height / 2 - titleSize})">
          <!-- Track Information -->
          ${isNowPlaying ? `
          <text class="now-playing" y="-${fontSize}">♫ PLAYING NOW</text>` : ''}
          <text class="info" y="0" style="font-size: ${fontSize * 1.5}px">${trackName}</text>
          <text class="secondary" y="${fontSize * 2.5}" style="font-size: ${fontSize * 1.2}px">by ${artistName}</text>
          <text class="secondary" y="${fontSize * 4.5}" style="font-size: ${fontSize * 1.2}px">from ${albumName}</text>
        </g>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
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
