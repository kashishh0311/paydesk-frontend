import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Input } from '../Input';

describe('Input Component Unit Tests', () => {
  it('renders input with label and placeholder', () => {
    const html = renderToString(
      <Input label="Base Salary" placeholder="Enter annual CTC" />
    );
    expect(html).toContain('Base Salary');
    expect(html).toContain('placeholder="Enter annual CTC"');
  });

  it('renders validation error message when error prop is present', () => {
    const html = renderToString(
      <Input label="Email" error="Invalid work email format" />
    );
    expect(html).toContain('Invalid work email format');
    expect(html).toContain('border-red-500');
  });

  it('renders helper text when provided', () => {
    const html = renderToString(
      <Input label="Employee Code" helperText="Format: EMP-XXXXXX" />
    );
    expect(html).toContain('Format: EMP-XXXXXX');
  });

  it('renders password toggle button when type is password', () => {
    const html = renderToString(
      <Input label="Password" type="password" />
    );
    expect(html).toContain('type="password"');
  });
});
