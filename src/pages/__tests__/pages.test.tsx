import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { AIAssistant } from '../AIAssistant';

describe('Page Components Render Tests', () => {
  it('renders AIAssistant page with initial greeting message and input box', () => {
    const html = renderToString(
      <Provider store={store}>
        <MemoryRouter>
          <AIAssistant />
        </MemoryRouter>
      </Provider>
    );

    expect(html).toContain('PayDesk AI Compensation Assistant');
    expect(html).toContain('Ask about salary distribution');
    expect(html).toContain('Ask AI');
  });
});
