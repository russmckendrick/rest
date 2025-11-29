/**
 * Tests for image utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLargestImageUrl,
  fetchImageAsDataUri,
  fetchImageFromLastFm,
} from '../../src/utils/image';
import type { LastFmImage } from '../../src/types';
import { mockFetch } from '../setup';

describe('getLargestImageUrl', () => {
  it('returns null for undefined input', () => {
    expect(getLargestImageUrl(undefined)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(getLargestImageUrl([])).toBeNull();
  });

  it('returns largest image URL', () => {
    const images: LastFmImage[] = [
      { '#text': 'http://example.com/small.jpg', size: 'small' },
      { '#text': 'http://example.com/large.jpg', size: 'large' },
      { '#text': 'http://example.com/medium.jpg', size: 'medium' },
      { '#text': 'http://example.com/extralarge.jpg', size: 'extralarge' },
    ];

    expect(getLargestImageUrl(images)).toBe('http://example.com/extralarge.jpg');
  });

  it('handles missing extralarge size', () => {
    const images: LastFmImage[] = [
      { '#text': 'http://example.com/small.jpg', size: 'small' },
      { '#text': 'http://example.com/large.jpg', size: 'large' },
    ];

    expect(getLargestImageUrl(images)).toBe('http://example.com/large.jpg');
  });

  it('returns null for default placeholder image', () => {
    const images: LastFmImage[] = [
      { '#text': 'http://example.com/2a96cbd8b46e442fc41c2b86b821562f.jpg', size: 'large' },
    ];

    expect(getLargestImageUrl(images)).toBeNull();
  });

  it('returns null for default_album placeholder', () => {
    const images: LastFmImage[] = [
      { '#text': 'http://example.com/default_album_medium.png', size: 'medium' },
    ];

    expect(getLargestImageUrl(images)).toBeNull();
  });

  it('returns null for empty URL', () => {
    const images: LastFmImage[] = [{ '#text': '', size: 'large' }];

    expect(getLargestImageUrl(images)).toBeNull();
  });

  it('returns null for whitespace-only URL', () => {
    const images: LastFmImage[] = [{ '#text': '   ', size: 'large' }];

    expect(getLargestImageUrl(images)).toBeNull();
  });

  it('handles empty size string', () => {
    const images: LastFmImage[] = [
      { '#text': 'http://example.com/unknown.jpg', size: '' },
      { '#text': 'http://example.com/small.jpg', size: 'small' },
    ];

    expect(getLargestImageUrl(images)).toBe('http://example.com/small.jpg');
  });
});

describe('fetchImageAsDataUri', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches image and returns data URI', async () => {
    const imageData = new Uint8Array([0xff, 0xd8, 0xff]); // JPEG magic bytes

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageData.buffer),
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    } as Response);

    const result = await fetchImageAsDataUri('http://example.com/image.jpg');

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('returns null for non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await fetchImageAsDataUri('http://example.com/notfound.jpg');

    expect(result).toBeNull();
  });

  it('returns null on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchImageAsDataUri('http://example.com/image.jpg');

    expect(result).toBeNull();
  });

  it('uses default content type when not provided', async () => {
    const imageData = new Uint8Array([0xff, 0xd8, 0xff]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageData.buffer),
      headers: new Headers(), // No content-type
    } as Response);

    const result = await fetchImageAsDataUri('http://example.com/image.jpg');

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });
});

describe('fetchImageFromLastFm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns null for undefined images', async () => {
    const result = await fetchImageFromLastFm(undefined);
    expect(result).toBeNull();
  });

  it('returns null for empty images array', async () => {
    const result = await fetchImageFromLastFm([]);
    expect(result).toBeNull();
  });

  it('fetches largest image and returns data URI', async () => {
    const images: LastFmImage[] = [
      { '#text': 'http://example.com/small.jpg', size: 'small' },
      { '#text': 'http://example.com/large.jpg', size: 'large' },
    ];

    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageData.buffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    } as Response);

    const result = await fetchImageFromLastFm(images);

    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(mockFetch).toHaveBeenCalledWith('http://example.com/large.jpg');
  });

  it('returns null when all images are placeholders', async () => {
    const images: LastFmImage[] = [
      { '#text': 'http://example.com/2a96cbd8b46e442fc41c2b86b821562f.jpg', size: 'large' },
    ];

    const result = await fetchImageFromLastFm(images);

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
