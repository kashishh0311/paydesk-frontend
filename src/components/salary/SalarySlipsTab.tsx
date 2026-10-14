import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { apiRequest } from '../../services/api';
import { formatINR, formatCurrency } from '../../utils/currency';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import {
  FileText,
  Search,
  Download,
  Loader2,
  User,
  ShieldCheck,
  X,
  Eye,
} from 'lucide-react';

interface EmployeeHistoryData {
  employee: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    department: string;
    job_title: string;
    country: string;
    currency: string;
  };
  salaryHistory: Array<{
    id: number;
    base_salary: number;
    bonuses: number;
    deductions: number;
    net_salary: number;
    effective_date: string;
    reason: string;
  }>;
  payrollHistory: Array<{
    id: number;
    payroll_month: number;
    month_name: string;
    payroll_year: number;
    basic_salary: number;
    allowances: number;
    bonus_amount?: number;
    lop_deduction?: number;
    unpaid_leave_days?: number;
    gross_salary: number;
    total_deductions: number;
    net_salary: number;
    status: string;
    payment_reference?: string;
    deductions?: Array<{
      deduction_type: string;
      reason: string;
      amount: number;
    }>;
  }>;
}

export const SalarySlipsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [historyData, setHistoryData] = useState<EmployeeHistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Search dropdown outside-click
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  useOnClickOutside(searchDropdownRef, () => setIsDropdownOpen(false));

  // Preview Modal
  const [previewSlip, setPreviewSlip] = useState<any | null>(null);
  const previewModalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(previewModalRef, () => setPreviewSlip(null));

  const handleDownloadSlip = async (run: any) => {
    setDownloadingId(run.id);
    try {
      const month = run.month_name || 'October';
      const year = run.payroll_year || 2026;

      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('paydesk_token') || localStorage.getItem('token') || '')
        : '';
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseUrl}/payroll/payslip/${run.id}/download`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve salary slip for printing/saving as PDF');
      }

      const html = await response.text();
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
      } else {
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }

      showSuccessToast(`Opening Save as PDF dialog for ${month} ${year}`);
    } catch (err: any) {
      showErrorToast(err.message || 'Error opening salary slip PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Load first employee on mount
  useEffect(() => {
    const loadDefault = async () => {
      try {
        const res = await apiRequest<{ success: boolean; data: { rows: any[] } }>(
          '/employees?limit=1'
        );
        if (res.data?.rows?.[0]) {
          handleSelectEmployee(res.data.rows[0]);
        }
      } catch (err) {
        console.error('Failed to load default employee for payslips:', err);
      }
    };
    loadDefault();
  }, []);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }
    setSearchLoading(true);
    setIsDropdownOpen(true);
    try {
      const res = await apiRequest<{ success: boolean; data: { rows: any[] } }>(
        `/employees?search=${encodeURIComponent(q)}&limit=8`
      );
      if (res.data?.rows) {
        setSearchResults(res.data.rows);
      }
    } catch (err) {
      console.error('Search employees error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectEmployee = async (emp: any) => {
    setIsDropdownOpen(false);
    setSearch(`${emp.employee_code} - ${emp.first_name} ${emp.last_name}`);
    setHistoryLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; data: EmployeeHistoryData }>(
        `/salaries/history/${emp.id}`
      );
      if (res.data) {
        setHistoryData(res.data);
      }
    } catch (err) {
      console.error('Load history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Official Salary Slips & Historical Compensation Records
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Generate, view, and print verified monthly salary slips with itemized component breakdowns in Indian Rupees (₹).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-primary text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Indian Rupee Format (₹)
          </span>
        </div>
      </div>

      {/* Employee Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-2xs relative" ref={searchDropdownRef}>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Select Employee to Inspect Salary Slips & History
        </label>
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Type employee code (e.g. EMP-010000) or name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-background border border-border focus:ring-1 focus:ring-primary text-foreground"
          />
          {searchLoading && (
            <Loader2 className="w-4 h-4 absolute right-3.5 top-3 animate-spin text-muted" />
          )}

          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto rounded-xl bg-card border border-border shadow-xl divide-y divide-border">
              {searchResults.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelectEmployee(emp)}
                  className="w-full text-left p-2.5 hover:bg-background flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div>
                    <span className="font-mono font-bold text-primary mr-2">
                      {emp.employee_code}
                    </span>
                    <span className="font-semibold text-foreground">
                      {emp.first_name} {emp.last_name}
                    </span>
                    <span className="text-muted ml-2">({emp.department} • {emp.job_title})</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History & Payslips Presentation */}
      {historyLoading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted">Retrieving chronological compensation history and salary slips...</p>
        </div>
      ) : historyData ? (
        <div className="space-y-6">
          {/* Employee Identity Card */}
          <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base">
                {historyData.employee.first_name[0]}{historyData.employee.last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {historyData.employee.first_name} {historyData.employee.last_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-background border border-border font-mono font-bold text-xs text-primary">
                    {historyData.employee.employee_code}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {historyData.employee.job_title} • {historyData.employee.department} • {historyData.employee.country || 'International'} ({historyData.employee.currency || 'USD'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-muted block">Monthly Base Salary</span>
                <div className="text-lg font-bold font-mono text-foreground">
                  {formatCurrency(Math.round((historyData.salaryHistory[0]?.base_salary || 600000) / 12), historyData.employee.currency, historyData.employee.country)} <span className="text-xs font-normal text-muted">/ mo</span>
                </div>
                <span className="text-[10px] text-rose-500 font-mono block">
                  Monthly Deductions: -{formatCurrency(Math.round((historyData.salaryHistory[0]?.deductions || 72000) / 12), historyData.employee.currency, historyData.employee.country)} / mo
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Payslips List */}
            <Card
              title="Monthly Salary Slips"
              subtitle="View, preview and print verified employee payslips"
              action={
                <span className="text-xs text-muted font-mono font-semibold">
                  {historyData.payrollHistory.length} Cycles Available
                </span>
              }
            >
              <div className="space-y-3">
                {historyData.payrollHistory.map((run) => (
                  <div
                    key={run.id}
                    className="p-3.5 rounded-xl bg-background border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {run.month_name} {run.payroll_year}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {run.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted space-x-2">
                        <span>Net Pay: <strong className="text-primary font-mono">{formatCurrency(run.net_salary, historyData.employee.currency, historyData.employee.country)}</strong></span>
                        <span>•</span>
                        <span>Gross: <strong className="text-foreground font-mono">{formatCurrency(run.gross_salary, historyData.employee.currency, historyData.employee.country)}</strong></span>
                        {Number(run.bonus_amount) > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Bonus: +{formatCurrency(run.bonus_amount, historyData.employee.currency, historyData.employee.country)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewSlip({ ...run, employee: historyData.employee })}
                        className="px-3 py-1.5 rounded-lg bg-card hover:bg-background border border-border text-foreground hover:text-primary text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        View Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSlip(run)}
                        disabled={downloadingId === run.id}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        {downloadingId === run.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        Download Salary Slip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Compensation Revision Timeline */}
            <Card
              title="Compensation Revisions Timeline"
              subtitle="Full chronological history of compensation adjustments"
              action={
                <span className="text-xs text-muted font-mono font-semibold">
                  {historyData.salaryHistory.length} Revisions Logged
                </span>
              }
            >
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {historyData.salaryHistory.map((s) => {
                  const base = Number(s.base_salary) || 0;
                  const monthlyBase = Math.round(base / 12);
                  const hra = Math.round(monthlyBase * 0.40);
                  const special = Math.round(monthlyBase * 0.20);
                  const allowances = hra + special;
                  const gross = monthlyBase + allowances + (Number(s.bonuses) || 0);
                  const epf = Math.round(monthlyBase * 0.12);
                  const pt = 200;
                  const health = 120;
                  const totalDeductions = epf + pt + health;
                  const netPay = gross - totalDeductions;

                  return (
                    <div key={s.id} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <div className="p-3 rounded-xl bg-background border border-border/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">
                            {s.reason || 'Annual Compensation Revision'}
                          </span>
                          <span className="text-[11px] font-mono text-muted">{s.effective_date}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div>
                            <span className="text-muted block text-[10px]">Monthly Base</span>
                            <strong className="text-foreground font-mono">{formatINR(monthlyBase)}/mo</strong>
                          </div>
                          <div>
                            <span className="text-muted block text-[10px]">Performance Bonus</span>
                            <strong className={`font-mono ${Number(s.bonuses) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted'}`}>
                              {Number(s.bonuses) > 0 ? `+${formatINR(Number(s.bonuses))}` : '₹0.00'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-muted block text-[10px]">Monthly Deductions</span>
                            <strong className="text-rose-500 font-mono">-{formatINR(totalDeductions)}/mo</strong>
                          </div>
                          <div>
                            <span className="text-muted block text-[10px]">Monthly Net Pay</span>
                            <strong className="text-primary font-mono">{formatINR(netPay)}/mo</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Full Salary Slip In-App Modal Preview */}
          {previewSlip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
              <div
                ref={previewModalRef}
                className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-xs font-bold text-primary tracking-wider uppercase block">PAYDESK HRMS</span>
                    <h3 className="text-lg font-bold text-foreground">
                      Salary Slip — {previewSlip.month_name} {previewSlip.payroll_year}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadSlip(previewSlip)}
                      disabled={downloadingId === previewSlip.id}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {downloadingId === previewSlip.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Download Salary Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewSlip(null)}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-background border border-border text-xs">
                  <div>
                    <span className="text-muted block text-[11px]">Employee Code</span>
                    <strong className="font-mono text-primary font-bold">{previewSlip.employee?.employee_code}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Employee Name</span>
                    <strong className="text-foreground">{previewSlip.employee?.first_name} {previewSlip.employee?.last_name}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Department</span>
                    <strong className="text-foreground">{previewSlip.employee?.department}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Payment Reference</span>
                    <strong className="font-mono text-foreground">{previewSlip.payment_reference || 'ACH-DIRECT'}</strong>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Earnings */}
                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
                    <h4 className="font-bold text-foreground border-b border-border pb-1.5">Earnings</h4>
                    <div className="flex justify-between">
                      <span className="text-muted">Monthly Basic Pay:</span>
                      <strong className="font-mono text-foreground">{formatCurrency(previewSlip.basic_salary, previewSlip.employee?.currency, previewSlip.employee?.country)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Allowances:</span>
                      <strong className="font-mono text-foreground">{formatCurrency(previewSlip.allowances, previewSlip.employee?.currency, previewSlip.employee?.country)}</strong>
                    </div>
                    {Number(previewSlip.bonus_amount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Performance Bonus:</span>
                        <strong className="font-mono text-emerald-600 dark:text-emerald-400">+{formatCurrency(previewSlip.bonus_amount, previewSlip.employee?.currency, previewSlip.employee?.country)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-2 font-bold">
                      <span className="text-foreground">Gross Earnings:</span>
                      <span className="font-mono text-primary">{formatCurrency(previewSlip.gross_salary, previewSlip.employee?.currency, previewSlip.employee?.country)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
                    <h4 className="font-bold text-rose-500 border-b border-border pb-1.5">Deductions</h4>
                    {previewSlip.deductions && previewSlip.deductions.length > 0 ? (
                      previewSlip.deductions.map((d: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <div>
                            <span className="text-foreground font-semibold block">{d.deduction_type}</span>
                            <span className="text-[10px] text-muted">{d.reason}</span>
                          </div>
                          <strong className="font-mono text-rose-500">-{formatCurrency(d.amount, previewSlip.employee?.currency, previewSlip.employee?.country)}</strong>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-muted">Statutory Deductions:</span>
                        <strong className="font-mono text-rose-500">-{formatCurrency(previewSlip.total_deductions, previewSlip.employee?.currency, previewSlip.employee?.country)}</strong>
                      </div>
                    )}
                    {/* Explicit Loss of Pay (LOP) display if not already in deductions list */}
                    {Number(previewSlip.lop_deduction) > 0 && !previewSlip.deductions?.some((d: any) => d.deduction_type?.toLowerCase().includes('loss of pay')) && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-foreground font-semibold block">Loss of Pay (LOP)</span>
                          <span className="text-[10px] text-muted">{previewSlip.unpaid_leave_days || 1} day(s) unpaid leave deduction</span>
                        </div>
                        <strong className="font-mono text-rose-500">-{formatCurrency(previewSlip.lop_deduction, previewSlip.employee?.currency, previewSlip.employee?.country)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-2 font-bold">
                      <span className="text-rose-600">Total Deductions:</span>
                      <span className="font-mono text-rose-600">-{formatCurrency(previewSlip.total_deductions, previewSlip.employee?.currency, previewSlip.employee?.country)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Take-Home Highlight Box */}
                <div className="p-4 rounded-xl bg-primary text-white flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block">
                      Net Salary Payable
                    </span>
                    <span className="text-xs opacity-80">Credited to employee salary bank account</span>
                  </div>
                  <span className="text-2xl font-extrabold font-mono">
                    {formatCurrency(previewSlip.net_salary, previewSlip.employee?.currency, previewSlip.employee?.country)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card title="No Employee Selected" subtitle="Select an employee above to preview payslips">
          <div className="py-12 text-center text-xs text-muted flex flex-col items-center justify-center space-y-2">
            <User className="w-8 h-8 text-muted/60" />
            <p>Use the search input above to lookup any employee by code or name.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
