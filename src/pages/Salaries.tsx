import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import {
  Banknote,
  Edit3,
  Eye,
  X,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Layers,
  Calendar,
  ShieldAlert,
  TrendingUp,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { formatINR } from '../utils/currency';
import { downloadExport } from '../utils/download';

import { SalaryStructureTab } from '../components/salary/SalaryStructureTab';
import { DeductionsLopTab } from '../components/salary/DeductionsLopTab';
import { IncrementsBonusesTab } from '../components/salary/IncrementsBonusesTab';
import { SalarySlipsTab } from '../components/salary/SalarySlipsTab';

interface SalaryRow {
  id: number;
  employeeId: number;
  code: string;
  name: string;
  department: string;
  currency: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  effectiveDate: string;
  unpaidLeaveDays?: number;
  lopDeduction?: number;
  leaveDetails?: any;
  monthlyBreakdown?: any;
}

interface RawSalaryItem {
  id: number;
  employee_id: number;
  base_salary: string | number;
  bonuses: string | number;
  deductions: string | number;
  net_salary: string | number;
  effective_date: string;
  unpaid_leave_days?: number;
  lop_deduction?: number;
  leave_details?: any;
  monthly_breakdown?: any;
  employee?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    department: string;
    currency: string;
  };
}

export const Salaries: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'employee-salary';

  const [salaries, setSalaries] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const debouncedSearch = useDebounce(search, 300);
  const debouncedDepartment = useDebounce(department, 200);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedDepartment, selectedMonth]);

  const [selectedRecord, setSelectedRecord] = useState<SalaryRow | null>(null);
  const [viewSalaryRecord, setViewSalaryRecord] = useState<SalaryRow | null>(null);
  const [newBase, setNewBase] = useState('');
  const [revisionReason, setRevisionReason] = useState('Annual Performance Appraisal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(modalRef, () => setSelectedRecord(null));

  const viewModalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(viewModalRef, () => setViewSalaryRecord(null));

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(exportDropdownRef, () => setIsExportMenuOpen(false));

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    setIsExportMenuOpen(false);
    const query = new URLSearchParams({
      format,
      month: selectedMonth,
      search,
      department
    });
    const ext = format === 'xlsx' ? 'xlsx' : format;
    downloadExport(`/export/salaries?${query.toString()}`, `paydesk_salaries_${selectedMonth}_${new Date().toISOString().split('T')[0]}.${ext}`);
  };

  const hasActiveFilters = Boolean(search || department || selectedMonth !== '2026-10');
  const handleClearFilters = () => {
    setSearch('');
    setDepartment('');
    setSelectedMonth('2026-10');
    setPage(1);
  };

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch,
        department: debouncedDepartment,
        month: selectedMonth
      });
      const res = await apiRequest<{ success: boolean; data: { rows: RawSalaryItem[]; count: number } }>(
        `/salaries?${queryParams.toString()}`
      );
      if (res.data?.rows) {
        const mapped: SalaryRow[] = res.data.rows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          code: r.employee?.employee_code || `EMP-${r.employee_id}`,
          name: r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Staff Member',
          department: r.employee?.department || 'Operations',
          currency: r.employee?.currency || 'USD',
          baseSalary: Number(r.base_salary),
          bonuses: Number(r.bonuses),
          deductions: Number(r.deductions),
          netSalary: Number(r.net_salary),
          effectiveDate: r.effective_date,
          unpaidLeaveDays: r.unpaid_leave_days || 0,
          lopDeduction: Number(r.lop_deduction) || 0,
          leaveDetails: r.leave_details,
          monthlyBreakdown: r.monthly_breakdown
        }));
        setSalaries(mapped);
        setTotalCount(res.data.count);
      }
    } catch {
      showErrorToast('Failed to load salary records from database.');
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, debouncedDepartment, selectedMonth]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  const handleOpenRevise = (row: SalaryRow) => {
    setSelectedRecord(row);
    setNewBase(String(row.baseSalary));
    setRevisionReason('Annual Performance Appraisal');
  };

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSubmitting(true);
    const updatedBase = Number(newBase) || selectedRecord.baseSalary;
    const updatedBonuses = Math.round(updatedBase * 0.1);
    const updatedDeductions = Math.round(updatedBase * 0.12);

    try {
      await apiRequest('/salaries/revise', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: selectedRecord.employeeId,
          base_salary: updatedBase,
          bonuses: updatedBonuses,
          deductions: updatedDeductions,
          reason: revisionReason
        })
      });

      setSelectedRecord(null);
      showSuccessToast(`Salary revision recorded for ${selectedRecord.name} (Logged in Compliance Audit)`);
      fetchSalaries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save salary revision.';
      showErrorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const tabs = [
    { id: 'employee-salary', label: 'Employee Salary', icon: Banknote },
    { id: 'salary-structure', label: 'Salary Structure', icon: Layers },
    { id: 'salary-deductions', label: 'Salary Deductions', icon: ShieldAlert },
    { id: 'increments-bonuses', label: 'Increments & Bonuses', icon: TrendingUp },
    { id: 'salary-slips', label: 'Salary Slips & History', icon: FileText }
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Salary Management</h1>
          <p className="text-xs text-muted mt-0.5">
            Managing verified compensation structures, automated deductions, and net take-home pay for {selectedMonth}.
          </p>
        </div>
        {currentTab === 'employee-salary' && (
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export
              </Button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-background transition text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-background transition text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-sky-500" />
                    <span>Export as Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-background transition text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-[14px] border-b border-border ">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSearchParams({ tab: t.id })}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${isActive
                ? 'bg-primary text-white shadow-xs'
                : 'bg-card hover:bg-background border border-border text-muted hover:text-foreground'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Views */}
      {currentTab === 'salary-structure' && <SalaryStructureTab />}
      {(currentTab === 'salary-deductions' || currentTab === 'deductions-lop') && <DeductionsLopTab />}
      {currentTab === 'increments-bonuses' && <IncrementsBonusesTab />}
      {currentTab === 'salary-slips' && <SalarySlipsTab />}

      {/* Default Tab: Employee Salary Table */}
      {currentTab === 'employee-salary' && (
        <>
          {/* Filters Bar */}
          <Card>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Search employee name or code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4" />}
                />

                <div>
                  <Select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by department"
                  >
                    <option value="">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </Select>
                </div>

                <div>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by month"
                  >
                    <option value="2026-10">October 2026 (Current Month)</option>
                    <option value="2026-09">September 2026</option>
                    <option value="2026-08">August 2026</option>
                    <option value="2026-07">July 2026</option>
                    <option value="2026-06">June 2026</option>
                    <option value="2026-05">May 2026</option>
                    <option value="2026-04">April 2026</option>
                    <option value="2026-03">March 2026</option>
                    <option value="2026-02">February 2026</option>
                    <option value="2026-01">January 2026</option>
                    <option value="2026-11">November 2026</option>
                    <option value="2026-12">December 2026</option>
                  </Select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted">
                    Active filters applied: {[
                      search && `Search: "${search}"`,
                      department && `Dept: ${department}`,
                      selectedMonth !== '2026-10' && `Month: ${selectedMonth}`
                    ].filter(Boolean).join(' • ')}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-foreground bg-background hover:bg-card border border-border transition shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Salary Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-sm transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
                <thead className="bg-background text-muted border-b border-border uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-3 px-3.5">Employee</th>
                    <th className="py-3 px-3.5">Department</th>
                    <th className="py-3 px-3.5">Annual Income</th>
                    <th className="py-3 px-3.5">Monthly Income</th>
                    <th className="py-3 px-3.5">Deductions</th>
                    <th className="py-3 px-3.5">Net Take-Home</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {salaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-muted">
                        No salary records found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    salaries.map((s) => (
                      <tr key={s.id} className="hover:bg-background/60 transition">
                        <td className="py-3 px-3.5">
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-muted font-mono">{s.code}</div>
                        </td>
                        <td className="py-3 px-3.5 font-medium">{s.department}</td>
                        <td className="py-3 px-3.5 font-mono font-medium">
                          {formatINR(s.baseSalary)}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-medium text-primary">
                          {formatINR(Math.round(s.baseSalary / 12))}/mo
                        </td>
                        <td className="py-3 px-3.5 font-mono text-red-500">
                          -{formatINR(s.deductions)}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-foreground">
                          {formatINR(s.netSalary)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewSalaryRecord(s)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRevise(s)}
                              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                            >
                              Revise
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border mt-2">
              <p className="text-sm text-muted">
                Showing Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalCount.toLocaleString()} total records)
              </p>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Salary Revision Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            ref={modalRef}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Revise Salary Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border text-xs space-y-1">
              <p><span className="text-muted">Employee:</span> <strong className="text-foreground">{selectedRecord.name} ({selectedRecord.code})</strong></p>
              <p><span className="text-muted">Current Base:</span> <strong className="font-mono text-foreground">{formatINR(selectedRecord.baseSalary)}</strong></p>
            </div>

            <form onSubmit={handleSaveRevision} className="space-y-3.5">
              <Input
                label="New Base Salary (₹ INR)"
                type="number"
                value={newBase}
                onChange={(e) => setNewBase(e.target.value)}
                required
              />

              <Select
                label="Mandatory Audit Reason"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
              >
                <option value="Annual Performance Appraisal">Annual Performance Appraisal</option>
                <option value="Market Correction">Market Correction</option>
                <option value="Promotion Adjustment">Promotion Adjustment</option>
                <option value="Equity Rebalancing">Equity Rebalancing</option>
              </Select>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Confirm & Audit Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Salary & Deductions Breakdown Modal */}
      {viewSalaryRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={viewModalRef}
            className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {viewSalaryRecord.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted font-mono">
                    <span className="font-semibold text-primary">{viewSalaryRecord.code}</span>
                    <span>•</span>
                    <span>{viewSalaryRecord.department}</span>
                    <span>•</span>
                    <span>Effective: {viewSalaryRecord.effectiveDate}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewSalaryRecord(null)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider block">Base Salary</span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  {formatINR(viewSalaryRecord.baseSalary)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider block">Bonuses & Allowances</span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  +{formatINR(viewSalaryRecord.bonuses)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider block">Total Deductions</span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  -{formatINR(viewSalaryRecord.deductions)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider block">Net Take-Home Pay</span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  {formatINR(viewSalaryRecord.netSalary)}
                </span>
              </div>
            </div>

            {/* Monthly Leave & Attendance Details */}
            {(() => {
              const base = viewSalaryRecord.baseSalary;
              const monthlyBase = Math.round(base / 12);
              const unpaidDays = viewSalaryRecord.unpaidLeaveDays !== undefined
                ? viewSalaryRecord.unpaidLeaveDays
                : (viewSalaryRecord.deductions > (Math.round(monthlyBase * 0.12) + 200 + 120) ? 2 : 0);
              const perDayRate = Math.round(monthlyBase / 30);
              const lop = viewSalaryRecord.lopDeduction && viewSalaryRecord.lopDeduction > 0
                ? viewSalaryRecord.lopDeduction
                : (unpaidDays > 0 ? perDayRate * unpaidDays : 0);

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted" />
                      Monthly Leave & Attendance Details ({selectedMonth})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Casual Leave */}
                    <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Casual Leave (CL)</span>
                      </div>
                      <div className="text-xs text-muted">
                        Taken: <strong className="text-foreground">1 Day</strong> (Balance: 11)
                      </div>
                      <div className="text-[11px] text-muted font-mono">
                        Salary Deduction: ₹0.00
                      </div>
                    </div>

                    {/* Sick Leave */}
                    <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Sick Leave (SL)</span>
                      </div>
                      <div className="text-xs text-muted">
                        Taken: <strong className="text-foreground">{unpaidDays > 0 ? 0 : 1} Day</strong> (Balance: 10)
                      </div>
                      <div className="text-[11px] text-muted font-mono">
                        Salary Deduction: ₹0.00
                      </div>
                    </div>

                    {/* Unpaid Leave / Loss of Pay */}
                    <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Loss of Pay (LOP)</span>
                      </div>
                      <div className="text-xs text-muted">
                        Taken: <strong className="text-foreground">{unpaidDays} Unpaid Day(s)</strong>
                      </div>
                      <div className="text-[11px] font-mono text-muted">
                        {unpaidDays > 0 ? (
                          <span className="text-foreground font-semibold">
                            LOP Deduction: -{formatINR(lop)} ({formatINR(perDayRate)}/day)
                          </span>
                        ) : (
                          <span>Salary Deduction: ₹0.00</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Deductions Breakdown & Explanation */}
            {(() => {
              const base = viewSalaryRecord.baseSalary;
              const monthlyBase = Math.round(base / 12);
              const epf = Math.round(monthlyBase * 0.12);
              const pt = 200;
              const health = 120;
              const statutorySubtotal = epf + pt + health;
              const unpaidDays = viewSalaryRecord.unpaidLeaveDays !== undefined
                ? viewSalaryRecord.unpaidLeaveDays
                : (viewSalaryRecord.deductions > statutorySubtotal ? 2 : 0);
              const perDayRate = Math.round(monthlyBase / 30);
              const lop = viewSalaryRecord.lopDeduction && viewSalaryRecord.lopDeduction > 0
                ? viewSalaryRecord.lopDeduction
                : (unpaidDays > 0 ? perDayRate * unpaidDays : Math.max(0, viewSalaryRecord.deductions - statutorySubtotal));
              const totalDeductions = statutorySubtotal + lop;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-muted" />
                      Total Deductions: {formatINR(totalDeductions)} (Statutory & LOP Breakdown)
                    </h4>
                    <span className="text-[11px] text-muted font-medium">
                      Itemized Breakdown
                    </span>
                  </div>

                  <div className="bg-background rounded-xl border border-border divide-y divide-border text-xs">
                    {/* EPF */}
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">Employee Provident Fund (EPF)</div>
                        <div className="text-[11px] text-muted">Statutory 12% deduction from basic salary (Monthly basic: {formatINR(monthlyBase)})</div>
                      </div>
                      <div className="font-mono font-medium text-foreground">
                        -{formatINR(epf)}
                      </div>
                    </div>

                    {/* Professional Tax */}
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">Professional Tax (PT)</div>
                        <div className="text-[11px] text-muted">State government statutory employment withholding</div>
                      </div>
                      <div className="font-mono font-medium text-foreground">
                        -{formatINR(pt)}
                      </div>
                    </div>

                    {/* Health Premium */}
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">Health & Medical Insurance Premium</div>
                        <div className="text-[11px] text-muted">Corporate group medical & healthcare policy coverage</div>
                      </div>
                      <div className="font-mono font-medium text-foreground">
                        -{formatINR(health)}
                      </div>
                    </div>

                    {/* Loss of Pay (LOP) */}
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">Loss of Pay (LOP) / Unpaid Leaves</div>
                        <div className="text-[11px] text-muted">
                          {lop > 0
                            ? `Automatic backend deduction for ${unpaidDays} unpaid leave day(s) @ ${formatINR(perDayRate)}/day`
                            : 'Nil (Full verified attendance for this cycle)'}
                        </div>
                      </div>
                      <div className="font-mono font-medium text-foreground">
                        {lop > 0 ? (
                          <span>-{formatINR(lop)}</span>
                        ) : (
                          <span className="text-muted">₹0.00</span>
                        )}
                      </div>
                    </div>

                    {/* Total Deductions Footer */}
                    <div className="p-3 bg-muted/5 flex items-center justify-between font-bold">
                      <div className="text-foreground">Total Monthly Deductions</div>
                      <div className="font-mono text-foreground text-sm">
                        -{formatINR(totalDeductions)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Compensation Formula Card */}
            <div className="p-3 rounded-xl bg-background border border-border text-xs text-muted flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">Take-Home Formula: </span>
                <span>Base ({formatINR(viewSalaryRecord.baseSalary)}) + Bonuses (+{formatINR(viewSalaryRecord.bonuses)}) - Deductions (-{formatINR(viewSalaryRecord.deductions)})</span>
              </div>
              <div className="font-mono font-bold text-foreground">
                = {formatINR(viewSalaryRecord.netSalary)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setViewSalaryRecord(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const rec = viewSalaryRecord;
                  setViewSalaryRecord(null);
                  handleOpenRevise(rec);
                }}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Revise This Salary
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
