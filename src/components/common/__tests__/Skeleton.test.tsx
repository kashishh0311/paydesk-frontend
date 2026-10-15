import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Skeleton, EmptyState, ErrorState } from '../Skeleton';

describe('Skeleton & State Helpers Unit Tests', () => {
  it('renders Skeleton element with correct variant and animation', () => {
    const html = renderToString(<Skeleton variant="rounded" animate="shimmer" className="h-10 w-full" />);
    expect(html).toContain('rounded-xl');
    expect(html).toContain('skeleton-shimmer');
  });

  it('renders EmptyState with custom title and description', () => {
    const html = renderToString(
      <EmptyState
        title="No salary records found"
        description="Try adjusting your department filter or search criteria."
      />
    );
    expect(html).toContain('No salary records found');
    expect(html).toContain('Try adjusting your department filter');
  });

  it('renders ErrorState with retry button and error details', () => {
    const html = renderToString(
      <ErrorState
        title="Failed to load compensation overview"
        message="MySQL database connection timed out."
        onRetry={() => {}}
      />
    );
    expect(html).toContain('Failed to load compensation overview');
    expect(html).toContain('MySQL database connection timed out');
    expect(html).toContain('Retry Request');
  });
});
