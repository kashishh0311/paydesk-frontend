import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Select } from '../Select';

describe('Select Component Unit Tests', () => {
  it('renders select with label and options', () => {
    const html = renderToString(
      <Select label="Department">
        <option value="Engineering">Engineering</option>
        <option value="Sales">Sales</option>
      </Select>
    );
    expect(html).toContain('Department');
    expect(html).toContain('Engineering');
    expect(html).toContain('Sales');
  });

  it('renders validation error message on select', () => {
    const html = renderToString(
      <Select label="Country" error="Country selection is required">
        <option value="">Select country</option>
      </Select>
    );
    expect(html).toContain('Country selection is required');
    expect(html).toContain('border-red-500');
  });

  it('renders helper text when provided', () => {
    const html = renderToString(
      <Select label="Role" helperText="Assign initial operational access">
        <option value="HR_MANAGER">HR Manager</option>
      </Select>
    );
    expect(html).toContain('Assign initial operational access');
  });
});
