/**
 * Tests for /lastfm-wordcloud handler helpers
 */

import { describe, it, expect } from 'vitest';
import {
  validatePeriod,
  validateLimit,
  fontSizeFor,
  renderWordCloudSvg,
} from '../../src/handlers/lastfm-wordcloud';

describe('validatePeriod', () => {
  it('returns the input when it is a valid period', () => {
    expect(validatePeriod('12month')).toBe('12month');
    expect(validatePeriod('7day')).toBe('7day');
    expect(validatePeriod('overall')).toBe('overall');
  });

  it('falls back to overall for invalid input', () => {
    expect(validatePeriod('forever')).toBe('overall');
    expect(validatePeriod('1week')).toBe('overall');
  });

  it('falls back to overall for null/empty', () => {
    expect(validatePeriod(null)).toBe('overall');
    expect(validatePeriod('')).toBe('overall');
  });

  it('honours the provided fallback', () => {
    expect(validatePeriod(null, '12month')).toBe('12month');
    expect(validatePeriod('bogus', '12month')).toBe('12month');
  });
});

describe('validateLimit', () => {
  it('returns parsed integer when in range', () => {
    expect(validateLimit('100')).toBe(100);
    expect(validateLimit('25')).toBe(25);
    expect(validateLimit('200')).toBe(200);
  });

  it('clamps values below the minimum', () => {
    expect(validateLimit('5')).toBe(25);
    expect(validateLimit('0')).toBe(25);
  });

  it('clamps values above the maximum', () => {
    expect(validateLimit('500')).toBe(200);
    expect(validateLimit('1000')).toBe(200);
  });

  it('falls back to default for null/empty/NaN', () => {
    expect(validateLimit(null)).toBe(75);
    expect(validateLimit('')).toBe(75);
    expect(validateLimit('abc')).toBe(75);
  });
});

describe('fontSizeFor', () => {
  it('returns minFont for the smallest playcount', () => {
    expect(fontSizeFor(1, 1, 1000, 10, 40)).toBe(10);
  });

  it('returns maxFont for the largest playcount', () => {
    expect(fontSizeFor(1000, 1, 1000, 10, 40)).toBe(40);
  });

  it('returns the midpoint when min and max are equal', () => {
    expect(fontSizeFor(50, 50, 50, 10, 40)).toBe(25);
  });

  it('produces monotonically increasing sizes', () => {
    const sizes = [10, 50, 200, 1000].map((p) => fontSizeFor(p, 10, 1000, 8, 32));
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]!).toBeGreaterThan(sizes[i - 1]!);
    }
  });
});

describe('renderWordCloudSvg', () => {
  it('emits an SVG containing each artist name', () => {
    const artists = [
      { name: 'Amplifier', playcount: 500 },
      { name: 'Oceansize', playcount: 300 },
      { name: 'Rush', playcount: 200 },
    ];
    const svg = renderWordCloudSvg(artists, 600);
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 600 375"');
    // Bold tier is rendered upper-case to match the reference style.
    expect(svg).toContain('AMPLIFIER');
    expect(svg).toContain('Oceansize');
    expect(svg).toContain('Rush');
  });

  it('escapes XML-unsafe characters in artist names', () => {
    // Use a tail artist (small playcount among many) so it's not uppercased.
    const artists = Array.from({ length: 20 }, (_, i) => ({
      name: i === 19 ? 'AC/DC <Live> & Friends' : `Filler ${i}`,
      playcount: 1000 - i * 30,
    }));
    const svg = renderWordCloudSvg(artists, 500);
    expect(svg).toContain('&lt;Live&gt;');
    expect(svg).toContain('&amp;');
    expect(svg).not.toContain('<Live>');
  });

  it('renders a fallback message when no artists are provided', () => {
    const svg = renderWordCloudSvg([], 500);
    expect(svg).toContain('No listening data');
  });

  it('emits debug rectangles when debug is true', () => {
    const artists = [{ name: 'Test', playcount: 100 }];
    const svg = renderWordCloudSvg(artists, 500, true);
    expect(svg).toContain('<rect');
    expect(svg).toContain('stroke="#ff0066"');
  });

  it('does not include debug rectangles when debug is false', () => {
    const artists = [{ name: 'Test', playcount: 100 }];
    const svg = renderWordCloudSvg(artists, 500, false);
    expect(svg).not.toContain('#ff0066');
  });
});
