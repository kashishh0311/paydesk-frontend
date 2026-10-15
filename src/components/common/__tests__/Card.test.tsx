import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Card } from '../Card';

describe('Card Component Unit Tests', () => {
  it('renders children correctly', () => {
    const html = renderToString(
      <Card>
        <div id="test-content">Card Inner Content</div>
      </Card>
    );
    expect(html).toContain('Card Inner Content');
    expect(html).toContain('bg-card');
  });

  it('renders title and subtitle when provided', () => {
    const html = renderToString(
      <Card title="Monthly Compensation" subtitle="Real-time employee payroll">
        <span>Body</span>
      </Card>
    );
    expect(html).toContain('Monthly Compensation');
    expect(html).toContain('Real-time employee payroll');
  });

  it('renders top action element when provided', () => {
    const html = renderToString(
      <Card title="Summary" action={<button id="action-btn">Export</button>}>
        <span>Body</span>
      </Card>
    );
    expect(html).toContain('Export');
  });

  it('applies custom className correctly', () => {
    const html = renderToString(
      <Card className="custom-test-class">
        <span>Body</span>
      </Card>
    );
    expect(html).toContain('custom-test-class');
  });
});
