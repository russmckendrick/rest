/**
 * Test setup and global mocks
 */

import { vi } from 'vitest';

// Mock fetch globally using globalThis (works in both Node and Workers)
const mockFetch = vi.fn();
(globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch;

// Export for use in tests
export { mockFetch };

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
