'use client';

import React from 'react';
import { AppraisalDetail, normalizePdfUrl } from '@/lib/api';
import { X, FileText, ExternalLink, Car, DollarSign, TrendingUp, TrendingDown, Minus, Image as ImageIcon, MapPin, ClipboardList } from 'lucide-react';

interface Props {
  appraisal: AppraisalDetail | null;
  loading: boolean;
  onClose: () => void;
}

export default function AppraisalDetailModal({ appraisal, loading, onClose }: Props) {
  const v = appraisal?.valuationData as any;

  const fmtCurrency = (val: number | null | undefined) =>
    val !== null && val !== undefined ? `$${val.toLocaleString()}` : 'N/A';

  const getTrendIcon = (trend: string) => {
    if (trend === 'appreciating') return <TrendingUp size={14} className="text-emerald-500" />;
    if (trend === 'depreciating') return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appraisal Details</h2>
            {appraisal && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {appraisal.vehicleYear && appraisal.vehicleMake
                  ? `${appraisal.vehicleYear} ${appraisal.vehicleMake} ${appraisal.vehicleModel || ''} ${appraisal.vehicleTrim || ''}`
                  : appraisal.vin}
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
          ) : !appraisal ? (
            <p className="text-gray-500 text-center py-8">Appraisal not found</p>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Condition" value={appraisal.condition || 'N/A'} icon={<Car size={14} />} />
                <StatCard label="Mileage" value={appraisal.mileage ? `${appraisal.mileage.toLocaleString()} mi` : 'N/A'} icon={<Car size={14} />} />
                <StatCard label="Photos" value={appraisal.photoCount?.toString() || '0'} icon={<ImageIcon size={14} />} />
                <StatCard label="Confidence" value={v?.confidenceLevel || 'N/A'} icon={<ClipboardList size={14} />} />
              </div>

              {/* Vehicle Info */}
              <Section title="Vehicle Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="VIN" value={appraisal.vin} mono />
                  <InfoRow label="Year" value={appraisal.vehicleYear?.toString() || 'N/A'} />
                  <InfoRow label="Make" value={appraisal.vehicleMake || 'N/A'} />
                  <InfoRow label="Model" value={appraisal.vehicleModel || 'N/A'} />
                  {appraisal.vehicleTrim && <InfoRow label="Trim" value={appraisal.vehicleTrim} />}
                  {appraisal.zipCode && <InfoRow label="Zip Code" value={appraisal.zipCode} />}
                </div>
              </Section>

              {/* Owner & User Info */}
              <Section title="Owner & User Info">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Vehicle Owner" value={appraisal.vehicleOwnerName || 'N/A'} />
                  <InfoRow label="User Email" value={appraisal.userEmail || 'N/A'} />
                  {appraisal.userFullName && <InfoRow label="User Full Name" value={appraisal.userFullName} />}
                </div>
              </Section>

              {/* Valuation Summary */}
              {v && (
                <Section title="Valuation Summary">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                      <p className="text-[10px] uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">Wholesale Range</p>
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{fmtCurrency(v.estimatedWholesaleLow)} – {fmtCurrency(v.estimatedWholesaleHigh)}</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">Trade-In Range</p>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{fmtCurrency(v.estimatedTradeInLow)} – {fmtCurrency(v.estimatedTradeInHigh)}</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                      <p className="text-[10px] uppercase tracking-wider text-purple-500 dark:text-purple-400 mb-1">Retail Range</p>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{fmtCurrency(v.estimatedRetailLow)} – {fmtCurrency(v.estimatedRetailHigh)}</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <p className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-amber-400 mb-1">Private Party Range</p>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{fmtCurrency(v.estimatedPrivatePartyLow)} – {fmtCurrency(v.estimatedPrivatePartyHigh)}</p>
                    </div>
                  </div>
                </Section>
              )}

              {/* Market Trend & Confidence */}
              {v && (
                <Section title="Market Analysis">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Market Trend</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getTrendIcon(v.marketTrend)}
                        <p className="text-sm text-gray-900 dark:text-white capitalize">{v.marketTrend || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Confidence Level</p>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{v.confidenceLevel || 'N/A'}</p>
                    </div>
                  </div>
                  {v.confidenceExplanation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{v.confidenceExplanation}</p>
                  )}
                  {v.marketTrendExplanation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{v.marketTrendExplanation}</p>
                  )}
                </Section>
              )}

              {/* Comparable Sources */}
              {v?.comparableSources && v.comparableSources.length > 0 && (
                <Section title="Comparable Sources">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-2 pr-3">Source</th>
                          <th className="pb-2 pr-3">Wholesale</th>
                          <th className="pb-2 pr-3">Trade-In</th>
                          <th className="pb-2 pr-3">Retail</th>
                          <th className="pb-2">Private Party</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {v.comparableSources.map((src: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white">{src.sourceName}</td>
                            <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{fmtCurrency(src.wholesaleLow)}–{fmtCurrency(src.wholesaleHigh)}</td>
                            <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{fmtCurrency(src.tradeInLow)}–{fmtCurrency(src.tradeInHigh)}</td>
                            <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">{fmtCurrency(src.retailLow)}–{fmtCurrency(src.retailHigh)}</td>
                            <td className="py-2 text-gray-600 dark:text-gray-300">{fmtCurrency(src.privatePartyLow)}–{fmtCurrency(src.privatePartyHigh)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}

              {/* Adjustments */}
              {v?.adjustments && v.adjustments.length > 0 && (
                <Section title="Adjustments">
                  <div className="space-y-2">
                    {v.adjustments.map((adj: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{adj.factor}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{adj.explanation}</p>
                        </div>
                        <span className={`text-sm font-semibold ${adj.impact > 0 ? 'text-emerald-600' : adj.impact < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {adj.impact > 0 ? '+' : ''}{fmtCurrency(adj.impact)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* AI Summary */}
              {v?.aiSummary && (
                <Section title="AI Summary">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{v.aiSummary}</p>
                  {v.dataAsOf && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Data as of: {v.dataAsOf}</p>
                  )}
                </Section>
              )}

              {/* Notes */}
              {appraisal.notes && (
                <Section title="Notes">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{appraisal.notes}</p>
                </Section>
              )}

              {/* PDF */}
              {normalizePdfUrl(appraisal.pdfUrl) && (
                <Section title="Report">
                  <a
                    href={normalizePdfUrl(appraisal.pdfUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                  >
                    <FileText size={16} />
                    View PDF Report
                    <ExternalLink size={14} />
                  </a>
                </Section>
              )}

              {/* Metadata */}
              <Section title="Metadata">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Appraisal ID" value={appraisal.id.substring(0, 16) + '...'} mono />
                  <InfoRow label="Created" value={new Date(appraisal.createdAt).toLocaleString()} />
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
      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{value}</p>
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
