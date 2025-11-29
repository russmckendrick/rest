/**
 * Handler for /trmnl-lastfm-last-played endpoint
 * Generates a last played track display for TRMNL e-ink displays
 */

import type { HandlerContext } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createHtmlResponse } from '../utils/cors';
import { escapeHtml } from '../utils/escape';
import { fetchImageFromLastFm } from '../utils/image';
import { renderTrmnlPage } from '../templates/html/trmnl-base';

function generateLastPlayedContent(
  trackName: string,
  artistName: string,
  albumName: string,
  albumArtDataUri: string | null,
  isNowPlaying: boolean
): string {
  const escapedTrack = escapeHtml(trackName);
  const escapedArtist = escapeHtml(artistName);
  const escapedAlbum = escapeHtml(albumName);

  const albumArt = albumArtDataUri
    ? `<img class="image-dither" src="${escapeHtml(albumArtDataUri)}" alt="Album Art" style="width: 300px; height: 300px; object-fit: cover; border: 2px solid #000;" />`
    : `<div style="width: 300px; height: 300px; background: #ccc; border: 2px solid #000; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 24px; color: #666;">No Art</span>
      </div>`;

  const statusText = isNowPlaying ? 'Now Playing' : 'Last Played';

  return `
    <div class="last-played-container">
      <div class="album-art">
        ${albumArt}
      </div>
      <div class="track-info">
        <div class="status" data-clamp="1">${statusText}</div>
        <div class="track-name" data-clamp="2">${escapedTrack}</div>
        <div class="artist-name" data-clamp="1">by ${escapedArtist}</div>
        <div class="album-name" data-clamp="1">from ${escapedAlbum}</div>
      </div>
    </div>
  `;
}

export async function handleTrmnlLastFmLastPlayed(ctx: HandlerContext): Promise<Response> {
  const { env, params, debugInfo } = ctx;
  const { username, debug } = params;

  const client = new LastFmClient(env.LASTFM_API_KEY);

  if (debug) debugInfo.push('Fetching recent tracks...');

  const recentTracks = await client.getRecentTracks(username, 1);
  const track = recentTracks.recenttracks.track[0];

  if (!track) {
    throw new Error('No recent tracks found');
  }

  const isNowPlaying = track['@attr']?.nowplaying === 'true';

  if (debug) {
    debugInfo.push(`Track: ${track.name}`);
    debugInfo.push(`Now playing: ${isNowPlaying}`);
  }

  // Fetch album art
  const albumArtDataUri = await fetchImageFromLastFm(track.image);

  if (debug) {
    debugInfo.push(albumArtDataUri ? 'Album art fetched successfully' : 'No album art available');
  }

  const additionalStyles = `
    .last-played-container {
      display: flex;
      align-items: center;
      padding: 20px;
      height: calc(100% - 100px);
      gap: 30px;
    }
    .album-art {
      flex-shrink: 0;
    }
    .track-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .status {
      font-size: 20px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .track-name {
      font-size: 42px;
      font-weight: bold;
      color: #000;
      line-height: 1.1;
    }
    .artist-name {
      font-size: 32px;
      color: #333;
    }
    .album-name {
      font-size: 28px;
      color: #666;
    }
  `;

  const content = generateLastPlayedContent(
    track.name,
    track.artist['#text'],
    track.album['#text'],
    albumArtDataUri,
    isNowPlaying
  );

  const html = renderTrmnlPage({
    title: isNowPlaying ? 'Now Playing' : 'Last Played',
    instance: `${escapeHtml(username)}'s Last.fm`,
    content,
    additionalStyles,
    debug,
    debugInfo,
  });

  // No cache for real-time data
  return createHtmlResponse(html, false);
}
