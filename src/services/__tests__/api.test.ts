import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, API_BASE_URL } from '../api';

describe('apiRequest Service Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves correct API_BASE_URL', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('performs successful GET request and returns data', async () => {
    const mockData = { success: true, data: { count: 10000 } };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    } as any);

    const result = await apiRequest<{ success: boolean; data: any }>('/analytics/overview');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/analytics/overview'),
      expect.objectContaining({
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockData);
  });

  it('throws descriptive error when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid or expired session token' })
    } as any);

    await expect(apiRequest('/protected-endpoint')).rejects.toThrow('Invalid or expired session token');
  });
});
