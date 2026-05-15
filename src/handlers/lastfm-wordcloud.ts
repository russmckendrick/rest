/**
 * Handler for /lastfm-wordcloud endpoint
 * Generates an SVG word cloud of top artists from Last.fm,
 * sized by play count and laid out with spiral packing.
 */

import type { HandlerContext, LastFmPeriod } from '../types';
import { LastFmClient } from '../utils/lastfm-client';
import { createSvgResponse } from '../utils/cors';
import { escapeXml } from '../utils/escape';

const VALID_PERIODS: LastFmPeriod[] = [
  'overall',
  '7day',
  '1month',
  '3month',
  '6month',
  '12month',
];

const MIN_LIMIT = 25;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 75;
const DEFAULT_PERIOD: LastFmPeriod = 'overall';
const ASPECT_RATIO = 1.6;
const CHAR_WIDTH_FACTOR = 0.58;
const LINE_HEIGHT_FACTOR = 1.05;
const BOX_PADDING = 1;
const MAX_SPIRAL_STEPS = 15000;

export interface ArtistDatum {
  name: string;
  playcount: number;
}

interface PlacedBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
  fontSize: number;
  rotated: boolean;
  weight: number;
  name: string;
}

export function validatePeriod(input: string | null, fallback: LastFmPeriod = DEFAULT_PERIOD): LastFmPeriod {
  if (!input) return fallback;
  return (VALID_PERIODS as string[]).includes(input) ? (input as LastFmPeriod) : fallback;
}

export function validateLimit(input: string | null, fallback: number = DEFAULT_LIMIT): number {
  if (!input) return fallback;
  const parsed = parseInt(input, 10);
  if (isNaN(parsed)) return fallback;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parsed));
}

export function fontSizeFor(
  playcount: number,
  minPlay: number,
  maxPlay: number,
  minFont: number,
  maxFont: number
): number {
  if (maxPlay === minPlay) return (minFont + maxFont) / 2;
  const logMin = Math.log(Math.max(1, minPlay));
  const logMax = Math.log(Math.max(1, maxPlay));
  const logCur = Math.log(Math.max(1, playcount));
  const t = (logCur - logMin) / (logMax - logMin);
  return minFont + (maxFont - minFont) * t;
}

function aabbOverlap(a: PlacedBox, b: PlacedBox): boolean {
  return (
    Math.abs(a.cx - b.cx) * 2 < a.w + b.w &&
    Math.abs(a.cy - b.cy) * 2 < a.h + b.h
  );
}

function tryPlace(
  candidate: PlacedBox,
  placed: PlacedBox[],
  width: number,
  height: number,
  x: number,
  y: number
): PlacedBox | null {
  if (
    x - candidate.w / 2 < 0 ||
    x + candidate.w / 2 > width ||
    y - candidate.h / 2 < 0 ||
    y + candidate.h / 2 > height
  ) {
    return null;
  }
  const tentative: PlacedBox = { ...candidate, cx: x, cy: y };
  for (const p of placed) {
    if (aabbOverlap(tentative, p)) return null;
  }
  return tentative;
}

// Mulberry32 deterministic PRNG so output is stable per (width, artists).
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function placeWord(
  candidate: PlacedBox,
  placed: PlacedBox[],
  width: number,
  height: number,
  cx: number,
  cy: number,
  rng: () => number
): PlacedBox | null {
  // Phase 1: tight Archimedean spiral, anchored at centre. Good for early/large words.
  const a = 0.4;
  const dt = 0.08;
  const maxSpiralRadius = Math.hypot(width, height) / 2;
  for (let step = 0; step < MAX_SPIRAL_STEPS; step++) {
    const t = step * dt;
    const r = a * t;
    if (r > maxSpiralRadius) break;
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    const result = tryPlace(candidate, placed, width, height, x, y);
    if (result) return result;
  }

  // Phase 2: uniform random scatter over the whole canvas. Picks up tail words
  // that the spiral skipped past because its tangential step grew with radius.
  for (let i = 0; i < 1500; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const result = tryPlace(candidate, placed, width, height, x, y);
    if (result) return result;
  }

  // Phase 3: deterministic grid scan as a last resort. Guarantees finding any
  // gap larger than the grid step. Order randomised so words don't all queue
  // up in a corner.
  const step = 3;
  const cols = Math.floor((width - candidate.w) / step);
  const rows = Math.floor((height - candidate.h) / step);
  const total = cols * rows;
  if (total <= 0) return null;
  const start = Math.floor(rng() * total);
  for (let k = 0; k < total; k++) {
    const idx = (start + k) % total;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = candidate.w / 2 + col * step;
    const y = candidate.h / 2 + row * step;
    const result = tryPlace(candidate, placed, width, height, x, y);
    if (result) return result;
  }

  return null;
}

export function renderWordCloudSvg(artists: ArtistDatum[], width: number, debug = false): string {
  const height = Math.round(width / ASPECT_RATIO);
  const cx = width / 2;
  const cy = height / 2;

  const filtered = artists.filter((a) => a.name && a.playcount > 0);
  if (filtered.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#888">No listening data</text></svg>`;
  }

  const sorted = [...filtered].sort((a, b) => b.playcount - a.playcount);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const maxPlay = first.playcount;
  const minPlay = last.playcount;

  const minFont = Math.max(8, width / 110);
  const maxFont = Math.max(minFont + 4, width / 16);

  const boldCutoff = Math.max(1, Math.ceil(sorted.length * 0.15));

  // Seed RNG from input characteristics so renders are stable across requests
  // but vary across different users/widths.
  const seed = sorted.reduce((acc, a) => acc + a.playcount + a.name.length, width);
  const rng = makeRng(seed);

  const placed: PlacedBox[] = [];

  sorted.forEach((artist, i) => {
    const fontSize = fontSizeFor(artist.playcount, minPlay, maxPlay, minFont, maxFont);
    const rotated = i >= 3 && i % 5 === 2;
    const weight = i < boldCutoff ? 700 : 400;

    const textW = artist.name.length * fontSize * CHAR_WIDTH_FACTOR + BOX_PADDING * 2;
    const textH = fontSize * LINE_HEIGHT_FACTOR + BOX_PADDING * 2;
    const boxW = rotated ? textH : textW;
    const boxH = rotated ? textW : textH;

    if (boxW > width || boxH > height) return;

    const candidate: PlacedBox = {
      cx: 0,
      cy: 0,
      w: boxW,
      h: boxH,
      fontSize,
      rotated,
      weight,
      name: artist.name,
    };

    const result = placeWord(candidate, placed, width, height, cx, cy, rng);
    if (result) placed.push(result);
  });

  const texts = placed
    .map((p) => {
      const safe = escapeXml(p.name);
      const transform = p.rotated ? ` transform="rotate(-90 ${p.cx} ${p.cy})"` : '';
      return `<text x="${p.cx.toFixed(2)}" y="${p.cy.toFixed(2)}" font-size="${p.fontSize.toFixed(2)}" font-weight="${p.weight}" text-anchor="middle" dominant-baseline="middle"${transform}>${safe}</text>`;
    })
    .join('');

  const debugRects = debug
    ? placed
        .map(
          (p) =>
            `<rect x="${(p.cx - p.w / 2).toFixed(2)}" y="${(p.cy - p.h / 2).toFixed(2)}" width="${p.w.toFixed(2)}" height="${p.h.toFixed(2)}" fill="none" stroke="#ff0066" stroke-width="0.5" opacity="0.5"/>`
        )
        .join('')
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, Helvetica, sans-serif" fill="#111111"><rect width="${width}" height="${height}" fill="#ffffff"/>${texts}${debugRects}</svg>`;
}

export async function handleLastFmWordcloud(ctx: HandlerContext): Promise<Response> {
  const { env, params, request } = ctx;
  const url = new URL(request.url);
  const period = validatePeriod(url.searchParams.get('period'));
  const limit = validateLimit(url.searchParams.get('limit'));

  const client = new LastFmClient(env.LASTFM_API_KEY);
  const data = await client.getTopArtists(params.username, period, limit);

  const artists: ArtistDatum[] = data.topartists.artist.map((a) => ({
    name: a.name,
    playcount: parseInt(a.playcount, 10),
  }));

  const svg = renderWordCloudSvg(artists, params.width, params.debug);
  return createSvgResponse(svg, true);
}
