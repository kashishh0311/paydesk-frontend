import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrintWin = {
  document: {
    write: vi.fn(),
    close: vi.fn()
  }
};

const mockWindowOpen = vi.fn().mockReturnValue(mockPrintWin);

// Set window and localStorage on globalThis before any code executes
Object.defineProperty(globalThis, 'window', {
  value: {
    open: mockWindowOpen,
    URL: { createObjectURL: vi.fn().mockReturnValue('blob:mock-url'), revokeObjectURL: vi.fn() }
  },
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis, 'localStorage', {
  value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  writable: true,
  configurable: true
});

import { downloadExport } from '../download';

describe('downloadExport Utility Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles HTML printable responses by opening window', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (header: string) => (header.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null)
      },
      text: async () => '<html><body>Payslip EMP-001</body></html>'
    } as any);

    await downloadExport('/payroll/payslip/1/download', 'payslip.html');
    expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
    expect(mockPrintWin.document.write).toHaveBeenCalledWith('<html><body>Payslip EMP-001</body></html>');
  });

  it('handles non-200 responses gracefully without throwing unhandled rejection', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null }
    } as any);

    await expect(downloadExport('/invalid/export', 'file.csv')).resolves.not.toThrow();
  });
});
