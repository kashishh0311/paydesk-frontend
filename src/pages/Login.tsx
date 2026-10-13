import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError } from '../features/user';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { Mail, Lock, ShieldCheck, Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const { isLoading, currentUser } = useAppSelector((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(loginUser({ email: email.trim(), password }));

    if (loginUser.fulfilled.match(result)) {
      showSuccessToast(`Welcome back, ${result.payload.name}!`);
      navigate('/dashboard', { replace: true });
    } else if (loginUser.rejected.match(result)) {
      const errorMsg = result.payload || 'Invalid email or password.';
      showErrorToast(errorMsg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4 py-10 transition-colors relative">
      <div className="absolute top-6 right-6">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-foreground shadow-sm transition"
          aria-label="Toggle light/dark theme"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-lg shadow-indigo-600/25 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">PayDesk</h1>
          <p className="text-sm text-muted mt-1">Enterprise Salary & Compensation Management</p>
        </div>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Sign In</h2>
            <p className="text-xs text-muted mt-1">Access the HR compensation oversight portal</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Sign In to PayDesk
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
