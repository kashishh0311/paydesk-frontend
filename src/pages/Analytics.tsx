import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { TrendingUp, DollarSign, Globe, Loader2 } from 'lucide-react';
import { apiRequest } from '../services/api';

interface CountryItem {
  country: string;
  currency: string;
  employees: number;
  pct: number;
  spend: string;
  totalSpend: number;
}

interface QuartileItem {
  band: string;
  range: string;
  count: number;
  color: string;
}

interface AnalyticsData {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  departmentsCount: number;
  countriesCount: number;
  totalPayrollBudget: number;
  averageBaseSalary: number;
  medianBaseSalary: number;
  countryBreakdown: CountryItem[];
  quartiles: QuartileItem[];
}

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiRequest<{ success: boolean; data: AnalyticsData }>('/analytics/overview');
        if (res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted">Calculating compensation aggregations across workforce records...</p>
      </div>
    );
  }

  const budgetFormatted = data?.totalPayrollBudget
    ? `$${Math.round(data.totalPayrollBudget).toLocaleString()}`
    : '$0';

  const medianFormatted = data?.medianBaseSalary
    ? `$${Math.round(data.medianBaseSalary).toLocaleString()}`
    : '$0';

  const hubsCount = data?.countriesCount || 8;

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Compensation Analytics & Reports</h1>
        <p className="text-xs text-muted mt-0.5">
          Organizational payroll metrics, international cost distributions, and median compensation analysis.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Global Payroll Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground font-mono">{budgetFormatted}</h3>
          <p className="text-[11px] text-muted">
            Total verified compensation across {data?.totalEmployees.toLocaleString() || '10,000'} staff
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Median Global Base</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground font-mono">{medianFormatted}</h3>
          <p className="text-[11px] text-muted">Normalized USD equivalent across all active regions</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>International Regions</span>
            <Globe className="w-4 h-4 text-sky-500" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">{hubsCount} Operating Hubs</h3>
          <p className="text-[11px] text-muted">Global compensation hubs synced with database records</p>
        </div>
      </div>

      {/* Country Spend Distribution & Quartiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Country Payroll Allocation" subtitle="Normalized annual spend per geographical region">
          <div className="space-y-3">
            {(data?.countryBreakdown || []).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{item.country}</span>
                  <span className="text-muted">
                    {item.employees.toLocaleString()} staff • <strong className="text-foreground font-mono">{item.spend}</strong>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-background overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-primary/75 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, item.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Salary Quartiles & Pay Bands" subtitle="Workforce distribution across compensation brackets">
          <div className="space-y-2.5">
            {(data?.quartiles || []).map((b, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${b.color}`} />
                    <span className="font-semibold text-foreground">{b.band}</span>
                  </div>
                  <span className="font-mono text-muted text-[11px]">{b.count.toLocaleString()} staff</span>
                </div>
                <p className="text-[11px] text-muted pl-4">
                  Salary Band: <strong className="text-foreground font-mono">{b.range}</strong>
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
