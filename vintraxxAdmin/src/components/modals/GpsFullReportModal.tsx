'use client';

/**
 * GpsFullReportModal — displays the AI-analysed full report after a GPS scan
 * report is promoted. Same data shape as the Frontend's ScanDetailModal but
 * styled for the Admin dark theme.
 */

import { X, AlertTriangle } from 'lucide-react';

export interface FullReportData {
  scanId: string;
  vehicle: {
    vin: string;
    year: number | null;
    make: string | null;
    model: string | null;
    mileage: number | null;
  };
  healthScore: number;
  overallStatus: 'healthy' | 'attention_needed' | 'critical';
  dtcAnalysis: Array<{
    code: string;
    description: string;
    severity: 'critical' | 'moderate' | 'minor' | 'info';
    category: string;
    possibleCauses: string[];
    repairEstimate: { low: number; high: number };
    urgency: 'immediate' | 'soon' | 'monitor';
  }>;
  repairRecommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedCost: { labor: number; parts: number; total: number };
  }>;
  emissionsAnalysis: {
    status: 'pass' | 'fail' | 'incomplete';
    summary: string;
  };
  totalEstimatedRepairCost: number;
  additionalRepairs?: unknown[];
  additionalRepairsTotalCost?: number;
  grandTotalCost?: number;
  aiSummary: string;
  stockNumber?: string;
}

interface Props {
  loading: boolean;
  data: FullReportData | null;
  error?: string | null;
  onClose: () => void;
}

const fmtCurrency = (v: number | null | undefined): string =>
  v != null ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—';

export default function GpsFullReportModal({ loading, data, error, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <div className="min-w-0 flex-1">
            {data ? (
              <>
                <h2 className="text-lg font-bold text-white truncate">
                  {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}
                </h2>
                <p className="text-blue-200 text-sm font-mono truncate">{data.vehicle.vin}</p>
              </>
            ) : (
              <h2 className="text-lg font-bold text-white">Full Report</h2>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 flex-shrink-0 ml-2">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Generating AI report...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle size={40} className="text-red-500 mb-3" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : !data ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">Report not available</p>
          ) : (
            <div className="space-y-6">
              {/* Health Score */}
              <div className="flex items-center gap-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${
                    data.healthScore >= 90
                      ? 'bg-emerald-500'
                      : data.healthScore >= 70
                        ? 'bg-yellow-500'
                        : data.healthScore >= 50
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  }`}
                >
                  {data.healthScore}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Health Score</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {data.healthScore >= 90
                      ? 'Excellent'
                      : data.healthScore >= 70
                        ? 'Good'
                        : data.healthScore >= 50
                          ? 'Fair'
                          : 'Poor'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {data.overallStatus.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Vehicle Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoTile label="Mileage" value={data.vehicle.mileage ? `${data.vehicle.mileage.toLocaleString()} mi` : '—'} />
                <InfoTile label="Stock Number" value={data.stockNumber || '—'} />
                <InfoTile label="DTC Codes" value={String(data.dtcAnalysis?.length || 0)} />
                <InfoTile
                  label="Emissions"
                  value={data.emissionsAnalysis?.status || '—'}
                  valueClass={
                    data.emissionsAnalysis?.status === 'pass'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : data.emissionsAnalysis?.status === 'fail'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                  }
                />
              </div>

              {/* Costs */}
              <div className="rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-700/50 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Repair Costs</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">DTC Repairs</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                      {fmtCurrency(data.totalEstimatedRepairCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Additional</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                      {fmtCurrency(data.additionalRepairsTotalCost || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Grand Total</p>
                    <p className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(data.grandTotalCost ?? data.totalEstimatedRepairCost)}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {data.aiSummary && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">AI Analysis Summary</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                    {data.aiSummary}
                  </p>
                </div>
              )}

              {/* DTC Analysis */}
              {data.dtcAnalysis && data.dtcAnalysis.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    DTC Codes ({data.dtcAnalysis.length})
                  </h3>
                  <div className="space-y-2">
                    {data.dtcAnalysis.map((dtc, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold text-white flex-shrink-0 ${
                            dtc.severity === 'critical'
                              ? 'bg-red-500'
                              : dtc.severity === 'moderate'
                                ? 'bg-orange-500'
                                : dtc.severity === 'minor'
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                          }`}
                        >
                          {dtc.code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {dtc.description}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {dtc.severity} • {dtc.urgency}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                          {fmtCurrency(dtc.repairEstimate.high)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repair Recommendations */}
              {data.repairRecommendations && data.repairRecommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    Repair Recommendations
                  </h3>
                  <div className="space-y-2">
                    {data.repairRecommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{rec.title}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            rec.priority === 'high'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                              : rec.priority === 'medium'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{rec.description}</p>
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Labor: {fmtCurrency(rec.estimatedCost.labor)} • Parts: {fmtCurrency(rec.estimatedCost.parts)} • Total: {fmtCurrency(rec.estimatedCost.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emissions */}
              {data.emissionsAnalysis && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Emissions Check</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{data.emissionsAnalysis.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${valueClass || 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
