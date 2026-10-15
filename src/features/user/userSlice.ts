import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserState, LoginCredentials, User } from './types';
import { userService } from './userService';

const hasStoredToken = typeof window !== 'undefined' ? Boolean(localStorage.getItem('paydesk_token')) : false;

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  isInitialLoading: hasStoredToken,
  error: null,
};

export const loginUser = createAsyncThunk<User, LoginCredentials, { rejectValue: string }>(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const user = await userService.login(credentials);
      return user;
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue('Authentication failed.');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<User | null>(
  'user/fetchCurrent',
  async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('paydesk_token') : null;
    if (!token) {
      return null;
    }
    return await userService.getMe();
  }
);

export const logoutUser = createAsyncThunk<void>(
  'user/logout',
  async () => {
    await userService.logout();
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.currentUser = action.payload;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Login failed.';
    });

    // fetchCurrentUser
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isInitialLoading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
      state.isInitialLoading = false;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.currentUser = null;
      state.isInitialLoading = false;
    });

    // logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.currentUser = null;
      state.error = null;
      state.isLoading = false;
    });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
