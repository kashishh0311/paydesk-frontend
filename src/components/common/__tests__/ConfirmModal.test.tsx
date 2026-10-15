import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ConfirmModal } from '../ConfirmModal';

describe('ConfirmModal Component Unit Tests', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToString(
      <ConfirmModal
        isOpen={false}
        title="Delete Record"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders modal dialog content when isOpen is true', () => {
    const html = renderToString(
      <ConfirmModal
        isOpen={true}
        title="Permanently Delete Employee"
        message="This will cascade delete all salary history and payroll records."
        confirmText="Yes, Delete"
        cancelText="Keep Employee"
        variant="danger"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(html).toContain('Permanently Delete Employee');
    expect(html).toContain('cascade delete all salary history');
    expect(html).toContain('Yes, Delete');
    expect(html).toContain('Keep Employee');
  });
});
