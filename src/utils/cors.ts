/**
 * CORS headers and response helpers
 */

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

export function handleOptions(): Response {
  return new Response(null, { headers: CORS_HEADERS });
}

export interface ResponseOptions {
  status?: number;
  contentType?: string;
  cacheControl?: string;
  additionalHeaders?: Record<string, string>;
}

export function createResponse(body: string | null, options: ResponseOptions = {}): Response {
  const {
    status = 200,
    contentType = 'text/plain',
    cacheControl,
    additionalHeaders = {},
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    ...CORS_HEADERS,
    ...additionalHeaders,
  };

  if (cacheControl) {
    headers['Cache-Control'] = cacheControl;
  }

  return new Response(body, { status, headers });
}

export function createSvgResponse(svg: string, cache = true): Response {
  return createResponse(svg, {
    contentType: 'image/svg+xml',
    cacheControl: cache ? 'public, max-age=1800' : 'no-store',
  });
}

export function createHtmlResponse(html: string, cache = true): Response {
  return createResponse(html, {
    contentType: 'text/html',
    cacheControl: cache ? 'public, max-age=1800' : 'no-store',
  });
}

export function createErrorResponse(message: string, status = 500): Response {
  return createResponse(`Error: ${message}`, { status });
}
