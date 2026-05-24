/**
 * Main router for russ-rest Cloudflare Worker.
 *
 * The Worker only handles API endpoints. The documentation pages (/, /docs/*)
 * are served as static assets from ./dist, built by the Astro project in
 * docs/. See wrangler.toml's [assets] block — static assets are matched
 * first, so unmatched paths fall through to this Worker.
 */

import type { Env, HandlerContext, RouteHandler, RequestParams } from './types';
import { handleOptions, createErrorResponse } from './utils/cors';
import { parseRequestParams } from './utils/validation';
import {
  handleLastFmChart,
  handleLastFmLastPlayed,
  handleLastFmWordcloud,
  handleTrmnlLastFmGrid,
  handleTrmnlLastFmLastPlayed,
  handleTrmnlLastFmStats,
  handleTrmnlLastFmHeatmap,
} from './handlers';

const apiRoutes: Record<string, RouteHandler> = {
  '/lastfm-chart': handleLastFmChart,
  '/lastfm-last-played': handleLastFmLastPlayed,
  '/lastfm-wordcloud': handleLastFmWordcloud,
  '/trmnl-lastfm-grid': handleTrmnlLastFmGrid,
  '/trmnl-lastfm-last-played': handleTrmnlLastFmLastPlayed,
  '/trmnl-lastfm-stats': handleTrmnlLastFmStats,
  '/trmnl-lastfm-heatmap': handleTrmnlLastFmHeatmap,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new URL(request.url);
    const apiHandler = apiRoutes[url.pathname];
    if (!apiHandler) {
      return createErrorResponse('Not found', 404);
    }

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
