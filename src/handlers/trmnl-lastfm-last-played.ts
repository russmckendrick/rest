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

/**
 * Pick a font size in px that lets a string fit comfortably in the
 * ~344px-wide artist column without truncation. Two-line wrap allowed.
 */
function fitFontSize(text: string): number {
  const len = text.length;
  if (len <= 12) return 56;
  if (len <= 18) return 48;
  if (len <= 26) return 38;
  if (len <= 36) return 30;
  if (len <= 50) return 24;
  return 20;
}

function generateLastPlayedContent(
  artistName: string,
  albumName: string,
  albumArtDataUri: string | null,
  isNowPlaying: boolean
): string {
  const escapedArtist = escapeHtml(artistName);
  const escapedAlbum = escapeHtml(albumName);

  const albumArt = albumArtDataUri
    ? `<img class="image image-dither" src="${escapeHtml(albumArtDataUri)}" alt="${escapedAlbum}" />`
    : `<div class="album-art__placeholder"><span>No Art</span></div>`;

  const backdrop = albumArtDataUri
    ? `<div class="last-played__backdrop" style="background-image: url('${escapeHtml(albumArtDataUri)}');"></div>`
    : '';

  const statusText = isNowPlaying ? 'Now Playing' : 'Last Played';
  const artistSize = fitFontSize(`by ${artistName}`);

  return `
    <div class="last-played">
      ${backdrop}
      <div class="last-played__content">
        <div class="album-art">
          ${albumArt}
        </div>
        <div class="album-info">
          <span class="label" data-clamp="1">${statusText}</span>
          <span class="title title--large album-info__title" data-clamp="3">${escapedAlbum}</span>
          <span class="value album-info__artist" style="font-size: ${artistSize}px;">by ${escapedArtist}</span>
        </div>
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
    .last-played {
      position: relative;
      height: 100%;
      background: var(--gray-75);
      overflow: hidden;
    }
    .last-played__backdrop {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.12;
      filter: blur(2px);
      pointer-events: none;
    }
    .last-played__content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 24px 32px;
      height: 100%;
      box-sizing: border-box;
    }
    .album-art {
      flex: 0 0 360px;
      width: 360px;
      height: 360px;
      border: 2px solid var(--black);
      background: var(--white);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .album-art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .album-art__placeholder {
      width: 100%;
      height: 100%;
      background: var(--gray-75);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: var(--gray-3);
    }
    .album-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .album-info .label {
      letter-spacing: 2px;
    }
    .album-info__title {
      line-height: 1.1;
    }
    .album-info__artist {
      color: var(--gray-2);
    }
  `;

  const content = generateLastPlayedContent(
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
