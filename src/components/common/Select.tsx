import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  wrapperClassName?: string;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      wrapperClassName = '',
      id,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`w-full space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-foreground">
            {label}
          </label>
        )}

        <div className="relative group w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`peer w-full h-10 pl-3.5 pr-10 rounded-lg bg-input border text-foreground text-sm appearance-none cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-border'
            } ${className}`}
            {...props}
          >
            {children}
          </select>

          {/* Styled Filter Dropdown Arrow with padding, gray default, and light black on active/focus/hover */}
          <div className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-gray-500 transition-colors duration-150 peer-hover:text-gray-700 dark:peer-hover:text-gray-300 peer-focus:text-gray-800 dark:peer-focus:text-gray-100 peer-active:text-gray-900 group-hover:text-gray-700 dark:group-hover:text-gray-300">
            <ChevronDown className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        {error ? (
          <p className="text-[11px] text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
