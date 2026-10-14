import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { apiRequest } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import {
  ShieldAlert,
  Search,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface DeductionRow {
  id: number;
  payroll_record_id: number;
  employee_id: number;
  deduction_type: string;
  amount: number;
  reason: string;
  source_record?: string;
  approval_status?: string;
  employee?: {
    employee_code: string;
    first_name: string;
    last_name: string;
    department: string;
    job_title?: string;
    currency?: string;
  };
  payrollRecord?: {
    id: number;
    payroll_month: number;
    payroll_year: number;
    month_name?: string;
    net_salary?: number;
    status?: string;
  };
}

export const DeductionsLopTab: React.FC = () => {
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // View Modal state
  const [viewDeduction, setViewDeduction] = useState<DeductionRow | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside, keep open when clicking inside
  useOnClickOutside(modalRef, () => setViewDeduction(null));

  const fetchDeductions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        deduction_type: typeFilter,
        search
      });

      const res = await apiRequest<{ success: boolean; data: { rows: DeductionRow[]; count: number } }>(
        `/payroll/deductions?${queryParams.toString()}`
      );

      if (res.data) {
        setDeductions(res.data.rows || []);
        setTotalCount(res.data.count || 0);
      }
    } catch (err) {
      console.error('Failed to load deductions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]);

  const deductionTypes = [
    { label: 'All Deductions', value: 'all' },
    { label: 'EPF / Provident Fund (12%)', value: 'EPF' },
    { label: 'Professional Tax (₹200/mo)', value: 'Professional Tax' },
    { label: 'Health & Medical Premium (₹120/mo)', value: 'Health' },
    { label: 'Loss of Pay (LOP)', value: 'LOP' },
    { label: 'Loan & Custom Deductions', value: 'custom' }
  ];

  const getTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('loan') || t.includes('advance') || t.includes('custom') || t.includes('penalty')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    if (t.includes('loss of pay') || t.includes('lop') || t.includes('leave')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (t.includes('epf') || t.includes('provident')) {
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
    if (t.includes('tax') || t.includes('professional')) {
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    }
    if (t.includes('health') || t.includes('medical')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    return 'bg-slate-500/10 text-muted border-border';
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Verified Salary Structure Deductions
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted font-mono bg-background px-3 py-1.5 rounded-lg border border-border">
            {totalCount.toLocaleString()} Total Records
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="flex flex-wrap items-center gap-1.5">
          {deductionTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTypeFilter(t.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border cursor-pointer ${typeFilter === t.value
                ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                : 'bg-background hover:bg-card border-border text-foreground'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted" />
          <input
            type="text"
            placeholder="Search employee code or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background border border-border focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>
      </div>

      {/* Deductions Table */}
      <Card title="Itemized Payroll Deductions Log" subtitle="Verified breakdown per employee with audit details and reasons">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background text-muted uppercase border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Pay Period</th>
                <th className="py-2.5 px-3">Deduction Type</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3">Deduction Reason</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    Loading itemized deductions from database...
                  </td>
                </tr>
              ) : deductions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No matching deduction records found. Adjust filters or search keywords.
                  </td>
                </tr>
              ) : (
                deductions.map((d) => {
                  const emp = d.employee;
                  const monthName = d.payrollRecord?.month_name || 'October';
                  const year = d.payrollRecord?.payroll_year || 2026;

                  return (
                    <tr key={d.id} className="hover:bg-background/60 transition">
                      <td className="py-2.5 px-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-primary font-bold">
                            {emp?.employee_code || `EMP-${d.employee_id}`}
                          </span>
                          <span className="text-foreground">
                            {emp ? `${emp.first_name} ${emp.last_name}` : 'Staff Member'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-muted">{emp?.department || 'Operations'}</td>
                      <td className="py-2.5 px-3 font-mono text-muted">
                        {monthName} {year}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTypeBadge(d.deduction_type)}`}>
                          {d.deduction_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-500">
                        -{formatCurrency(d.amount, emp?.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-muted max-w-[260px] truncate">
                        {d.reason || 'Standard payroll deduction'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewDeduction(d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background hover:bg-card border border-border text-foreground hover:text-primary text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border mt-2">
            <span className="text-xs text-muted">
              Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalCount} total entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-lg border border-border disabled:opacity-40 hover:bg-background text-foreground cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-lg border border-border disabled:opacity-40 hover:bg-background text-foreground cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Deduction Detail View Modal */}
      {viewDeduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div
            ref={modalRef}
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-foreground">Deduction Record Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDeduction(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <span className="text-muted block">Employee</span>
                <strong className="text-foreground text-sm block">
                  {viewDeduction.employee?.first_name} {viewDeduction.employee?.last_name}
                </strong>
                <span className="font-mono text-primary font-bold">
                  {viewDeduction.employee?.employee_code || `EMP-${viewDeduction.employee_id}`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <span className="text-muted block">Department</span>
                <strong className="text-foreground text-sm block">
                  {viewDeduction.employee?.department || 'General'}
                </strong>
                <span className="text-muted">
                  {viewDeduction.employee?.job_title || 'Staff Member'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  {viewDeduction.deduction_type}
                </span>
                <span className="text-xs text-muted">Deducted from monthly payroll</span>
              </div>
              <span className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                -{formatCurrency(viewDeduction.amount, viewDeduction.employee?.currency)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <span className="text-muted font-semibold block">Deduction Reason & Justification</span>
                <p className="text-foreground leading-relaxed">
                  {viewDeduction.reason || 'No specific reason description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-background border border-border space-y-0.5">
                  <span className="text-muted block">Source Record</span>
                  <span className="font-semibold text-foreground">
                    {viewDeduction.source_record || 'Standard Automated Rule'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border space-y-0.5">
                  <span className="text-muted block">Pay Cycle</span>
                  <span className="font-semibold text-foreground">
                    {viewDeduction.payrollRecord?.month_name || 'October'} {viewDeduction.payrollRecord?.payroll_year || 2026}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDeduction(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
