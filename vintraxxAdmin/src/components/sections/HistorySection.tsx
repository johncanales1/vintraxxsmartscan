'use client';

import { useState, useEffect } from 'react';
import { api, Scan, ScanDetail } from '@/lib/api';
import { StatusBadge } from '@/components/Dashboard';
import ScanDetailModal from '@/components/modals/ScanDetailModal';
import {
  Search, Trash2, Eye, History, RefreshCw, ChevronLeft, ChevronRight, ExternalLink, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function HistorySection() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [filtered, setFiltered] = useState<Scan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedScan, setSelectedScan] = useState<ScanDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { loadScans(); }, [page]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      scans.filter(s =>
        s.vin.toLowerCase().includes(q) ||
        s.user?.email.toLowerCase().includes(q) ||
        s.vehicleMake?.toLowerCase().includes(q) ||
        s.vehicleModel?.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      )
    );
  }, [search, scans]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const res = await api.getScans(page, 50);
      setScans(res.scans);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch { toast.error('Failed to load scans'); }
    finally { setLoading(false); }
  };

  const openDetail = async (scanId: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await api.getScanDetail(scanId);
      setSelectedScan(res.scan);
    } catch { toast.error('Failed to load scan details'); setShowDetailModal(false); }
    finally { setDetailLoading(false); }
  };

  const handleDelete = async (id: string, vin: string) => {
    if (!confirm(`Delete scan for VIN "${vin}" and its report? This cannot be undone.`)) return;
    try {
      await api.deleteScan(id);
      toast.success('Scan deleted');
      loadScans();
    } catch { toast.error('Failed to delete scan'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by VIN, email, make, model, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} total</span>
          <button onClick={loadScans} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <History size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{search ? 'No scans match your search' : 'No scan history found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 lg:px-6 py-3">Vehicle</th>
                  <th className="px-4 lg:px-6 py-3">VIN</th>
                  <th className="px-4 lg:px-6 py-3">User</th>
                  <th className="px-4 lg:px-6 py-3">Status</th>
                  <th className="px-4 lg:px-6 py-3">Cost</th>
                  <th className="px-4 lg:px-6 py-3">PDF</th>
                  <th className="px-4 lg:px-6 py-3">Date</th>
                  <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-900 dark:text-white">
                      {scan.vehicleYear && scan.vehicleMake
                        ? `${scan.vehicleYear} ${scan.vehicleMake} ${scan.vehicleModel || ''}`
                        : '—'}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm font-mono text-gray-600 dark:text-gray-300">{scan.vin}</td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">{scan.user?.email || '—'}</span>
                        {scan.user?.isDealer && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">D</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5"><StatusBadge status={scan.status} /></td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {scan.fullReport
                        ? `$${(scan.fullReport.totalReconditioningCost + scan.fullReport.additionalRepairsCost).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5">
                      {scan.fullReport?.pdfUrl ? (
                        <a
                          href={scan.fullReport.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          <FileText size={14} />
                          PDF
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(scan.receivedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(scan.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleDelete(scan.id, scan.vin)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && (
        <ScanDetailModal
          scan={selectedScan}
          loading={detailLoading}
          onClose={() => { setShowDetailModal(false); setSelectedScan(null); }}
        />
      )}
    </div>
  );
}
