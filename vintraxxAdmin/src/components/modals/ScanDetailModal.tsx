'use client';

import React from 'react';
import { ScanDetail, normalizePdfUrl } from '@/lib/api';
import { X, FileText, ExternalLink, AlertTriangle, CheckCircle, Clock, Car } from 'lucide-react';

interface Props {
  scan: ScanDetail | null;
  loading: boolean;
  onClose: () => void;
}

export default function ScanDetailModal({ scan, loading, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Scan Details</h2>
            {scan && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {scan.vehicleYear && scan.vehicleMake
                  ? `${scan.vehicleYear} ${scan.vehicleMake} ${scan.vehicleModel || ''}`
                  : scan.vin}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !scan ? (
            <p className="text-gray-500 text-center py-8">Scan not found</p>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Status" value={scan.status.replace(/_/g, ' ')} icon={<Clock size={14} />} />
                <StatCard label="DTCs" value={scan.dtcCount.toString()} icon={<AlertTriangle size={14} />} />
                <StatCard label="MIL" value={scan.milOn ? 'ON' : 'OFF'} icon={scan.milOn ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} />
                <StatCard label="Mileage" value={scan.mileage ? `${scan.mileage.toLocaleString()} mi` : 'N/A'} icon={<Car size={14} />} />
              </div>

              {/* Vehicle Info */}
              <Section title="Vehicle Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="VIN" value={scan.vin} mono />
                  <InfoRow label="Year" value={scan.vehicleYear?.toString() || 'N/A'} />
                  <InfoRow label="Make" value={scan.vehicleMake || 'N/A'} />
                  <InfoRow label="Model" value={scan.vehicleModel || 'N/A'} />
                  <InfoRow label="Engine" value={scan.vehicleEngine || 'N/A'} />
                  {scan.stockNumber && <InfoRow label="Stock #" value={scan.stockNumber} />}
                </div>
              </Section>

              {/* DTC Codes */}
              {(scan.storedDtcCodes.length > 0 || scan.pendingDtcCodes.length > 0 || scan.permanentDtcCodes.length > 0) && (
                <Section title="DTC Codes">
                  {scan.storedDtcCodes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Stored ({scan.storedDtcCodes.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scan.storedDtcCodes.map((code, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-mono font-semibold">{code}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scan.pendingDtcCodes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Pending ({scan.pendingDtcCodes.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scan.pendingDtcCodes.map((code, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-mono font-semibold">{code}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scan.permanentDtcCodes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Permanent ({scan.permanentDtcCodes.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scan.permanentDtcCodes.map((code, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-mono font-semibold">{code}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* Additional Repairs */}
              {scan.additionalRepairs.length > 0 && (
                <Section title="Additional Repairs">
                  <div className="flex flex-wrap gap-1.5">
                    {scan.additionalRepairs.map((r, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium">{r}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Full Report */}
              {scan.fullReport && (
                <Section title="Report">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow label="Reconditioning Cost" value={`$${scan.fullReport.totalReconditioningCost.toLocaleString()}`} />
                    <InfoRow label="Additional Repairs Cost" value={`$${scan.fullReport.additionalRepairsCost.toLocaleString()}`} />
                    <InfoRow label="Report Version" value={scan.fullReport.reportVersion} />
                    <InfoRow label="Generated" value={scan.fullReport.createdAt ? new Date(scan.fullReport.createdAt).toLocaleDateString() : 'N/A'} />
                  </div>
                  {normalizePdfUrl(scan.fullReport.pdfUrl) && (
                    <a
                      href={normalizePdfUrl(scan.fullReport.pdfUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                    >
                      <FileText size={16} />
                      View PDF Report
                      <ExternalLink size={14} />
                    </a>
                  )}
                </Section>
              )}

              {/* User Info */}
              {scan.user && (
                <Section title="User">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow label="Email" value={scan.user.email} />
                    <InfoRow label="Type" value={scan.user.isDealer ? 'Dealer' : 'Regular'} />
                  </div>
                </Section>
              )}

              {/* Metadata */}
              <Section title="Metadata">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Scan ID" value={scan.id.substring(0, 12) + '...'} mono />
                  <InfoRow label="Scan Date" value={new Date(scan.scanDate).toLocaleString()} />
                  <InfoRow label="Received At" value={new Date(scan.receivedAt).toLocaleString()} />
                  {scan.processedAt && <InfoRow label="Processed At" value={new Date(scan.processedAt).toLocaleString()} />}
                  {scan.scannerDeviceId && <InfoRow label="Scanner Device" value={scan.scannerDeviceId} />}
                  {scan.errorMessage && <InfoRow label="Error" value={scan.errorMessage} />}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-center">
      <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className={`text-sm text-gray-900 dark:text-white truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
