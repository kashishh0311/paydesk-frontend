import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  PayrollTrendChart,
  DepartmentBarChart,
  CurrencyDistributionChart,
  type MonthlyTrendItem,
  type DeptBreakdownItem,
  type CountryBreakdownItem
} from '../DashboardCharts';

describe('DashboardCharts Unit Tests', () => {
  const mockTrendData: MonthlyTrendItem[] = [
    { period: '2026-08', label: "Aug '26", count: 10000, spend: 2000000000, avgBase: 85000 },
    { period: '2026-09', label: "Sep '26", count: 10000, spend: 2100000000, avgBase: 86000 },
    { period: '2026-10', label: "Oct '26", count: 10000, spend: 2200000000, avgBase: 87000 }
  ];

  const mockDeptData: DeptBreakdownItem[] = [
    { dept: 'Engineering', employees: 3500, pct: 35, avg: '₹95,000.00', totalSpend: 332500000 },
    { dept: 'Sales', employees: 2500, pct: 25, avg: '₹80,000.00', totalSpend: 200000000 }
  ];

  const mockCountryData: CountryBreakdownItem[] = [
    { country: 'India', currency: 'INR', employees: 6000, pct: 60, spend: '₹57,00,00,000', totalSpend: 570000000 },
    { country: 'United States', currency: 'USD', employees: 2000, pct: 20, spend: '$19,000,000', totalSpend: 19000000 }
  ];

  it('renders PayrollTrendChart with SVG bars and tick marks', () => {
    const html = renderToString(<PayrollTrendChart data={mockTrendData} />);
    expect(html).toContain('Monthly Payroll Progression');
    expect(html).toContain('<svg');
    expect(html).toContain('Avg Base:');
  });

  it('renders empty state when PayrollTrendChart data is empty', () => {
    const html = renderToString(<PayrollTrendChart data={[]} />);
    expect(html).toContain('No historical compensation records available');
  });

  it('renders DepartmentBarChart with department names and progress bars', () => {
    const html = renderToString(<DepartmentBarChart data={mockDeptData} />);
    expect(html).toContain('Department Compensation Breakdown');
    expect(html).toContain('Engineering');
    expect(html).toContain('Sales');
    expect(html).toContain('3,500');
  });

  it('renders CurrencyDistributionChart with currency badges and employee counts', () => {
    const html = renderToString(<CurrencyDistributionChart data={mockCountryData} />);
    expect(html).toContain('Global Currency &amp; Region Allocation');
    expect(html).toContain('India');
    expect(html).toContain('United States');
    expect(html).toContain('INR');
    expect(html).toContain('USD');
  });
});
