import { describe, it, expect } from 'vitest';
import { formatINR, formatCurrency } from '../currency';

describe('currency utility tests', () => {
  it('correctly formats standard INR amounts', () => {
    expect(formatINR(50000)).toBe('₹50,000.00');
    expect(formatINR(1250000)).toBe('₹12,50,000.00');
    expect(formatINR(0)).toBe('₹0.00');
  });

  it('handles negative INR amounts', () => {
    expect(formatINR(-5000)).toBe('-₹5,000.00');
  });

  it('correctly formats compact INR values for dashboard charts', () => {
    expect(formatINR(50000000, { compact: true })).toContain('Cr');
    expect(formatINR(500000, { compact: true })).toContain('L');
  });

  it('handles multi-currency formatting via formatCurrency', () => {
    const usd = formatCurrency(5000, 'USD');
    expect(usd).toContain('5,000');

    const inr = formatCurrency(5000, 'INR');
    expect(inr).toContain('5,000');
  });
});
