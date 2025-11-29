/**
 * Tests for base64 utilities
 */

import { describe, it, expect } from 'vitest';
import { arrayBufferToBase64, createDataUri } from '../../src/utils/base64';

describe('arrayBufferToBase64', () => {
  it('converts empty buffer to empty string', () => {
    const buffer = new ArrayBuffer(0);
    expect(arrayBufferToBase64(buffer)).toBe('');
  });

  it('converts small buffer correctly', () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const buffer = data.buffer;
    const result = arrayBufferToBase64(buffer);
    expect(result).toBe(btoa('Hello'));
  });

  it('converts single byte', () => {
    const data = new Uint8Array([65]); // "A"
    const buffer = data.buffer;
    const result = arrayBufferToBase64(buffer);
    expect(result).toBe(btoa('A'));
  });

  it('handles binary data', () => {
    const data = new Uint8Array([0, 127, 255, 128]);
    const buffer = data.buffer;
    const result = arrayBufferToBase64(buffer);
    // Verify it's valid base64
    expect(() => atob(result)).not.toThrow();
    // Verify round-trip
    const decoded = atob(result);
    expect(decoded.charCodeAt(0)).toBe(0);
    expect(decoded.charCodeAt(1)).toBe(127);
    expect(decoded.charCodeAt(2)).toBe(255);
    expect(decoded.charCodeAt(3)).toBe(128);
  });

  it('handles large buffers without stack overflow', () => {
    // Create a buffer larger than typical chunk size (8192)
    const size = 16384;
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    const buffer = data.buffer;

    // Should not throw stack overflow
    expect(() => arrayBufferToBase64(buffer)).not.toThrow();

    const result = arrayBufferToBase64(buffer);
    // Verify it's valid base64
    expect(() => atob(result)).not.toThrow();
  });
});

describe('createDataUri', () => {
  it('creates data URI with content type', () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const buffer = data.buffer;
    const result = createDataUri(buffer, 'text/plain');

    expect(result).toMatch(/^data:text\/plain;base64,/);
    expect(result).toBe(`data:text/plain;base64,${btoa('Hello')}`);
  });

  it('handles image content types', () => {
    const data = new Uint8Array([0xff, 0xd8, 0xff]); // JPEG magic bytes
    const buffer = data.buffer;
    const result = createDataUri(buffer, 'image/jpeg');

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('handles PNG content type', () => {
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
    const buffer = data.buffer;
    const result = createDataUri(buffer, 'image/png');

    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
