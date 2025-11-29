/**
 * Tests for escape utilities
 */

import { describe, it, expect } from 'vitest';
import { escapeXml, escapeHtml } from '../../src/utils/escape';

describe('escapeXml', () => {
  it('escapes less than sign', () => {
    expect(escapeXml('<')).toBe('&lt;');
    expect(escapeXml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater than sign', () => {
    expect(escapeXml('>')).toBe('&gt;');
  });

  it('escapes ampersand', () => {
    expect(escapeXml('&')).toBe('&amp;');
    expect(escapeXml('A & B')).toBe('A &amp; B');
  });

  it('escapes single quotes', () => {
    expect(escapeXml("'")).toBe('&apos;');
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it('escapes double quotes', () => {
    expect(escapeXml('"')).toBe('&quot;');
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('handles empty strings', () => {
    expect(escapeXml('')).toBe('');
  });

  it('handles null and undefined', () => {
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
  });

  it('preserves normal text', () => {
    expect(escapeXml('Hello World')).toBe('Hello World');
    expect(escapeXml('Track Name - Artist')).toBe('Track Name - Artist');
  });

  it('escapes multiple special characters', () => {
    expect(escapeXml('<tag attr="value">')).toBe('&lt;tag attr=&quot;value&quot;&gt;');
  });
});

describe('escapeHtml', () => {
  it('escapes less than sign', () => {
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater than sign', () => {
    expect(escapeHtml('>')).toBe('&gt;');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('&')).toBe('&amp;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"')).toBe('&quot;');
  });

  it('escapes single quotes (HTML entity)', () => {
    expect(escapeHtml("'")).toBe('&#x27;');
  });

  it('escapes forward slash', () => {
    expect(escapeHtml('/')).toBe('&#x2F;');
    expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
  });

  it('handles empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('preserves normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});
