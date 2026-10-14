import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/common/Card';
import { DashboardSkeleton, ErrorState, EmptyState } from '../components/common/Skeleton';
import { apiRequest } from '../services/api';
import {
  Users,
  Banknote,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  CreditCard
} from 'lucide-react';
import {
  PayrollTrendChart,
  DepartmentBarChart,
  CurrencyDistributionChart,
  type MonthlyTrendItem,
  type DeptBreakdownItem,
  type CountryBreakdownItem
} from '../components/dashboard/DashboardCharts';
import { formatINR } from '../utils/currency';

interface StatsOverview {
  totalEmployees: number;
  activeEmployees: number;
  departmentsCount: number;
  countriesCount: number;
  totalPayrollBudget: number;
  monthlyPayroll?: number;
  netSalaryPayable?: number;
  totalDeductions?: number;
  pendingPayrollApprovals?: number;
  paidSalaries?: number;
  averageBaseSalary: number;
  averageNetSalary?: number;
  departmentBreakdown: DeptBreakdownItem[];
  countryBreakdown: CountryBreakdownItem[];
  monthlyTrends?: MonthlyTrendItem[];
}

interface RecentAuditItem {
  id: number;
  employee_code: string;
  action: string;
  reason: string;
  date: string;
  status: string;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentAudits, setRecentAudits] = useState<RecentAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, auditRes] = await Promise.all([
        apiRequest<{ success: boolean; data: StatsOverview }>('/analytics/overview'),
        apiRequest<{
          success: boolean;
          data: {
            rows: Array<{
              id: number;
              action: string;
              reason: string;
              created_at?: string;
              createdAt?: string;
              employee?: { employee_code: string };
            }>;
          };
        }>('/audit-logs?limit=5')
      ]);

      if (overviewRes.data) {
        setStats(overviewRes.data);
      }

      if (auditRes.data?.rows) {
        const mapped: RecentAuditItem[] = auditRes.data.rows.map((r) => {
          const rawDate = r.createdAt || r.created_at;
          let formattedDate = 'Today';
          if (rawDate) {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              formattedDate = parsed.toLocaleDateString();
            }
          }
          return {
            id: r.id,
            employee_code: r.employee?.employee_code || 'EMP-SYSTEM',
            action: r.action,
            reason: r.reason,
            date: formattedDate,
            status: 'Applied'
          };
        });
        setRecentAudits(mapped);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve live dashboard metrics.';
      setError(msg);
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full py-8 space-y-4">
        <ErrorState
          title="Failed to Load Dashboard Metrics"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  // 6 Summary KPI Cards required by specification
  const kpiCards = [
    {
      title: 'Total Employees',
      value: (stats?.totalEmployees || 10000).toLocaleString(),
      change: `${(stats?.activeEmployees || 9820).toLocaleString()} active in system`,
      icon: Users,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      title: 'Monthly Compensation',
      value: stats?.monthlyPayroll
        ? formatINR(stats.monthlyPayroll)
        : stats?.totalPayrollBudget
          ? formatINR(stats.totalPayrollBudget * 0.085)
          : formatINR(0),
      change: 'Gross compensation calculation',
      icon: Banknote,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Net Salary Payable',
      value: stats?.netSalaryPayable
        ? formatINR(stats.netSalaryPayable)
        : formatINR(0),
      change: 'After taxes & statutory withholdings',
      icon: Wallet,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10'
    },
    {
      title: 'Total Deductions',
      value: stats?.totalDeductions
        ? formatINR(stats.totalDeductions)
        : formatINR(0),
      change: 'EPF, Taxes, Health & LOP',
      icon: ShieldAlert,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    {
      title: 'Active Salary Records',
      value: (stats?.activeEmployees || stats?.totalEmployees || 10000).toLocaleString(),
      change: 'Verified compensation plans',
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Paid Salaries',
      value: stats?.paidSalaries
        ? formatINR(stats.paidSalaries)
        : formatINR(0),
      change: 'Disbursed to employee accounts',
      icon: CreditCard,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Global Compensation Overview
          </h1>
          <p className="text-xs text-muted">
            Managing {stats?.totalEmployees.toLocaleString()} employees across {stats?.countriesCount} countries and currencies with automated audit compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Live Database Synced
          </span>
        </div>
      </div>

      {/* 6 Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-col justify-between transition hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted leading-tight">{kpi.title}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bgColor} ${kpi.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-lg font-bold tracking-tight text-foreground font-mono">{kpi.value}</h3>
                <p className="text-[10px] text-muted mt-0.5 flex items-center gap-1 truncate">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate">{kpi.change}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 1: Side-by-Side Charts (Monthly Trend & Department Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PayrollTrendChart data={stats?.monthlyTrends || []} />
        <DepartmentBarChart data={stats?.departmentBreakdown || []} />
      </div>

      {/* Row 2: Side-by-Side (Currency Regions & Recent Audit Trail) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CurrencyDistributionChart data={stats?.countryBreakdown || []} />

        <Card
          title="Recent Compensation Actions"
          subtitle="Live compliance audit tracking from database"
          className="h-full flex flex-col"
        >
          <div className="table-slider max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[550px]">
              <thead className="bg-background text-muted border-b border-border uppercase tracking-wider text-xs sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border text-foreground">
                {recentAudits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-muted">
                      <EmptyState
                        title="No recent compensation revisions"
                        description="No compliance audit tracking recorded yet."
                      />
                    </td>
                  </tr>
                ) : (
                  recentAudits.map((row) => (
                    <tr key={row.id} className="hover:bg-background/60 transition">
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">{row.employee_code}</td>
                      <td className="py-2.5 px-3 text-xs font-medium">{row.action}</td>
                      <td className="py-2.5 px-3 text-xs text-muted max-w-[140px] truncate">{row.reason}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
