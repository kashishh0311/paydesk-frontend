import React from 'react';
import { Inbox, AlertCircle, RefreshCw, Bot } from 'lucide-react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: 'shimmer' | 'pulse' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  width,
  height,
  animate = 'shimmer',
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'rounded-md h-4 w-full',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    rectangular: 'rounded-none',
  };

  const animStyles = {
    shimmer: 'skeleton-shimmer',
    pulse: 'animate-pulse bg-muted/20',
    none: 'bg-muted/20',
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  return (
    <div
      className={`${variantStyles[variant]} ${animStyles[animate]} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
      {...props}
    />
  );
};


export const KpiCardSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({
  count = 6,
  className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3.5',
}) => {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <Skeleton width="55%" height={13} />
              <Skeleton variant="rounded" width={28} height={28} className="rounded-lg" />
            </div>
            <div className="mt-3 space-y-1.5">
              <Skeleton width="75%" height={22} />
              <Skeleton width="85%" height={11} />
            </div>
          </div>
        ))}
      </div>
    );
  };

/* ==========================================================================
   Charts & Graph Skeleton
   ========================================================================== */
export const ChartSkeleton: React.FC<{
  title?: string;
  type?: 'trend' | 'department' | 'currency' | 'card';
  height?: number;
}> = ({ title, type = 'trend', height = 260 }) => {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4 pb-2.5 border-b border-border/60">
        <div className="space-y-1">
          {title ? (
            <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
          ) : (
            <Skeleton width={160} height={16} />
          )}
          <Skeleton width={220} height={12} />
        </div>
        <Skeleton width={80} height={24} className="rounded-lg" />
      </div>

      {type === 'trend' && (
        <div className="space-y-3" style={{ minHeight: height }}>
          <div className="flex justify-between items-center px-1">
            <Skeleton width={140} height={16} />
            <Skeleton width={100} height={14} />
          </div>
          <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-border/40">
            {[45, 60, 50, 75, 65, 80, 70, 90, 85, 95, 88, 100].map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <Skeleton
                  width="100%"
                  height={`${h}%`}
                  className="rounded-t-md opacity-75"
                />
                <Skeleton width="70%" height={8} />
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'department' && (
        <div className="space-y-2.5" style={{ minHeight: height }}>
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-background/60 border border-border/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1">
                <Skeleton width={20} height={20} className="rounded-md shrink-0" />
                <Skeleton width={110} height={13} />
                <Skeleton width="40%" height={8} className="rounded-full hidden sm:block" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Skeleton width={70} height={12} className="font-mono hidden md:block" />
                <Skeleton width={85} height={14} className="font-mono" />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'currency' && (
        <div className="space-y-2.5" style={{ minHeight: height }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-background/60 border border-border/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton width={24} height={18} className="rounded shrink-0" />
                <Skeleton width={90} height={13} />
                <Skeleton width="35%" height={6} className="rounded-full hidden sm:block" />
              </div>
              <Skeleton width={75} height={13} className="font-mono shrink-0" />
            </div>
          ))}
        </div>
      )}

      {type === 'card' && (
        <div className="space-y-3" style={{ minHeight: height }}>
          <Skeleton width="100%" height={height - 50} />
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   Table Row & Full Table Skeletons
   ========================================================================== */
export const TableRowSkeleton: React.FC<{
  columns: number;
  rows?: number;
}> = ({ columns, rows = 6 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="hover:bg-background/40 transition">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="py-3 px-3.5">
              <Skeleton
                width={colIdx === 0 ? '60%' : colIdx === columns - 1 ? '40%' : '75%'}
                height={14}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  showPagination?: boolean;
}> = ({
  columns = 6,
  rows = 8,
  showHeader = true,
  showPagination = true,
}) => {
    return (
      <div className="bg-card border border-border text-foreground rounded-xl shadow-2xs overflow-hidden">
        {showHeader && (
          <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton width={160} height={16} />
              <Skeleton width={220} height={12} />
            </div>
            <Skeleton width={90} height={32} className="rounded-lg" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted border-b border-border uppercase tracking-wider text-xs">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="py-3 px-3.5">
                    <Skeleton width={i === 0 ? 60 : 80} height={12} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              <TableRowSkeleton columns={columns} rows={rows} />
            </tbody>
          </table>
        </div>
        {showPagination && (
          <div className="p-3.5 border-t border-border flex items-center justify-between">
            <Skeleton width={120} height={12} />
            <div className="flex items-center gap-2">
              <Skeleton width={32} height={32} className="rounded-lg" />
              <Skeleton width={32} height={32} className="rounded-lg" />
            </div>
          </div>
        )}
      </div>
    );
  };


export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({
  title = 'No records found',
  description = 'No data matching your current filters or criteria.',
  icon,
  action,
  className = '',
}) => {
    return (
      <div className={`py-12 px-4 flex flex-col items-center justify-center text-center space-y-2.5 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-muted/10 border border-border flex items-center justify-center text-muted">
          {icon || <Inbox className="w-5 h-5" />}
        </div>
        <h4 className="text-sm font-semibold text-foreground tracking-tight">{title}</h4>
        <p className="text-xs text-muted max-w-sm">{description}</p>
        {action && <div className="pt-2">{action}</div>}
      </div>
    );
  };

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Failed to load records',
  message = 'An unexpected error occurred while communicating with the database.',
  onRetry,
  className = '',
}) => {
    return (
      <div className={`p-6 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center flex flex-col items-center justify-center space-y-2.5 ${className}`}>
        <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h4>
        <p className="text-xs text-muted max-w-md">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover text-xs font-semibold shadow-xs transition mt-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Request
          </button>
        )}
      </div>
    );
  };


export const EmployeeDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-card border border-border space-y-2">
            <Skeleton width="60%" height={11} />
            <Skeleton width="80%" height={20} />
            <Skeleton width="50%" height={10} />
          </div>
        ))}
      </div>

      {/* Verified Salary Structure Components */}
      <div className="p-3.5 rounded-xl bg-background border border-border space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton width={180} height={14} />
          <Skeleton width={100} height={12} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border/80 space-y-1.5">
              <Skeleton width="70%" height={10} />
              <Skeleton width="85%" height={14} />
              <Skeleton width="50%" height={10} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <Skeleton width={140} height={12} />
          <Skeleton width={140} height={12} />
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   Salary Structure Management Skeleton
   ========================================================================== */
export const SalaryStructureSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Employee Badge Summary */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" width={48} height={48} className="rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton width={140} height={18} />
              <Skeleton width={70} height={18} className="rounded-md" />
            </div>
            <Skeleton width={220} height={12} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="space-y-1 text-right">
            <Skeleton width={120} height={11} />
            <Skeleton width={110} height={22} />
          </div>
          <div className="space-y-1 text-right border-l border-border pl-4">
            <Skeleton width={110} height={11} />
            <Skeleton width={100} height={22} />
          </div>
        </div>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border space-y-2">
            <Skeleton width="60%" height={12} />
            <Skeleton width="75%" height={22} />
            <Skeleton width="50%" height={11} />
          </div>
        ))}
      </div>

      {/* Monthly Breakdown & Leave cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-4 rounded-xl bg-card border border-border space-y-3">
          <Skeleton width={180} height={16} />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-border/40">
                <Skeleton width="40%" height={12} />
                <Skeleton width="25%" height={12} />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <Skeleton width={130} height={16} />
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-background border border-border space-y-1">
                <Skeleton width="60%" height={12} />
                <Skeleton width="40%" height={18} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   Salary Slips History Skeleton
   ========================================================================== */
export const SalarySlipsHistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" width={40} height={40} className="rounded-lg" />
          <div className="space-y-1">
            <Skeleton width={150} height={16} />
            <Skeleton width={180} height={12} />
          </div>
        </div>
        <Skeleton width={110} height={28} className="rounded-lg" />
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-3.5 border-b border-border">
          <Skeleton width={140} height={14} />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-muted border-b border-border uppercase text-xs">
            <tr>
              <th className="py-2.5 px-3"><Skeleton width={80} height={12} /></th>
              <th className="py-2.5 px-3"><Skeleton width={70} height={12} /></th>
              <th className="py-2.5 px-3"><Skeleton width={90} height={12} /></th>
              <th className="py-2.5 px-3"><Skeleton width={70} height={12} /></th>
              <th className="py-2.5 px-3 text-right"><Skeleton width={60} height={12} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <TableRowSkeleton columns={5} rows={5} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ==========================================================================
   AI Assistant Thinking Skeleton
   ========================================================================== */
export const AIAssistantMessageSkeleton: React.FC = () => {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/80 max-w-2xl animate-in fade-in duration-200">
      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 animate-pulse" />
      </div>
      <div className="space-y-2 flex-1 pt-1">
        <div className="flex items-center gap-2">
          <Skeleton width={110} height={12} />
          <span className="text-[10px] text-primary font-mono animate-pulse font-semibold">Evaluating database records...</span>
        </div>
        <Skeleton width="92%" height={12} />
        <Skeleton width="85%" height={12} />
        <Skeleton width="65%" height={12} />
      </div>
    </div>
  );
};

/* ==========================================================================
   Complete Dashboard Skeleton (Includes 3-3 Wrap on 1300-1400px screen)
   ========================================================================== */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 w-full animate-in fade-in duration-200">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs">
        <div className="space-y-1.5">
          <Skeleton width={240} height={20} />
          <Skeleton width={320} height={12} />
        </div>
        <Skeleton width={140} height={28} className="rounded-lg" />
      </div>

      {/* 6 Summary KPI Cards Grid (Wraps 3-3 on 1300-1400px screen) */}
      <KpiCardSkeleton
        count={6}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3.5"
      />

      {/* Row 1: Charts (Monthly Trend & Department Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartSkeleton title="Monthly Payroll Progression" type="trend" />
        <ChartSkeleton title="Department Compensation Breakdown" type="department" />
      </div>

      {/* Row 2: Charts (Currency Regions & Recent Audit Trail) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartSkeleton title="Global Currency Distribution" type="currency" />
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4 pb-2.5 border-b border-border/60">
            <div className="space-y-1">
              <Skeleton width={180} height={16} />
              <Skeleton width={220} height={12} />
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted border-b border-border uppercase tracking-wider text-xs">
              <tr>
                <th className="py-2.5 px-3"><Skeleton width={60} height={11} /></th>
                <th className="py-2.5 px-3"><Skeleton width={50} height={11} /></th>
                <th className="py-2.5 px-3"><Skeleton width={80} height={11} /></th>
                <th className="py-2.5 px-3 text-right"><Skeleton width={50} height={11} /></th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              <TableRowSkeleton columns={4} rows={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   Analytics Page Skeleton
   ========================================================================== */
export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 w-full animate-in fade-in duration-200">
      <div>
        <Skeleton width={260} height={22} />
        <Skeleton width={380} height={12} className="mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton width="50%" height={12} />
              <Skeleton variant="rounded" width={24} height={24} className="rounded-md" />
            </div>
            <Skeleton width="65%" height={24} />
            <Skeleton width="85%" height={11} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartSkeleton title="Country Payroll Allocation" type="currency" />
        <ChartSkeleton title="Compensation Quartiles" type="department" />
      </div>
    </div>
  );
};

/* ==========================================================================
   Full App Shell Skeleton (Sidebar + Topbar + Page) for Auth resolution
   ========================================================================== */
export const AppShellSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex antialiased">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/95 fixed inset-y-0 z-40">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" width={32} height={32} className="rounded-lg" />
            <div className="space-y-1">
              <Skeleton width={80} height={14} />
              <Skeleton width={90} height={10} />
            </div>
          </div>
        </div>
        <div className="flex-1 px-3 py-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl">
              <Skeleton variant="rounded" width={18} height={18} className="rounded-md" />
              <Skeleton width={120} height={14} />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-background border border-border">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="space-y-1 flex-1">
              <Skeleton width={80} height={12} />
              <Skeleton width={50} height={10} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area Skeleton */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-card/90 border-b border-border px-4 lg:px-[30px] flex items-center justify-between">
          <Skeleton width={32} height={32} className="rounded-lg lg:hidden" />
          <div className="hidden lg:block"></div>
          <div className="flex items-center gap-3">
            <Skeleton width={100} height={14} className="hidden md:block" />
            <Skeleton variant="rounded" width={32} height={32} className="rounded-xl" />
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton width={80} height={12} className="hidden lg:inline-block" />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-[30px] py-4 lg:py-[30px] w-full flex flex-col">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
};
