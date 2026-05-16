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

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1))}...`;
}

function formatTrackStatus(isNowPlaying: boolean, unixTimestamp?: string): string {
  if (isNowPlaying) {
    return 'Now playing';
  }

  if (!unixTimestamp) {
    return 'Last played';
  }

  const timestamp = parseInt(unixTimestamp, 10);
  if (isNaN(timestamp)) {
    return 'Last played';
  }

  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (elapsedSeconds < 60) {
    return 'Just played';
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

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

function generateModernLastPlayedSvg(
  trackName: string,
  artistName: string,
  albumName: string,
  albumArtDataUri: string | null,
  username: string,
  width: number,
  statusLabel: string,
  debug: boolean,
  debugInfo: string[]
): string {
  const baseWidth = 900;
  const baseHeight = 280;
  const debugHeight = debug ? 160 : 0;
  const viewHeight = baseHeight + debugHeight;
  const height = Math.round((width / baseWidth) * viewHeight);
  const safeTrack = escapeXml(truncateText(trackName, 30));
  const safeArtist = escapeXml(truncateText(artistName, 34));
  const safeAlbum = escapeXml(truncateText(albumName || 'Unknown album', 38));
  const safeUsername = escapeXml(username.toUpperCase());
  const safeStatus = escapeXml(statusLabel);
  const safeArt = albumArtDataUri ? escapeXml(albumArtDataUri) : null;

  const backgroundArt = safeArt
    ? `<image href="${safeArt}" x="0" y="0" width="${baseWidth}" height="${baseHeight}" preserveAspectRatio="xMidYMid slice" opacity="0.74" filter="url(#modernBlur)"/>`
    : '';

  const cover = safeArt
    ? `<image href="${safeArt}" x="34" y="34" width="212" height="212" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>`
    : `<rect x="34" y="34" width="212" height="212" rx="18" fill="#1d2a31"/>
       <circle cx="140" cy="140" r="58" fill="#111318" opacity="0.78"/>
       <path transform="translate(124, 124) scale(1)" fill="#d83a34" d="${LASTFM_LOGO_PATH}"/>`;

  const debugSection = debug
    ? `
      <g transform="translate(34, ${baseHeight + 28})">
        ${debugInfo
          .map((info, i) => `<text x="0" y="${i * 20}" class="debug">${escapeXml(info)}</text>`)
          .join('')}
      </g>
    `
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${baseWidth} ${viewHeight}">
      <defs>
        <linearGradient id="modernNowBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#151413"/>
          <stop offset="48%" stop-color="#211715"/>
          <stop offset="100%" stop-color="#4a1715"/>
        </linearGradient>
        <linearGradient id="modernScrim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#070707" stop-opacity="0.76"/>
          <stop offset="46%" stop-color="#12100f" stop-opacity="0.80"/>
          <stop offset="100%" stop-color="#4a1715" stop-opacity="0.58"/>
        </linearGradient>
        <clipPath id="coverClip">
          <rect x="34" y="34" width="212" height="212" rx="18"/>
        </clipPath>
        <filter id="modernBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18"/>
        </filter>
        <filter id="coverShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000000" flood-opacity="0.36"/>
        </filter>
      </defs>
      <style>
        .status { font: 760 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f1e8dc; }
        .track { font: 800 46px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f1e8dc; }
        .artist { font: 700 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f1e8dc; }
        .album { font: 500 19px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #a8aaa3; }
        .footer { font: 600 12px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #a8aaa3; letter-spacing: 1.5px; }
        .debug { font: 14px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #f05c45; }
      </style>

      <rect width="${baseWidth}" height="${viewHeight}" rx="28" fill="url(#modernNowBg)"/>
      ${backgroundArt}
      <rect width="${baseWidth}" height="${baseHeight}" rx="28" fill="url(#modernScrim)"/>

      <g filter="url(#coverShadow)">
        ${cover}
      </g>

      <g transform="translate(288 40)">
        <rect x="0" y="0" width="${Math.max(116, safeStatus.length * 8 + 44)}" height="30" rx="15" fill="#d83a34" opacity="0.22"/>
        <circle cx="19" cy="15" r="4.5" fill="#f05c45"/>
        <text x="34" y="20" class="status">${safeStatus}</text>

        <text x="0" y="88" class="track">${safeTrack}</text>
        <text x="0" y="128" class="artist">${safeArtist}</text>
        <text x="0" y="162" class="album">${safeAlbum}</text>

        <line x1="0" y1="194" x2="548" y2="194" stroke="#f1e8dc" stroke-opacity="0.14"/>
        <path transform="translate(0, 208) scale(0.62)" fill="#a8aaa3" d="${LASTFM_LOGO_PATH}"/>
        <text x="34" y="218" class="footer" dominant-baseline="middle">LAST.FM</text>
        <text x="548" y="218" text-anchor="end" class="footer" dominant-baseline="middle">${safeUsername}</text>
      </g>

      ${debugSection}
    </svg>
  `.trim();
}

export async function handleLastFmLastPlayed(ctx: HandlerContext): Promise<Response> {
  const { env, params, debugInfo } = ctx;
  const { username, width, debug, style } = params;

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
  const isNowPlaying = track['@attr']?.nowplaying === 'true';
  const statusLabel = formatTrackStatus(isNowPlaying, track.date?.uts);

  const svg =
    style === 'modern'
      ? generateModernLastPlayedSvg(
          trackName,
          artistName,
          albumName,
          albumArtDataUri,
          username,
          width,
          statusLabel,
          debug,
          debugInfo
        )
      : generateLastPlayedSvg(
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
