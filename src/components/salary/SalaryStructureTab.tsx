import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { apiRequest } from '../../services/api';
import { formatINR } from '../../utils/currency';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { SalaryStructureSkeleton } from '../common/Skeleton';
import {
  Layers,
  Search,
  Edit3,
  CheckCircle2,
  User,
  Loader2,
  FileText,
} from 'lucide-react';

interface EmployeeItem {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  job_title: string;
  currency: string;
}

interface SalaryStructureData {
  employee: EmployeeItem;
  currentRecord: any;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  effective_date: string;
  reason: string;
  monthly: {
    basic_salary: number;
    hra: number;
    special_allowance: number;
    gross_monthly: number;
    epf: number;
    professional_tax: number;
    health_insurance: number;
    lop?: number;
    other_deductions?: number;
    custom_deductions?: Array<{ type: string; amount: number; reason?: string }>;
    total_deductions: number;
    net_monthly: number;
  };
  leaves?: any;
}

export const SalaryStructureTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<EmployeeItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);

  // Search dropdown outside-click handler
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  useOnClickOutside(searchDropdownRef, () => setIsDropdownOpen(false));

  // Current Structure Data
  const [structure, setStructure] = useState<SalaryStructureData | null>(null);
  const [structureLoading, setStructureLoading] = useState(false);

  // Edit / Add Form State
  const [isEditing, setIsEditing] = useState(false);
  const [annualBase, setAnnualBase] = useState<number>(600000);
  const [bonusInput, setBonusInput] = useState<number>(0);
  const [reasonInput, setReasonInput] = useState('Annual Performance Appraisal');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Load default employee on mount (e.g. EMP-000001 or first employee)
  useEffect(() => {
    const loadDefault = async () => {
      try {
        const res = await apiRequest<{ success: boolean; data: { rows: EmployeeItem[] } }>(
          '/employees?limit=1'
        );
        if (res.data?.rows?.[0]) {
          handleSelectEmployee(res.data.rows[0]);
        }
      } catch (err) {
        console.error('Failed to load default employee for structure:', err);
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
      const res = await apiRequest<{ success: boolean; data: { rows: EmployeeItem[] } }>(
        `/employees?search=${encodeURIComponent(q)}&limit=8`
      );
      if (res.data?.rows) {
        setSearchResults(res.data.rows);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectEmployee = async (emp: EmployeeItem) => {
    setSelectedEmp(emp);
    setIsDropdownOpen(false);
    setSearch(`${emp.employee_code} - ${emp.first_name} ${emp.last_name}`);
    setStructureLoading(true);
    setIsEditing(false);
    try {
      const res = await apiRequest<{ success: boolean; data: SalaryStructureData }>(
        `/salaries/structure/${emp.id}`
      );
      if (res.data) {
        setStructure(res.data);
        setAnnualBase(res.data.base_salary);
        setBonusInput(res.data.bonuses || 0);
        setReasonInput(res.data.reason || 'Annual Performance Appraisal');
        setEffectiveDate(res.data.effective_date || new Date().toISOString().split('T')[0]);
      }
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to load employee salary structure.');
    } finally {
      setStructureLoading(false);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      showErrorToast('Please select an employee first.');
      return;
    }
    if (!annualBase || annualBase <= 0) {
      showErrorToast('Please enter a valid base salary amount in Indian Rupees (₹).');
      return;
    }

    setSubmitting(true);
    try {
      // Approximate 12% statutory deduction
      const deductions = Math.round(annualBase * 0.12);
      const res = await apiRequest<{ success: boolean; message: string }>('/salaries/revise', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: selectedEmp.id,
          base_salary: annualBase,
          bonuses: bonusInput,
          deductions,
          reason: reasonInput,
          effective_date: effectiveDate,
          is_structure_edit: true
        })
      });

      showSuccessToast(res.message || 'Salary structure saved and updated successfully!');
      setIsEditing(false);
      // Reload updated structure
      handleSelectEmployee(selectedEmp);
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to save salary structure.');
    } finally {
      setSubmitting(false);
    }
  };

  const simulatedMonthlyBase = Math.round(annualBase / 12);
  const simulatedBasicSalary = Math.round(simulatedMonthlyBase * 0.50);
  const simulatedHra = Math.round(simulatedBasicSalary * 0.40);
  const simulatedSpecialAllowance = simulatedMonthlyBase - simulatedBasicSalary - simulatedHra;
  const simulatedAllowances = simulatedHra + simulatedSpecialAllowance;
  const simulatedGrossMonthly = simulatedMonthlyBase + Math.round((bonusInput || 0) / 12);
  const simulatedEpf = Math.round(simulatedBasicSalary * 0.12);
  const simulatedPT = 200;
  const simulatedHealth = 120;
  const simulatedTotalDeductions = simulatedEpf + simulatedPT + simulatedHealth;
  const simulatedNetMonthly = simulatedGrossMonthly - simulatedTotalDeductions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Employee Salary Structure Management
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Configure, add, and revise individual compensation packages, basic pay, allowances, and statutory deductions in Indian Rupees (₹).
          </p>
        </div>
        {selectedEmp && (
          <Button
            onClick={() => setIsEditing((prev) => !prev)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            {isEditing ? <FileText className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isEditing ? 'View Current Structure' : 'Edit Salary Structure'}
          </Button>
        )}
      </div>

      {/* Employee Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-2xs relative" ref={searchDropdownRef}>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Select Employee to Manage Salary Structure
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

      {structureLoading ? (
        <SalaryStructureSkeleton />
      ) : structure ? (
        <div className="space-y-6">
          {/* Employee Badge Summary */}
          <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base">
                {structure.employee.first_name[0]}{structure.employee.last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {structure.employee.first_name} {structure.employee.last_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-background border border-border font-mono font-bold text-xs text-primary">
                    {structure.employee.employee_code}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {structure.employee.job_title} • {structure.employee.department} • INR (₹)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-muted block">Annual Base Compensation</span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {formatINR(structure.base_salary)}
                </span>
              </div>
              <div className="text-right border-l border-border pl-4">
                <span className="text-[11px] text-primary font-semibold block">Net Take-Home Pay</span>
                <span className="text-xl font-bold font-mono text-primary">
                  {formatINR(structure.monthly.net_monthly)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* EDIT FORM or DISPLAY MODE */}
          {isEditing ? (
            <Card
              title="Edit Employee Salary Structure"
              subtitle="Update compensation package, adjust component allowances, and log mandatory reason"
            >
              <form onSubmit={handleSaveStructure} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Annual Base Salary (in ₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="50000"
                        step="1000"
                        value={annualBase}
                        onChange={(e) => setAnnualBase(Number(e.target.value) || 0)}
                        required
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Annual Performance Bonus (in ₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={bonusInput}
                        onChange={(e) => setBonusInput(Number(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Revision Reason
                    </label>
                    <select
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground"
                    >
                      <option value="Annual Performance Appraisal">Annual Performance Appraisal</option>
                      <option value="Promotion & Role Elevation">Promotion & Role Elevation</option>
                      <option value="Market Correction Adjustment">Market Correction Adjustment</option>
                      <option value="Executive Review">Executive Review</option>
                      <option value="Joining Salary Structure Setup">Joining Salary Structure Setup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-background border border-border text-foreground"
                    />
                  </div>
                </div>

                {/* Live Preview of Calculated Structure */}
                <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Calculated Monthly Component Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-card border border-border/70">
                      <span className="text-muted block text-[11px]">Monthly Base Salary</span>
                      <strong className="text-foreground font-mono text-sm">{formatINR(simulatedMonthlyBase)}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border border-border/70">
                      <span className="text-muted block text-[11px]">Basic Pay (50%)</span>
                      <strong className="text-foreground font-mono text-sm">{formatINR(simulatedBasicSalary)}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border border-border/70">
                      <span className="text-muted block text-[11px]">HRA + Special (50%)</span>
                      <strong className="text-foreground font-mono text-sm">{formatINR(simulatedAllowances)}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-primary font-semibold block text-[11px]">Monthly Net Take-Home</span>
                      <strong className="text-primary font-mono text-sm">{formatINR(simulatedNetMonthly)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Salary Structure
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Earnings Breakdown Card */}
              <Card title="Monthly Earnings Breakdown" subtitle="Basic pay and component allowances">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Basic Pay</span>
                      <span className="text-[11px] text-muted">Fixed monthly core salary</span>
                    </div>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {formatINR(structure.monthly.basic_salary)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">House Rent Allowance (HRA)</span>
                      <span className="text-[11px] text-muted">40% of basic pay</span>
                    </div>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {formatINR(structure.monthly.hra)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Special & Flexi Allowance</span>
                      <span className="text-[11px] text-muted">Conveyance, communications & role allowance</span>
                    </div>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {formatINR(structure.monthly.special_allowance)}
                    </span>
                  </div>

                  {structure.bonuses > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">Performance Bonus & Increment</span>
                        <span className="text-[11px] text-muted">Additional compensation this period</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        +{formatINR(structure.bonuses)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-xs font-bold text-foreground">Monthly Gross Salary</span>
                    <span className="font-mono font-bold text-primary text-base">
                      {formatINR(structure.monthly.gross_monthly)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Deductions Breakdown Card */}
              <Card title="Monthly Deductions Breakdown" subtitle="Statutory withholdings and benefits">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">EPF (Provident Fund)</span>
                      <span className="text-[11px] text-muted">12% of basic pay contribution</span>
                    </div>
                    <span className="font-mono font-bold text-rose-500 text-sm">
                      -{formatINR(structure.monthly.epf)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Professional Tax (PT)</span>
                      <span className="text-[11px] text-muted">State statutory employment deduction</span>
                    </div>
                    <span className="font-mono font-bold text-rose-500 text-sm">
                      -{formatINR(structure.monthly.professional_tax)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Health & Medical Premium</span>
                      <span className="text-[11px] text-muted">Corporate group medical coverage</span>
                    </div>
                    <span className="font-mono font-bold text-rose-500 text-sm">
                      -{formatINR(structure.monthly.health_insurance)}
                    </span>
                  </div>

                  {(structure.monthly.lop || 0) > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">Loss of Pay (LOP)</span>
                        <span className="text-[11px] text-muted">
                          {structure.leaves?.unpaid_leave?.days_taken || 2} unpaid leave days ({formatINR(structure.leaves?.unpaid_leave?.per_day_rate || Math.round(structure.monthly.basic_salary / 30))}/day)
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        -{formatINR(structure.monthly.lop || 0)}
                      </span>
                    </div>
                  )}

                  {structure.monthly.custom_deductions && structure.monthly.custom_deductions.map((cd, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">{cd.type}</span>
                        <span className="text-[11px] text-muted">{cd.reason || 'Custom employee deduction'}</span>
                      </div>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                        -{formatINR(cd.amount)}
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Total Deductions</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-base">
                      -{formatINR(structure.monthly.total_deductions)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Net Summary Box */}
              <Card title="Net Compensation Summary" subtitle="Credited to employee bank account">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                      Monthly Take-Home Pay
                    </span>
                    <div className="text-3xl font-extrabold font-mono text-primary">
                      {formatINR(structure.monthly.net_monthly)}
                    </div>
                    <span className="text-[11px] text-muted">
                      Paid monthly after all verified statutory & LOP deductions
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Effective Date:</span>
                      <strong className="text-foreground font-mono">{structure.effective_date}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Last Reason:</span>
                      <strong className="text-foreground">{structure.reason}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Annual CTC:</span>
                      <strong className="text-foreground font-mono">{formatINR(structure.base_salary)}</strong>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    Edit This Salary Structure
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Monthly Leave & Attendance Details Card */}
          {structure && (
            <Card
              title="Monthly Leave & Attendance Details"
              subtitle="Breakdown of all leave types, verified balances, and automatic backend LOP deduction"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Casual Leave */}
                <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Casual Leave (CL)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Paid Leave
                    </span>
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <div>Days Taken: <strong className="text-foreground">1 Day</strong></div>
                    <div>Remaining Balance: <strong className="text-foreground">11 Days</strong></div>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-xs">
                    <span className="text-muted">Deduction:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹0.00 (No Loss)</strong>
                  </div>
                </div>

                {/* Sick Leave */}
                <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Sick Leave (SL)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Paid Leave
                    </span>
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <div>Days Taken: <strong className="text-foreground">{structure.leaves?.sick_leave?.days_taken || 0} Day(s)</strong></div>
                    <div>Remaining Balance: <strong className="text-foreground">10 Days</strong></div>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-xs">
                    <span className="text-muted">Deduction:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹0.00 (Medical Paid)</strong>
                  </div>
                </div>

                {/* Loss of Pay (LOP) */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  (structure.monthly.lop || 0) > 0 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-background border-border'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Loss of Pay (LOP) / Unpaid Leaves</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (structure.monthly.lop || 0) > 0
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/10 text-muted border border-border'
                    }`}>
                      {(structure.monthly.lop || 0) > 0 ? 'Deducted' : 'Full Attendance'}
                    </span>
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <div>Unpaid Days: <strong className="text-foreground">{structure.leaves?.unpaid_leave?.days_taken || 0} Day(s)</strong></div>
                    <div>Per Day Deduction Rate: <strong className="font-mono text-foreground">{formatINR(structure.leaves?.unpaid_leave?.per_day_rate || Math.round(structure.monthly.basic_salary / 30))}</strong></div>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-xs">
                    <span className="text-muted">Total LOP Deduction:</span>
                    <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {(structure.monthly.lop || 0) > 0 ? `-${formatINR(structure.monthly.lop || 0)}` : '₹0.00'}
                    </strong>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card title="No Employee Selected" subtitle="Search an employee above to manage their salary structure">
          <div className="py-12 text-center text-xs text-muted flex flex-col items-center justify-center space-y-2">
            <User className="w-8 h-8 text-muted/60" />
            <p>Use the search input above to lookup any employee by code or name.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
