/**
 * Handler for /trmnl-lastfm-grid endpoint
 * Generates a 2x5 album grid for TRMNL e-ink displays
 */

import type { HandlerContext, LastFmAlbum } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createHtmlResponse } from '../utils/cors';
import { escapeHtml } from '../utils/escape';
import { fetchImageAsDataUri, getLargestImageUrl } from '../utils/image';
import { renderTrmnlPage } from '../templates/html/trmnl-base';

interface AlbumImage {
  dataUrl: string;
  index: number;
}

async function fetchAlbumImage(
  client: LastFmClient,
  album: LastFmAlbum,
  index: number,
  debug: boolean,
  debugInfo: string[]
): Promise<AlbumImage | null> {
  if (debug) debugInfo.push(`Processing album ${index + 1}...`);

  const artistName =
    typeof album.artist === 'string'
      ? album.artist
      : album.artist?.['#text'] ?? album.artist?.name ?? '';

  if (!artistName) {
    if (debug) debugInfo.push(`No valid artist name for album ${index + 1}`);
    return null;
  }

  try {
    // Try to get album info for better image
    const albumInfo = await client.getAlbumInfo(artistName, album.name);

    if (albumInfo?.album?.image) {
      const imageUrl = getLargestImageUrl(albumInfo.album.image);
      if (imageUrl) {
        const dataUrl = await fetchImageAsDataUri(imageUrl);
        if (dataUrl) {
          if (debug) debugInfo.push(`Successfully fetched album ${index + 1} via album.getInfo`);
          return { dataUrl, index };
        }
      }
    }
  } catch {
    if (debug) debugInfo.push(`album.getInfo failed for album ${index + 1}, trying chart image`);
  }

  // Fallback to chart image
  const chartImageUrl = getLargestImageUrl(album.image);
  if (chartImageUrl) {
    const dataUrl = await fetchImageAsDataUri(chartImageUrl);
    if (dataUrl) {
      if (debug) debugInfo.push(`Using chart image for album ${index + 1}`);
      return { dataUrl, index };
    }
  }

  if (debug) debugInfo.push(`No image available for album ${index + 1}`);
  return null;
}

function generateGridContent(orderedImages: (string | null)[]): string {
  const cells = orderedImages
    .map((dataUrl, index) => {
      const imageContent = dataUrl
        ? `<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #fff;">
            <img class="image-dither album-image" src="${escapeHtml(dataUrl)}" alt="Album ${index + 1}" />
          </div>`
        : '';

      return `<div class="album-cell">${imageContent}</div>`;
    })
    .join('');

  return `<div class="album-grid">${cells}</div>`;
}

export async function handleTrmnlLastFmGrid(ctx: HandlerContext): Promise<Response> {
  const { env, params, debugInfo } = ctx;
  const { username, debug } = params;

  const client = new LastFmClient(env.LASTFM_API_KEY);

  if (debug) debugInfo.push('Fetching weekly album chart...');

  const chartData = await client.getWeeklyAlbumChart(username, 10);

  if (!chartData?.weeklyalbumchart?.album) {
    throw new Error('Invalid Last.fm response format');
  }

  const albums = chartData.weeklyalbumchart.album.slice(0, 10);
  if (debug) debugInfo.push(`Found ${albums.length} albums`);

  // Fetch all album images in parallel
  const albumImages = await Promise.all(
    albums.map((album, index) => fetchAlbumImage(client, album, index, debug, debugInfo))
  );

  // Filter out nulls and maintain order
  const validImages = albumImages.filter((img): img is AlbumImage => img !== null);
  if (debug) debugInfo.push(`Successfully fetched ${validImages.length} album images`);

  // Create ordered array with null for missing images
  const orderedImages: (string | null)[] = Array.from({ length: 10 }, () => null);
  validImages.forEach((img) => {
    orderedImages[img.index] = img.dataUrl;
  });

  const additionalStyles = `
    .album-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 12px;
      padding: 16px;
      height: calc(100% - 80px);
      background: #fff;
    }
    .album-cell {
      aspect-ratio: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fff;
      border: 1px solid #000;
      overflow: hidden;
      padding: 4px;
    }
    .album-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: auto;
      -webkit-font-smoothing: none;
    }
  `;

  const content = generateGridContent(orderedImages);

  const html = renderTrmnlPage({
    title: 'Weekly Top Albums',
    instance: `${escapeHtml(username)}'s Last.fm`,
    content,
    additionalStyles,
    debug,
    debugInfo,
  });

  return createHtmlResponse(html, true);
}
