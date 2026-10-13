import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`bg-card border border-border text-foreground rounded-xl p-4 sm:p-5 shadow-2xs transition-colors ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-3.5 pb-2.5 border-b border-border/60">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
