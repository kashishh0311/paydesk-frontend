import React, { useState } from 'react';
import { Card } from '../common/Card';
import { TrendingUp, BarChart3, Globe, DollarSign } from 'lucide-react';

export interface MonthlyTrendItem {
  period: string;
  label: string;
  count: number;
  spend: number;
  avgBase: number;
}

export interface DeptBreakdownItem {
  dept: string;
  employees: number;
  pct: number;
  avg: string;
  totalSpend: number;
}

export interface CountryBreakdownItem {
  country: string;
  currency: string;
  employees: number;
  pct: number;
  spend: string;
  totalSpend: number;
}

// -------------------------------------------------------------
// Helper for SVG smooth Bezier path
// -------------------------------------------------------------
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

function formatCurrencyCompact(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${val.toLocaleString()}`;
}

// -------------------------------------------------------------
// 1. Soft, Compact Payroll Trend Chart (Side-by-Side Ready)
// -------------------------------------------------------------
export const PayrollTrendChart: React.FC<{ data: MonthlyTrendItem[] }> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card title="Monthly Payroll Trend" subtitle="Live compensation progression">
        <div className="h-52 flex items-center justify-center text-muted text-xs">
          No historical payroll records available
        </div>
      </Card>
    );
  }

  // Compact dimensions for side-by-side layout
  const svgWidth = 520;
  const svgHeight = 170;
  const paddingLeft = 52;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 32;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const values = data.map((d) => d.spend);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const minVal = Math.max(0, rawMin * 0.92);
  const maxVal = rawMax * 1.05 || 1;

  const points = data.map((item, idx) => {
    const x = paddingLeft + (idx / Math.max(1, data.length - 1)) * chartWidth;
    const normalizedY = (item.spend - minVal) / (maxVal - minVal || 1);
    const y = paddingTop + chartHeight - normalizedY * chartHeight;
    return { x, y, item };
  });

  const linePath = createSmoothPath(points.map((p) => ({ x: p.x, y: p.y })));
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  // Soft grid tick marks (3 ticks)
  const yTicks = [0, 0.5, 1].map((pct) => {
    const val = minVal + pct * (maxVal - minVal);
    const y = paddingTop + chartHeight - pct * chartHeight;
    return { y, label: formatCurrencyCompact(val) };
  });

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <Card
      title="Monthly Payroll Progression"
      subtitle="12-month budget run-rate and salary actions"
      action={
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span>+16% Run-Rate</span>
        </span>
      }
    >
      <div className="space-y-3">
        {/* Soft Sub-header Strip */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-background border border-border text-xs">
          <div>
            <span className="text-muted">
              {hoveredIndex !== null ? activePoint.item.label : 'Current Run-Rate'}:
            </span>{' '}
            <strong className="text-foreground font-semibold">
              ${Math.round(activePoint.item.spend).toLocaleString()}
            </strong>
          </div>
          <div className="text-muted">
            <span>Avg Base: </span>
            <strong className="text-foreground font-medium">
              ${Math.round(activePoint.item.avgBase).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Compact Soft SVG Line Chart */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="softAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Grid Lines */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={tick.y}
                  x2={svgWidth - paddingRight}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 6}
                  y={tick.y + 3}
                  textAnchor="end"
                  fill="currentColor"
                  className="text-[10px] fill-muted font-mono"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#softAreaGrad)" />

            {/* Smooth Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Points and Labels */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              // Show label every 2 months or on hover to keep x-axis uncluttered
              const showLabel = idx % 2 === 0 || idx === points.length - 1 || isHovered;

              return (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 2.5}
                    fill={isHovered ? '#4f46e5' : '#818cf8'}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="transition-all duration-150"
                  />
                  {showLabel && (
                    <text
                      x={pt.x}
                      y={svgHeight - 8}
                      textAnchor="middle"
                      className={`text-[10px] font-medium transition-colors ${
                        isHovered ? 'fill-primary font-bold' : 'fill-muted'
                      }`}
                    >
                      {pt.item.label}
                    </text>
                  )}
                  {/* Invisible hit target for hover */}
                  <rect
                    x={pt.x - chartWidth / (data.length * 2)}
                    y={paddingTop}
                    width={chartWidth / data.length}
                    height={chartHeight + 20}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Card>
  );
};

// -------------------------------------------------------------
// 2. Simple, Soft Department Bar Chart (No Rainbow, Uniform Soft Bars)
// -------------------------------------------------------------
export const DepartmentBarChart: React.FC<{ data: DeptBreakdownItem[] }> = ({ data }) => {
  const maxSpend = Math.max(...(data || []).map((d) => d.totalSpend), 1);

  return (
    <Card
      title="Department Compensation Breakdown"
      subtitle="Spend and workforce distribution across operating departments"
      action={
        <span className="text-xs text-muted font-medium">
          {data?.length || 0} Departments
        </span>
      }
    >
      <div className="space-y-2.5">
        {(data || []).map((dept, idx) => {
          const barWidth = Math.max(6, Math.round((dept.totalSpend / maxSpend) * 100));

          return (
            <div
              key={dept.dept}
              className="p-2 rounded-xl hover:bg-background/80 transition-colors duration-150 border border-transparent hover:border-border/60"
            >
              <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-background border border-border flex items-center justify-center font-bold text-[10px] text-muted font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-foreground text-xs">{dept.dept}</span>
                  <span className="text-muted text-[11px]">
                    ({dept.employees.toLocaleString()} staff • {dept.pct}%)
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-muted text-[11px]">
                    Avg: <strong className="text-foreground">{dept.avg}</strong>
                  </span>
                  <span className="font-semibold text-foreground font-mono text-xs">
                    ${dept.totalSpend.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Simple, Soft Monochromatic Progress Track */}
              <div className="h-1.5 w-full rounded-full bg-background overflow-hidden border border-border/40">
                <div
                  className="h-full rounded-full bg-primary/75 hover:bg-primary transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// -------------------------------------------------------------
// 3. Simple, Soft Currency & Regional Allocation
// -------------------------------------------------------------
export const CurrencyDistributionChart: React.FC<{ data: CountryBreakdownItem[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const totalEmployees = data.reduce((acc, curr) => acc + curr.employees, 0);
  const maxEmployees = Math.max(...data.map((c) => c.employees), 1);

  return (
    <Card
      title="Global Currency & Region Allocation"
      subtitle="Headcount and compensation distributed across currency hubs"
      action={
        <div className="flex items-center gap-1 text-xs text-muted">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>{data.length} Regions</span>
        </div>
      }
    >
      <div className="space-y-2.5">
        {data.map((hub) => {
          const pct = Math.round((hub.employees / (totalEmployees || 1)) * 100);
          const barWidth = Math.max(6, Math.round((hub.employees / maxEmployees) * 100));

          return (
            <div
              key={hub.currency}
              className="p-2 rounded-xl hover:bg-background/80 transition-colors duration-150 border border-transparent hover:border-border/60"
            >
              <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-background border border-border font-mono font-bold text-[11px] text-primary shrink-0">
                    {hub.currency}
                  </span>
                  <span className="font-semibold text-foreground text-xs">{hub.country}</span>
                  <span className="text-muted text-[11px]">
                    ({hub.employees.toLocaleString()} staff • {pct}%)
                  </span>
                </div>
                <span className="font-mono font-semibold text-foreground text-xs shrink-0">
                  {hub.spend}
                </span>
              </div>

              {/* Simple, Soft Unified Bar */}
              <div className="h-1.5 w-full rounded-full bg-background overflow-hidden border border-border/40">
                <div
                  className="h-full rounded-full bg-sky-500/70 hover:bg-sky-500 transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
