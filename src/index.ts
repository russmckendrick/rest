/**
 * Main router for russ-rest Cloudflare Worker
 */

import type { Env, HandlerContext, RouteHandler, RequestParams } from './types';
import { handleOptions, createErrorResponse } from './utils/cors';
import { parseRequestParams } from './utils/validation';
import {
  handleLastFmChart,
  handleLastFmLastPlayed,
  handleTrmnlLastFmGrid,
  handleTrmnlLastFmLastPlayed,
  handleTrmnlLastFmStats,
} from './handlers';
import {
  renderHomePage,
  renderLastfmChartDocs,
  renderLastfmLastPlayedDocs,
  renderTrmnlGridDocs,
  renderTrmnlLastPlayedDocs,
  renderTrmnlStatsDocs,
  render404Page,
} from './templates/docs';

// API routes that require Last.fm API
const apiRoutes: Record<string, RouteHandler> = {
  '/lastfm-chart': handleLastFmChart,
  '/lastfm-last-played': handleLastFmLastPlayed,
  '/trmnl-lastfm-grid': handleTrmnlLastFmGrid,
  '/trmnl-lastfm-last-played': handleTrmnlLastFmLastPlayed,
  '/trmnl-lastfm-stats': handleTrmnlLastFmStats,
};

// Documentation routes (static HTML)
const docRoutes: Record<string, () => string> = {
  '/': renderHomePage,
  '/docs/lastfm-chart': renderLastfmChartDocs,
  '/docs/lastfm-last-played': renderLastfmLastPlayedDocs,
  '/docs/trmnl-lastfm-grid': renderTrmnlGridDocs,
  '/docs/trmnl-lastfm-last-played': renderTrmnlLastPlayedDocs,
  '/docs/trmnl-lastfm-stats': renderTrmnlStatsDocs,
};

function createHtmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check for documentation routes first
    const docHandler = docRoutes[pathname];
    if (docHandler) {
      return createHtmlResponse(docHandler());
    }

    // Check for API routes
    const apiHandler = apiRoutes[pathname];
    if (!apiHandler) {
      // Return 404 page for unknown paths
      return createHtmlResponse(render404Page(), 404);
    }

    // Parse and validate request parameters
    const paramsResult = parseRequestParams(url, env);
    if (!paramsResult.success) {
      return createErrorResponse(paramsResult.error ?? 'Invalid parameters', 400);
    }

    const context: HandlerContext = {
      request,
      env,
      params: paramsResult.value as RequestParams,
      debugInfo: [],
    };

    try {
      return await apiHandler(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Handler error:', message);
      return createErrorResponse(message);
    }
  },
};
