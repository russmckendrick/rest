/**
 * XML and HTML escaping utilities
 */

const XML_ESCAPE_MAP: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape special characters for safe use in XML/SVG content
 */
export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (char) => XML_ESCAPE_MAP[char] ?? char);
}

/**
 * Escape special characters for safe use in HTML content
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}
