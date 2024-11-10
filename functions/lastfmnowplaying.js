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
      const albumImageUrl = track.image.find(img => img.size === 'large')?.['#text'];
      
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
  
      // Calculate proportional sizes
      const headerHeight = Math.round(customWidth / 6);
      const titleSize = Math.max(16, Math.round(customWidth / 35));
      const fontSize = Math.max(12, Math.round(customWidth / 60));
      const logoSize = Math.round(titleSize * 0.8);
      const albumSize = Math.round(headerHeight * 1.5);
      const padding = Math.round(customWidth / 40);
      
      // Calculate total height needed
      const totalHeight = headerHeight + albumSize + padding * 2;
  
      const isNowPlaying = track['@attr']?.nowplaying === 'true';
      const trackName = escapeXml(track.name);
      const artistName = escapeXml(track.artist['#text']);
      const albumName = escapeXml(track.album['#text']);
  
      // Generate SVG
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${customWidth}" height="${totalHeight}" viewBox="0 0 ${customWidth} ${totalHeight}">
          <style>
            .title { font: bold ${titleSize}px system-ui, sans-serif; fill: #D6D5C9; }
            .info { font: ${fontSize}px system-ui, sans-serif; fill: #D6D5C9; }
            .secondary { font: ${fontSize}px system-ui, sans-serif; fill: #B9BAA3; }
            .now-playing { font: bold ${fontSize}px system-ui, sans-serif; fill: #FF8888; }
          </style>
          
          <!-- Header Background -->
          <rect width="${customWidth}" height="${headerHeight}" fill="#800000"/>
          
          <!-- Header Group -->
          <g transform="translate(${padding}, ${headerHeight/2 + titleSize/3})">
            <!-- Last.fm Logo -->
            <path transform="translate(0, -${titleSize/1.2}) scale(${logoSize/25})" 
                  fill="#D6D5C9" 
                  d="M14.131 22.948l-1.172-3.193c0 0-1.912 2.131-4.771 2.131-2.537 0-4.333-2.203-4.333-5.729 0-4.511 2.276-6.125 4.515-6.125 3.224 0 4.245 2.089 5.125 4.772l1.161 3.667c1.161 3.561 3.365 6.421 9.713 6.421 4.548 0 7.631-1.391 7.631-5.068 0-2.968-1.697-4.511-4.844-5.244l-2.344-0.511c-1.624-0.371-2.104-1.032-2.104-2.131 0-1.249 0.985-1.984 2.604-1.984 1.767 0 2.704 0.661 2.865 2.24l3.661-0.444c-0.297-3.301-2.584-4.656-6.323-4.656-3.308 0-6.532 1.251-6.532 5.245 0 2.5 1.204 4.077 4.245 4.807l2.484 0.589c1.865 0.443 2.484 1.224 2.484 2.287 0 1.359-1.323 1.921-3.828 1.921-3.703 0-5.244-1.943-6.124-4.625l-1.204-3.667c-1.541-4.765-4.005-6.531-8.891-6.531-5.287-0.016-8.151 3.385-8.151 9.192 0 5.573 2.864 8.595 8.005 8.595 4.14 0 6.125-1.943 6.125-1.943z"/>
            
            <!-- Title Text -->
            <text x="${logoSize * 1.5}" class="title">${isNowPlaying ? 'Now Playing' : 'Last Played'}</text>
          </g>
  
          <!-- Main Content Area -->
          <g transform="translate(${padding}, ${headerHeight + padding})">
            <!-- Album Art -->
            ${albumArtDataUri ? `
            <image 
              href="${escapeXml(albumArtDataUri)}" 
              x="0" 
              y="0" 
              width="${albumSize}" 
              height="${albumSize}"
            />` : `
            <rect 
              x="0" 
              y="0" 
              width="${albumSize}" 
              height="${albumSize}" 
              fill="#666666"
            />`}
  
            <!-- Track Information -->
            <g transform="translate(${albumSize + padding * 2}, ${fontSize * 2})">
              ${isNowPlaying ? `
              <text class="now-playing" y="-${fontSize}">♫ PLAYING NOW</text>` : ''}
              <text class="info" y="${fontSize * 1.5}">${trackName}</text>
              <text class="secondary" y="${fontSize * 3.5}">by ${artistName}</text>
              <text class="secondary" y="${fontSize * 5.5}">from ${albumName}</text>
            </g>
          </g>
        </svg>
      `;
  
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=30',
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