import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from '../NotFound';

describe('NotFound Page Unit Tests', () => {
  it('renders 404 error badge and page not found title', () => {
    const html = renderToString(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(html).toContain('404 ERROR');
    expect(html).toContain('Page Not Found');
    expect(html).toContain('Back to Dashboard');
    expect(html).toContain('Previous Page');
  });
});
