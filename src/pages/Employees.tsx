import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { apiRequest } from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Trash2,
  Download,
  X,
  Check,
  FileSpreadsheet,
  FileText,
  RotateCcw
} from 'lucide-react';
import { downloadExport } from '../utils/download';
import { useDebounce } from '../hooks/useDebounce';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

interface EmployeeItem {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  country: string;
  currency: string;
  hire_date: string;
  status: string;
}

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Debounced filters to prevent excessive network calls
  const debouncedSearch = useDebounce(search, 300);
  const debouncedDepartment = useDebounce(department, 200);
  const debouncedCountry = useDebounce(country, 200);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedDepartment, debouncedCountry]);

  // Modal & Dropdown States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close export dropdown when clicking outside screen
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(exportDropdownRef, () => setIsExportMenuOpen(false));

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: 'Engineering',
    job_title: 'Software Engineer',
    country: 'United States',
    currency: 'USD',
    base_salary: 85000,
    status: 'Active'
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch,
        department: debouncedDepartment,
        country: debouncedCountry
      });
      const res = await apiRequest<{ success: boolean; data: { rows: EmployeeItem[]; count: number } }>(
        `/employees?${queryParams.toString()}`
      );
      if (res.data) {
        setEmployees(res.data.rows);
        setTotalCount(res.data.count);
      }
    } catch {
      showErrorToast('Failed to retrieve live employee records from database.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, debouncedDepartment, debouncedCountry]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      showSuccessToast(`Employee ${formData.first_name} ${formData.last_name} onboarded successfully!`);
      setIsAddModalOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        department: 'Engineering',
        job_title: 'Software Engineer',
        country: 'United States',
        currency: 'USD',
        base_salary: 85000,
        status: 'Active'
      });
      fetchEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create employee profile.';
      showErrorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/employees/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      showSuccessToast(`Employee ${deleteTarget.employee_code} removed.`);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete employee.';
      showErrorToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(search || department || country);
  const handleClearFilters = () => {
    setSearch('');
    setDepartment('');
    setCountry('');
    setPage(1);
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    setIsExportMenuOpen(false);
    const query = new URLSearchParams({
      format,
      search,
      department,
      country
    });
    const ext = format === 'xlsx' ? 'xls' : format;
    downloadExport(`/export/employees?${query.toString()}`, `paydesk_employees_${new Date().toISOString().split('T')[0]}.${ext}`);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Employee Directory</h1>
          <p className="text-xs text-muted mt-0.5">
            Viewing and managing {totalCount.toLocaleString()} global employee records with instant search and pagination.
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
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-background transition text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-background transition text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-500" />
                  <span>Export as Excel (.xls)</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-background transition text-left"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Input
                placeholder="Search by name, code or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

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
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by country"
              >
                <option value="">All Countries</option>
                <option value="United States">United States (USD)</option>
                <option value="United Kingdom">United Kingdom (GBP)</option>
                <option value="Germany">Germany (EUR)</option>
                <option value="India">India (INR)</option>
                <option value="Singapore">Singapore (SGD)</option>
                <option value="Japan">Japan (JPY)</option>
                <option value="Canada">Canada (CAD)</option>
                <option value="Australia">Australia (AUD)</option>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
              <span className="text-muted">
                Active filters applied: {[search && `Search: "${search}"`, department && `Dept: ${department}`, country && `Country: ${country}`].filter(Boolean).join(' • ')}
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

      {/* Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <thead className="bg-background text-muted border-b border-border uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3 px-3.5">Code</th>
                <th className="py-3 px-3.5">Employee Name</th>
                <th className="py-3 px-3.5">Department</th>
                <th className="py-3 px-3.5">Job Title</th>
                <th className="py-3 px-3.5">Country</th>
                <th className="py-3 px-3.5">Currency</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted">
                    No employee records matching current criteria in MySQL database.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-background/60 transition">
                    <td className="py-3 px-3.5 font-mono font-semibold text-primary">{emp.employee_code}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold">{emp.first_name} {emp.last_name}</div>
                      <div className="text-xs text-muted">{emp.email}</div>
                    </td>
                    <td className="py-3 px-3.5 font-medium">{emp.department}</td>
                    <td className="py-3 px-3.5 text-muted">{emp.job_title}</td>
                    <td className="py-3 px-3.5">{emp.country}</td>
                    <td className="py-3 px-3.5 font-mono">{emp.currency}</td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setDeleteTarget(emp)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-background transition cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            Showing Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalCount.toLocaleString()} total entries)
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

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Onboard New Employee</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </Select>
                <Input
                  label="Job Title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Country"
                  value={formData.country}
                  onChange={(e) => {
                    const c = e.target.value;
                    const currencies: Record<string, string> = {
                      'United States': 'USD',
                      'United Kingdom': 'GBP',
                      'Germany': 'EUR',
                      'India': 'INR',
                      'Singapore': 'SGD',
                      'Japan': 'JPY',
                      'Canada': 'CAD',
                      'Australia': 'AUD'
                    };
                    setFormData({
                      ...formData,
                      country: c,
                      currency: currencies[c] || 'USD'
                    });
                  }}
                >
                  <option value="United States">United States (USD)</option>
                  <option value="United Kingdom">United Kingdom (GBP)</option>
                  <option value="Germany">Germany (EUR)</option>
                  <option value="India">India (INR)</option>
                  <option value="Singapore">Singapore (SGD)</option>
                  <option value="Japan">Japan (JPY)</option>
                  <option value="Canada">Canada (CAD)</option>
                  <option value="Australia">Australia (AUD)</option>
                </Select>
                <Input
                  label={`Starting Base Salary (${formData.currency})`}
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
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
                  Create & Log Audit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Remove Employee Record"
        message={`Are you sure you want to remove employee ${deleteTarget?.employee_code} (${deleteTarget?.first_name} ${deleteTarget?.last_name})? This action will permanently remove their records and record an entry in the compliance audit trail.`}
        confirmText="Remove Record"
        cancelText="Keep Employee"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
