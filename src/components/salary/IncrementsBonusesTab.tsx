import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { apiRequest } from '../../services/api';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { formatCurrency } from '../../utils/currency';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  X,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface EmployeeOption {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  currency?: string;
  country?: string;
  salary_record?: {
    base_salary: number;
    net_salary: number;
  };
  salaryRecords?: Array<{
    base_salary: number;
    bonuses?: number;
    effective_date?: string;
  }>;
}

interface IncrementAuditRow {
  id: number;
  action: string;
  reason: string;
  created_at?: string;
  createdAt?: string;
  employee_id?: number;
  employee?: {
    id?: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    department: string;
    currency?: string;
    country?: string;
  };
  previous_value?: {
    base_salary?: number;
    monthly_base?: number;
    monthly_increment?: number;
    bonus_amount?: number;
    currency?: string;
    net_salary?: number;
  };
  new_value?: {
    base_salary?: number;
    monthly_base?: number;
    monthly_increment?: number;
    bonus_amount?: number;
    other_deduction_name?: string | null;
    other_deduction_amount?: number;
    deduction_type?: string;
    amount?: number;
    total_deductions?: number;
    currency?: string;
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

  // Edit & Delete Audit State
  const [editingAudit, setEditingAudit] = useState<IncrementAuditRow | null>(null);
  const [editMode, setEditMode] = useState<'monthly' | 'annual'>('monthly');
  const [editMonthlyIncrement, setEditMonthlyIncrement] = useState<string>('');
  const [editNewBase, setEditNewBase] = useState<string>('');
  const [editBonusAmount, setEditBonusAmount] = useState<string>('0');
  const [editReason, setEditReason] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deletingAudit, setDeletingAudit] = useState<IncrementAuditRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const editModalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(editModalRef, () => setEditingAudit(null));

  const deleteModalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(deleteModalRef, () => setDeletingAudit(null));

  const handleOpenEditAudit = (a: IncrementAuditRow) => {
    setEditingAudit(a);
    const monthlyInc = Number(a.new_value?.monthly_increment || 0);
    const bonusVal = Number(a.new_value?.bonus_amount || 0);
    const baseVal = Number(a.new_value?.base_salary || 0);
    const isMonthly = monthlyInc > 0 || (a.reason && a.reason.toLowerCase().includes('monthly increment'));

    setEditMode(isMonthly ? 'monthly' : 'annual');
    setEditMonthlyIncrement(monthlyInc > 0 ? String(monthlyInc) : '');
    setEditNewBase(baseVal > 0 ? String(baseVal) : '');
    setEditBonusAmount(String(bonusVal));
    setEditReason(a.reason || 'Annual Performance Appraisal');
  };

  const handleSaveEditAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudit) return;

    setEditSubmitting(true);
    try {
      const numInc = Number(editMonthlyIncrement) || 0;
      const numBonus = Number(editBonusAmount) || 0;
      const numBase = editMode === 'annual' ? (Number(editNewBase) || Number(editingAudit.new_value?.base_salary) || 65000) : (Number(editingAudit.new_value?.base_salary) || 65000);

      const res = await apiRequest<{ success: boolean; message: string }>(`/audit-logs/${editingAudit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          monthly_increment: editMode === 'monthly' ? numInc : 0,
          bonus_amount: numBonus,
          base_salary: numBase,
          reason: editReason
        })
      });

      showSuccessToast(res.message || 'Increment & bonus record updated successfully!');
      setEditingAudit(null);
      fetchAudits();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to update increment/bonus record.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleConfirmDeleteAudit = async () => {
    if (!deletingAudit) return;

    setDeleteSubmitting(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>(`/audit-logs/${deletingAudit.id}`, {
        method: 'DELETE'
      });

      showSuccessToast(res.message || 'Audit record deleted successfully!');
      setDeletingAudit(null);
      fetchAudits();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to delete audit record.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

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
        '/audit-logs?limit=30'
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

  const getEmpBaseSalary = (emp: any): number => {
    if (!emp) return 0;
    return Number(
      emp.salary_record?.base_salary ??
      emp.salaryRecords?.[0]?.base_salary ??
      emp.base_salary ??
      650000
    );
  };

  const getEmpMonthlyBase = (emp: any): number => {
    return Math.round(getEmpBaseSalary(emp) / 12);
  };

  const handleSelectEmployee = async (emp: any) => {
    setSelectedEmp(emp);
    setIsDropdownOpen(false);

    let activeEmp = emp;
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/employees/${emp.id}`);
      if (res.data) {
        activeEmp = res.data;
        setSelectedEmp(res.data);
      }
    } catch (e) {
      console.error('Error fetching employee details:', e);
    }

    const currentBase = getEmpBaseSalary(activeEmp);

    // Leave monthly increment empty so user can type specific increment amount (e.g. 2000)
    setMonthlyIncrement('');
    setNewBase(String(currentBase));
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

    const isAlreadyRevised = audits.some(
      (a) =>
        a.employee?.employee_code === selectedEmp.employee_code ||
        a.employee?.id === selectedEmp.id
    );

    if (isAlreadyRevised) {
      showErrorToast(
        `An increment or bonus has already been added for ${selectedEmp.first_name} ${selectedEmp.last_name} (${selectedEmp.employee_code}). You cannot add it a second time. Please use 'Edit' in the audit trail to adjust it.`
      );
      return;
    }

    const currentBase = getEmpBaseSalary(selectedEmp);
    const empCurr = selectedEmp?.currency || (selectedEmp?.country === 'India' ? 'INR' : 'USD');
    const empCountry = selectedEmp?.country;

    let finalAnnualBase = 0;
    const numInc = Number(monthlyIncrement) || 0;
    const numBonus = Number(bonusAmount) || 0;

    if (incrementMode === 'monthly') {
      if (numInc <= 0 && numBonus <= 0) {
        showErrorToast('Please enter an increment amount or performance bonus.');
        return;
      }
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
      const reasonPrefix = incrementMode === 'monthly'
        ? (numInc > 0 && numBonus > 0
            ? `Monthly Increment (+${formatCurrency(numInc, empCurr, empCountry)}) & Bonus (+${formatCurrency(numBonus, empCurr, empCountry)})`
            : numBonus > 0
              ? `Performance Bonus (+${formatCurrency(numBonus, empCurr, empCountry)})`
              : `Monthly Increment (+${formatCurrency(numInc, empCurr, empCountry)} this month)`)
        : (numBonus > 0
            ? `Base Revision to ${formatCurrency(finalAnnualBase, empCurr, empCountry)} & Bonus (+${formatCurrency(numBonus, empCurr, empCountry)})`
            : reason);

      const payload: any = {
        employee_id: selectedEmp.id,
        increment_type: incrementMode,
        is_increment_planner: true,
        base_salary: finalAnnualBase,
        bonuses: numBonus,
        reason: `${reasonPrefix}: ${reason}`,
        effective_date: effectiveDate
      };

      if (incrementMode === 'monthly') {
        payload.monthly_increment = numInc;
      }

      const res = await apiRequest<{ success: boolean; message: string }>('/salaries/revise', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showSuccessToast(
        incrementMode === 'monthly'
          ? (numInc > 0 && numBonus > 0
              ? `Increment (${formatCurrency(numInc, empCurr, empCountry)}) and Bonus (${formatCurrency(numBonus, empCurr, empCountry)}) recorded!`
              : numBonus > 0
                ? `Performance Bonus of ${formatCurrency(numBonus, empCurr, empCountry)} recorded!`
                : `Monthly increment of ${formatCurrency(numInc, empCurr, empCountry)} recorded!`)
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

  const getCurrencySymbol = (currency?: string, country?: string): string => {
    const code = (currency || (country === 'India' ? 'INR' : 'USD')).toUpperCase().trim();
    const map: Record<string, string> = {
      INR: '₹',
      USD: '$',
      GBP: '£',
      EUR: '€',
      AUD: 'A$',
      CAD: 'C$',
      JPY: '¥',
      SGD: 'S$'
    };
    return map[code] || (code ? `${code} ` : '$');
  };

  const empCurr = selectedEmp?.currency || (selectedEmp?.country === 'India' ? 'INR' : 'USD');
  const empCountry = selectedEmp?.country;
  const empSym = getCurrencySymbol(empCurr, empCountry);

  const isEmployeeAlreadyRevised = selectedEmp
    ? audits.some(
        (a) =>
          a.employee?.employee_code === selectedEmp.employee_code ||
          a.employee?.id === selectedEmp.id
      )
    : false;

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
                          {formatCurrency(getEmpBaseSalary(emp), emp.currency, emp.country)}
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
                      {selectedEmp.currency && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-bold">
                          {selectedEmp.currency}
                        </span>
                      )}
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
                    <span>Current Base: {formatCurrency(getEmpBaseSalary(selectedEmp), empCurr, empCountry)}</span>
                  </div>
                </div>
              )}

              {/* Warning Alert if Increment or Bonus was already added */}
              {selectedEmp && isEmployeeAlreadyRevised && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">Increment / Bonus Already Added</strong>
                    <span>
                      An increment or bonus has already been added for {selectedEmp.first_name} {selectedEmp.last_name} ({selectedEmp.employee_code}). Adding a second time is not allowed. Please use <strong>Edit</strong> in the audit trail on the right to adjust it.
                    </span>
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
                    This Month Increment ({empSym}/mo)
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
                    Annual Base ({empSym}/yr)
                  </button>
                </div>
              </div>

              {/* This Month Increment Input Mode */}
              {incrementMode === 'monthly' ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">
                        Monthly Base Increment ({empSym})
                      </label>
                      {selectedEmp && (
                        <div className="text-[11px] text-muted text-right">
                          <span>Base: </span>
                          <strong className="font-mono text-foreground">{formatCurrency(getEmpMonthlyBase(selectedEmp), empCurr, empCountry)}/mo</strong>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted text-xs font-bold font-mono">{empSym}</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={monthlyIncrement}
                        onChange={(e) => setMonthlyIncrement(e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Live Simulation Card */}
                  {selectedEmp && (() => {
                    const monthlyTotal = getEmpMonthlyBase(selectedEmp);
                    const basicMonthly = Math.round(monthlyTotal * 0.50);
                    const hraMonthly = Math.round(basicMonthly * 0.40);
                    const specialMonthly = monthlyTotal - basicMonthly - hraMonthly;
                    const allowancesMonthly = hraMonthly + specialMonthly;
                    const inc = Number(monthlyIncrement) || 0;
                    const bonus = Number(bonusAmount) || 0;
                    const grossThisMonth = monthlyTotal + inc + bonus;
                    const epf = Math.round(basicMonthly * 0.12);
                    const deductions = epf + 320;
                    const netThisMonth = grossThisMonth - deductions;

                    return (
                      <div className="p-3 rounded-xl bg-background border border-border text-xs space-y-1.5">
                        <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Live Compensation Simulation (This Month)
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted">Monthly Base Income:</span>
                          <span className="font-mono font-bold">{formatCurrency(monthlyTotal, empCurr, empCountry)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pl-2 text-muted">
                          <span>• Basic Pay (50%):</span>
                          <span className="font-mono">{formatCurrency(basicMonthly, empCurr, empCountry)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pl-2 text-muted">
                          <span>• Allowances (HRA + Special 50%):</span>
                          <span className="font-mono">{formatCurrency(allowancesMonthly, empCurr, empCountry)}</span>
                        </div>
                        {inc > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted">This Month Increment:</span>
                            <span className="font-mono font-bold text-emerald-500">+{formatCurrency(inc, empCurr, empCountry)}</span>
                          </div>
                        )}
                        {bonus > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted">Performance Bonus:</span>
                            <span className="font-mono font-bold text-primary">+{formatCurrency(bonus, empCurr, empCountry)}</span>
                          </div>
                        )}
                        {(inc > 0 || bonus > 0) && (
                          <div className="flex justify-between items-center text-xs border-t border-border/50 pt-1 font-semibold">
                            <span className="text-foreground">Gross Earnings (This Month):</span>
                            <span className="font-mono text-foreground font-bold">{formatCurrency(grossThisMonth, empCurr, empCountry)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs text-muted border-t border-border/50 pt-1">
                          <span>Statutory Deductions (EPF 12% + PT + Health):</span>
                          <span className="font-mono text-rose-500">-{formatCurrency(deductions, empCurr, empCountry)}</span>
                        </div>
                        <div className="pt-1.5 border-t border-border flex justify-between items-center font-bold">
                          <span className="text-foreground">Net Pay (This Month):</span>
                          <span className="font-mono text-primary text-sm">
                            {formatCurrency(netThisMonth, empCurr, empCountry)}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted pt-0.5">
                          Will be automatically saved and credited in {effectiveDate.substring(0, 7)} payroll.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Annual Base Salary Input Mode */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">
                      New Base Salary (Annual {empCurr} - {empSym})
                    </label>
                    {selectedEmp && (
                      <button
                        type="button"
                        onClick={() => setNewBase(String(getEmpBaseSalary(selectedEmp)))}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                        title="Click to automatically apply current annual base"
                      >
                        <span>Current:</span>
                        <strong className="font-mono">{formatCurrency(getEmpBaseSalary(selectedEmp), empCurr, empCountry)}</strong>
                        <span className="text-[10px] text-primary/70">(Click to fill)</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted text-xs font-bold font-mono">{empSym}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newBase}
                      onChange={(e) => setNewBase(e.target.value)}
                      placeholder={selectedEmp ? `Enter amount (Current: ${formatCurrency(getEmpBaseSalary(selectedEmp), empCurr, empCountry)})` : "e.g. 71500"}
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Performance Bonus Input */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Performance Bonus ({empSym})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted text-xs font-bold font-mono">{empSym}</span>
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
                disabled={submitting || !selectedEmp || isEmployeeAlreadyRevised}
                className={`w-full font-semibold text-xs py-2 flex items-center justify-center gap-1.5 ${
                  isEmployeeAlreadyRevised
                    ? 'bg-muted/80 text-muted-foreground border border-border cursor-not-allowed opacity-75'
                    : 'bg-primary hover:bg-primary/90 text-white cursor-pointer'
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isEmployeeAlreadyRevised ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {isEmployeeAlreadyRevised ? 'Already Added (Cannot Add 2nd Time)' : 'Submit Revision'}
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
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-background text-muted uppercase border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Revision / Bonus</th>
                    <th className="py-2.5 px-3 text-right">Previous</th>
                    <th className="py-2.5 px-3 text-right">New Base</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-right">Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : audits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        No recent salary revision events recorded. Submit a revision on the left to create an audit record.
                      </td>
                    </tr>
                  ) : (
                    audits.map((a) => {
                      const aCurr = a.new_value?.currency || a.employee?.currency || (a.employee?.country === 'India' ? 'INR' : 'USD');
                      const aCountry = a.employee?.country;
                      const prev = Number(a.previous_value?.base_salary || 0);
                      const next = Number(a.new_value?.base_salary || 0);
                      const monthlyInc = Number(a.new_value?.monthly_increment || 0);
                      const bonusVal = Number(a.new_value?.bonus_amount || 0);
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
                            {aCurr && (
                              <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-muted/20 text-muted font-mono font-medium">
                                {aCurr}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {monthlyInc > 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <ArrowUpRight className="w-3 h-3" />
                                  +{formatCurrency(monthlyInc, aCurr, aCountry)} (This Month)
                                </span>
                                {bonusVal > 0 && (
                                  <span className="block text-[10px] text-primary font-mono font-semibold">
                                    Bonus: +{formatCurrency(bonusVal, aCurr, aCountry)}
                                  </span>
                                )}
                              </div>
                            ) : diffPct !== 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <ArrowUpRight className="w-3 h-3" />
                                  +{diffPct}%
                                </span>
                                {bonusVal > 0 && (
                                  <span className="block text-[10px] text-primary font-mono font-semibold">
                                    Bonus: +{formatCurrency(bonusVal, aCurr, aCountry)}
                                  </span>
                                )}
                              </div>
                            ) : bonusVal > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary font-mono">
                                +{formatCurrency(bonusVal, aCurr, aCountry)} (Bonus)
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted font-mono">No Change</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted">
                            {formatCurrency(prev, aCurr, aCountry)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            {isMonthly ? (
                              <span>
                                {formatCurrency(prev, aCurr, aCountry)}{' '}
                                {monthlyInc > 0 && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                    (+{formatCurrency(monthlyInc, aCurr, aCountry)})
                                  </span>
                                )}
                              </span>
                            ) : (
                              formatCurrency(next, aCurr, aCountry)
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-muted max-w-[200px] truncate">{a.reason}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted text-[11px]">{dateStr}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAudit(a)}
                                className="text-primary hover:underline text-xs flex items-center gap-1 cursor-pointer font-medium"
                                title="Edit this revision/bonus"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingAudit(a)}
                                className="text-rose-500 hover:text-rose-700 hover:underline text-xs flex items-center gap-1 cursor-pointer font-medium"
                                title="Delete this revision/bonus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
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

      {/* Edit Audit Modal */}
      {editingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            ref={editModalRef}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Edit Increment & Bonus Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAudit(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Employee Banner */}
            <div className="p-3 rounded-xl bg-background border border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {editingAudit.employee?.first_name?.[0] || 'E'}{editingAudit.employee?.last_name?.[0] || 'M'}
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {editingAudit.employee ? `${editingAudit.employee.first_name} ${editingAudit.employee.last_name}` : 'Staff Member'}
                </span>
                <span className="font-mono text-[11px] text-primary">
                  {editingAudit.employee?.employee_code || 'EMP-SYSTEM'} • {editingAudit.employee?.department || 'Operations'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveEditAudit} className="space-y-3.5">
              {/* Revision Type */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-background border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setEditMode('monthly')}
                    className={`py-1.5 px-3 rounded-md font-medium transition cursor-pointer text-center ${
                      editMode === 'monthly'
                        ? 'bg-primary text-white shadow-2xs font-semibold'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    Monthly Increment
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode('annual')}
                    className={`py-1.5 px-3 rounded-md font-medium transition cursor-pointer text-center ${
                      editMode === 'annual'
                        ? 'bg-primary text-white shadow-2xs font-semibold'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    Annual Base
                  </button>
                </div>
              </div>

              {/* Amount field depending on mode */}
              {editMode === 'monthly' ? (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Monthly Increment Amount ({getCurrencySymbol(editingAudit.employee?.currency, editingAudit.employee?.country)})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editMonthlyIncrement}
                    onChange={(e) => setEditMonthlyIncrement(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    New Annual Base Salary ({getCurrencySymbol(editingAudit.employee?.currency, editingAudit.employee?.country)})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editNewBase}
                    onChange={(e) => setEditNewBase(e.target.value)}
                    placeholder="e.g. 85000"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Performance Bonus */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Performance Bonus ({getCurrencySymbol(editingAudit.employee?.currency, editingAudit.employee?.country)})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editBonusAmount}
                  onChange={(e) => setEditBonusAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Appraisal Reason */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Appraisal Reason
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAudit(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {editSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            ref={deleteModalRef}
            className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Delete Audit Entry</h3>
                <p className="text-xs text-muted">Revert compensation adjustment</p>
              </div>
            </div>

            <p className="text-xs text-foreground bg-background p-3 rounded-xl border border-border">
              Are you sure you want to delete this increment/bonus record for{' '}
              <strong className="text-primary font-semibold">
                {deletingAudit.employee ? `${deletingAudit.employee.first_name} ${deletingAudit.employee.last_name}` : 'this employee'}
              </strong>
              ? This will remove the audit entry and revert the compensation in payroll.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingAudit(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDeleteAudit}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
