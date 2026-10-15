import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { ThemeProvider } from '../../context/ThemeContext';
import { Login } from '../Login';

if (typeof window === 'undefined') {
  (globalThis as any).window = {};
}
if (typeof localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
}

describe('Login Page Unit Tests', () => {
  it('renders login form elements and credentials fields', () => {
    const html = renderToString(
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );

    expect(html).toContain('PayDesk');
    expect(html).toContain('Work Email');
    expect(html).toContain('Password');
    expect(html).toContain('Sign In to PayDesk');
  });
});
