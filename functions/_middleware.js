// functions/_middleware.js
export async function onRequest(context) {
    const url = new URL(context.request.url);
    
    // List of valid function paths
    const validPaths = ['/lastfm-chart', '/lastfm-last-played', '/ticker', '/lastfm-grid'];
    
    // Check if the requested path is valid
    if (!validPaths.some(path => url.pathname.startsWith(path))) {
      return Response.redirect('https://github.com/russmckendrick/rest', 301);
    }
    
    // Continue to the next middleware or function handler
    return await context.next();
  }