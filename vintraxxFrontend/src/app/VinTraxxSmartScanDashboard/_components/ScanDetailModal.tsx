/**
 * ScanDetailModal — extracted verbatim from the original
 * VinTraxxSmartScanDashboard/page.tsx (lines 1184\u20131312). Same field layout,
 * same Tailwind classes, same close behaviour, same data contract.
 *
 * The point of the extraction is for both the existing Overview OBD-scan
 * list and the new GPS-DTC AI bridge to open the SAME final-report UI. State
 * is owned by `ScanDetailContext` so any consumer page just calls
 * `useScanDetail().openByScanId(scanId)`.
 */

"use client";

import { X } from "lucide-react";
import type { FullReportData } from "../_lib/types";
import { formatCurrency } from "../_lib/format";

interface Props {
  loading: boolean;
  scanDetail: FullReportData | null;
  onClose: () => void;
}

export function ScanDetailModal({ loading, scanDetail, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm sm:text-base">
              Loading report details...
            </p>
          </div>
        ) : scanDetail ? (
          <>
            <div className="bg-[#1B3A5F] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-xl font-bold text-white truncate">
                  {scanDetail.vehicle.year} {scanDetail.vehicle.make}{" "}
                  {scanDetail.vehicle.model}
                </h2>
                <p className="text-blue-200 text-xs sm:text-sm font-mono truncate">
                  {scanDetail.vehicle.vin}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 sm:p-2 flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-70px)] sm:max-h-[calc(85vh-80px)]">
              {/* Health Score */}
              <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-200">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0 ${
                    scanDetail.healthScore >= 90
                      ? "bg-emerald-500"
                      : scanDetail.healthScore >= 70
                        ? "bg-yellow-500"
                        : scanDetail.healthScore >= 50
                          ? "bg-orange-500"
                          : "bg-red-500"
                  }`}
                >
                  {scanDetail.healthScore}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-500">
                    Health Score
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {scanDetail.healthScore >= 90
                      ? "Excellent"
                      : scanDetail.healthScore >= 70
                        ? "Good"
                        : scanDetail.healthScore >= 50
                          ? "Fair"
                          : "Poor"}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 capitalize">
                    {scanDetail.overallStatus.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-500">Mileage</p>
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">
                    {scanDetail.vehicle.mileage?.toLocaleString() || "—"} mi
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-500">
                    Stock Number
                  </p>
                  <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                    {scanDetail.stockNumber || "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-500">DTC Codes</p>
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">
                    {scanDetail.dtcAnalysis?.length || 0}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-500">
                    Emissions Status
                  </p>
                  <p
                    className={`font-semibold capitalize text-sm sm:text-base ${
                      scanDetail.emissionsAnalysis?.status === "pass"
                        ? "text-emerald-600"
                        : scanDetail.emissionsAnalysis?.status === "fail"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {scanDetail.emissionsAnalysis?.status || "—"}
                  </p>
                </div>
              </div>

              {/* Costs */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">
                  Repair Costs
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-[10px] sm:text-sm text-slate-500">
                      DTC Repairs
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-slate-900">
                      {formatCurrency(scanDetail.totalEstimatedRepairCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-slate-500">
                      Additional
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-slate-900">
                      {formatCurrency(scanDetail.additionalRepairsTotalCost || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-slate-500">
                      Grand Total
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-emerald-600">
                      {formatCurrency(
                        scanDetail.grandTotalCost ??
                          scanDetail.totalEstimatedRepairCost,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {scanDetail.aiSummary && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">
                    AI Analysis Summary
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {scanDetail.aiSummary}
                  </p>
                </div>
              )}

              {/* DTC Analysis */}
              {scanDetail.dtcAnalysis && scanDetail.dtcAnalysis.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">
                    DTC Codes ({scanDetail.dtcAnalysis.length})
                  </h3>
                  <div className="space-y-2">
                    {scanDetail.dtcAnalysis.map((dtc, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-50"
                      >
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold text-white flex-shrink-0 ${
                            dtc.severity === "critical"
                              ? "bg-red-500"
                              : dtc.severity === "moderate"
                                ? "bg-orange-500"
                                : dtc.severity === "minor"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                          }`}
                        >
                          {dtc.code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-900">
                            {dtc.description}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 capitalize">
                            {dtc.severity} • {dtc.urgency}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 flex-shrink-0">
                          {formatCurrency(dtc.repairEstimate.high)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 sm:p-12 text-center text-slate-500 text-sm sm:text-base">
            Report not available
          </div>
        )}
      </div>
    </div>
  );
}
