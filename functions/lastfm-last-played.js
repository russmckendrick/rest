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

    // Function to escape XML special characters
    const escapeXml = (unsafe) => {
      return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
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
    const headerHeight = Math.round(height * 0.3);
    const logoSize = Math.max(20, Math.round(height * 0.13));

    const trackName = escapeXml(track.name);
    const artistName = escapeXml(track.artist['#text']);
    const albumName = escapeXml(track.album['#text']);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${customWidth}" height="${debug ? height + 200 : height}" viewBox="0 0 ${customWidth} ${debug ? height + 200 : height}">
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
          .header-text { font: bold ${fontSize * 1.8}px system-ui, sans-serif; fill: #D6D5C9; filter: url(#shadow); }
          ${debug ? '.debug { font: ${fontSize}px monospace; fill: #FF0000; }' : ''}
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

        <!-- Header Group -->
        <g transform="translate(${artSize + contentPadding * 1.5}, ${contentPadding * 1.5})">
          <!-- Last.fm Logo -->
          <path transform="translate(0, ${fontSize * 0}) scale(${logoSize/25})" 
                fill="#D6D5C9" 
                d="M14.131 22.948l-1.172-3.193c0 0-1.912 2.131-4.771 2.131-2.537 0-4.333-2.203-4.333-5.729 0-4.511 2.276-6.125 4.515-6.125 3.224 0 4.245 2.089 5.125 4.772l1.161 3.667c1.161 3.561 3.365 6.421 9.713 6.421 4.548 0 7.631-1.391 7.631-5.068 0-2.968-1.697-4.511-4.844-5.244l-2.344-0.511c-1.624-0.371-2.104-1.032-2.104-2.131 0-1.249 0.985-1.984 2.604-1.984 1.767 0 2.704 0.661 2.865 2.24l3.661-0.444c-0.297-3.301-2.584-4.656-6.323-4.656-3.308 0-6.532 1.251-6.532 5.245 0 2.5 1.204 4.077 4.245 4.807l2.484 0.589c1.865 0.443 2.484 1.224 2.484 2.287 0 1.359-1.323 1.921-3.828 1.921-3.703 0-5.244-1.943-6.124-4.625l-1.204-3.667c-1.541-4.765-4.005-6.531-8.891-6.531-5.287-0.016-8.151 3.385-8.151 9.192 0 5.573 2.864 8.595 8.005 8.595 4.14 0 6.125-1.943 6.125-1.943z"/>
          
          <!-- Header Text -->
          <text x="${logoSize * 1.5}" y="${fontSize * 0.9}" class="header-text" dominant-baseline="central">Last Played</text>
        </g>

        <!-- Content (Right Side) -->
        <g transform="translate(${artSize + contentPadding * 1.5}, ${height/2})">
          <!-- Track Information -->
          <text class="info" y="0">${trackName}</text>
          <text class="secondary" y="${fontSize * 2.5}">by ${artistName}</text>
          <text class="secondary" y="${fontSize * 4.5}">from ${albumName}</text>
        </g>

        ${debug ? `
        <!-- Debug Information -->
        <g transform="translate(10, ${height + 20})">
          ${debugInfo.map((info, i) => 
            `<text x="0" y="${i * 20}" class="debug">${escapeXml(info)}</text>`
          ).join('')}
        </g>
        ` : ''}
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