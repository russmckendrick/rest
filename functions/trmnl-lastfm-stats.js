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
    
    // Fetch user info
    if (debug) debugInfo.push('Fetching user info...');
    const userInfoResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch Last.fm user info');
    }

    const userInfo = await userInfoResponse.json();
    const user = userInfo.user;

    // Fetch user's top artists
    if (debug) debugInfo.push('Fetching top artists...');
    const topArtistsResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&period=7day&limit=5&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!topArtistsResponse.ok) {
      throw new Error('Failed to fetch Last.fm top artists');
    }

    const topArtists = await topArtistsResponse.json();

    // Generate TRMNL-compatible HTML markup
    const markup = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://usetrmnl.com/css/latest/plugins.css">
          <script src="https://usetrmnl.com/js/latest/plugins.js"></script>
          <style>
            .stats-container {
              display: flex;
              flex-direction: column;
              height: calc(100% - 80px);
              background: #fff;
              padding: 24px;
            }
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 32px;
              padding-bottom: 16px;
              border-bottom: 2px solid #000;
            }
            .user-info {
              flex-grow: 1;
            }
            .username {
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #000;
            }
            .join-date {
              font-size: 24px;
              color: #000;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
              margin-bottom: 32px;
            }
            .stat-box {
              background: #fff;
              border: 2px solid #000;
              padding: 16px;
              text-align: center;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #000;
              margin-bottom: 8px;
            }
            .stat-label {
              font-size: 20px;
              color: #000;
            }
            .top-artists {
              flex-grow: 1;
            }
            .top-artists-title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 16px;
              color: #000;
            }
            .artist-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .artist-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 16px;
              background: #fff;
              border: 1px solid #000;
            }
            .artist-name {
              font-size: 24px;
              color: #000;
            }
            .artist-plays {
              font-size: 24px;
              color: #000;
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
          </style>
        </head>
        <body class="environment trmnl">
          <div class="screen">
            <div class="view view--full">
              <div class="layout">
                <!-- Black pixel to establish rendering context -->
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="1" height="1" style="position: absolute; top: 0; left: 0; opacity: 0; pointer-events: none; display: block;" />
                <div class="stats-container">
                  <div class="header">
                    <div class="user-info">
                      <div class="username">${user.name}</div>
                      <div class="join-date">Member since ${new Date(parseInt(user.registered.unixtime) * 1000).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div class="stats-grid">
                    <div class="stat-box">
                      <div class="stat-value">${parseInt(user.playcount).toLocaleString()}</div>
                      <div class="stat-label">Total Plays</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value">${parseInt(user.playlists).toLocaleString()}</div>
                      <div class="stat-label">Playlists</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value">${parseInt(user.track_count).toLocaleString()}</div>
                      <div class="stat-label">Tracks</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value">${parseInt(user.artist_count).toLocaleString()}</div>
                      <div class="stat-label">Artists</div>
                    </div>
                  </div>

                  <div class="top-artists">
                    <div class="top-artists-title">Top Artists This Week</div>
                    <div class="artist-list">
                      ${topArtists.topartists.artist.map(artist => `
                        <div class="artist-item">
                          <div class="artist-name">${artist.name}</div>
                          <div class="artist-plays">${parseInt(artist.playcount).toLocaleString()} plays</div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="title_bar">
                <img class="image" src="https://usetrmnl.com/images/plugins/trmnl--render.svg" />
                <span class="title" style="color: #000;">Last.fm Stats</span>
                <span class="instance" style="color: #000;">${username}'s Profile</span>
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