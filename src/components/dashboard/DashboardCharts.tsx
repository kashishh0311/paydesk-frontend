import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Globe } from 'lucide-react';
import { formatINR } from '../../utils/currency';

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

function formatCurrencyCompact(val: number): string {
  return formatINR(val, { compact: true });
}

// -------------------------------------------------------------
// 1. Simple, Clean Monthly Payroll Bar Chart (Monochromatic)
// -------------------------------------------------------------
export const PayrollTrendChart: React.FC<{ data: MonthlyTrendItem[] }> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card title="Monthly Compensation Trend" subtitle="Live salary expenditure progression">
        <div className="h-52 flex items-center justify-center text-muted text-xs">
          No historical compensation records available
        </div>
      </Card>
    );
  }

  const svgWidth = 580;
  const svgHeight = 200;
  const paddingLeft = 75;
  const paddingRight = 20;
  const paddingTop = 18;
  const paddingBottom = 26;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const values = data.map((d) => d.spend);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const minVal = Math.max(0, rawMin * 0.90);
  const maxVal = rawMax * 1.04 || 1;

  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(20, Math.max(14, slotWidth * 0.52));

  const items = data.map((item, idx) => {
    const centerX = paddingLeft + (idx + 0.5) * slotWidth;
    const normalizedY = (item.spend - minVal) / (maxVal - minVal || 1);
    const barHeight = Math.max(8, normalizedY * chartHeight);
    const y = paddingTop + chartHeight - barHeight;
    return {
      idx,
      item,
      centerX,
      barX: centerX - barWidth / 2,
      barY: y,
      barHeight,
      slotX: paddingLeft + idx * slotWidth
    };
  });

  // Grid tick marks (3 ticks)
  const yTicks = [0, 0.5, 1].map((pct) => {
    const val = minVal + pct * (maxVal - minVal);
    const y = paddingTop + chartHeight - pct * chartHeight;
    return { y, label: formatCurrencyCompact(val) };
  });

  const activeIndex = hoveredIndex !== null ? hoveredIndex : items.length - 1;
  const activeItem = items[activeIndex];

  return (
    <Card
      title="Monthly Payroll Progression"
      subtitle="12-month budget run-rate and salary actions"
      className="h-full flex flex-col justify-between"
      action={
        <span className="text-xs text-muted font-medium">
          12-Month Progression
        </span>
      }
    >
      <div className="space-y-3">
        {/* Simple Clean Sub-header */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-background border border-border text-xs">
          <div>
            <span className="text-muted">
              {hoveredIndex !== null ? activeItem.item.label : 'Current Month'}:
            </span>{' '}
            <strong className="text-foreground font-semibold font-mono">
              {formatINR(activeItem.item.spend)}
            </strong>
          </div>
          <div className="text-muted">
            <span>Avg Base: </span>
            <strong className="text-foreground font-medium font-mono">
              {formatINR(activeItem.item.avgBase)}
            </strong>
          </div>
        </div>

        {/* Clean, Simple Monochromatic Bar Chart */}
        <div className="relative w-full select-none pt-0.5">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Subtle Grid Guidelines */}
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
                  x={paddingLeft - 8}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  fill="currentColor"
                  className="text-[10px] fill-muted font-mono"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Simple Clean Uniform Bars */}
            {items.map((it) => {
              const isHovered = hoveredIndex === it.idx;

              return (
                <g key={it.idx}>
                  <rect
                    x={it.barX}
                    y={it.barY}
                    width={barWidth}
                    height={it.barHeight}
                    rx="3"
                    ry="3"
                    fill="#4f46e5"
                    className="transition-opacity duration-150"
                    opacity={isHovered ? 1 : 0.8}
                  />

                  {/* Interactive Hit Box */}
                  <rect
                    x={it.slotX}
                    y={paddingTop - 10}
                    width={slotWidth}
                    height={chartHeight + 35}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(it.idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}

            {/* X-Axis Month Labels */}
            {items.map((it) => {
              const isHovered = hoveredIndex === it.idx;
              const showLabel = it.idx % 2 === 0 || it.idx === items.length - 1 || isHovered;

              return (
                <g key={`lbl-${it.idx}`}>
                  {showLabel && (
                    <text
                      x={it.centerX}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-medium transition-colors ${
                        isHovered ? 'fill-primary font-bold' : 'fill-muted'
                      }`}
                    >
                      {it.item.label}
                    </text>
                  )}
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
// 2. Department Bar Chart with Custom Blue Scrollbar
// -------------------------------------------------------------
export const DepartmentBarChart: React.FC<{ data: DeptBreakdownItem[] }> = ({ data }) => {
  const maxSpend = Math.max(...(data || []).map((d) => d.totalSpend), 1);

  return (
    <Card
      title="Department Compensation Breakdown"
      subtitle="Spend and workforce distribution across operating departments"
      className="h-full flex flex-col"
      action={
        <span className="text-xs text-muted font-medium">
          {data?.length || 0} Departments
        </span>
      }
    >
      <div className="flex-1 space-y-1 overflow-y-auto pr-1.5 custom-scrollbar">
        {(data || []).map((dept, idx) => {
          const barWidth = Math.max(6, Math.round((dept.totalSpend / maxSpend) * 100));

          return (
            <div
              key={dept.dept}
              className="p-1.5 rounded-lg hover:bg-background/80 transition-colors duration-150 border border-transparent hover:border-border/60"
            >
              <div className="flex items-center justify-between text-xs mb-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-background border border-border flex items-center justify-center font-bold text-[9px] text-muted font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-foreground text-xs">{dept.dept}</span>
                  <span className="text-muted text-[11px]">
                    ({dept.employees.toLocaleString()} staff • {dept.pct}%)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted text-[11px]">
                    Avg: <strong className="text-foreground">{dept.avg}</strong>
                  </span>
                  <span className="font-semibold text-foreground font-mono text-xs">
                    {formatINR(dept.totalSpend)}
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
// 3. Global Currency & Regional Allocation with Custom Blue Scrollbar
// -------------------------------------------------------------
export const CurrencyDistributionChart: React.FC<{ data: CountryBreakdownItem[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const totalEmployees = data.reduce((acc, curr) => acc + curr.employees, 0);
  const maxEmployees = Math.max(...data.map((c) => c.employees), 1);

  return (
    <Card
      title="Global Currency & Region Allocation"
      subtitle="Headcount and compensation distributed across currency hubs"
      className="h-full flex flex-col"
      action={
        <div className="flex items-center gap-1 text-xs text-muted">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>{data.length} Regions</span>
        </div>
      }
    >
      <div className="flex-1 space-y-1 overflow-y-auto pr-1.5 custom-scrollbar">
        {data.map((hub) => {
          const pct = Math.round((hub.employees / (totalEmployees || 1)) * 100);
          const barWidth = Math.max(6, Math.round((hub.employees / maxEmployees) * 100));

          return (
            <div
              key={hub.currency}
              className="p-1.5 rounded-lg hover:bg-background/80 transition-colors duration-150 border border-transparent hover:border-border/60"
            >
              <div className="flex items-center justify-between text-xs mb-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-background border border-border font-mono font-bold text-[10px] text-primary shrink-0">
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
