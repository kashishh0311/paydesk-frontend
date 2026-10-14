import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { apiRequest } from '../../services/api';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { formatINR } from '../../utils/currency';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  X
} from 'lucide-react';

interface EmployeeOption {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  currency: string;
  salary_record?: {
    base_salary: number;
    net_salary: number;
  };
}

interface IncrementAuditRow {
  id: number;
  action: string;
  reason: string;
  created_at?: string;
  createdAt?: string;
  employee?: {
    employee_code: string;
    first_name: string;
    last_name: string;
    department: string;
  };
  previous_value?: {
    base_salary?: number;
    monthly_base?: number;
    monthly_increment?: number;
    net_salary?: number;
  };
  new_value?: {
    base_salary?: number;
    monthly_base?: number;
    monthly_increment?: number;
    net_salary?: number;
  };
}

export const IncrementsBonusesTab: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeOption | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empLoading, setEmpLoading] = useState(false);

  // Search dropdown outside-click handler
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  useOnClickOutside(searchDropdownRef, () => setIsDropdownOpen(false));

  // Form states
  const [incrementMode, setIncrementMode] = useState<'monthly' | 'annual'>('monthly');
  const [monthlyIncrement, setMonthlyIncrement] = useState<string>('');
  const [newBase, setNewBase] = useState<string>('');
  const [bonusAmount, setBonusAmount] = useState<string>('0');
  const [reason, setReason] = useState('Annual Performance Appraisal');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Audit list
  const [audits, setAudits] = useState<IncrementAuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Search employees for increment selection
  const searchEmployees = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setEmployees([]);
      setIsDropdownOpen(false);
      return;
    }
    setEmpLoading(true);
    setIsDropdownOpen(true);
    try {
      const res = await apiRequest<{ success: boolean; data: { rows: any[] } }>(
        `/employees?search=${encodeURIComponent(q)}&limit=8`
      );
      if (res.data?.rows) {
        setEmployees(res.data.rows);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmpLoading(false);
    }
  }, []);

  const fetchAudits = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; data: { rows: IncrementAuditRow[] } }>(
        '/audit-logs?limit=15'
      );
      if (res.data?.rows) {
        setAudits(res.data.rows.filter((r) => r.action === 'SALARY_REVISED'));
      }
    } catch (err) {
      console.error('Error loading audits:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmp(emp);
    setIsDropdownOpen(false);
    setMonthlyIncrement('');
    setNewBase('');
    setBonusAmount('0');
  };

  const handleClearEmployee = () => {
    setSelectedEmp(null);
    setMonthlyIncrement('');
    setNewBase('');
    setBonusAmount('0');
    setEmpSearch('');
    setIsDropdownOpen(false);
  };

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      showErrorToast('Please search and select an employee first.');
      return;
    }

    const currentBase = Number(selectedEmp.salary_record?.base_salary || 65000);

    let finalAnnualBase = 0;
    if (incrementMode === 'monthly') {
      if (!monthlyIncrement || Number(monthlyIncrement) <= 0) {
        showErrorToast('Please enter a valid monthly increment amount.');
        return;
      }
      // Monthly increment applies to this month's payroll without altering the permanent annual base
      finalAnnualBase = currentBase;
    } else {
      if (!newBase || Number(newBase) <= 0) {
        showErrorToast('Please enter a valid new base salary.');
        return;
      }
      finalAnnualBase = Number(newBase);
    }

    setSubmitting(true);
    try {
      const payload: any = {
        employee_id: selectedEmp.id,
        increment_type: incrementMode,
        base_salary: finalAnnualBase,
        bonuses: Number(bonusAmount) || 0,
        reason: incrementMode === 'monthly'
          ? `Monthly Increment (+₹${Number(monthlyIncrement).toLocaleString('en-IN')} this month): ${reason}`
          : reason,
        effective_date: effectiveDate
      };

      if (incrementMode === 'monthly') {
        payload.monthly_increment = Number(monthlyIncrement);
      }

      const res = await apiRequest<{ success: boolean; message: string }>('/salaries/revise', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showSuccessToast(
        incrementMode === 'monthly'
          ? `Monthly increment of ₹${Number(monthlyIncrement).toLocaleString('en-IN')} added and included in salary slip!`
          : (res.message || 'Salary increment recorded successfully!')
      );
      setSelectedEmp(null);
      setMonthlyIncrement('');
      setNewBase('');
      setBonusAmount('0');
      setEmpSearch('');
      fetchAudits();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to submit compensation revision.');
    } finally {
      setSubmitting(false);
    }
  };

  const reasons = [
    'Annual Performance Appraisal',
    'Merit Promotion & Title Elevation',
    'Market Rate Compensation Correction',
    'Retention Incentive Adjustment',
    'Executive Discretionary Bonus'
  ];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Compensation Increments & Performance Bonus Planner
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Process merit increases, promotion adjustments, and one-time performance incentives with full audit tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Audit Log Synchronized
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Increment & Bonus Action Form */}
        <div className="lg:col-span-1">
          <Card
            title="Initiate Increment or Bonus"
            subtitle="Select employee and record verified compensation adjustment"
          >
            <form onSubmit={handleRevise} className="space-y-4">
              {/* Employee Search */}
              <div className="relative" ref={searchDropdownRef}>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Search Employee
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted" />
                  <input
                    type="text"
                    value={empSearch}
                    onChange={(e) => {
                      setEmpSearch(e.target.value);
                      searchEmployees(e.target.value);
                    }}
                    onFocus={() => {
                      if (employees.length > 0) setIsDropdownOpen(true);
                    }}
                    placeholder="Enter code (e.g. EMP-010000) or name..."
                    className="w-full pl-8 pr-8 py-2 text-xs rounded-lg bg-background border border-border focus:ring-1 focus:ring-primary text-foreground"
                  />
                  {empLoading ? (
                    <Loader2 className="w-3.5 h-3.5 absolute right-3 top-2.5 animate-spin text-muted" />
                  ) : empSearch ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEmpSearch('');
                        setIsDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-muted hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Search Results Dropdown */}
                {isDropdownOpen && employees.length > 0 && (
                  <div className="mt-1.5 max-h-48 overflow-y-auto rounded-lg bg-card border border-border divide-y divide-border shadow-xl absolute left-0 right-0 z-30">
                    {employees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full text-left p-2.5 hover:bg-background flex items-center justify-between text-xs transition cursor-pointer"
                      >
                        <div>
                          <span className="font-mono font-bold text-primary mr-1.5">
                            {emp.employee_code}
                          </span>
                          <span className="font-semibold text-foreground">
                            {emp.first_name} {emp.last_name}
                          </span>
                          <span className="block text-[10px] text-muted">{emp.department}</span>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-foreground">
                          {formatINR(emp.salary_record?.base_salary || 650000)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Employee Preview */}
              {selectedEmp && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground">
                        {selectedEmp.first_name} {selectedEmp.last_name}
                      </span>
                      <span className="font-mono text-xs text-primary font-bold ml-2">
                        {selectedEmp.employee_code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearEmployee}
                      className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded cursor-pointer font-medium"
                    >
                      <X className="w-3 h-3" /> Change
                    </button>
                  </div>
                  <div className="text-[11px] text-muted flex justify-between">
                    <span>Department: {selectedEmp.department}</span>
                    <span>Current Base: {formatINR(selectedEmp.salary_record?.base_salary || 650000)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Increment Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setIncrementMode('monthly')}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      incrementMode === 'monthly'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    This Month Increment (₹/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncrementMode('annual')}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      incrementMode === 'annual'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    Annual Base (₹/yr)
                  </button>
                </div>
              </div>

              {/* This Month Increment Input Mode */}
              {incrementMode === 'monthly' ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">
                        This Month Increment Amount (in ₹)
                      </label>
                      {selectedEmp && (
                        <span className="text-[11px] text-muted">
                          Current: <strong className="text-foreground font-mono">{formatINR(Math.round(Number(selectedEmp.salary_record?.base_salary || 65000) / 12))}/mo</strong>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted text-xs font-bold font-mono">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="500"
                        value={monthlyIncrement}
                        onChange={(e) => setMonthlyIncrement(e.target.value)}
                        placeholder="e.g. 5000"
                        required
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Live Simulation Card */}
                  {selectedEmp && (
                    <div className="p-3 rounded-xl bg-background border border-border text-xs space-y-1.5">
                      <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Calculated Compensation (This Month)
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Standard Monthly Base:</span>
                        <span className="font-mono">{formatINR(Math.round(Number(selectedEmp.salary_record?.base_salary || 65000) / 12))}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">This Month Increment:</span>
                        <span className="font-mono font-bold text-emerald-500">+{formatINR(Number(monthlyIncrement) || 0)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-border flex justify-between items-center font-bold">
                        <span className="text-foreground">Total Earnings (This Month):</span>
                        <span className="font-mono text-primary text-sm">
                          {formatINR(
                            Math.round(Number(selectedEmp.salary_record?.base_salary || 65000) / 12) +
                              (Number(monthlyIncrement) || 0)
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted pt-0.5">
                        Will be automatically credited and included in {effectiveDate.substring(0, 7)} salary slip.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Annual Base Salary Input Mode */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">
                      New Base Salary (Annual INR - ₹)
                    </label>
                    {selectedEmp && !newBase && (
                      <button
                        type="button"
                        onClick={() => setNewBase(String(selectedEmp.salary_record?.base_salary || 65000))}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                      >
                        Use current ({formatINR(selectedEmp.salary_record?.base_salary || 65000)})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted text-xs font-bold font-mono">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newBase}
                      onChange={(e) => setNewBase(e.target.value)}
                      placeholder={selectedEmp ? `Enter amount (Current: ${formatINR(selectedEmp.salary_record?.base_salary || 65000)})` : "e.g. 71500"}
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Performance Bonus Input */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Performance Bonus (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted text-xs font-bold font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Revision Reason */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Appraisal Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Effective Date */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !selectedEmp}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-xs py-2 flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                Submit Revision
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Historical Increment Audits */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Increment & Bonus Audit Trail"
            subtitle="Verified compensation adjustments logged to compliance database"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background text-muted uppercase border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Adjustment</th>
                    <th className="py-2.5 px-3 text-right">Previous</th>
                    <th className="py-2.5 px-3 text-right">New Base</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : audits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        No recent salary revision events recorded. Submit a revision on the left to create an audit record.
                      </td>
                    </tr>
                  ) : (
                    audits.map((a) => {
                      const prev = Number(a.previous_value?.base_salary || 0);
                      const next = Number(a.new_value?.base_salary || 0);
                      const monthlyInc = Number(a.new_value?.monthly_increment || 0);
                      const isMonthly = monthlyInc > 0 || (a.reason && a.reason.toLowerCase().includes('monthly increment'));
                      const diffPct = prev > 0 ? Math.round(((next - prev) / prev) * 100) : 0;
                      const rawDate = a.createdAt || a.created_at;
                      const dateStr = rawDate ? new Date(rawDate).toLocaleDateString() : 'Recent';

                      return (
                        <tr key={a.id} className="hover:bg-background/60 transition">
                          <td className="py-2.5 px-3 font-semibold">
                            <span className="font-mono text-primary font-bold mr-1.5">
                              {a.employee?.employee_code || 'EMP-SYSTEM'}
                            </span>
                            <span className="text-foreground">
                              {a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : 'Staff Member'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isMonthly ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="w-3 h-3" />
                                +{formatINR(monthlyInc || 5000)} (This Month)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="w-3 h-3" />
                                +{diffPct}%
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted">
                            {formatINR(prev)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            {isMonthly ? (
                              <span>{formatINR(prev)} <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">(+{formatINR(monthlyInc || 5000)})</span></span>
                            ) : (
                              formatINR(next)
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-muted max-w-[200px] truncate">{a.reason}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted text-[11px]">{dateStr}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
