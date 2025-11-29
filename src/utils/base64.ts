/**
 * Base64 encoding utilities with chunked processing
 * to avoid stack overflow on large buffers
 */

const CHUNK_SIZE = 8192;

/**
 * Convert ArrayBuffer to base64 string using chunked processing
 * This avoids "Maximum call stack size exceeded" errors on large buffers
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const chunks: string[] = [];

  for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
    const chunk = uint8Array.slice(i, i + CHUNK_SIZE);
    chunks.push(String.fromCharCode(...chunk));
  }

  return btoa(chunks.join(''));
}

/**
 * Create a data URI from an ArrayBuffer with the given content type
 */
export function createDataUri(buffer: ArrayBuffer, contentType: string): string {
  const base64 = arrayBufferToBase64(buffer);
  return `data:${contentType};base64,${base64}`;
}
