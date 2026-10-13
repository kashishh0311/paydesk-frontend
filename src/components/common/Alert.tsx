import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'info' | 'warning';
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'error',
  message,
  className = '',
}) => {
  const styles = {
    error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-200',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-200',
    info: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-200',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-200',
  };

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
  };

  return (
    <div className={`p-3.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1">{message}</div>
    </div>
  );
};
