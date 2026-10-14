const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = API_BASE_URL + endpoint;

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('paydesk_token') || localStorage.getItem('token'))
    : null;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = 'Bearer ' + token;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // credentials: 'include' ensures httpOnly cookies (paydesk_token) are sent with every request
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || ('Request failed with status ' + response.status);
    throw new Error(errorMsg);
  }

  return data;
}
