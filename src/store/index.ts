import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { userReducer } from '../features/user';

const rootReducer = combineReducers({
  user: userReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
