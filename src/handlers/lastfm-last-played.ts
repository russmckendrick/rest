/**
 * Handler for /lastfm-last-played endpoint
 * Generates an SVG showing the last played track from Last.fm
 */

import type { HandlerContext } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createSvgResponse } from '../utils/cors';
import { escapeXml } from '../utils/escape';
import { fetchImageFromLastFm } from '../utils/image';
import { LASTFM_LOGO_PATH } from '../templates/svg/lastfm-logo';

function generateLastPlayedSvg(
  trackName: string,
  artistName: string,
  albumName: string,
  albumArtDataUri: string | null,
  width: number,
  debug: boolean,
  debugInfo: string[]
): string {
  // Calculate dimensions
  const height = Math.round(width * 0.3);
  const artSize = height;
  const contentPadding = Math.round(height * 0.1);
  const fontSize = Math.max(12, Math.round(height * 0.08));
  const logoSize = Math.max(20, Math.round(height * 0.13));

  const escapedTrackName = escapeXml(trackName);
  const escapedArtistName = escapeXml(artistName);
  const escapedAlbumName = escapeXml(albumName);

  const totalHeight = debug ? height + 200 : height;

  const albumArtBackground = albumArtDataUri
    ? `<image
        href="${escapeXml(albumArtDataUri)}"
        x="0"
        y="0"
        width="${width}"
        height="${height}"
        preserveAspectRatio="xMidYMid slice"
      />`
    : '';

  const albumArtLeft = albumArtDataUri
    ? `<image
        href="${escapeXml(albumArtDataUri)}"
        x="0"
        y="0"
        width="${artSize}"
        height="${height}"
      />`
    : `<rect
        x="0"
        y="0"
        width="${artSize}"
        height="${height}"
        fill="#666666"
      />`;

  const debugSection = debug
    ? `
      <!-- Debug Information -->
      <g transform="translate(10, ${height + 20})">
        ${debugInfo.map((info, i) => `<text x="0" y="${i * 20}" class="debug">${escapeXml(info)}</text>`).join('')}
      </g>
    `
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
      <defs>
        <!-- Background gradient -->
        <linearGradient id="overlay" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#800000" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#800000" stop-opacity="0.85"/>
        </linearGradient>

        <!-- Text shadow filter -->
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="1" dy="1" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.7"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <style>
        .info { font: bold ${fontSize * 1.5}px system-ui, sans-serif; fill: #D6D5C9; filter: url(#shadow); letter-spacing: -0.5px; }
        .secondary { font: ${fontSize * 1.2}px system-ui, sans-serif; fill: #B9BAA3; filter: url(#shadow); }
        .header-text { font: bold ${fontSize * 1.8}px system-ui, sans-serif; fill: #D6D5C9; filter: url(#shadow); }
        ${debug ? `.debug { font: ${fontSize}px monospace; fill: #FF0000; }` : ''}
      </style>

      <!-- Background Image with Album Art -->
      ${albumArtBackground}

      <!-- Gradient Overlay -->
      <rect width="${width}" height="${height}" fill="url(#overlay)"/>

      <!-- Album Art (Left Side) -->
      ${albumArtLeft}

      <!-- Header Group -->
      <g transform="translate(${artSize + contentPadding * 1.5}, ${contentPadding * 1.5})">
        <!-- Last.fm Logo -->
        <path transform="translate(0, 0) scale(${logoSize / 25})"
              fill="#D6D5C9"
              d="${LASTFM_LOGO_PATH}"/>

        <!-- Header Text -->
        <text x="${logoSize * 1.5}" y="${fontSize * 0.9}" class="header-text" dominant-baseline="central">Last Played</text>
      </g>

      <!-- Content (Right Side) -->
      <g transform="translate(${artSize + contentPadding * 1.5}, ${height / 2})">
        <!-- Track Information -->
        <text class="info" y="0">${escapedTrackName}</text>
        <text class="secondary" y="${fontSize * 2.5}">by ${escapedArtistName}</text>
        <text class="secondary" y="${fontSize * 4.5}">from ${escapedAlbumName}</text>
      </g>

      ${debugSection}
    </svg>
  `.trim();
}

export async function handleLastFmLastPlayed(ctx: HandlerContext): Promise<Response> {
  const { env, params, debugInfo } = ctx;
  const { username, width, debug } = params;

  const client = new LastFmClient(env.LASTFM_API_KEY);

  if (debug) debugInfo.push('Fetching tracks...');

  const recentTracks = await client.getRecentTracks(username, 1);
  const track = recentTracks.recenttracks.track[0];

  if (!track) {
    throw new Error('No tracks found');
  }

  if (debug) debugInfo.push('Finding album art URL...');

  // Fetch album art
  const albumArtDataUri = await fetchImageFromLastFm(track.image);

  if (debug) {
    debugInfo.push(albumArtDataUri ? 'Album art fetched successfully' : 'No album art available');
  }

  const trackName = track.name;
  const artistName = track.artist['#text'];
  const albumName = track.album['#text'];

  const svg = generateLastPlayedSvg(
    trackName,
    artistName,
    albumName,
    albumArtDataUri,
    width,
    debug,
    debugInfo
  );

  // No cache for real-time data
  return createSvgResponse(svg, false);
}
