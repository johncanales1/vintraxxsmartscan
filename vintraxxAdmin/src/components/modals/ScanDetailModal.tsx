'use client';

import React from 'react';
import { ScanDetail, normalizePdfUrl } from '@/lib/api';
import { X, FileText, ExternalLink, AlertTriangle, CheckCircle, Clock, Car, DollarSign, Activity, Shield } from 'lucide-react';

interface Props {
  scan: ScanDetail | null;
  loading: boolean;
  onClose: () => void;
}

export default function ScanDetailModal({ scan, loading, onClose }: Props) {
  const fr = scan?.fullReport;
  const aiRaw = fr?.aiRawResponse as any;
  const dtcAnalysis = (fr?.dtcAnalysis || []) as any[];
  const emissionsCheck = fr?.emissionsCheck as any;
  const mileageRisk = (fr?.mileageRiskAssessment || []) as any[];
  const repairRecs = (fr?.repairRecommendations || []) as any[];
  const additionalRepairsData = (fr?.additionalRepairsData || []) as any[];

  const fmtCurrency = (val: number | null | undefined) =>
    val !== null && val !== undefined ? `$${val.toLocaleString()}` : 'N/A';

  const grandTotal = fr ? (fr.totalReconditioningCost + fr.additionalRepairsCost) : 0;

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

              {/* Grand Total Cost */}
              {fr && (
                <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} />
                      <span className="text-sm font-medium text-slate-300">Total Estimated Cost</span>
                    </div>
                    <span className="text-xl font-bold">{fmtCurrency(grandTotal)}</span>
                  </div>
                </div>
              )}

              {/* Vehicle Info */}
              <Section title="Vehicle Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="VIN" value={scan.vin} mono />
                  <InfoRow label="Year" value={scan.vehicleYear?.toString() || 'N/A'} />
                  <InfoRow label="Make" value={scan.vehicleMake || 'N/A'} />
                  <InfoRow label="Model" value={scan.vehicleModel || 'N/A'} />
                  <InfoRow label="Engine" value={scan.vehicleEngine || 'N/A'} />
                  {scan.stockNumber && <InfoRow label="Stock #" value={scan.stockNumber} />}
                  {scan.vehicleOwnerName && <InfoRow label="Vehicle Owner" value={scan.vehicleOwnerName} />}
                </div>
              </Section>

              {/* Emissions Check */}
              {emissionsCheck && (
                <Section title="Emissions Check">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`px-3 py-2 rounded-lg ${emissionsCheck.status === 'pass' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Status</p>
                      <p className={`text-sm font-bold ${emissionsCheck.status === 'pass' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {emissionsCheck.status === 'pass' ? '✓ Passed' : '✗ Failed'}
                      </p>
                    </div>
                    <InfoRow label="Tests Passed" value={emissionsCheck.testsPassed?.toString() || '0'} />
                    <InfoRow label="Tests Failed" value={emissionsCheck.testsFailed?.toString() || '0'} />
                  </div>
                </Section>
              )}

              {/* DTC Analysis with AI details */}
              {dtcAnalysis.length > 0 && (
                <Section title={`DTC Analysis (${dtcAnalysis.length})`}>
                  <div className="space-y-2">
                    {dtcAnalysis.map((dtc: any, i: number) => (
                      <div key={i} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-mono font-semibold">{dtc.code}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              dtc.severity === 'critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-600' :
                              dtc.severity === 'moderate' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                              'bg-blue-100 dark:bg-blue-500/20 text-blue-600'
                            }`}>{dtc.severity}</span>
                          </div>
                          {dtc.repair && (
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                              {fmtCurrency((dtc.repair?.partsCost || 0) + (dtc.repair?.laborCost || 0))}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{dtc.description}</p>
                        {dtc.module && <p className="text-[10px] text-gray-400 mt-1">Module: {dtc.module}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* DTC Codes (raw) */}
              {(scan.storedDtcCodes.length > 0 || scan.pendingDtcCodes.length > 0 || scan.permanentDtcCodes.length > 0) && dtcAnalysis.length === 0 && (
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

              {/* Repair Recommendations */}
              {repairRecs.length > 0 && (
                <Section title="Repair Recommendations">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-2 pr-3">Repair</th>
                          <th className="pb-2 pr-3">Priority</th>
                          <th className="pb-2 pr-3 text-right">Parts</th>
                          <th className="pb-2 pr-3 text-right">Labor</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {repairRecs.map((rec: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 pr-3 text-gray-900 dark:text-white max-w-[200px] truncate">{rec.title || rec.description}</td>
                            <td className="py-2 pr-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                rec.priority === 'high' ? 'bg-red-100 dark:bg-red-500/20 text-red-600' :
                                rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                                'bg-blue-100 dark:bg-blue-500/20 text-blue-600'
                              }`}>{rec.priority}</span>
                            </td>
                            <td className="py-2 pr-3 text-right text-gray-600 dark:text-gray-300">{fmtCurrency(rec.estimatedCost?.parts)}</td>
                            <td className="py-2 pr-3 text-right text-gray-600 dark:text-gray-300">{fmtCurrency(rec.estimatedCost?.labor)}</td>
                            <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{fmtCurrency(rec.estimatedCost?.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}

              {/* Additional Repairs with itemized costs */}
              {(additionalRepairsData.length > 0 || scan.additionalRepairs.length > 0) && (
                <Section title="Additional Repairs">
                  {additionalRepairsData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                            <th className="pb-2 pr-3">Repair</th>
                            <th className="pb-2 pr-3 text-right">Parts</th>
                            <th className="pb-2 pr-3 text-right">Labor</th>
                            <th className="pb-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {additionalRepairsData.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 pr-3 text-gray-900 dark:text-white">{r.name}</td>
                              <td className="py-2 pr-3 text-right text-gray-600 dark:text-gray-300">{fmtCurrency(r.partsCost)}</td>
                              <td className="py-2 pr-3 text-right text-gray-600 dark:text-gray-300">{fmtCurrency(r.laborCost)}</td>
                              <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{fmtCurrency(r.totalCost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {scan.additionalRepairs.map((r, i) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium">{r}</span>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* Mileage Risk Assessment */}
              {mileageRisk.length > 0 && (
                <Section title="Mileage Risk Assessment">
                  <div className="space-y-2">
                    {mileageRisk.map((risk: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">{risk.issue}</p>
                          {risk.mileageEstimate && <p className="text-[10px] text-gray-400 mt-0.5">At ~{risk.mileageEstimate.toLocaleString()} mi</p>}
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {fmtCurrency(risk.costEstimateLow)}–{fmtCurrency(risk.costEstimateHigh)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* AI Summary */}
              {aiRaw?.aiSummary && (
                <Section title="AI Summary">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiRaw.aiSummary}</p>
                </Section>
              )}

              {/* Full Report Metadata */}
              {fr && (
                <Section title="Report">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow label="Reconditioning Cost" value={fmtCurrency(fr.totalReconditioningCost)} />
                    <InfoRow label="Additional Repairs Cost" value={fmtCurrency(fr.additionalRepairsCost)} />
                    <InfoRow label="Modules Scanned" value={fr.modulesScanned?.join(', ') || 'N/A'} />
                    <InfoRow label="Datapoints Scanned" value={fr.datapointsScanned?.toLocaleString() || 'N/A'} />
                    <InfoRow label="Report Version" value={fr.reportVersion} />
                    <InfoRow label="Generated" value={fr.createdAt ? new Date(fr.createdAt).toLocaleDateString() : 'N/A'} />
                    {fr.emailSentAt && <InfoRow label="Email Sent" value={new Date(fr.emailSentAt).toLocaleString()} />}
                  </div>
                  {normalizePdfUrl(fr.pdfUrl) && (
                    <a
                      href={normalizePdfUrl(fr.pdfUrl)!}
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
                    {scan.userFullName && <InfoRow label="Scanner Owner" value={scan.userFullName} />}
                    {scan.vehicleOwnerName && <InfoRow label="Vehicle Owner" value={scan.vehicleOwnerName} />}
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
