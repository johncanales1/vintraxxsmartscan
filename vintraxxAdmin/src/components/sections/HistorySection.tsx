'use client';

import { useState, useEffect } from 'react';
import { api, Scan, ScanDetail, Appraisal, AppraisalDetail, normalizePdfUrl } from '@/lib/api';
import { StatusBadge } from '@/components/Dashboard';
import ScanDetailModal from '@/components/modals/ScanDetailModal';
import AppraisalDetailModal from '@/components/modals/AppraisalDetailModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import GpsDtcsSection from '@/components/sections/GpsDtcsSection';
import {
  Search, Trash2, Eye, History, RefreshCw, ChevronLeft, ChevronRight, FileText, ClipboardList, Mail, Send, X, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Three-tab history view: traditional OBD scans, appraisals, and the
 * newer GPS DTC stream. The DTC tab embeds `GpsDtcsSection` directly so
 * the view, filters, and AI-bridge logic stay in one place — the
 * sidebar route /gps-dtcs and this in-page tab share the same component.
 */
type HistoryTab = 'scans' | 'appraisals' | 'dtc';

interface HistorySectionProps {
  initialTab?: HistoryTab;
}

export default function HistorySection({ initialTab = 'scans' }: HistorySectionProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vin: string } | null>(null);

  // Appraisals state
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [filteredAppraisals, setFilteredAppraisals] = useState<Appraisal[]>([]);
  const [appraisalSearch, setAppraisalSearch] = useState('');
  const [appraisalLoading, setAppraisalLoading] = useState(true);
  const [appraisalPage, setAppraisalPage] = useState(1);
  const [appraisalTotalPages, setAppraisalTotalPages] = useState(1);
  const [appraisalTotal, setAppraisalTotal] = useState(0);
  const [appraisalDeleteTarget, setAppraisalDeleteTarget] = useState<{ id: string; vin: string } | null>(null);


  // Appraisal Detail Modal state
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalDetail | null>(null);
  const [showAppraisalDetailModal, setShowAppraisalDetailModal] = useState(false);
  const [appraisalDetailLoading, setAppraisalDetailLoading] = useState(false);

  // Email Compose Modal state
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [composeEmail, setComposeEmail] = useState({ to: '', subject: '', body: '' });
  const [composeSending, setComposeSending] = useState(false);
  const [composeSent, setComposeSent] = useState(false);

  useEffect(() => { loadScans(); }, [page]);
  useEffect(() => { loadAppraisals(); }, [appraisalPage]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      scans.filter(s =>
        s.vin.toLowerCase().includes(q) ||
        s.user?.email.toLowerCase().includes(q) ||
        s.user?.fullName?.toLowerCase().includes(q) ||
        s.userFullName?.toLowerCase().includes(q) ||
        s.vehicleOwnerName?.toLowerCase().includes(q) ||
        s.vehicleMake?.toLowerCase().includes(q) ||
        s.vehicleModel?.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      )
    );
  }, [search, scans]);

  useEffect(() => {
    const q = appraisalSearch.toLowerCase();
    setFilteredAppraisals(
      appraisals.filter(a =>
        a.vin.toLowerCase().includes(q) ||
        a.userEmail?.toLowerCase().includes(q) ||
        a.userFullName?.toLowerCase().includes(q) ||
        a.vehicleOwnerName?.toLowerCase().includes(q) ||
        a.vehicleMake?.toLowerCase().includes(q) ||
        a.vehicleModel?.toLowerCase().includes(q) ||
        a.condition?.toLowerCase().includes(q)
      )
    );
  }, [appraisalSearch, appraisals]);


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

  const loadAppraisals = async () => {
    setAppraisalLoading(true);
    try {
      const res = await api.getAppraisals(appraisalPage, 50);
      setAppraisals(res.appraisals);
      setAppraisalTotalPages(res.totalPages);
      setAppraisalTotal(res.total);
    } catch { toast.error('Failed to load appraisals'); }
    finally { setAppraisalLoading(false); }
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteScan(deleteTarget.id);
      toast.success('Scan deleted');
      setDeleteTarget(null);
      loadScans();
    } catch { toast.error('Failed to delete scan'); }
  };

  const handleDeleteAppraisal = async () => {
    if (!appraisalDeleteTarget) return;
    try {
      await api.deleteAppraisal(appraisalDeleteTarget.id);
      toast.success('Appraisal deleted');
      setAppraisalDeleteTarget(null);
      loadAppraisals();
    } catch { toast.error('Failed to delete appraisal'); }
  };

  // Email Compose handlers
  const openEmailCompose = (toEmail: string) => {
    setComposeEmail({ to: toEmail, subject: '', body: '' });
    setComposeSent(false);
    setComposeSending(false);
    setShowEmailCompose(true);
  };

  const closeEmailCompose = () => {
    setShowEmailCompose(false);
    setComposeEmail({ to: '', subject: '', body: '' });
    setComposeSent(false);
  };

  const handleSendEmail = async () => {
    if (!composeEmail.to || !composeEmail.subject) {
      toast.error('Recipient and subject are required');
      return;
    }
    setComposeSending(true);
    try {
      await api.sendEmail(composeEmail.to, composeEmail.subject, composeEmail.body);
      setComposeSent(true);
      toast.success('Email sent!');
    } catch { toast.error('Failed to send email'); }
    finally { setComposeSending(false); }
  };

  // Appraisal detail handler
  const openAppraisalDetail = async (appraisalId: string) => {
    setAppraisalDetailLoading(true);
    setShowAppraisalDetailModal(true);
    try {
      const res = await api.getAppraisalDetail(appraisalId);
      setSelectedAppraisal(res.appraisal);
    } catch { toast.error('Failed to load appraisal details'); setShowAppraisalDetailModal(false); }
    finally { setAppraisalDetailLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('scans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'scans'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <History size={16} />
          OBD Scans
        </button>
        <button
          onClick={() => setActiveTab('appraisals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'appraisals'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ClipboardList size={16} />
          Appraisals
        </button>
        {/*
          DTC events tab — mirrors the sidebar /gps-dtcs route. Putting it
          here gives admins reviewing scan history a one-click jump to the
          GPS-side fault feed without losing tab context.
         */}
        <button
          onClick={() => setActiveTab('dtc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dtc'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <AlertTriangle size={16} />
          DTC Events
        </button>
      </div>

      {/* DTC Events tab — embed the canonical section. */}
      {activeTab === 'dtc' && <GpsDtcsSection />}

      {/* OBD Scans Tab */}
      {activeTab === 'scans' && (
        <>
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
                      <th className="px-4 lg:px-6 py-3">Customer</th>
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
                            {scan.user?.email ? (
                              <button onClick={() => openEmailCompose(scan.user!.email)} className="truncate max-w-[140px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left">{scan.user.email}</button>
                            ) : (
                              <span className="truncate max-w-[140px]">—</span>
                            )}
                            {scan.user?.isDealer && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">D</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                          <span className="truncate max-w-[120px] block">{scan.vehicleOwnerName || '—'}</span>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5"><StatusBadge status={scan.status} /></td>
                        <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                          {scan.fullReport
                            ? `$${(scan.fullReport.totalReconditioningCost + scan.fullReport.additionalRepairsCost).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          {normalizePdfUrl(scan.fullReport?.pdfUrl) ? (
                            <a
                              href={normalizePdfUrl(scan.fullReport?.pdfUrl)!}
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
                            <button onClick={() => setDeleteTarget({ id: scan.id, vin: scan.vin })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all">
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Appraisals Tab */}
      {activeTab === 'appraisals' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by VIN, email, make, model, condition..."
                value={appraisalSearch}
                onChange={(e) => setAppraisalSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{appraisalTotal.toLocaleString()} total</span>
              <button onClick={loadAppraisals} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {appraisalLoading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ))}
              </div>
            ) : filteredAppraisals.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{appraisalSearch ? 'No appraisals match your search' : 'No appraisals found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 lg:px-6 py-3">Vehicle</th>
                      <th className="px-4 lg:px-6 py-3">VIN</th>
                      <th className="px-4 lg:px-6 py-3">User</th>
                      <th className="px-4 lg:px-6 py-3">Customer</th>
                      <th className="px-4 lg:px-6 py-3">Condition</th>
                      <th className="px-4 lg:px-6 py-3">Mileage</th>
                      <th className="px-4 lg:px-6 py-3">PDF</th>
                      <th className="px-4 lg:px-6 py-3">Date</th>
                      <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredAppraisals.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-900 dark:text-white">
                          {a.vehicleYear && a.vehicleMake
                            ? `${a.vehicleYear} ${a.vehicleMake} ${a.vehicleModel || ''} ${a.vehicleTrim || ''}`
                            : '—'}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-sm font-mono text-gray-600 dark:text-gray-300">{a.vin}</td>
                        <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                          {a.userEmail ? (
                            <button onClick={() => openEmailCompose(a.userEmail!)} className="truncate max-w-[140px] block text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left">{a.userEmail}</button>
                          ) : (
                            <span className="truncate max-w-[140px] block">—</span>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                          <span className="truncate max-w-[120px] block">{a.vehicleOwnerName || '—'}</span>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                            {a.condition || '—'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                          {a.mileage ? `${a.mileage.toLocaleString()} mi` : '—'}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          {normalizePdfUrl(a.pdfUrl) ? (
                            <a
                              href={normalizePdfUrl(a.pdfUrl)!}
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
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openAppraisalDetail(a.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => setAppraisalDeleteTarget({ id: a.id, vin: a.vin })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all">
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

            {appraisalTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Page {appraisalPage} of {appraisalTotalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setAppraisalPage(p => Math.max(1, p - 1))} disabled={appraisalPage === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setAppraisalPage(p => Math.min(appraisalTotalPages, p + 1))} disabled={appraisalPage === appraisalTotalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showDetailModal && (
        <ScanDetailModal
          scan={selectedScan}
          loading={detailLoading}
          onClose={() => { setShowDetailModal(false); setSelectedScan(null); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Scan"
          message={`Delete scan for VIN "${deleteTarget.vin}" and its report?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {appraisalDeleteTarget && (
        <ConfirmDeleteModal
          title="Delete Appraisal"
          message={`Delete appraisal for VIN "${appraisalDeleteTarget.vin}"?`}
          onConfirm={handleDeleteAppraisal}
          onCancel={() => setAppraisalDeleteTarget(null)}
        />
      )}

      {/* Appraisal Detail Modal */}
      {showAppraisalDetailModal && (
        <AppraisalDetailModal
          appraisal={selectedAppraisal}
          loading={appraisalDetailLoading}
          onClose={() => { setShowAppraisalDetailModal(false); setSelectedAppraisal(null); }}
        />
      )}

      {/* Email Compose Modal */}
      {showEmailCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeEmailCompose}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">New Message</h2>
              </div>
              <button onClick={closeEmailCompose} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {composeSent ? (
              <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Your message has been sent to {composeEmail.to}</p>
                <button onClick={closeEmailCompose} className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">To</label>
                  <input
                    type="email"
                    value={composeEmail.to}
                    onChange={e => setComposeEmail(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={composeEmail.subject}
                    onChange={e => setComposeEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter subject..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    value={composeEmail.body}
                    onChange={e => setComposeEmail(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Write your message..."
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={closeEmailCompose} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={composeSending || !composeEmail.subject.trim()}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {composeSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {composeSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
