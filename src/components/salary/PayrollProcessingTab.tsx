import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { apiRequest } from '../../services/api';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { formatINR } from '../../utils/currency';
import {
  Calendar,
  Clock,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  FileText,
  Loader2,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Lock
} from 'lucide-react';

interface PayrollRecordItem {
  id: number;
  employee_id: number;
  payroll_month: string;
  payroll_year: number;
  total_days: number;
  days_worked: number;
  lop_days: number;
  base_salary: number;
  allowances: number;
  gross_salary: number;
  lop_deduction: number;
  statutory_deductions: number;
  total_deductions: number;
  net_salary: number;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Processing' | 'Paid' | 'Failed';
  payment_reference?: string;
  payment_date?: string;
  employee?: {
    employee_code: string;
    first_name: string;
    last_name: string;
    department: string;
    currency: string;
  };
}

interface PayrollSummary {
  totalRecords: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  pendingReview: number;
  approvedCount: number;
  paidCount: number;
}

export const PayrollProcessingTab: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [currentStep, setCurrentStep] = useState(1);

  const [records, setRecords] = useState<PayrollRecordItem[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Direct Bank Transfer (ACH)');
  const paymentModalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(paymentModalRef, () => setIsPaymentModalOpen(false));

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2026', '2025'];

  const fetchPayrollData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        payroll_month: selectedMonth,
        payroll_year: selectedYear,
        page: String(page),
        limit: '15',
        status: statusFilter,
        search
      });

      const [listRes, summaryRes] = await Promise.all([
        apiRequest<{ success: boolean; data: { rows: PayrollRecordItem[]; count: number } }>(
          `/payroll/records?${queryParams.toString()}`
        ),
        apiRequest<{ success: boolean; data: PayrollSummary }>(
          `/payroll/summary?payroll_month=${selectedMonth}&payroll_year=${selectedYear}`
        )
      ]);

      if (listRes.data) {
        setRecords(listRes.data.rows || []);
        setTotalCount(listRes.data.count || 0);
      }
      if (summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load payroll batch data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, page, statusFilter, search]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Step 3: Run Batch Calculation
  const handleCalculatePayroll = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string; data: any }>('/payroll/calculate', {
        method: 'POST',
        body: JSON.stringify({
          payroll_month: selectedMonth,
          payroll_year: selectedYear,
          total_days: 30
        })
      });
      showSuccessToast(res.message || 'Payroll calculated successfully!');
      setCurrentStep(4);
      fetchPayrollData();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to calculate payroll batch.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 5: Approve Payroll
  const handleApprovePayroll = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/payroll/approve', {
        method: 'POST',
        body: JSON.stringify({
          payroll_month: selectedMonth,
          payroll_year: selectedYear
        })
      });
      showSuccessToast(res.message || 'Payroll records approved and locked!');
      setCurrentStep(6);
      fetchPayrollData();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to approve payroll batch.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step 6: Record Payment
  const handleRecordPayment = async () => {
    if (!paymentRef.trim()) {
      showErrorToast('Please enter a payment transaction reference.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/payroll/payment', {
        method: 'POST',
        body: JSON.stringify({
          payroll_month: selectedMonth,
          payroll_year: selectedYear,
          payment_reference: paymentRef,
          payment_method: paymentMethod
        })
      });
      showSuccessToast(res.message || 'Payment recorded successfully!');
      setIsPaymentModalOpen(false);
      fetchPayrollData();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to record payments.');
    } finally {
      setActionLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Select Period', desc: `${selectedMonth} ${selectedYear}` },
    { number: 2, title: 'Attendance', desc: '30 Days Standard' },
    { number: 3, title: 'Calculate', desc: 'Gross & Allowances' },
    { number: 4, title: 'Review Deductions', desc: 'Statutory & LOP' },
    { number: 5, title: 'Approve', desc: 'Lock Records' },
    { number: 6, title: 'Disburse', desc: 'Record Payment' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Approved':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'Processing':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Paid':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Failed':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-muted border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* 6-Step Workflow Progression Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              6-Step Payroll Execution Cycle
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Structured HR workflow ensuring attendance verification, deduction compliance, and audit sign-off.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Steps Visual Tracker */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s) => {
            const isActive = currentStep === s.number;
            const isCompleted = currentStep > s.number;

            return (
              <button
                key={s.number}
                onClick={() => setCurrentStep(s.number)}
                className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                  isActive
                    ? 'bg-primary/10 border-primary shadow-xs'
                    : isCompleted
                    ? 'bg-background border-emerald-500/30'
                    : 'bg-background/60 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary text-white'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-border text-muted'
                    }`}
                  >
                    {isCompleted ? '✓' : s.number}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-foreground truncate">{s.title}</div>
                  <div className="text-[10px] text-muted truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cycle Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted">Cycle Headcount</span>
          <h4 className="text-lg font-bold font-mono text-foreground mt-1">
            {(summary?.totalRecords || 0).toLocaleString()}
          </h4>
          <span className="text-[10px] text-muted">Active employees</span>
        </div>
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted">Total Gross Spend</span>
          <h4 className="text-lg font-bold font-mono text-foreground mt-1">
            {formatINR(summary?.totalGross || 0)}
          </h4>
          <span className="text-[10px] text-muted">Before deductions</span>
        </div>
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted">Total Deductions</span>
          <h4 className="text-lg font-bold font-mono text-rose-500 mt-1">
            -{formatINR(summary?.totalDeductions || 0)}
          </h4>
          <span className="text-[10px] text-muted">Statutory & LOP</span>
        </div>
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted">Net Payable</span>
          <h4 className="text-lg font-bold font-mono text-primary mt-1">
            {formatINR(summary?.totalNet || 0)}
          </h4>
          <span className="text-[10px] text-muted">Total take-home</span>
        </div>
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted">Pending Review</span>
          <h4 className="text-lg font-bold font-mono text-amber-500 mt-1">
            {summary?.pendingReview || 0}
          </h4>
          <span className="text-[10px] text-muted">Awaiting approval</span>
        </div>
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[11px] font-semibold text-muted">Paid Disbursed</span>
          <h4 className="text-lg font-bold font-mono text-emerald-500 mt-1">
            {summary?.paidCount || 0}
          </h4>
          <span className="text-[10px] text-muted">Completed transfers</span>
        </div>
      </div>

      {/* Action Command Bar for the Active Step */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            {currentStep <= 2 && <Calendar className="w-5 h-5" />}
            {currentStep === 3 && <Calculator className="w-5 h-5" />}
            {currentStep === 4 && <ShieldCheck className="w-5 h-5" />}
            {currentStep === 5 && <CheckCircle2 className="w-5 h-5" />}
            {currentStep >= 6 && <CreditCard className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Step {currentStep}: {steps[currentStep - 1]?.title}
            </h3>
            <p className="text-xs text-muted">
              {currentStep === 1 && `Configured for ${selectedMonth} ${selectedYear}. Verify active headcount.`}
              {currentStep === 2 && 'Attendance calendar synchronized. 30 days standard work month.'}
              {currentStep === 3 && 'Ready to trigger batch calculation across active employee records.'}
              {currentStep === 4 && 'Review calculated gross, EPF, LOP withholdings, and net payable.'}
              {currentStep === 5 && 'Approve calculated payroll batch to lock values for disbursement.'}
              {currentStep === 6 && 'Record disbursement reference and mark payroll as paid.'}
            </p>
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex items-center gap-2">
          {currentStep === 3 && (
            <Button
              onClick={handleCalculatePayroll}
              disabled={actionLoading}
              className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
              Run Payroll Calculation
            </Button>
          )}

          {currentStep === 4 && (
            <Button
              onClick={() => setCurrentStep(5)}
              className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              Proceed to Approval
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {currentStep === 5 && (
            <Button
              onClick={handleApprovePayroll}
              disabled={actionLoading || (summary?.pendingReview === 0 && summary?.approvedCount > 0)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve Payroll Batch
            </Button>
          )}

          {currentStep === 6 && (
            <Button
              onClick={() => {
                setPaymentRef(`TXN-PD-${Date.now().toString().slice(-6)}`);
                setIsPaymentModalOpen(true);
              }}
              disabled={actionLoading || (summary?.approvedCount === 0 && summary?.paidCount > 0)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Payroll Records Table */}
      <Card
        title={`Payroll Records — ${selectedMonth} ${selectedYear}`}
        subtitle="Live payroll records with component calculations and approval statuses"
        action={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 text-xs rounded-lg bg-background border border-border text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background text-muted uppercase border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Work Days</th>
                <th className="py-2.5 px-3 text-right">Base</th>
                <th className="py-2.5 px-3 text-right">Gross</th>
                <th className="py-2.5 px-3 text-right">Deductions</th>
                <th className="py-2.5 px-3 text-right">Net Payable</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    Loading payroll records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    No payroll records generated for {selectedMonth} {selectedYear} yet. Click "Run Payroll Calculation" to process this cycle.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-background/60 transition">
                    <td className="py-2.5 px-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary font-bold">{r.employee?.employee_code || `EMP-${r.employee_id}`}</span>
                        <span className="text-foreground">{r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Staff Member'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted">{r.employee?.department || 'Operations'}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {r.days_worked} / {r.total_days}
                      {r.lop_days > 0 && (
                        <span className="ml-1 text-[10px] text-rose-500 font-semibold">({r.lop_days}d LOP)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatINR(r.base_salary)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatINR(r.gross_salary)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-500">-{formatINR(r.total_deductions)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                      {formatINR(r.net_salary)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={`http://localhost:5000/api/v1/payroll/payslip/${r.id}/html`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border hover:bg-card text-primary font-semibold text-[11px] transition"
                      >
                        <Eye className="w-3 h-3" />
                        Payslip
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Soft Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div
            ref={paymentModalRef}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Record Payroll Disbursement
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-muted hover:text-foreground text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted">
              Disburse verified salaries for <strong>{selectedMonth} {selectedYear}</strong>. Records will transition to <strong>Paid</strong> status with the entered transaction reference.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground"
                >
                  <option value="Direct Bank Transfer (ACH)">Direct Bank Transfer (ACH)</option>
                  <option value="Wire Transfer (SWIFT)">Wire Transfer (SWIFT)</option>
                  <option value="Corporate Payroll Cheque">Corporate Payroll Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Transaction / Batch Reference
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. TXN-PD-202610-001"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Disbursement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
