import { describe, it, expect, vi } from 'vitest';
import * as toastModule from '../toast';
import { toast } from 'react-toastify';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('Toast Utility Unit Tests', () => {
  it('should call toast.success with bottom-center position', () => {
    toastModule.showSuccessToast('Operation successful');
    expect(toast.success).toHaveBeenCalledWith(
      'Operation successful',
      expect.objectContaining({
        position: 'bottom-center',
      })
    );
  });

  it('should call toast.error with bottom-center position', () => {
    toastModule.showErrorToast('Error occurred');
    expect(toast.error).toHaveBeenCalledWith(
      'Error occurred',
      expect.objectContaining({
        position: 'bottom-center',
      })
    );
  });

  it('should call toast.info with bottom-center position', () => {
    toastModule.showInfoToast('Information note');
    expect(toast.info).toHaveBeenCalledWith(
      'Information note',
      expect.objectContaining({
        position: 'bottom-center',
      })
    );
  });
});
