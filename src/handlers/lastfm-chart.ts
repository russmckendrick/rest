/**
 * Handler for /lastfm-chart endpoint
 * Generates an SVG chart of top artists or albums from Last.fm
 */

import type { HandlerContext, LastFmAlbum, LastFmArtist } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createSvgResponse } from '../utils/cors';
import { escapeXml } from '../utils/escape';
import { fetchImageFromLastFm, fetchImagesInParallel } from '../utils/image';
import { LASTFM_LOGO_PATH } from '../templates/svg/lastfm-logo';

interface ChartItem {
  name: string;
  artistName?: string;
  playcount: number;
  imageDataUri?: string | null;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1))}...`;
}

function formatPlayCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return value.toString();
}

function extractItems(items: LastFmAlbum[] | LastFmArtist[], showAlbums: boolean): ChartItem[] {
  return items.map((item) => {
    if (showAlbums) {
      const album = item as LastFmAlbum;
      const artistName =
        typeof album.artist === 'string' ? album.artist : (album.artist?.name ?? '');
      return {
        name: album.name,
        artistName,
        playcount: parseInt(album.playcount, 10),
      };
    } else {
      const artist = item as LastFmArtist;
      return {
        name: artist.name,
        playcount: parseInt(artist.playcount, 10),
      };
    }
  });
}

function getAlbumArtistName(album: LastFmAlbum): string {
  return typeof album.artist === 'string' ? album.artist : (album.artist?.name ?? '');
}

function normalizeArtistName(value: string): string {
  return value.trim().toLowerCase();
}

async function fetchArtistImage(
  client: LastFmClient,
  artist: LastFmArtist,
  username: string
): Promise<string | null> {
  const directImage = await fetchImageFromLastFm(artist.image);
  if (directImage) {
    return directImage;
  }

  try {
    const artistInfo = await client.getArtistInfo(artist.name, username);
    return fetchImageFromLastFm(artistInfo.artist.image);
  } catch {
    return null;
  }
}

async function fetchArtistImagesInParallel(
  client: LastFmClient,
  artists: LastFmArtist[],
  username: string
): Promise<(string | null)[]> {
  return Promise.all(artists.map((artist) => fetchArtistImage(client, artist, username)));
}

async function fetchArtistAlbumFallbackImages(
  client: LastFmClient,
  username: string,
  artists: LastFmArtist[],
  existingImages: (string | null)[]
): Promise<(string | null)[]> {
  if (existingImages.every(Boolean)) {
    return existingImages;
  }

  try {
    const topAlbums = await client.getTopAlbums(username, '7day', 50);
    const albumsByArtist = new Map<string, LastFmAlbum>();

    for (const album of topAlbums.topalbums.album) {
      const artistName = normalizeArtistName(getAlbumArtistName(album));
      if (artistName && !albumsByArtist.has(artistName)) {
        albumsByArtist.set(artistName, album);
      }
    }

    const fallbackImages = await fetchImagesInParallel(
      artists.map((artist, index) => {
        if (existingImages[index]) {
          return undefined;
        }

        return albumsByArtist.get(normalizeArtistName(artist.name))?.image;
      })
    );

    return existingImages.map((image, index) => image ?? fallbackImages[index] ?? null);
  } catch {
    return existingImages;
  }
}

function generateChartSvg(
  items: ChartItem[],
  showAlbums: boolean,
  width: number,
  avatarDataUri: string | null
): string {
  // Calculate proportional sizes
  const fontSize = Math.max(12, Math.round(width / 60));
  const titleSize = Math.max(16, Math.round(width / 35));
  const rowHeight = Math.max(18, Math.round(width / 40));
  const headerHeight = Math.round(width / 12);
  const logoSize = Math.round(titleSize * 0.8);
  const startY = headerHeight;
  const avatarSize = Math.round(headerHeight * 0.7);
  const avatarPadding = Math.round(headerHeight * 0.15);
  const totalHeight = startY + items.length * rowHeight;

  const rows = items
    .map((item, i) => {
      const position = i / Math.max(items.length - 1, 1);
      const startColor = { r: 128, g: 0, b: 0 };
      const endColor = { r: 186, g: 0, b: 0 };
      const currentColor = {
        r: Math.round(startColor.r + (endColor.r - startColor.r) * position),
        g: 0,
        b: 0,
      };
      const color = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

      const name = escapeXml(item.name);

      if (showAlbums && item.artistName) {
        const artistName = escapeXml(item.artistName);
        const textWidth = name.length * (fontSize * 0.6);
        const artistWidth = (artistName.length + 3) * (fontSize * 0.6);
        const separatorStartX = textWidth + 35;
        const separatorEndX = width - artistWidth - 35;

        return `
          <g transform="translate(0, ${startY + i * rowHeight})">
            <rect class="row-bg" x="0" y="0" width="${width}" height="${rowHeight}" fill="${color}"/>
            <text x="25" y="${rowHeight / 2 + fontSize / 3}" class="item-name">${name}</text>
            <line x1="${separatorStartX}" y1="${rowHeight / 2}" x2="${separatorEndX}" y2="${rowHeight / 2}" class="separator" />
            <text x="${width - 25}" y="${rowHeight / 2 + fontSize / 3}" class="artist-name" text-anchor="end">by ${artistName}</text>
          </g>
        `;
      } else {
        return `
          <g transform="translate(0, ${startY + i * rowHeight})">
            <rect class="row-bg" x="0" y="0" width="${width}" height="${rowHeight}" fill="${color}"/>
            <text x="25" y="${rowHeight / 2 + fontSize / 3}" class="item-name">${name}</text>
            <text x="${width - 25}" y="${rowHeight / 2 + fontSize / 3}" class="plays" text-anchor="end">${item.playcount} plays</text>
          </g>
        `;
      }
    })
    .join('');

  const avatarImage = avatarDataUri
    ? `<image
        href="${escapeXml(avatarDataUri)}"
        x="${avatarPadding}"
        y="${headerHeight / 2 - avatarSize / 2}"
        width="${avatarSize}"
        height="${avatarSize}"
        clip-path="url(#avatarClip)"
      />`
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
      <defs>
        <clipPath id="avatarClip">
          <circle cx="${avatarSize / 2 + avatarPadding}" cy="${headerHeight / 2}" r="${avatarSize / 2}"/>
        </clipPath>
      </defs>
      <style>
        .title { font: bold ${titleSize}px system-ui, sans-serif; fill: #D6D5C9; }
        .item-name { font: ${fontSize}px system-ui, sans-serif; fill: #D6D5C9; }
        .artist-name { font: ${fontSize}px system-ui, sans-serif; fill: #B9BAA3; }
        .plays { font: ${fontSize}px system-ui, sans-serif; fill: #B9BAA3; }
        .separator { stroke: #666666; stroke-width: 0.5; stroke-dasharray: 2 2; }
        .row-bg { transition: opacity 0.3s; }
        .row-bg:hover { opacity: 0.8; }
      </style>

      <!-- Header Background -->
      <rect width="${width}" height="${headerHeight}" fill="#800000"/>

      <!-- User Avatar -->
      ${avatarImage}

      <!-- Header Group -->
      <g transform="translate(${avatarSize + avatarPadding * 2}, ${headerHeight / 2 + titleSize / 3})">
        <!-- Last.fm Logo -->
        <path transform="translate(0, -${titleSize / 1.2}) scale(${logoSize / 25})"
              fill="#D6D5C9"
              d="${LASTFM_LOGO_PATH}"/>

        <!-- Title Text -->
        <text x="${logoSize * 1.5}" class="title">Top ${showAlbums ? 'Albums' : 'Artists'} Last Week</text>
      </g>

      <!-- Items List -->
      ${rows}
    </svg>
  `.trim();
}

function generateModernChartSvg(
  items: ChartItem[],
  showAlbums: boolean,
  width: number,
  avatarDataUri: string | null,
  username: string
): string {
  const baseWidth = 900;
  const rowHeight = 62;
  const listY = 128;
  const footerHeight = 62;
  const contentHeight = listY + items.length * rowHeight + footerHeight;
  const viewHeight = Math.max(showAlbums ? 380 : 350, contentHeight);
  const height = Math.round((width / baseWidth) * viewHeight);
  const maxPlaycount = Math.max(...items.map((item) => item.playcount), 1);
  const totalPlays = items.reduce((sum, item) => sum + item.playcount, 0);
  const title = `Top ${showAlbums ? 'albums' : 'artists'} this week`;
  const safeUsername = escapeXml(username.toUpperCase());

  const avatar = avatarDataUri
    ? `<image href="${escapeXml(avatarDataUri)}" x="40" y="32" width="52" height="52" preserveAspectRatio="xMidYMid slice" clip-path="url(#chartAvatarClip)"/>`
    : `<circle cx="66" cy="58" r="25" fill="#f1e8dc" opacity="0.95"/>
       <circle cx="66" cy="58" r="19" fill="#1c1715" opacity="0.94"/>`;

  const rows = items
    .map((item, index) => {
      const y = listY + index * rowHeight;
      const rank = (index + 1).toString().padStart(2, '0');
      const barWidth = Math.max(12, Math.round((item.playcount / maxPlaycount) * 642));
      const name = escapeXml(truncateText(item.name, showAlbums ? 34 : 36));
      const artistName = item.artistName ? escapeXml(truncateText(item.artistName, 32)) : '';
      const count = formatPlayCount(item.playcount);
      const rankFill = index === 0 ? '#d9b45c' : '#8d8d86';
      const nameSize = index === 0 ? 24 : 21;
      const nameWeight = index === 0 ? 780 : 720;
      const image = item.imageDataUri
        ? `<image href="${escapeXml(item.imageDataUri)}" x="96" y="${y - 1}" width="46" height="46" preserveAspectRatio="xMidYMid slice" clip-path="url(#itemClip-${index})"/>`
        : `<rect x="96" y="${y - 1}" width="46" height="46" rx="8" fill="#f1e8dc" opacity="0.10"/>
           <path transform="translate(109, ${y + 12}) scale(0.78)" fill="#a8aaa3" d="${LASTFM_LOGO_PATH}" opacity="0.56"/>`;
      const labelX = 158;
      const barX = labelX;
      const barY = showAlbums ? y + 48 : y + 38;
      const meta = showAlbums
        ? `<text x="${labelX}" y="${y + 38}" class="chart-meta">${artistName}</text>`
        : '';

      return `
        <g>
          <text x="42" y="${y + 24}" fill="${rankFill}" class="chart-rank">${rank}</text>
          ${image}
          <text x="${labelX}" y="${y + 24}" class="chart-name" font-size="${nameSize}" font-weight="${nameWeight}">${name}</text>
          ${meta}
          <text x="858" y="${y + 24}" text-anchor="end" class="chart-count">${count}</text>
          <rect x="${barX}" y="${barY}" width="${858 - barX}" height="8" rx="4" class="chart-track"/>
          <rect x="${barX}" y="${barY}" width="${barWidth}" height="8" rx="4" fill="url(#chartAccent)" opacity="${index === 0 ? '1' : '0.86'}"/>
        </g>
      `;
    })
    .join('');

  const itemClipPaths = items
    .map(
      (_, index) =>
        `<clipPath id="itemClip-${index}"><rect x="96" y="${listY + index * rowHeight - 1}" width="46" height="46" rx="8"/></clipPath>`
    )
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${baseWidth} ${viewHeight}">
      <defs>
        <linearGradient id="chartBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#151413"/>
          <stop offset="56%" stop-color="#1e1514"/>
          <stop offset="100%" stop-color="#321817"/>
        </linearGradient>
        <linearGradient id="chartAccent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#f05c45"/>
          <stop offset="100%" stop-color="#9e211e"/>
        </linearGradient>
        <pattern id="chartNoise" width="52" height="52" patternUnits="userSpaceOnUse">
          <path d="M7 9h1M20 31h1M41 14h1M33 43h1M13 48h1M47 37h1" stroke="#f1e8dc" stroke-opacity="0.11"/>
        </pattern>
        <clipPath id="chartAvatarClip">
          <circle cx="66" cy="58" r="26"/>
        </clipPath>
        ${itemClipPaths}
      </defs>
      <style>
        .chart-eyebrow { font: 700 13px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #a8aaa3; letter-spacing: 2px; }
        .chart-title { font: 800 34px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f1e8dc; }
        .chart-rank { font: 760 18px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .chart-name { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f1e8dc; }
        .chart-meta { font: 500 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #a8aaa3; }
        .chart-count { font: 740 17px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #d8d0c5; }
        .chart-track { fill: #f1e8dc; opacity: 0.12; }
        .chart-footer { font: 600 12px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #a8aaa3; letter-spacing: 1.5px; }
      </style>

      <rect width="${baseWidth}" height="${viewHeight}" rx="26" fill="url(#chartBg)"/>
      <rect width="${baseWidth}" height="${viewHeight}" rx="26" fill="url(#chartNoise)" opacity="0.35"/>
      <circle cx="815" cy="38" r="150" fill="#d83a34" opacity="0.10"/>
      <circle cx="110" cy="${viewHeight - 60}" r="180" fill="#d9b45c" opacity="0.07"/>

      ${avatar}
      <path transform="translate(54, 46) scale(0.78)" fill="#d83a34" d="${LASTFM_LOGO_PATH}" opacity="${avatarDataUri ? '0' : '1'}"/>
      <text x="112" y="48" class="chart-eyebrow">LAST.FM / 7 DAYS</text>
      <text x="112" y="82" class="chart-title">${escapeXml(title)}</text>

      ${rows}

      <text x="42" y="${viewHeight - 30}" class="chart-footer">${safeUsername}</text>
      <text x="858" y="${viewHeight - 30}" text-anchor="end" class="chart-footer">${formatPlayCount(totalPlays)} TOTAL PLAYS</text>
    </svg>
  `.trim();
}

export async function handleLastFmChart(ctx: HandlerContext): Promise<Response> {
  const { env, params } = ctx;
  const { username, width, showAlbums, showArtists, style } = params;

  const client = new LastFmClient(env.LASTFM_API_KEY);
  const useAlbums = showAlbums && !showArtists;

  // Fetch user info and top items in parallel
  const [userInfo, topItems] = await Promise.all([
    client.getUserInfo(username),
    useAlbums
      ? client.getTopAlbums(username, '7day', 10)
      : client.getTopArtists(username, '7day', 10),
  ]);

  // Fetch avatar
  const avatarDataUri = await fetchImageFromLastFm(userInfo.user.image);

  // Extract items
  const rawItems = useAlbums
    ? (topItems as Awaited<ReturnType<typeof client.getTopAlbums>>).topalbums.album
    : (topItems as Awaited<ReturnType<typeof client.getTopArtists>>).topartists.artist;

  const items = extractItems(rawItems, useAlbums);

  let modernItems = items;
  if (style === 'modern') {
    const itemImages = useAlbums
      ? await fetchImagesInParallel((rawItems as LastFmAlbum[]).map((album) => album.image))
      : await fetchArtistAlbumFallbackImages(
          client,
          username,
          rawItems,
          await fetchArtistImagesInParallel(client, rawItems, username)
        );

    modernItems = items.map((item, index) => ({
      ...item,
      imageDataUri: itemImages[index] ?? null,
    }));
  }

  // Generate SVG
  const svg =
    style === 'modern'
      ? generateModernChartSvg(modernItems, useAlbums, width, avatarDataUri, username)
      : generateChartSvg(items, useAlbums, width, avatarDataUri);

  return createSvgResponse(svg, true);
}
