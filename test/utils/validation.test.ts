/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateUsername,
  validateWidth,
  parseRequestParams,
  DEFAULT_USERNAME,
  DEFAULT_WIDTH,
  MIN_WIDTH,
  MAX_WIDTH,
} from '../../src/utils/validation';

describe('validateUsername', () => {
  it('returns default for null input', () => {
    const result = validateUsername(null);
    expect(result.success).toBe(true);
    expect(result.value).toBe(DEFAULT_USERNAME);
  });

  it('returns default for empty string', () => {
    const result = validateUsername('');
    expect(result.success).toBe(true);
    expect(result.value).toBe(DEFAULT_USERNAME);
  });

  it('accepts valid usernames', () => {
    expect(validateUsername('testuser').success).toBe(true);
    expect(validateUsername('testuser').value).toBe('testuser');

    expect(validateUsername('Test_User-123').success).toBe(true);
    expect(validateUsername('ab').success).toBe(true);
    expect(validateUsername('a123456789012345').success).toBe(false); // 16 chars
  });

  it('trims whitespace from usernames', () => {
    const result = validateUsername('  testuser  ');
    expect(result.success).toBe(true);
    expect(result.value).toBe('testuser');
  });

  it('rejects too short usernames', () => {
    const result = validateUsername('a');
    expect(result.success).toBe(false);
    expect(result.error).toContain('between 2 and 15');
  });

  it('rejects too long usernames', () => {
    const result = validateUsername('a234567890123456'); // 16 chars
    expect(result.success).toBe(false);
    expect(result.error).toContain('between 2 and 15');
  });

  it('rejects usernames with invalid characters', () => {
    expect(validateUsername('user@name').success).toBe(false);
    expect(validateUsername('user name').success).toBe(false);
    expect(validateUsername('user.name').success).toBe(false);
    expect(validateUsername('123user').success).toBe(false); // must start with letter
  });

  it('uses custom default when provided', () => {
    const result = validateUsername(null, 'customdefault');
    expect(result.success).toBe(true);
    expect(result.value).toBe('customdefault');
  });
});

describe('validateWidth', () => {
  it('returns default for null input', () => {
    const result = validateWidth(null);
    expect(result.success).toBe(true);
    expect(result.value).toBe(DEFAULT_WIDTH);
  });

  it('returns default for empty string', () => {
    const result = validateWidth('');
    expect(result.success).toBe(true);
    expect(result.value).toBe(DEFAULT_WIDTH);
  });

  it('accepts valid widths', () => {
    expect(validateWidth('800').value).toBe(800);
    expect(validateWidth(`${MIN_WIDTH}`).value).toBe(MIN_WIDTH);
    expect(validateWidth(`${MAX_WIDTH}`).value).toBe(MAX_WIDTH);
  });

  it('rejects widths below minimum', () => {
    const result = validateWidth(`${MIN_WIDTH - 1}`);
    expect(result.success).toBe(false);
    expect(result.error).toContain(`between ${MIN_WIDTH} and ${MAX_WIDTH}`);
  });

  it('rejects widths above maximum', () => {
    const result = validateWidth(`${MAX_WIDTH + 1}`);
    expect(result.success).toBe(false);
    expect(result.error).toContain(`between ${MIN_WIDTH} and ${MAX_WIDTH}`);
  });

  it('rejects non-numeric input', () => {
    const result = validateWidth('abc');
    expect(result.success).toBe(false);
    expect(result.error).toContain('must be a number');
  });

  it('rejects floating point numbers (parses as int)', () => {
    const result = validateWidth('500.5');
    expect(result.success).toBe(true);
    expect(result.value).toBe(500); // parseInt truncates
  });

  it('uses custom default when provided', () => {
    const result = validateWidth(null, 600);
    expect(result.success).toBe(true);
    expect(result.value).toBe(600);
  });
});

describe('parseRequestParams', () => {
  it('parses valid URL parameters', () => {
    const url = new URL('https://example.com/test?username=testuser&width=800');
    const env = { LASTFM_API_KEY: 'test' };

    const result = parseRequestParams(url, env);

    expect(result.success).toBe(true);
    expect(result.value).toEqual({
      username: 'testuser',
      width: 800,
      debug: false,
      showAlbums: false,
      showArtists: true,
    });
  });

  it('uses defaults when parameters are missing', () => {
    const url = new URL('https://example.com/test');
    const env = { LASTFM_API_KEY: 'test' };

    const result = parseRequestParams(url, env);

    expect(result.success).toBe(true);
    expect(result.value?.username).toBe(DEFAULT_USERNAME);
    expect(result.value?.width).toBe(DEFAULT_WIDTH);
  });

  it('uses env DEFAULT_USERNAME when available', () => {
    const url = new URL('https://example.com/test');
    const env = { LASTFM_API_KEY: 'test', DEFAULT_USERNAME: 'envuser' };

    const result = parseRequestParams(url, env);

    expect(result.success).toBe(true);
    expect(result.value?.username).toBe('envuser');
  });

  it('detects debug flag', () => {
    const url = new URL('https://example.com/test?debug');
    const env = { LASTFM_API_KEY: 'test' };

    const result = parseRequestParams(url, env);

    expect(result.success).toBe(true);
    expect(result.value?.debug).toBe(true);
  });

  it('handles albums and artists flags correctly', () => {
    // Only albums
    let url = new URL('https://example.com/test?albums');
    const env = { LASTFM_API_KEY: 'test' };
    let result = parseRequestParams(url, env);
    expect(result.value?.showAlbums).toBe(true);
    expect(result.value?.showArtists).toBe(false);

    // Only artists
    url = new URL('https://example.com/test?artists');
    result = parseRequestParams(url, env);
    expect(result.value?.showAlbums).toBe(false);
    expect(result.value?.showArtists).toBe(true);

    // Both (artists takes precedence)
    url = new URL('https://example.com/test?albums&artists');
    result = parseRequestParams(url, env);
    expect(result.value?.showAlbums).toBe(true);
    expect(result.value?.showArtists).toBe(true);

    // Neither (default to artists)
    url = new URL('https://example.com/test');
    result = parseRequestParams(url, env);
    expect(result.value?.showAlbums).toBe(false);
    expect(result.value?.showArtists).toBe(true);
  });

  it('returns error for invalid username', () => {
    const url = new URL('https://example.com/test?username=a');
    const env = { LASTFM_API_KEY: 'test' };

    const result = parseRequestParams(url, env);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error for invalid width', () => {
    const url = new URL('https://example.com/test?width=abc');
    const env = { LASTFM_API_KEY: 'test' };

    const result = parseRequestParams(url, env);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
