import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { showErrorToast } from '../utils/toast';
import { downloadExport } from '../utils/download';
import { useDebounce } from '../hooks/useDebounce';
import { TableRowSkeleton, EmptyState, ErrorState } from '../components/common/Skeleton';

interface LogItem {
  id: number;
  user: string;
  employeeCode: string;
  action: string;
  prev: string;
  new: string;
  reason: string;
  time: string;
}

interface RawAuditLog {
  id: number;
  action: string;
  previous_value: { net_salary?: number; base_salary?: number; name?: string } | null;
  new_value: { net_salary?: number; base_salary?: number; name?: string; deleted?: boolean } | null;
  reason: string;
  created_at?: string;
  createdAt?: string;
  user?: { name: string; email: string };
  employee?: { employee_code: string; currency: string };
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch
      });
      const res = await apiRequest<{ success: boolean; data: { rows: RawAuditLog[]; count: number } }>(
        `/audit-logs?${queryParams.toString()}`
      );
      if (res.data?.rows) {
        const mapped: LogItem[] = res.data.rows.map((r) => {
          const currency = r.employee?.currency || '$';
          const prevStr = r.previous_value?.net_salary != null
            ? `${currency} ${Number(r.previous_value.net_salary).toLocaleString()}`
            : r.previous_value?.name ? `Created: ${r.previous_value.name}` : 'None';
          const newStr = r.new_value?.net_salary != null
            ? `${currency} ${Number(r.new_value.net_salary).toLocaleString()}`
            : r.new_value?.deleted ? 'Deleted' : 'Recorded';

          const rawDate = r.createdAt || r.created_at;
          let formattedTime = 'Just now';
          if (rawDate) {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              formattedTime = parsed.toLocaleString();
            }
          }

          return {
            id: r.id,
            user: r.user?.name || 'HR Manager',
            employeeCode: r.employee?.employee_code || 'EMP-SYSTEM',
            action: r.action,
            prev: prevStr,
            new: newStr,
            reason: r.reason,
            time: formattedTime
          };
        });
        setLogs(mapped);
        setTotalCount(res.data.count || mapped.length);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve compliance audit logs from database.';
      setError(msg);
      showErrorToast('Failed to retrieve compliance audit logs from database.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleExport = () => {
    downloadExport('/export/audit-logs', `paydesk_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Compliance & Audit Trail</h1>
          <p className="text-xs text-muted mt-0.5">
            Immutable log of all compensation modifications, revisions, and authorized actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Logs
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Full Audit Trail Active
          </div>
        </div>
      </div>

      {/* Search Bar - Backend Driven Filter */}
      <Card>
        <div className="space-y-2">
          <Input
            placeholder="Filter audit logs by actor, employee code, or reason in database..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />

          {Boolean(search) && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted">
                Filtering logs by: <strong className="text-foreground font-mono">"{search}"</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-muted hover:text-foreground bg-background hover:bg-card border border-border transition shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Audit Table */}
      <Card>
        <div className="table-slider">
          <table className={`w-full text-left text-sm min-w-[780px] 2xl:min-w-0 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <thead className="bg-background text-muted border-b border-border uppercase tracking-wider text-xs">
              <tr>
                <th className="py-3 px-3.5">Log ID</th>
                <th className="py-3 px-3.5">Actor</th>
                <th className="py-3 px-3.5">Employee Code</th>
                <th className="py-3 px-3.5">Action</th>
                <th className="py-3 px-3.5">Previous Value</th>
                <th className="py-3 px-3.5">New Value</th>
                <th className="py-3 px-3.5">Justification / Reason</th>
                <th className="py-3 px-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loading && logs.length === 0 ? (
                <TableRowSkeleton columns={8} rows={10} />
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <ErrorState
                      title="Failed to Load Audit Logs"
                      message={error}
                      onRetry={fetchAuditLogs}
                    />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      title="No compliance logs found"
                      description="No audit trail entries matched the specified query."
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-background/60 transition">
                    <td className="py-3 px-3.5 font-mono text-muted">#{log.id}</td>
                    <td className="py-3 px-3.5 font-medium">{log.user}</td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-primary">{log.employeeCode}</td>
                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-muted">{log.prev}</td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-emerald-500">{log.new}</td>
                    <td className="py-3 px-3.5 text-muted">{log.reason}</td>
                    <td className="py-3 px-3.5 text-right font-mono text-muted text-xs">{log.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border mt-2">
          <p className="text-sm text-muted">
            Showing Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalCount} total audit events)
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
    </div>
  );
};
