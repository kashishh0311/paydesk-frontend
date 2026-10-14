import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchCurrentUser } from './features/user';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Salaries } from './pages/Salaries';
import { Analytics } from './pages/Analytics';
import { AuditLogs } from './pages/AuditLogs';
import { AIAssistant } from './pages/AIAssistant';
import { NotFound } from './pages/NotFound';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShellSkeleton } from './components/common/Skeleton';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isInitialLoading } = useAppSelector((state) => state.user);

  if (isInitialLoading) {
    return <AppShellSkeleton />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isInitialLoading } = useAppSelector((state) => state.user);

  if (isInitialLoading) {
    return <AppShellSkeleton />;
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function CatchAllRoute() {
  const { currentUser, isInitialLoading } = useAppSelector((state) => state.user);

  if (isInitialLoading) {
    return <AppShellSkeleton />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <NotFound />;
}

function AppContent() {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Dashboard & App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="salaries" element={<Salaries />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          {/* If a logged-in user accesses an undefined route inside layout */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Global Fallback: redirects to /login if unauthenticated, shows NotFound if authenticated */}
        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
      <ToastContainer
        position="bottom-center"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}
