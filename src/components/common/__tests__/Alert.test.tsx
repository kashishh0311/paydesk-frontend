import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Alert } from '../Alert';

describe('Alert Component Unit Tests', () => {
  it('renders error alert with message', () => {
    const html = renderToString(<Alert type="error" message="Failed to connect to MySQL" />);
    expect(html).toContain('Failed to connect to MySQL');
    expect(html).toContain('text-red-700');
  });

  it('renders success alert correctly', () => {
    const html = renderToString(<Alert type="success" message="Salary revision saved successfully" />);
    expect(html).toContain('Salary revision saved successfully');
    expect(html).toContain('text-emerald-700');
  });

  it('renders warning alert correctly', () => {
    const html = renderToString(<Alert type="warning" message="Employee has unpaid LOP days" />);
    expect(html).toContain('Employee has unpaid LOP days');
    expect(html).toContain('text-amber-700');
  });

  it('renders info alert correctly', () => {
    const html = renderToString(<Alert type="info" message="Active payroll cycle is October 2026" />);
    expect(html).toContain('Active payroll cycle is October 2026');
    expect(html).toContain('text-sky-700');
  });
});
