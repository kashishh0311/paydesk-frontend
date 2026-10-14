import { apiRequest } from '../../services/api';
import type { LoginCredentials, User } from './types';

interface AuthApiResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token?: string;
  };
}

export const userService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const res = await apiRequest<AuthApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!res.data?.user) {
      throw new Error(res.message || 'Login failed.');
    }

    if (res.data.token) {
      localStorage.setItem('paydesk_token', res.data.token);
    }

    return res.data.user;
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: { user: User } }>('/auth/me', {
        method: 'GET',
      });
      return res.data?.user || null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem('paydesk_token');
    }
  },
};
