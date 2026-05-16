/**
 * Input validation utilities
 */

import type { ValidationResult, RequestParams, Env } from '../types';

export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{1,14}$/;
export const MIN_WIDTH = 100;
export const MAX_WIDTH = 2000;
export const DEFAULT_WIDTH = 500;
export const DEFAULT_USERNAME = 'russmckendrick';
export const DEFAULT_STYLE = 'modern';
export const OUTPUT_STYLES = ['classic', 'modern'] as const;

export type OutputStyle = (typeof OUTPUT_STYLES)[number];

/**
 * Validate Last.fm username
 */
export function validateUsername(
  input: string | null,
  defaultValue: string = DEFAULT_USERNAME
): ValidationResult<string> {
  if (!input) {
    return { success: true, value: defaultValue };
  }

  const trimmed = input.trim();

  if (trimmed.length < 2 || trimmed.length > 15) {
    return { success: false, error: 'Username must be between 2 and 15 characters' };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return { success: false, error: 'Username contains invalid characters' };
  }

  return { success: true, value: trimmed };
}

/**
 * Validate width parameter
 */
export function validateWidth(
  input: string | null,
  defaultValue: number = DEFAULT_WIDTH
): ValidationResult<number> {
  if (!input) {
    return { success: true, value: defaultValue };
  }

  const parsed = parseInt(input, 10);

  if (isNaN(parsed)) {
    return { success: false, error: 'Width must be a number' };
  }

  if (parsed < MIN_WIDTH || parsed > MAX_WIDTH) {
    return { success: false, error: `Width must be between ${MIN_WIDTH} and ${MAX_WIDTH}` };
  }

  return { success: true, value: parsed };
}

/**
 * Validate output style parameter
 */
export function validateStyle(
  input: string | null,
  defaultValue: OutputStyle = DEFAULT_STYLE
): ValidationResult<OutputStyle> {
  if (!input) {
    return { success: true, value: defaultValue };
  }

  const value = input.trim().toLowerCase();
  if (OUTPUT_STYLES.includes(value as OutputStyle)) {
    return { success: true, value: value as OutputStyle };
  }

  return { success: false, error: `Style must be one of: ${OUTPUT_STYLES.join(', ')}` };
}

/**
 * Parse and validate all request parameters from URL
 */
export function parseRequestParams(url: URL, env: Env): ValidationResult<RequestParams> {
  const defaultUsername = env.DEFAULT_USERNAME ?? DEFAULT_USERNAME;

  const usernameResult = validateUsername(url.searchParams.get('username'), defaultUsername);
  if (!usernameResult.success || !usernameResult.value) {
    return { success: false, error: usernameResult.error };
  }

  const widthResult = validateWidth(url.searchParams.get('width'));
  if (!widthResult.success || widthResult.value === undefined) {
    return { success: false, error: widthResult.error };
  }

  const styleResult = validateStyle(url.searchParams.get('style'));
  if (!styleResult.success || !styleResult.value) {
    return { success: false, error: styleResult.error };
  }

  const showAlbums = url.searchParams.has('albums');
  const showArtists = url.searchParams.has('artists') || !showAlbums;

  return {
    success: true,
    value: {
      username: usernameResult.value,
      width: widthResult.value,
      debug: url.searchParams.has('debug'),
      showAlbums,
      showArtists,
      style: styleResult.value,
    },
  };
}
