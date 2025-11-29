/**
 * Last.fm API response types
 */

export interface LastFmImage {
  '#text': string;
  size: 'small' | 'medium' | 'large' | 'extralarge' | '';
}

export interface LastFmArtist {
  name: string;
  playcount: string;
  url: string;
  image?: LastFmImage[];
  mbid?: string;
}

export interface LastFmAlbum {
  name: string;
  playcount: string;
  artist:
    | {
        name: string;
        '#text'?: string;
      }
    | string;
  image: LastFmImage[];
  url: string;
  mbid?: string;
}

export interface LastFmTrack {
  name: string;
  artist: {
    '#text': string;
    mbid?: string;
  };
  album: {
    '#text': string;
    mbid?: string;
  };
  image: LastFmImage[];
  url: string;
  '@attr'?: {
    nowplaying?: string;
  };
  date?: {
    uts: string;
    '#text': string;
  };
}

export interface LastFmUser {
  name: string;
  realname: string;
  url: string;
  image: LastFmImage[];
  playcount: string;
  playlists: string;
  track_count: string;
  artist_count: string;
  registered: {
    unixtime: string;
    '#text': number;
  };
  country: string;
}

// API Response wrappers
export interface UserInfoResponse {
  user: LastFmUser;
}

export interface TopArtistsResponse {
  topartists: {
    artist: LastFmArtist[];
    '@attr': {
      user: string;
      totalPages: string;
      page: string;
      perPage: string;
      total: string;
    };
  };
}

export interface TopAlbumsResponse {
  topalbums: {
    album: LastFmAlbum[];
    '@attr': {
      user: string;
      totalPages: string;
      page: string;
      perPage: string;
      total: string;
    };
  };
}

export interface WeeklyAlbumChartResponse {
  weeklyalbumchart: {
    album: LastFmAlbum[];
    '@attr': {
      user: string;
      from: string;
      to: string;
    };
  };
}

export interface RecentTracksResponse {
  recenttracks: {
    track: LastFmTrack[];
    '@attr': {
      user: string;
      totalPages: string;
      page: string;
      perPage: string;
      total: string;
    };
  };
}

export interface AlbumInfoResponse {
  album: {
    name: string;
    artist: string;
    image: LastFmImage[];
    url: string;
    listeners: string;
    playcount: string;
  };
}

export interface LastFmErrorResponse {
  error: number;
  message: string;
}

export type LastFmPeriod = 'overall' | '7day' | '1month' | '3month' | '6month' | '12month';
