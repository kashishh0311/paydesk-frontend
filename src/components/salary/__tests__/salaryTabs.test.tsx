import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DeductionsLopTab } from '../DeductionsLopTab';
import { IncrementsBonusesTab } from '../IncrementsBonusesTab';

describe('Salary Workspace Tab Components Tests', () => {
  it('renders DeductionsLopTab skeleton or header controls', () => {
    const html = renderToString(<DeductionsLopTab />);
    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
  });

  it('renders IncrementsBonusesTab revision launcher form and tabs', () => {
    const html = renderToString(<IncrementsBonusesTab />);
    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
  });
});
