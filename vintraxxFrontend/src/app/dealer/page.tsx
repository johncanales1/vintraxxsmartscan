"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";

const API_BASE = "https://api.vintraxx.com/api/v1";

interface DealerUser {
    id: string;
    email: string;
    isDealer: boolean;
    pricePerLaborHour: number | null;
    logoUrl?: string | null;
    createdAt?: string;
}

interface Report {
    scanId: string;
    vin: string;
    vehicleYear: number | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    status: string;
    scanDate: string;
    stockNumber: string | null;
    additionalRepairs: string[];
    totalReconditioningCost: number | null;
    additionalRepairsCost: number | null;
    pdfUrl: string | null;
    emailSentAt: string | null;
}

export default function DealerPortalPage() {
    const router = useRouter();
    const [dealer, setDealer] = useState<DealerUser | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDealerData = useCallback(async (token: string) => {
        try {
            const [profileRes, reportsRes] = await Promise.all([
                fetch(`${API_BASE}/dealer/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/dealer/reports`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (profileRes.status === 401 || profileRes.status === 403) {
                localStorage.removeItem("dealer_token");
                localStorage.removeItem("dealer_user");
                router.push("/login");
                return;
            }

            const profileData = await profileRes.json();
            const reportsData = await reportsRes.json();

            if (profileData.success) setDealer(profileData.dealer);
            if (reportsData.success) setReports(reportsData.reports);
        } catch {
            setError("Failed to load dealer data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem("dealer_token");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchDealerData(token);
    }, [fetchDealerData, router]);

    const handleLogout = () => {
        localStorage.removeItem("dealer_token");
        localStorage.removeItem("dealer_user");
        router.push("/login");
    };

    const formatCurrency = (val: number | null) =>
        val !== null ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

    const statusColor: Record<string, string> = {
        COMPLETED: "bg-green-100 text-green-700",
        FAILED: "bg-red-100 text-red-700",
        RECEIVED: "bg-blue-100 text-blue-700",
        ANALYZING: "bg-yellow-100 text-yellow-700",
        GENERATING_PDF: "bg-yellow-100 text-yellow-700",
        EMAILING: "bg-yellow-100 text-yellow-700",
        DECODING_VIN: "bg-yellow-100 text-yellow-700",
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-4">
                    <UntitledLogoMinimal className="size-16 animate-pulse" />
                    <p className="text-sm text-gray-500">Loading dealer portal…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
                <div className="rounded-xl bg-white p-8 shadow-lg text-center max-w-sm">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-3">
                        <UntitledLogoMinimal className="size-8" />
                        <span className="text-lg font-bold text-gray-900">VinTraxx</span>
                        <span className="hidden sm:inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            Dealer Portal
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[200px]">
                            {dealer?.email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome + Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow">
                        <p className="text-sm font-medium text-blue-200">Welcome back</p>
                        <p className="mt-1 text-xl font-bold truncate">{dealer?.email}</p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                                Dealer
                            </span>
                            {dealer?.pricePerLaborHour && (
                                <span className="text-sm text-blue-100">
                                    ${dealer.pricePerLaborHour}/hr labor rate
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                        <p className="text-sm text-gray-500">Total Scans</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{reports.length}</p>
                    </div>

                    <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                        <p className="text-sm text-gray-500">Completed Reports</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {reports.filter((r) => r.status === "COMPLETED").length}
                        </p>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-base font-semibold text-gray-900">Scan Reports</h2>
                    </div>

                    {reports.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-400">
                            No scan reports yet. Scans submitted from the mobile app will appear here.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["VIN", "Vehicle", "Stock #", "Date", "Status", "Recon Cost", "Add. Repairs", "PDF"].map((h) => (
                                            <th
                                                key={h}
                                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {reports.map((r) => (
                                        <tr key={r.scanId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                                                {r.vin}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                                {[r.vehicleYear, r.vehicleMake, r.vehicleModel].filter(Boolean).join(" ") || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {r.stockNumber || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {formatDate(r.scanDate)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[r.status] ?? "bg-gray-100 text-gray-600"}`}
                                                >
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                                {formatCurrency(r.totalReconditioningCost)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                                {formatCurrency(r.additionalRepairsCost)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {r.pdfUrl ? (
                                                    <a
                                                        href={r.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline text-xs"
                                                    >
                                                        View PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
