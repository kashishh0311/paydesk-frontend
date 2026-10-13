export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string | Role | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
}
