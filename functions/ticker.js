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
    
    // Get last 100 tracks for a longer scroll
    const recentTracksResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&limit=100&api_key=${context.env.LASTFM_API_KEY}&format=json`
    );

    if (!recentTracksResponse.ok) {
      throw new Error('Failed to fetch Last.fm recent tracks');
    }

    const recentTracks = await recentTracksResponse.json();
    
    // Transform the data into a simpler format
    const tracks = recentTracks.recenttracks.track.map(track => ({
      name: track.name,
      artist: track.artist['#text'],
      nowPlaying: !!track['@attr']?.nowplaying,
      timestamp: track.date?.uts || Date.now() / 1000
    }));

    return new Response(JSON.stringify({ tracks }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}