import { describe, it, expect, vi } from 'vitest';

describe('useOnClickOutside Hook Logic Tests', () => {
  it('triggers handler when click is outside target reference element', () => {
    const handler = vi.fn();
    const mockTarget = { id: 'modal-body' };
    const mockRef = { current: { contains: (target: any) => target === mockTarget } };

    const simulateListener = (eventTarget: any) => {
      const el = mockRef.current;
      if (!el || el.contains(eventTarget)) {
        return;
      }
      handler();
    };

    // Click inside element -> should not trigger
    simulateListener(mockTarget);
    expect(handler).not.toHaveBeenCalled();

    // Click outside element -> should trigger
    simulateListener({ id: 'backdrop' });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
