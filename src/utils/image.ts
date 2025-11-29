/**
 * Image fetching and processing utilities
 */

import { createDataUri } from './base64';
import type { LastFmImage } from '../types';

const SIZE_ORDER: Record<string, number> = {
  extralarge: 4,
  large: 3,
  medium: 2,
  small: 1,
  '': 0,
};

// Default Last.fm placeholder image hash
const DEFAULT_IMAGE_HASH = '2a96cbd8b46e442fc41c2b86b821562f';

/**
 * Get the largest image URL from Last.fm image array
 * Returns null if no valid image is found
 */
export function getLargestImageUrl(images: LastFmImage[] | undefined): string | null {
  if (!images || images.length === 0) {
    return null;
  }

  const sorted = [...images].sort((a, b) => {
    return (SIZE_ORDER[b.size] ?? 0) - (SIZE_ORDER[a.size] ?? 0);
  });

  const url = sorted[0]?.['#text'];

  if (
    !url ||
    url.trim() === '' ||
    url.includes(DEFAULT_IMAGE_HASH) ||
    url.includes('default_album')
  ) {
    return null;
  }

  return url;
}

/**
 * Fetch an image and convert it to a data URI
 */
export async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'image/jpeg';

    return createDataUri(buffer, contentType);
  } catch {
    return null;
  }
}

/**
 * Get the largest image from Last.fm and convert to data URI
 */
export async function fetchImageFromLastFm(
  images: LastFmImage[] | undefined
): Promise<string | null> {
  const url = getLargestImageUrl(images);
  if (!url) {
    return null;
  }
  return fetchImageAsDataUri(url);
}

/**
 * Fetch multiple images in parallel, maintaining order
 */
export async function fetchImagesInParallel(
  imageArrays: (LastFmImage[] | undefined)[]
): Promise<(string | null)[]> {
  const promises = imageArrays.map((images) => fetchImageFromLastFm(images));
  return Promise.all(promises);
}
