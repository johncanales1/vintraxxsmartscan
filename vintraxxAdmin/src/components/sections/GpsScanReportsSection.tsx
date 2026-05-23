'use client';

/**
 * GpsScanReportsSection — admin scan reports console.
 *
 * Lists all GPS terminals and allows running full diagnostic scans, viewing
 * results, emailing PDFs, and promoting to AI. Mirrors the Frontend's
 * "Reports" page but admin-scoped (no ownership filter).
 */

import { useState, useEffect, useCallback } from 'react';
import { api, GpsTerminal, GpsScanReport, AdminFullReportData } from '@/lib/api';
import GpsFullReportModal from '@/components/modals/GpsFullReportModal';
import ConfirmPasswordModal from '@/components/modals/ConfirmPasswordModal';
import BulkActionBar from '@/components/shared/BulkActionBar';
import { useMultiSelect } from '@/lib/useMultiSelect';
import { useAuth } from '@/lib/auth';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import { fmtRelative, vehicleLabel } from '@/lib/gpsHelpers';
import {
  Search, RefreshCw, Radio, Wifi, WifiOff, Play, ChevronLeft, ChevronRight,
  FileText, Mail, Sparkles, AlertTriangle, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GpsScanReportsSection() {
  const [terminals, setTerminals] = useState<GpsTerminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online'>('all');

  // Track which terminal's scan panel is expanded
  const [expandedTerminalId, setExpandedTerminalId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(id);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listGpsTerminals(page, 30, {
        search: debouncedQuery.trim() || undefined,
        filter: statusFilter === 'online' ? 'online' : undefined,
      });
      setTerminals(res.terminals);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load terminals');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh on terminal status change
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queue = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        load();
      }, 2000);
    };
    const off1 = gpsAdminWs.on('terminal.online', queue);
    const off2 = gpsAdminWs.on('terminal.offline', queue);
    return () => {
      off1();
      off2();
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by VIN, device ID, or nickname..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} terminals</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'online');
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Terminals</option>
            <option value="online">Online Only</option>
          </select>
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : terminals.length === 0 ? (
        <div className="text-center py-16">
          <Radio size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {query || statusFilter !== 'all' ? 'No terminals match your filters' : 'No terminals provisioned yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {terminals.map((t) => (
            <TerminalScanRow
              key={t.id}
              terminal={t}
              expanded={expandedTerminalId === t.id}
              onToggle={() => setExpandedTerminalId(expandedTerminalId === t.id ? null : t.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Terminal Row with expandable Scan Panel ─────────────────────────────────

function TerminalScanRow({
  terminal,
  expanded,
  onToggle,
}: {
  terminal: GpsTerminal;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isOnline = terminal.status === 'ONLINE';
  const label = vehicleLabel(terminal);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {terminal.vehicleVin || terminal.deviceIdentifier}
            {terminal.ownerUser && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">• {terminal.ownerUser.email}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isOnline ? (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">ONLINE</span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400">OFFLINE</span>
          )}
          <FileText size={16} className={`transition-transform ${expanded ? 'text-blue-500 rotate-90' : 'text-gray-400'}`} />
        </div>
      </button>
      {expanded && <ScanPanel terminal={terminal} />}
    </div>
  );
}

// ─── Scan Panel (inline per terminal) ────────────────────────────────────────

function ScanPanel({ terminal }: { terminal: GpsTerminal }) {
  const { admin } = useAuth();
  const canDelete = !!admin?.superAdmin;
  const [report, setReport] = useState<GpsScanReport | null>(null);
  const [reports, setReports] = useState<GpsScanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [fullReportOpen, setFullReportOpen] = useState(false);
  const [fullReportLoading, setFullReportLoading] = useState(false);
  const [fullReportData, setFullReportData] = useState<AdminFullReportData | null>(null);
  const [fullReportError, setFullReportError] = useState<string | null>(null);

  const sel = useMultiSelect();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const isOnline = terminal.status === 'ONLINE';

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listGpsScanReports(terminal.id, { limit: 10 });
      setReports(res.reports);
      if (res.reports.length > 0) {
        setReport(res.reports[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load scan reports');
    } finally {
      setLoading(false);
    }
  }, [terminal.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const pollUntilSettled = useCallback(async (id: string) => {
    const MAX = 25;
    for (let i = 0; i < MAX; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await api.getGpsScanReport(id);
        const r = res.report;
        setReport(r);
        if (r.status !== 'PENDING') return r;
      } catch {
        break;
      }
    }
    return null;
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await api.requestGpsScanReport(terminal.id);
      toast.success(res.reused ? 'Scan already in progress' : 'Scan initiated');
      // Fetch the pending report immediately
      const detail = await api.getGpsScanReport(res.scanReportId);
      setReport(detail.report);
      // Poll until completion
      await pollUntilSettled(res.scanReportId);
      loadReports();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start scan');
    } finally {
      setScanning(false);
    }
  };

  const handleEmail = async () => {
    if (!report) return;
    setEmailing(true);
    try {
      const res = await api.emailGpsScanReport(report.id);
      toast.success(`Report emailed to ${res.sentTo}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to email report');
    } finally {
      setEmailing(false);
    }
  };

  const handleFullReport = async () => {
    if (!report) return;
    setPromoting(true);
    setFullReportOpen(true);
    setFullReportLoading(true);
    setFullReportData(null);
    setFullReportError(null);

    try {
      // Promote to AI (idempotent — returns existing scanId if already promoted)
      const promoteRes = await api.promoteGpsScanToAi(report.id);
      const scanId = promoteRes.scanId;

      // Poll for report completion
      const MAX_POLL = 60;
      const POLL_INTERVAL = 2000;
      for (let i = 0; i < MAX_POLL; i++) {
        const res = await api.getAdminScanFullReport(scanId);
        if (res.status === 'completed' && res.data) {
          setFullReportData(res.data);
          setFullReportLoading(false);
          loadReports();
          return;
        }
        if (res.status === 'failed') {
          setFullReportError(res.error || 'Report generation failed');
          setFullReportLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
      setFullReportError('Report generation timed out');
      setFullReportLoading(false);
    } catch (err: any) {
      setFullReportError(err.message || 'Failed to generate full report');
      setFullReportLoading(false);
    } finally {
      setPromoting(false);
    }
  };

  const handleViewExistingReport = async () => {
    if (!report?.promotedScanId) return;
    setFullReportOpen(true);
    setFullReportLoading(true);
    setFullReportData(null);
    setFullReportError(null);

    try {
      const res = await api.getAdminScanFullReport(report.promotedScanId);
      if (res.status === 'completed' && res.data) {
        setFullReportData(res.data);
      } else if (res.status === 'failed') {
        setFullReportError(res.error || 'Report generation failed');
      } else {
        setFullReportError('Report is still processing');
      }
    } catch (err: any) {
      setFullReportError(err.message || 'Failed to load report');
    } finally {
      setFullReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-5 py-6 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-5 border-t border-gray-200 dark:border-gray-600 space-y-5 bg-gray-50/50 dark:bg-gray-800/50">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRunScan}
          disabled={scanning || !isOnline}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-all"
        >
          {scanning ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {scanning ? 'Scanning...' : report ? 'Refresh Scan' : 'Run Full Scan'}
        </button>
        {!isOnline && (
          <span className="inline-flex items-center gap-1 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
            <WifiOff size={12} /> Device must be online to scan
          </span>
        )}
        {report && (report.status === 'COMPLETED' || report.status === 'PARTIAL') && (
          <>
            <button
              onClick={handleEmail}
              disabled={emailing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-200 text-sm font-medium transition-all"
            >
              <Mail size={14} />
              {emailing ? 'Sending...' : 'Email PDF'}
            </button>
            <button
              onClick={report.promotedScanId ? handleViewExistingReport : handleFullReport}
              disabled={promoting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium transition-all"
            >
              <Sparkles size={14} />
              {promoting ? 'Working...' : report.promotedScanId ? 'View Full Report' : 'Full Report'}
            </button>
          </>
        )}
      </div>

      {/* Report Content */}
      {report ? (
        <ReportView report={report} />
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No scan reports yet. {isOnline ? 'Click "Run Full Scan" to start.' : 'Connect the device to run a scan.'}</p>
        </div>
      )}

      {/* Full Report Modal */}
      {fullReportOpen && (
        <GpsFullReportModal
          loading={fullReportLoading}
          data={fullReportData}
          error={fullReportError}
          onClose={() => setFullReportOpen(false)}
        />
      )}

      {/* Previous Reports */}
      {reports.length > 1 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Previous Reports</p>
          </div>

          {/* Bulk-action bar */}
          {canDelete && (
            <BulkActionBar
              count={sel.selectedIds.size}
              total={reports.length}
              allSelected={sel.allSelected(reports.map((r) => r.id))}
              onDelete={() => setBulkDeleteOpen(true)}
              onCancel={sel.clear}
              onToggleAll={() => sel.toggleAll(reports.map((r) => r.id))}
              itemLabel="scan report"
            />
          )}

          <div className="space-y-1 mt-2">
            {reports.slice(1).map((r) => (
              <div
                key={r.id}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  sel.isSelected(r.id)
                    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/40'
                    : report?.id === r.id
                      ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                {canDelete && (
                  <input
                    type="checkbox"
                    checked={sel.isSelected(r.id)}
                    onChange={() => sel.toggle(r.id)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                )}
                <button
                  onClick={() => setReport(r)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <span className="font-mono">{fmtRelative(r.requestedAt)}</span>
                  <StatusBadge status={r.status} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteOpen && (
        <ConfirmPasswordModal
          title="Delete Scan Reports"
          message={
            <span>
              Permanently delete <span className="font-semibold">{sel.selectedIds.size}</span>{' '}
              selected scan report{sel.selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.
            </span>
          }
          onConfirm={async () => {
            const ids = Array.from(sel.selectedIds);
            try {
              const res = await api.bulkDeleteGpsScanReports(ids);
              toast.success(`Deleted ${res.deleted} scan report${res.deleted === 1 ? '' : 's'}`);
              sel.clear();
              setBulkDeleteOpen(false);
              loadReports();
            } catch (err: any) {
              toast.error(err.message || 'Failed to delete scan reports');
              setBulkDeleteOpen(false);
            }
          }}
          onClose={() => setBulkDeleteOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Report View ─────────────────────────────────────────────────────────────

function ReportView({ report }: { report: GpsScanReport }) {
  const toNum = (v: string | number | null | undefined): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const kmToMi = (km: string | number | null | undefined) => {
    const val = toNum(km);
    return val > 0 ? `${(val * 0.621371).toLocaleString(undefined, { maximumFractionDigits: 0 })} mi` : '—';
  };

  return (
    <div className="space-y-4">
      {/* Status + Time */}
      <div className="flex items-center gap-3">
        <StatusBadge status={report.status} />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {fmtRelative(report.requestedAt)}
        </span>
        {report.errorText && (
          <span className="text-xs text-red-600 dark:text-red-400">{report.errorText}</span>
        )}
      </div>

      {report.status === 'PENDING' && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Waiting for vehicle response...</span>
        </div>
      )}

      {(report.status === 'COMPLETED' || report.status === 'PARTIAL') && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiTile label="Odometer" value={kmToMi(report.mileageKm)} />
            <KpiTile
              label="MIL"
              value={report.milOn === true ? 'ON' : report.milOn === false ? 'OFF' : '—'}
              highlight={report.milOn === true}
            />
            <KpiTile label="DTC Count" value={String(report.dtcCount ?? 0)} highlight={(report.dtcCount ?? 0) > 0} />
            <KpiTile label="Protocol" value={report.protocol || '—'} />
          </div>

          {/* DTC Codes */}
          {(report.storedDtcCodes.length > 0 || report.pendingDtcCodes.length > 0 || report.permanentDtcCodes.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Diagnostic Trouble Codes</p>
              {report.storedDtcCodes.length > 0 && (
                <DtcBadgeRow label="Stored" codes={report.storedDtcCodes} color="red" />
              )}
              {report.pendingDtcCodes.length > 0 && (
                <DtcBadgeRow label="Pending" codes={report.pendingDtcCodes} color="amber" />
              )}
              {report.permanentDtcCodes.length > 0 && (
                <DtcBadgeRow label="Permanent" codes={report.permanentDtcCodes} color="purple" />
              )}
            </div>
          )}

          {/* OBD Live Data */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">OBD Live Data</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <ObdCell label="RPM" value={report.rpm != null ? `${report.rpm}` : null} />
              <ObdCell label="Speed" value={report.vehicleSpeedKmh != null ? `${toNum(report.vehicleSpeedKmh)} km/h` : null} />
              <ObdCell label="Coolant" value={report.coolantTempC != null ? `${report.coolantTempC}°C` : null} />
              <ObdCell label="Intake Air" value={report.intakeAirTempC != null ? `${report.intakeAirTempC}°C` : null} />
              <ObdCell label="Throttle" value={report.throttlePct != null ? `${toNum(report.throttlePct)}%` : null} />
              <ObdCell label="Engine Load" value={report.engineLoadPct != null ? `${toNum(report.engineLoadPct)}%` : null} />
              <ObdCell label="MAF" value={report.mafGps != null ? `${toNum(report.mafGps)} g/s` : null} />
              <ObdCell label="Fuel Level" value={report.fuelLevelPct != null ? `${toNum(report.fuelLevelPct)}%` : null} />
              <ObdCell label="Battery" value={report.batteryVoltageMv != null ? `${(report.batteryVoltageMv / 1000).toFixed(1)}V` : null} />
              <ObdCell label="Ambient" value={report.ambientTempC != null ? `${report.ambientTempC}°C` : null} />
              <ObdCell label="Barometric" value={report.barometricKpa != null ? `${report.barometricKpa} kPa` : null} />
              <ObdCell label="Fuel Rail" value={report.fuelRailPressureKpa != null ? `${report.fuelRailPressureKpa} kPa` : null} />
              <ObdCell label="Intake Manifold" value={report.intakeManifoldKpa != null ? `${report.intakeManifoldKpa} kPa` : null} />
              <ObdCell label="Dist w/ MIL" value={kmToMi(report.distanceWithMilKm)} />
              <ObdCell label="Dist Since Clear" value={kmToMi(report.distanceSinceClearKm)} />
              <ObdCell label="Warm-ups" value={report.warmupsSinceClear != null ? `${report.warmupsSinceClear}` : null} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Small helper components ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', icon: <Clock size={10} /> },
    COMPLETED: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-300', icon: <CheckCircle size={10} /> },
    PARTIAL: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', icon: <AlertTriangle size={10} /> },
    FAILED: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', icon: <XCircle size={10} /> },
    TIMED_OUT: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400', icon: <Clock size={10} /> },
  };
  const c = cfg[status] ?? cfg.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${c.bg} ${c.text}`}>
      {c.icon} {status}
    </span>
  );
}

function KpiTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`px-3 py-2.5 rounded-lg border ${
      highlight
        ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10'
        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
    }`}>
      <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${highlight ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function DtcBadgeRow({ label, codes, color }: { label: string; codes: string[]; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 pt-1 w-16 flex-shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {codes.map((c) => (
          <span key={c} className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium ${colors[color]}`}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function ObdCell({ label, value }: { label: string; value: string | null }) {
  if (!value || value === '—' || value === '0 mi') return null;
  return (
    <div className="px-2.5 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
      <p className="text-[9px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
