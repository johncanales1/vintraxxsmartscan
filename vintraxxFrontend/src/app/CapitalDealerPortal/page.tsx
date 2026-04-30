"use client";

import { useState, useEffect } from "react";
import { Phone, ArrowRight, QrCode, DollarSign, CircleCheckBig, Clock, TrendingUp, Activity, FileText, Mail, Monitor, Settings, Search, Trash2 } from "lucide-react";
import { DealerNav } from "@/components/shared-assets/navigation/dealer-nav";
import { API_BASE } from "@/lib/api-config";
import { gpsWs } from "@/app/VinTraxxSmartScanDashboard/_lib/gpsWs";
import { useRouter } from "next/navigation";

interface DealerUser {
    id: string;
    email: string;
    isDealer: boolean;
    pricePerLaborHour: number | null;
    fullName?: string | null;
    logoUrl?: string | null;
    originalLogoUrl?: string | null;
    qrCodeUrl?: string | null;
    createdAt?: string;
    companyName?: string;
}

export default function CapitalDealerPortalPage() {
    const router = useRouter();
    const [searchName, setSearchName] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchPhone, setSearchPhone] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dealer, setDealer] = useState<DealerUser | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // Auth gate: identical pattern to the dashboard layout. If no token,
    // bounce to /login. If the profile fetch returns 401/403, the token is
    // stale — clear it and bounce.
    useEffect(() => {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("dealer_token")
                : null;
        if (!token) {
            router.replace("/login");
            return;
        }

        // Load cached dealer user for instant render
        const storedUser = localStorage.getItem("dealer_user");
        if (storedUser) {
            try {
                setDealer(JSON.parse(storedUser));
            } catch {}
        }

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/dealer/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.status === 401 || res.status === 403) {
                    try { gpsWs.disconnect(); } catch { /* no-op */ }
                    localStorage.removeItem("dealer_token");
                    localStorage.removeItem("dealer_user");
                    router.replace("/login");
                    return;
                }
                if (!res.ok) return;
                const data = await res.json();
                if (data.success && data.dealer) {
                    setDealer(data.dealer);
                    localStorage.setItem("dealer_user", JSON.stringify(data.dealer));
                }
            } catch (err) {
                console.error("Failed to fetch dealer profile:", err);
            } finally {
                setAuthChecked(true);
            }
        })();
    }, [router]);

    // NOTE: this page is currently a UI mock-up — the financing back-end
    // for VinTraxx Capital is not yet wired in. The rows below are sample
    // placeholders only. They contain NO real customer data. Once the
    // backend lender API is available, replace this with a real fetch.
    const applications = [
        { id: 1, name: "Sample Customer 1", email: "customer1@example.com", phone: "555-0101", createdOn: "13 Mar 2026", status: "FinWise Bank, sub-serviced by American First Finance Funded" },
        { id: 2, name: "Sample Customer 1", email: "customer1@example.com", phone: "555-0101", createdOn: "13 Mar 2026", status: "Application Started" },
        { id: 3, name: "Sample Customer 2", email: "customer2@example.com", phone: "555-0102", createdOn: "13 Mar 2026", status: "FinWise Bank, sub-serviced by American First Finance Pre Qualified" },
        { id: 4, name: "Sample Customer 2", email: "customer2@example.com", phone: "555-0102", createdOn: "13 Mar 2026", status: "Phone Verified" },
        { id: 5, name: "Sample Customer 3", email: "customer3@example.com", phone: "555-0103", createdOn: "12 Mar 2026", status: "Application Started" },
        { id: 6, name: "Sample Customer 4", email: "customer4@example.com", phone: "555-0104", createdOn: "6 Mar 2026", status: "FinWise Bank, sub-serviced by American First Finance Funded" },
        { id: 7, name: "Sample Customer 4", email: "customer4@example.com", phone: "555-0104", createdOn: "6 Mar 2026", status: "Application Started" },
        { id: 8, name: "Sample Customer 4", email: "customer4@example.com", phone: "555-0105", createdOn: "6 Mar 2026", status: "Application Started" },
        { id: 9, name: "Sample Customer 5", email: "customer5@example.com", phone: "555-0105", createdOn: "6 Mar 2026", status: "FinWise Bank, sub-serviced by American First Finance Denied" },
        { id: 10, name: "Sample Customer 6", email: "customer6@example.com", phone: "555-0106", createdOn: "4 Mar 2026", status: "FinWise Bank, sub-serviced by American First Finance Funded" },
    ];

    const stats = [
        { title: "Total Funded", value: "$7,600", subtitle: "6 deals · avg $1,266.67", icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-100", status: "Funded" },
        { title: "Total Approved", value: "$10,800", subtitle: "8 approvals · avg $1,350", icon: CircleCheckBig, color: "text-blue-600", bgColor: "bg-blue-100", status: "Approved" },
        { title: "Pending Applications", value: "23", subtitle: "35 started · 3 denied", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100", status: "Pending" },
        { title: "Conversion Rate", value: "75%", subtitle: "Overall conversion", icon: TrendingUp, color: "text-[#8B2332]", bgColor: "bg-red-100", status: "Rate" },
    ];

    const lenderPerformance = [
        { name: "U.S. Bank Avvance", approvals: 0, funded: 0, rate: 0, color: "text-red-500" },
        { name: "American First Finance", approvals: 8, funded: 6, rate: 75, color: "text-emerald-500" },
    ];

    const recentApplications = [
        { label: "Total Started Applications", value: "35", color: "text-slate-700" },
        { label: "Info Completed", value: "23", color: "text-slate-700" },
        { label: "Phone Verified", value: "28", color: "text-slate-700" },
        { label: "Approvals", value: "8", color: "text-emerald-700" },
        { label: "Denials", value: "3", color: "text-red-700" },
        { label: "Application Errors", value: "1", color: "text-amber-700" },
        { label: "Invoiced", value: "8", color: "text-blue-700" },
        { label: "E-Signature Completed", value: "6", color: "text-blue-700" },
        { label: "Initial Payment Completed", value: "6", color: "text-blue-700" },
        { label: "Funded Deals", value: "6", color: "text-emerald-700" },
    ];

    const statusOptions = [
        "All",
        "FinWise Bank, sub-serviced by American First Finance Funded",
        "Application Started",
        "FinWise Bank, sub-serviced by American First Finance Pre Qualified",
        "Phone Verified",
        "FinWise Bank, sub-serviced by American First Finance Denied",
        "FinWise Bank, sub-serviced by American First Finance Agreement Created",
        "FinWise Bank, sub-serviced by American First Finance Account Expired",
        "FinWise Bank, sub-serviced by American First Finance Application Error",
        "Payment Provider Not Available",
        "U.S. Bank Avvance Pre Approval Link Generated",
        "U.S. Bank Avvance Pre Approval Denied",
    ];

    // Don't render the page (and especially don't flash sample-PII rows)
    // until the auth gate has resolved.
    if (!authChecked) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-slate-500 text-sm">Loading…</div>
            </main>
        );
    }

    return (
        <>
            <DealerNav 
                dealerLogo={dealer?.logoUrl}
                originalLogoUrl={dealer?.originalLogoUrl}
                dealerName={dealer?.companyName}
                userEmail={dealer?.email}
                userId={dealer?.id}
                fullName={dealer?.fullName}
                pricePerLaborHour={dealer?.pricePerLaborHour}
                qrCodeUrl={dealer?.qrCodeUrl}
                createdAt={dealer?.createdAt}
                onProfileUpdate={(data) => setDealer(prev => prev ? { 
                    ...prev, 
                    logoUrl: data.logoUrl ?? prev.logoUrl,
                    originalLogoUrl: data.originalLogoUrl ?? prev.originalLogoUrl,
                    qrCodeUrl: data.qrCodeUrl ?? prev.qrCodeUrl,
                    pricePerLaborHour: data.pricePerLaborHour ?? prev.pricePerLaborHour,
                    fullName: data.fullName ?? prev.fullName,
                    email: data.email ?? prev.email,
                } : null)}
            />
            <main className="pt-16 min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695cac8c2981bc8a1da18bbf/b8367dd73_IMG_4709.jpg" 
                            alt="VinTraxx Capital" 
                            className="h-12 object-contain" 
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-[#1B3A5F]">Capital Dealer Portal</h1>
                            <p className="text-slate-500 text-sm">Manage customer financing applications</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <a href="tel:8324914917">
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2 border-slate-300 text-slate-900 bg-white">
                                <Phone className="w-4 h-4" />
                                832-491-4917
                            </button>
                        </a>
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            Web Link <ArrowRight className="w-4 h-4" />
                        </button>
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white gap-2">
                            <QrCode className="w-4 h-4" /> QR Code
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, index) => (
                        <div key={index} className="rounded-xl border text-card-foreground shadow bg-white border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                <div className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border-transparent shadow ${stat.bgColor} ${stat.color} border-0`}>
                                    {stat.status}
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-[#1B3A5F]">{stat.value}</p>
                            <p className="text-slate-500 text-sm mt-1">{stat.subtitle}</p>
                        </div>
                    ))}
                </div>

                {/* Lender Performance */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold text-[#1B3A5F] mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Lender Performance
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {lenderPerformance.map((lender, index) => (
                            <div key={index} className="rounded-xl border text-card-foreground shadow bg-white border-slate-200 p-6">
                                <div className="flex flex-col items-center">
                                    <svg viewBox="20 20 160 100" className="w-56 h-32">
                                        <path d="M 20 100.00000000000001 A 80 80 0 0 1 180 100" stroke="#e2e8f0" strokeWidth="12" fill="none"></path>
                                        <path d="M 20 100.00000000000001 A 80 80 0 0 1 43.4314575050762 156.5685424949238" stroke="#ef4444" strokeWidth="12" fill="none" strokeLinecap="round"></path>
                                        <path d="M 43.4314575050762 156.5685424949238 A 80 80 0 0 1 100 180" stroke="#eab308" strokeWidth="12" fill="none" strokeLinecap="round"></path>
                                        <path d="M 100 180 A 80 80 0 0 1 180 100" stroke="#22c55e" strokeWidth="12" fill="none" strokeLinecap="round"></path>
                                        <circle cx="100" cy="100" r="5" fill={lender.rate === 0 ? "#ef4444" : "#22c55e"}></circle>
                                        <line x1="100" y1="100" x2={lender.rate === 0 ? "100" : "149.49747468305833"} y2={lender.rate === 0 ? "30" : "149.49747468305833"} stroke={lender.rate === 0 ? "#ef4444" : "#22c55e"} strokeWidth="3" strokeLinecap="round"></line>
                                    </svg>
                                    <p className={`text-2xl font-bold -mt-2 ${lender.color}`}>{lender.rate}%</p>
                                </div>
                                <div className="text-center mt-4">
                                    <h3 className="font-bold text-[#1B3A5F] text-lg">{lender.name}</h3>
                                    <p className="text-slate-500 text-sm">Approvals: {lender.approvals}</p>
                                    <p className="text-slate-500 text-sm">Funded Deals: {lender.funded}</p>
                                    <p className={`font-bold text-sm mt-1 ${lender.color}`}>Conversion Rate: {lender.rate}%</p>
                                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${lender.rate === 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${lender.rate}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Applications Summary */}
                <div className="rounded-xl border text-card-foreground shadow bg-white border-slate-200">
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[#1B3A5F] flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Recent Applications
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentApplications.map((app, index) => (
                            <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <p className="text-slate-600">{app.label}</p>
                                <p className={`font-bold text-lg ${app.color}`}>{app.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Applications Table */}
                <div className="rounded-xl border text-card-foreground shadow bg-white border-slate-200 mt-10">
                    <div className="p-6 border-b border-slate-200">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <h2 className="text-lg font-semibold text-[#1B3A5F] flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Applications
                            </h2>
                            <div className="flex gap-2 flex-wrap">
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm">
                                    <Mail className="w-4 h-4" /> Send Customer Application
                                </button>
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-2 text-sm">
                                    <Monitor className="w-4 h-4" /> Create Desktop Application
                                </button>
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
                                    <QrCode className="w-4 h-4" /> QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-slate-500 mb-4">Application List <span className="text-slate-400">(Total count: 35)</span></p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <input 
                                className="flex h-9 rounded-md border bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-44 border-slate-400 text-slate-900 placeholder:text-slate-500 text-sm" 
                                placeholder="Search using name..." 
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                            <input 
                                className="flex h-9 rounded-md border bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-48 border-slate-400 text-slate-900 placeholder:text-slate-500 text-sm" 
                                placeholder="Search using email..." 
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                            />
                            <input 
                                className="flex h-9 rounded-md border bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-36 border-slate-400 text-slate-900 placeholder:text-slate-500 text-sm" 
                                placeholder="Phone number..." 
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                            />
                            <select 
                                className="border border-slate-400 rounded-md px-3 py-1.5 text-sm text-slate-900 bg-white"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                {statusOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <button className="p-2 bg-blue-600 rounded-md hover:bg-blue-700">
                                <Search className="w-4 h-4 text-white" />
                            </button>
                            <button className="p-2 bg-red-500 rounded-md hover:bg-red-600">
                                <Trash2 className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-y border-slate-200">
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold w-12">S.No.</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Name</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Email</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Phone</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Created On</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Status</th>
                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map((app, index) => (
                                        <tr key={app.id} className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                            <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                            <td className="px-4 py-3 text-slate-800 font-medium">{app.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{app.email}</td>
                                            <td className="px-4 py-3 text-slate-600">{app.phone}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{app.createdOn}</td>
                                            <td className="px-4 py-3 text-slate-700 max-w-[220px]">{app.status}</td>
                                            <td className="px-4 py-3">
                                                <button className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-md">
                                                    <Settings className="w-4 h-4 text-white" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Cards */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div className="rounded-xl shadow bg-[#1B3A5F] border-0 p-6 text-white">
                        <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                        <p className="text-blue-200 text-sm mb-4">Your dedicated account manager is available to assist with any application questions.</p>
                        <div className="flex gap-3">
                            <a href="tel:8324914917">
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-white text-[#1B3A5F] hover:bg-blue-50 gap-2">
                                    <Phone className="w-4 h-4" /> Call Us
                                </button>
                            </a>
                            <a href="mailto:capital@vintraxx.com">
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 border-white text-white hover:bg-white/10 gap-2">
                                    <Mail className="w-4 h-4" /> Email
                                </button>
                            </a>
                        </div>
                    </div>
                    <div className="rounded-xl shadow bg-[#8B2332] border-0 p-6 text-white">
                        <h3 className="font-bold text-lg mb-2">Loan Programs</h3>
                        <p className="text-red-200 text-sm mb-4">$1,000–$25,000 · 24–72 month terms · Same-day funding available</p>
                        <a href="mailto:capital@vintraxx.com?subject=Learn More About Loan Programs">
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-white text-[#8B2332] hover:bg-red-50 gap-2">
                                Learn More <ArrowRight className="w-4 h-4" />
                            </button>
                        </a>
                    </div>
                </div>
            </div>
            </main>
        </>
    );
}
