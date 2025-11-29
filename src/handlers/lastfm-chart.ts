/**
 * Handler for /lastfm-chart endpoint
 * Generates an SVG chart of top artists or albums from Last.fm
 */

import type { HandlerContext, LastFmAlbum, LastFmArtist } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createSvgResponse } from '../utils/cors';
import { escapeXml } from '../utils/escape';
import { fetchImageFromLastFm } from '../utils/image';
import { LASTFM_LOGO_PATH } from '../templates/svg/lastfm-logo';

interface ChartItem {
  name: string;
  artistName?: string;
  playcount: number;
}

function extractItems(
  items: LastFmAlbum[] | LastFmArtist[],
  showAlbums: boolean
): ChartItem[] {
  return items.map((item) => {
    if (showAlbums) {
      const album = item as LastFmAlbum;
      const artistName =
        typeof album.artist === 'string' ? album.artist : album.artist?.name ?? '';
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

export async function handleLastFmChart(ctx: HandlerContext): Promise<Response> {
  const { env, params } = ctx;
  const { username, width, showAlbums, showArtists } = params;

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

  // Generate SVG
  const svg = generateChartSvg(items, useAlbums, width, avatarDataUri);

  return createSvgResponse(svg, true);
}
