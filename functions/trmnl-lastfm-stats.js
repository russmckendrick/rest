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
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&period=7day&limit=6&api_key=${context.env.LASTFM_API_KEY}&format=json`
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
            /* Base Layout */
            .layout {
              display: flex;
              flex-direction: column;
              height: 100%;
              background: #fff;
            }
            
            /* Content Container */
            .content {
              flex: 1;
              padding: 16px;
              display: flex;
              flex-direction: column;
              min-height: 0;
            }
            
            /* Header Section */
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #000;
            }
            
            .user-info {
              flex: 1;
            }
            
            .username {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #000;
              line-height: 1;
            }
            
            .join-date {
              font-size: 20px;
              color: #000;
              line-height: 1;
            }
            
            /* Stats Grid */
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 24px;
              margin-bottom: 8px;
              padding: 0 16px;
            }
            
            .stat-box {
              background: #fff;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            
            .stat-value {
              font-size: 42px;
              font-weight: bold;
              color: #000;
              margin-bottom: 4px;
              line-height: 1;
            }
            
            .stat-label {
              font-size: 18px;
              color: #000;
              line-height: 1;
            }
            
            /* Top Artists Section */
            .top-artists {
              margin-top: 8px;
              flex: 1;
              min-height: 0;
            }
            
            .top-artists-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #000;
              line-height: 1;
              text-align: center;
            }
            
            .artist-list {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              padding: 0 16px;
            }
            
            .artist-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 16px;
              background: #fff;
              border: 1px solid #000;
            }
            
            .artist-name {
              font-size: 20px;
              color: #000;
              line-height: 1;
            }
            
            .artist-plays {
              font-size: 20px;
              color: #000;
              line-height: 1;
            }
            
            /* Title Bar */
            .title_bar {
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 16px;
              background: #fff;
              border-top: 2px solid #000;
            }
            
            /* TRMNL Specific Styles */
            .screen {
              background: #fff !important;
              height: 100vh;
              overflow: hidden;
            }
            
            .view {
              background: #fff !important;
              height: 100%;
              overflow: hidden;
            }
            
            /* Debug Mode */
            .debug-info {
              display: none;
            }
          </style>
        </head>
        <body class="environment trmnl">
          <div class="screen">
            <div class="view view--full">
              <div class="layout">
                <!-- Black pixel to establish rendering context -->
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="1" height="1" style="position: absolute; top: 0; left: 0; opacity: 0; pointer-events: none; display: block;" />
                <div class="content">
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
            <div class="debug-info">
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