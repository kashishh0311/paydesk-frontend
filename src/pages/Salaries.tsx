import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import {
  Banknote,
  Edit3,
  X,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { downloadExport } from '../utils/download';
import { useDebounce } from '../hooks/useDebounce';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

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
}

interface RawSalaryItem {
  id: number;
  employee_id: number;
  base_salary: string | number;
  bonuses: string | number;
  deductions: string | number;
  net_salary: string | number;
  effective_date: string;
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
  const [salaries, setSalaries] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [recordType, setRecordType] = useState<'current' | 'previous' | 'all'>('current');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Debounced filters
  const debouncedSearch = useDebounce(search, 300);
  const debouncedDepartment = useDebounce(department, 200);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedDepartment, recordType]);

  // Modal & Export states
  const [selectedRecord, setSelectedRecord] = useState<SalaryRow | null>(null);
  const [newBase, setNewBase] = useState('');
  const [revisionReason, setRevisionReason] = useState('Annual Performance Appraisal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Close export dropdown when clicking outside
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(exportDropdownRef, () => setIsExportMenuOpen(false));

  const hasActiveFilters = Boolean(search || department || recordType !== 'current');
  const handleClearFilters = () => {
    setSearch('');
    setDepartment('');
    setRecordType('current');
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
        record_type: recordType
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
          effectiveDate: r.effective_date
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
  }, [page, debouncedSearch, debouncedDepartment, recordType]);

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

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    setIsExportMenuOpen(false);
    const query = new URLSearchParams({ format, department, record_type: recordType });
    const ext = format === 'xlsx' ? 'xls' : format;
    downloadExport(`/export/salaries?${query.toString()}`, `paydesk_salaries_${new Date().toISOString().split('T')[0]}.${ext}`);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Salary Management</h1>
          <p className="text-xs text-muted mt-0.5">
            Managing verified compensation structures, automated deductions, and net take-home pay. Showing {recordType === 'current' ? 'current active records' : recordType === 'previous' ? 'previous historical revisions' : 'all records'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
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
                  <span>Export as Excel (.xls)</span>
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
      </div>

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
                value={recordType}
                onChange={(e) => {
                  setRecordType(e.target.value as 'current' | 'previous' | 'all');
                  setPage(1);
                }}
                aria-label="Filter by salary record status"
              >
                <option value="current">Current Active Salaries</option>
                <option value="previous">Previous / Historical Revisions</option>
                <option value="all">All Records (Current & Historical)</option>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
              <span className="text-muted">
                Active filters applied: {[
                  search && `Search: "${search}"`,
                  department && `Dept: ${department}`,
                  recordType === 'previous' && 'Status: Previous Revisions',
                  recordType === 'all' && 'Status: All Records'
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
                <th className="py-3 px-3.5">Base Salary</th>
                <th className="py-3 px-3.5">Bonuses</th>
                <th className="py-3 px-3.5">Deductions</th>
                <th className="py-3 px-3.5">Net Salary</th>
                <th className="py-3 px-3.5">Effective Date</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted">
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
                      {s.currency} {s.baseSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-emerald-500">
                      +{s.currency} {s.bonuses.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-red-400">
                      -{s.currency} {s.deductions.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-foreground">
                      {s.currency} {s.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-mono text-xs text-foreground">{s.effectiveDate}</div>
                      <div className="mt-0.5">
                        {recordType === 'previous' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Previous Revision
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Active Structure
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRevise(s)}
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Revise
                      </Button>
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

      {/* Salary Revision Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Revise Salary Record</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border text-xs space-y-1">
              <p><span className="text-muted">Employee:</span> <strong className="text-foreground">{selectedRecord.name} ({selectedRecord.code})</strong></p>
              <p><span className="text-muted">Current Base:</span> <strong className="font-mono text-foreground">{selectedRecord.currency} {selectedRecord.baseSalary.toLocaleString()}</strong></p>
            </div>

            <form onSubmit={handleSaveRevision} className="space-y-3.5">
              <Input
                label={`New Base Salary (${selectedRecord.currency})`}
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
    </div>
  );
};
