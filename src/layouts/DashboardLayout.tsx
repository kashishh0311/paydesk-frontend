import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../features/user';
import { useTheme } from '../context/ThemeContext';
import { showInfoToast } from '../utils/toast';
import {
  LayoutDashboard,
  Users,
  Banknote,
  BarChart3,
  ClipboardList,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAppSelector((state) => state.user);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSalaryMenuOpen, setIsSalaryMenuOpen] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Live Time & Date matching screenshot style
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
      const dayStr = now.toLocaleDateString([], { weekday: 'long' });
      setCurrentDateTime(`${timeStr}, ${dayStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    showInfoToast('You have been signed out.');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Salary Management', path: '/salaries', icon: Banknote },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
    { name: 'AI Salary Assistant', path: '/ai-assistant', icon: Sparkles },
  ];

  // User initials for avatar
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'HR';

  // Safe role string for rendering
  const roleName = typeof currentUser?.role === 'object' && currentUser?.role !== null
    ? (currentUser.role as { id: number; name: string }).name
    : (typeof currentUser?.role === 'string' ? currentUser.role : 'HR_MANAGER');

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on Desktop, Slide-over on Mobile) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground font-mono">PAYDESK</span>
              <span className="text-[10px] block text-muted uppercase tracking-wider font-semibold">HR Compensation</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSalaries = item.path === '/salaries';
            const isActive = isSalaries ? location.pathname.startsWith('/salaries') : location.pathname === item.path;

            if (isSalaries) {
              const currentTab = new URLSearchParams(location.search).get('tab') || 'employee-salary';
              const salarySubItems = [
                { name: 'Employee Salary', tab: 'employee-salary' },
                { name: 'Salary Structure', tab: 'salary-structure' },
                { name: 'Salary Deductions', tab: 'salary-deductions' },
                { name: 'Increments & Bonuses', tab: 'increments-bonuses' },
                { name: 'Salary Slips & History', tab: 'salary-slips' }
              ];

              return (
                <div key={item.path} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!location.pathname.startsWith('/salaries')) {
                        navigate('/salaries?tab=employee-salary');
                        setIsSalaryMenuOpen(true);
                      } else {
                        setIsSalaryMenuOpen((prev) => !prev);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30 font-semibold'
                        : 'text-muted hover:text-foreground hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted'}`} />
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${isSalaryMenuOpen && isActive ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Collapsible Submenu: Toggles on click */}
                  {isActive && isSalaryMenuOpen && (
                    <div className="pl-5 pr-2 pt-2.5 pb-2 space-y-2 border-l-2 border-primary/20 ml-5 my-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      {salarySubItems.map((sub) => {
                        const isSubActive = currentTab === sub.tab || (sub.tab === 'salary-deductions' && currentTab === 'deductions-lop');
                        return (
                          <NavLink
                            key={sub.tab}
                            to={`/salaries?tab=${sub.tab}`}
                            className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              isSubActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-muted hover:text-foreground hover:bg-background/60'
                            }`}
                          >
                            {sub.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/30 font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-background'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer with User Pill */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-foreground truncate">{currentUser?.name || 'HR Manager'}</p>
                <p className="text-[10px] text-muted truncate uppercase font-mono">{roleName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-card transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/90 backdrop-blur-md border-b border-border px-4 lg:px-[30px] flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg border border-border text-muted hover:text-foreground lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Time & Date */}
            {currentDateTime && (
              <div className="hidden md:flex flex-col text-right pr-2">
                <span className="text-xs font-semibold text-foreground">{currentDateTime.split(',')[0]}</span>
                <span className="text-[11px] text-muted">{currentDateTime.split(',')[1]}</span>
              </div>
            )}

            {/* Light / Dark Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-background border border-border text-muted hover:text-foreground transition"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* User Avatar Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {initials}
              </div>
              <span className="text-xs font-semibold text-foreground hidden lg:inline-block max-w-[120px] truncate">
                {currentUser?.name || 'HR Manager'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 px-4 lg:px-[30px] py-4 lg:py-[30px] w-full flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
