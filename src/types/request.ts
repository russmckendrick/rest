/**
 * Request and handler types
 */

export interface Env {
  LASTFM_API_KEY: string;
  DEFAULT_USERNAME?: string;
}

export interface RequestParams {
  username: string;
  width: number;
  debug: boolean;
  showAlbums: boolean;
  showArtists: boolean;
}

export interface HandlerContext {
  request: Request;
  env: Env;
  params: RequestParams;
  debugInfo: string[];
}

export type RouteHandler = (ctx: HandlerContext) => Promise<Response>;

export interface ValidationResult<T> {
  success: boolean;
  value?: T;
  error?: string;
}
