/**
 * Tests for CORS utilities
 */

import { describe, it, expect } from 'vitest';
import {
  CORS_HEADERS,
  handleOptions,
  createResponse,
  createSvgResponse,
  createHtmlResponse,
  createErrorResponse,
} from '../../src/utils/cors';

describe('CORS_HEADERS', () => {
  it('includes required CORS headers', () => {
    expect(CORS_HEADERS['Access-Control-Allow-Origin']).toBe('*');
    expect(CORS_HEADERS['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');
    expect(CORS_HEADERS['Access-Control-Allow-Headers']).toBe('Content-Type');
  });
});

describe('handleOptions', () => {
  it('returns response with CORS headers', () => {
    const response = handleOptions();

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
  });

  it('returns null body', async () => {
    const response = handleOptions();
    const body = await response.text();

    expect(body).toBe('');
  });
});

describe('createResponse', () => {
  it('creates response with default options', async () => {
    const response = createResponse('Hello');

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    expect(await response.text()).toBe('Hello');
  });

  it('includes CORS headers', () => {
    const response = createResponse('Hello');

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('uses custom status code', () => {
    const response = createResponse('Error', { status: 500 });

    expect(response.status).toBe(500);
  });

  it('uses custom content type', () => {
    const response = createResponse('{}', { contentType: 'application/json' });

    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('sets cache control when provided', () => {
    const response = createResponse('Hello', { cacheControl: 'public, max-age=3600' });

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('omits cache control when not provided', () => {
    const response = createResponse('Hello');

    expect(response.headers.get('Cache-Control')).toBeNull();
  });

  it('includes additional headers', () => {
    const response = createResponse('Hello', {
      additionalHeaders: { 'X-Custom-Header': 'value' },
    });

    expect(response.headers.get('X-Custom-Header')).toBe('value');
  });

  it('handles null body', async () => {
    const response = createResponse(null);

    expect(await response.text()).toBe('');
  });
});

describe('createSvgResponse', () => {
  it('sets SVG content type', () => {
    const response = createSvgResponse('<svg></svg>');

    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('sets cache control for cached responses', () => {
    const response = createSvgResponse('<svg></svg>', true);

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=1800');
  });

  it('sets no-store for uncached responses', () => {
    const response = createSvgResponse('<svg></svg>', false);

    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('defaults to cached', () => {
    const response = createSvgResponse('<svg></svg>');

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=1800');
  });
});

describe('createHtmlResponse', () => {
  it('sets HTML content type', () => {
    const response = createHtmlResponse('<html></html>');

    expect(response.headers.get('Content-Type')).toBe('text/html');
  });

  it('sets cache control for cached responses', () => {
    const response = createHtmlResponse('<html></html>', true);

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=1800');
  });

  it('sets no-store for uncached responses', () => {
    const response = createHtmlResponse('<html></html>', false);

    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('createErrorResponse', () => {
  it('creates error response with default status', async () => {
    const response = createErrorResponse('Something went wrong');

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Error: Something went wrong');
  });

  it('uses custom status code', () => {
    const response = createErrorResponse('Not found', 404);

    expect(response.status).toBe(404);
  });

  it('includes CORS headers', () => {
    const response = createErrorResponse('Error');

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
