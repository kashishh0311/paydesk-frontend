import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Button } from '../Button';

describe('Button Component Unit Tests', () => {
  it('renders button with primary variant and text content', () => {
    const html = renderToString(<Button variant="primary">Submit Revision</Button>);
    expect(html).toContain('Submit Revision');
    expect(html).toContain('bg-indigo-600');
  });

  it('renders different size styles', () => {
    const htmlSm = renderToString(<Button size="sm">Small</Button>);
    const htmlLg = renderToString(<Button size="lg">Large</Button>);
    expect(htmlSm).toContain('text-xs');
    expect(htmlLg).toContain('text-base');
  });

  it('renders danger variant for destructive actions', () => {
    const html = renderToString(<Button variant="danger">Delete Employee</Button>);
    expect(html).toContain('bg-red-600');
    expect(html).toContain('Delete Employee');
  });

  it('disables button when disabled or isLoading is true', () => {
    const htmlDisabled = renderToString(<Button disabled>Disabled Action</Button>);
    const htmlLoading = renderToString(<Button isLoading>Saving</Button>);
    expect(htmlDisabled).toContain('disabled');
    expect(htmlLoading).toContain('disabled');
    expect(htmlLoading).toContain('animate-spin');
  });

  it('renders left and right icons properly', () => {
    const html = renderToString(
      <Button leftIcon={<span id="left-icon">L</span>} rightIcon={<span id="right-icon">R</span>}>
        Action
      </Button>
    );
    expect(html).toContain('left-icon');
    expect(html).toContain('right-icon');
  });
});
