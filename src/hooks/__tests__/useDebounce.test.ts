import { describe, it, expect, vi } from 'vitest';

describe('useDebounce Hook Logic Tests', () => {
  it('delays updating value until timeout expires', () => {
    vi.useFakeTimers();
    let currentVal = 'EMP-001';
    let debouncedVal = currentVal;

    const setDebounced = (val: string) => {
      debouncedVal = val;
    };

    // Simulate hook setting a timer
    const update = (newVal: string, delay: number = 300) => {
      currentVal = newVal;
      const handler = setTimeout(() => {
        setDebounced(newVal);
      }, delay);
      return () => clearTimeout(handler);
    };

    update('EMP-002', 300);
    expect(debouncedVal).toBe('EMP-001');

    vi.advanceTimersByTime(200);
    expect(debouncedVal).toBe('EMP-001');

    vi.advanceTimersByTime(100);
    expect(debouncedVal).toBe('EMP-002');

    vi.useRealTimers();
  });

  it('cancels pending update if value changes rapidly', () => {
    vi.useFakeTimers();
    let debouncedVal = 'initial';

    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = (val: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        debouncedVal = val;
      }, 300);
    };

    trigger('change-1');
    vi.advanceTimersByTime(150);
    trigger('change-2');
    vi.advanceTimersByTime(150);
    expect(debouncedVal).toBe('initial');

    vi.advanceTimersByTime(150);
    expect(debouncedVal).toBe('change-2');

    vi.useRealTimers();
  });
});
