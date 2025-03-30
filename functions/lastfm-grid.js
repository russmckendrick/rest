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
    
    // Fetch recent tracks from Last.fm
    const lastfmResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&limit=10&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!lastfmResponse.ok) {
      throw new Error('Failed to fetch Last.fm data');
    }

    const data = await lastfmResponse.json();
    const tracks = data.recenttracks.track;

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
            }
            .album-image {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body class="environment trmnl">
          <div class="screen">
            <div class="view view--full">
              <div class="layout">
                <div class="album-grid">
                  ${tracks.map((track) => {
                    const imageUrl = track.image.find(img => img.size === 'large')?.['#text'] || '';
                    return imageUrl ? `
                      <div class="album-cell">
                        <img class="album-image" src="${imageUrl}" alt="" />
                      </div>
                    ` : '';
                  }).join('')}
                </div>
              </div>
              
              <div class="title_bar">
                <img class="image" src="https://usetrmnl.com/images/plugins/trmnl--render.svg" />
                <span class="title">Recent Albums</span>
                <span class="instance">${username}'s Last.fm</span>
              </div>
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