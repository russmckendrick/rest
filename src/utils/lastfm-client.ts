/**
 * Last.fm API client with proper URL encoding and HTTPS
 */

import type {
  UserInfoResponse,
  TopArtistsResponse,
  TopAlbumsResponse,
  WeeklyAlbumChartResponse,
  RecentTracksResponse,
  AlbumInfoResponse,
  LastFmPeriod,
  LastFmErrorResponse,
} from '../types';

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

export class LastFmApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public lastFmError?: LastFmErrorResponse
  ) {
    super(message);
    this.name = 'LastFmApiError';
  }
}

export class LastFmClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(method: string, params: Record<string, string>): Promise<T> {
    const url = new URL(LASTFM_API_BASE);
    url.searchParams.set('method', method);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('format', 'json');

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new LastFmApiError(
        `Last.fm API error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data: unknown = await response.json();

    // Check for Last.fm error response
    if (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as LastFmErrorResponse).error === 'number'
    ) {
      const errorData = data as LastFmErrorResponse;
      throw new LastFmApiError(errorData.message, undefined, errorData);
    }

    return data as T;
  }

  async getUserInfo(username: string): Promise<UserInfoResponse> {
    return this.request<UserInfoResponse>('user.getinfo', { user: username });
  }

  async getTopArtists(
    username: string,
    period: LastFmPeriod = '7day',
    limit = 10
  ): Promise<TopArtistsResponse> {
    return this.request<TopArtistsResponse>('user.gettopartists', {
      user: username,
      period,
      limit: limit.toString(),
    });
  }

  async getTopAlbums(
    username: string,
    period: LastFmPeriod = '7day',
    limit = 10
  ): Promise<TopAlbumsResponse> {
    return this.request<TopAlbumsResponse>('user.gettopalbums', {
      user: username,
      period,
      limit: limit.toString(),
    });
  }

  async getWeeklyAlbumChart(username: string, limit = 10): Promise<WeeklyAlbumChartResponse> {
    return this.request<WeeklyAlbumChartResponse>('user.getweeklyalbumchart', {
      user: username,
      limit: limit.toString(),
    });
  }

  async getRecentTracks(username: string, limit = 1): Promise<RecentTracksResponse> {
    return this.request<RecentTracksResponse>('user.getrecenttracks', {
      user: username,
      limit: limit.toString(),
    });
  }

  async getAlbumInfo(artist: string, album: string): Promise<AlbumInfoResponse> {
    return this.request<AlbumInfoResponse>('album.getInfo', {
      artist,
      album,
    });
  }
}
