// functions/lastfm.js
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
    const showAlbums = url.searchParams.has('albums');
    const showArtists = url.searchParams.has('artists') || (!showAlbums);
    const username = url.searchParams.get('username') || 'russmckendrick';
    const customWidth = parseInt(url.searchParams.get('width')) || 500;
    
    // Fetch user info to get avatar
    const userInfoResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch Last.fm user info');
    }

    const userInfo = await userInfoResponse.json();
    const userImageUrl = userInfo.user.image.find(img => img.size === 'medium')?.['#text'] || '';
    
    // Fetch and convert avatar image
    let avatarDataUri = '';
    if (userImageUrl) {
      try {
        const imageResponse = await fetch(userImageUrl);
        if (imageResponse.ok) {
          const imageArrayBuffer = await imageResponse.arrayBuffer();
          const imageBase64 = btoa(
            String.fromCharCode(...new Uint8Array(imageArrayBuffer))
          );
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          avatarDataUri = `data:${contentType};base64,${imageBase64}`;
        }
      } catch (error) {
        console.error('Failed to fetch avatar:', error);
      }
    }

    const method = showAlbums ? 'user.gettopalbums' : 'user.gettopartists';
    
    const lastfmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=${method}&user=${username}&period=7day&limit=10&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!lastfmResponse.ok) {
      throw new Error('Failed to fetch Last.fm data');
    }

    const data = await lastfmResponse.json();
    const items = showAlbums ? data.topalbums.album : data.topartists.artist;

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
    const fontSize = Math.max(12, Math.round(customWidth / 60));
    const titleSize = Math.max(16, Math.round(customWidth / 35));
    const rowHeight = Math.max(18, Math.round(customWidth / 40));
    const headerHeight = Math.round(customWidth / 12);
    const logoSize = Math.round(titleSize * 0.8);
    const startY = headerHeight;
    const avatarSize = Math.round(headerHeight * 0.7);
    const avatarPadding = Math.round(headerHeight * 0.15);

    // Calculate exact height needed
    const totalHeight = startY + (items.length * rowHeight);

    // Generate SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${customWidth}" height="${totalHeight}" viewBox="0 0 ${customWidth} ${totalHeight}">
        <defs>
          <clipPath id="avatarClip">
            <circle cx="${avatarSize/2 + avatarPadding}" cy="${headerHeight/2}" r="${avatarSize/2}"/>
          </clipPath>
        </defs>
        <style>
          .title { font: bold ${titleSize}px system-ui, sans-serif; fill: #D6D5C9; }
          .item-name { font: ${fontSize}px system-ui, sans-serif; fill: #D6D5C9; }
          .artist-name { font: ${fontSize}px system-ui, sans-serif; fill: #B9BAA3; }
          .plays { font: ${fontSize}px system-ui, sans-serif; fill: #B9BAA3; }
          .separator { stroke: #666666; stroke-width: 0.5; stroke-dasharray: 2 2; }
          .row-bg { transition: opacity 0.3s; }
          .row-bg:hover { opacity: 0.8; }
        </style>
        
        <!-- Header Background -->
        <rect width="${customWidth}" height="${headerHeight}" fill="#800000"/>
        
        <!-- User Avatar -->
        ${avatarDataUri ? `
        <image 
          href="${avatarDataUri}" 
          x="${avatarPadding}" 
          y="${headerHeight/2 - avatarSize/2}" 
          width="${avatarSize}" 
          height="${avatarSize}"
          clip-path="url(#avatarClip)"
        />
        ` : `
        <circle 
          cx="${avatarSize/2 + avatarPadding}" 
          cy="${headerHeight/2}" 
          r="${avatarSize/2}"
          fill="#600000"
        />
        <text 
          x="${avatarSize/2 + avatarPadding}" 
          y="${headerHeight/2}"
          font-family="system-ui, sans-serif"
          font-size="${avatarSize/2}px"
          fill="#D6D5C9"
          text-anchor="middle"
          dominant-baseline="middle"
        >${username.slice(0, 2).toUpperCase()}</text>
        `}
        
        <!-- Header Group -->
        <g transform="translate(${avatarSize + avatarPadding * 2}, ${headerHeight/2 + titleSize/3})">
          <!-- Last.fm Logo -->
          <path transform="translate(0, -${titleSize/1.2}) scale(${logoSize/25})" 
                fill="#D6D5C9" 
                d="M14.131 22.948l-1.172-3.193c0 0-1.912 2.131-4.771 2.131-2.537 0-4.333-2.203-4.333-5.729 0-4.511 2.276-6.125 4.515-6.125 3.224 0 4.245 2.089 5.125 4.772l1.161 3.667c1.161 3.561 3.365 6.421 9.713 6.421 4.548 0 7.631-1.391 7.631-5.068 0-2.968-1.697-4.511-4.844-5.244l-2.344-0.511c-1.624-0.371-2.104-1.032-2.104-2.131 0-1.249 0.985-1.984 2.604-1.984 1.767 0 2.704 0.661 2.865 2.24l3.661-0.444c-0.297-3.301-2.584-4.656-6.323-4.656-3.308 0-6.532 1.251-6.532 5.245 0 2.5 1.204 4.077 4.245 4.807l2.484 0.589c1.865 0.443 2.484 1.224 2.484 2.287 0 1.359-1.323 1.921-3.828 1.921-3.703 0-5.244-1.943-6.124-4.625l-1.204-3.667c-1.541-4.765-4.005-6.531-8.891-6.531-5.287-0.016-8.151 3.385-8.151 9.192 0 5.573 2.864 8.595 8.005 8.595 4.14 0 6.125-1.943 6.125-1.943z"/>
          
          <!-- Title Text -->
          <text x="${logoSize * 1.5}" class="title">Top ${showAlbums ? 'Albums' : 'Artists'} Last Week</text>
        </g>

        <!-- Items List -->
        ${items.map((item, i) => {
          const position = i / (items.length - 1);
          const startColor = {r: 128, g: 0, b: 0};
          const endColor = {r: 186, g: 0, b: 0};
          
          const currentColor = {
            r: Math.round(startColor.r + (endColor.r - startColor.r) * position),
            g: 0,
            b: 0
          };
          
          const color = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
          const playCount = parseInt(item.playcount);
          
          if (showAlbums) {
            const name = escapeXml(item.name);
            const artistName = escapeXml(item.artist.name);
            const textWidth = name.length * (fontSize * 0.6);
            const artistWidth = (artistName.length + 3) * (fontSize * 0.6);
            const padding = 50;
            const separatorStartX = textWidth + 35;
            const separatorEndX = customWidth - artistWidth - 35;

            return `
              <g transform="translate(0, ${startY + (i * rowHeight)})">
                <rect class="row-bg" x="0" y="0" width="${customWidth}" height="${rowHeight}" 
                      fill="${color}"/>
                <text x="25" y="${rowHeight/2 + fontSize/3}" class="item-name">${name}</text>
                <line x1="${separatorStartX}" y1="${rowHeight/2}" 
                      x2="${separatorEndX}" y2="${rowHeight/2}" 
                      class="separator" />
                <text x="${customWidth - 25}" y="${rowHeight/2 + fontSize/3}" 
                      class="artist-name" text-anchor="end">by ${artistName}</text>
              </g>
            `;
          } else {
            const name = escapeXml(item.name);
            return `
              <g transform="translate(0, ${startY + (i * rowHeight)})">
                <rect class="row-bg" x="0" y="0" width="${customWidth}" height="${rowHeight}" 
                      fill="${color}"/>
                <text x="25" y="${rowHeight/2 + fontSize/3}" class="item-name">${name}</text>
                <text x="${customWidth - 25}" y="${rowHeight/2 + fontSize/3}" class="plays" text-anchor="end">
                  ${playCount} plays
                </text>
              </g>
            `;
          }
        }).join('')}
      </svg>
    `;

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