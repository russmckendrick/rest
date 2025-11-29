/**
 * Tests for Last.fm client
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LastFmClient, LastFmApiError } from '../../src/utils/lastfm-client';
import { mockFetch } from '../setup';

describe('LastFmClient', () => {
  let client: LastFmClient;

  beforeEach(() => {
    client = new LastFmClient('test-api-key');
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    it('stores API key', () => {
      expect(client).toBeDefined();
    });
  });

  describe('getUserInfo', () => {
    it('constructs correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { name: 'testuser' } }),
      } as Response);

      await client.getUserInfo('testuser');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('method=user.getinfo'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('user=testuser'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('api_key=test-api-key'));
    });

    it('uses HTTPS for API calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { name: 'test' } }),
      } as Response);

      await client.getUserInfo('testuser');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://ws.audioscrobbler.com')
      );
    });

    it('URL encodes username with special characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { name: 'test user' } }),
      } as Response);

      await client.getUserInfo('test user');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('user=test+user'));
    });

    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(client.getUserInfo('testuser')).rejects.toThrow(LastFmApiError);
    });

    it('throws on Last.fm error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 6, message: 'User not found' }),
      } as Response);

      await expect(client.getUserInfo('testuser')).rejects.toThrow(LastFmApiError);
    });
  });

  describe('getTopArtists', () => {
    it('includes period and limit parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ topartists: { artist: [] } }),
      } as Response);

      await client.getTopArtists('testuser', '7day', 5);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('method=user.gettopartists'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('period=7day'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=5'));
    });

    it('uses default period and limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ topartists: { artist: [] } }),
      } as Response);

      await client.getTopArtists('testuser');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('period=7day'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });
  });

  describe('getTopAlbums', () => {
    it('constructs correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ topalbums: { album: [] } }),
      } as Response);

      await client.getTopAlbums('testuser', '1month', 20);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('method=user.gettopalbums'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('period=1month'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'));
    });
  });

  describe('getWeeklyAlbumChart', () => {
    it('constructs correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ weeklyalbumchart: { album: [] } }),
      } as Response);

      await client.getWeeklyAlbumChart('testuser', 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('method=user.getweeklyalbumchart')
      );
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });
  });

  describe('getRecentTracks', () => {
    it('constructs correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ recenttracks: { track: [] } }),
      } as Response);

      await client.getRecentTracks('testuser', 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('method=user.getrecenttracks')
      );
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=5'));
    });
  });

  describe('getAlbumInfo', () => {
    it('URL encodes artist and album names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ album: { name: 'Test Album' } }),
      } as Response);

      await client.getAlbumInfo('Artist & Friends', 'Album / Title');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('artist=Artist+%26+Friends'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('album=Album+%2F+Title'));
    });
  });
});

describe('LastFmApiError', () => {
  it('includes status code', () => {
    const error = new LastFmApiError('Test error', 404);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('LastFmApiError');
  });

  it('includes Last.fm error response', () => {
    const lastFmError = { error: 6, message: 'User not found' };
    const error = new LastFmApiError('User not found', undefined, lastFmError);

    expect(error.lastFmError).toEqual(lastFmError);
  });
});
