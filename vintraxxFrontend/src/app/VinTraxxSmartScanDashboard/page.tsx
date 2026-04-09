"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Eye, Car, Scan, DollarSign, TrendingUp, ClipboardList, X, FileText, Wrench, Activity, CalendarDays, Mail, Send, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from "recharts";
import { DealerNav } from "@/components/shared-assets/navigation/dealer-nav";

const API_BASE = "https://api.vintraxx.com/api/v1";

interface DealerUser {
    id: string;
    email: string;
    fullName?: string | null;
    isDealer: boolean;
    pricePerLaborHour: number | null;
    logoUrl?: string | null;
    originalLogoUrl?: string | null;
    qrCodeUrl?: string | null;
    createdAt?: string;
    companyName?: string;
}

// OBD Scan Report from /dealer/reports (existing endpoint)
interface OBDScanReport {
    scanId: string;
    vin: string;
    vehicleYear: number | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    stockNumber: string | null;
    scanDate: string;
    status: string;
    additionalRepairs: string[];
    totalReconditioningCost: number | null;
    additionalRepairsCost: number | null;
    pdfUrl: string | null;
    emailSentAt: string | null;
    userFullName?: string | null;
    vehicleOwnerName?: string | null;
    scannerOwnerName?: string | null;
    emailOwnerName?: string | null;
    emailOwnerEmail?: string | null;
}

// Detailed report from /scan/report/:scanId (FullReportData structure)
interface OBDReportDetail {
    scanId: string;
    vehicle: {
        vin: string;
        year: number;
        make: string;
        model: string;
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
    additionalRepairs?: any[];
    additionalRepairsTotalCost?: number;
    grandTotalCost?: number;
    aiSummary: string;
    stockNumber?: string;
}

// Appraisal data from /appraisal/dashboard
interface AppraisalData {
    appraisalId: string;
    vin: string;
    vehicle: {
        year: number;
        make: string;
        model: string;
        trim?: string;
        mileage: number;
    };
    valuation: {
        wholesale: number;
        retail: number;
        tradeIn: number;
    };
    createdAt: string;
    userEmail: string;
    userFullName?: string;
    vehicleOwnerName?: string;
    pdfUrl?: string | null;
}

interface ServiceAppointment {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    dealership?: string | null;
    vehicle?: string | null;
    vin?: string | null;
    serviceType: string;
    preferredDate: string;
    preferredTime?: string | null;
    additionalNotes?: string | null;
    status: string;
    createdAt: string;
}

export default function DealerPortalPage() {
    const router = useRouter();
    const [dealer, setDealer] = useState<DealerUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // OBD Scan Data
    const [obdReports, setObdReports] = useState<OBDScanReport[]>([]);
    const [obdSearchQuery, setObdSearchQuery] = useState("");
    
    // Appraisal Data
    const [appraisals, setAppraisals] = useState<AppraisalData[]>([]);
    const [appraisalSearchQuery, setAppraisalSearchQuery] = useState("");
    
    // Service Appointments
    const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
    
    // Modal States
    const [showScanListModal, setShowScanListModal] = useState(false);
    const [scanListFilter, setScanListFilter] = useState<'all' | 'repairs'>('all');
    const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
    const [scanDetail, setScanDetail] = useState<OBDReportDetail | null>(null);
    const [scanDetailLoading, setScanDetailLoading] = useState(false);
    const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalData | null>(null);
    
    // Scan Activity Period
    const [scanActivityPeriod, setScanActivityPeriod] = useState<'1w' | '1m' | '3m' | '6m' | '12m'>('12m');

    // Schedule Service Appointment Modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        name: '',
        email: '',
        phone: '',
        dealership: '',
        vehicle: '',
        vin: '',
        serviceType: '',
        preferredDate: '',
        preferredTime: '',
        additionalNotes: '',
    });
    const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
    const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
    const [scheduleSuccess, setScheduleSuccess] = useState(false);

    // Email Compose Modal
    const [showEmailCompose, setShowEmailCompose] = useState(false);
    const [composeEmail, setComposeEmail] = useState({ to: '', subject: '', body: '' });
    const [composeSending, setComposeSending] = useState(false);
    const [composeSent, setComposeSent] = useState(false);

    const fetchDealerData = useCallback(async (token: string) => {
        try {
            const [profileRes, reportsRes, appraisalsRes, appointmentsRes] = await Promise.all([
                fetch(`${API_BASE}/dealer/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/dealer/reports`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/appraisal/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/dealer/appointments`, {
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
            const appraisalsData = await appraisalsRes.json();
            const appointmentsData = await appointmentsRes.json();

            if (profileData.success) setDealer(profileData.dealer);
            if (reportsData.success) {
                setObdReports(reportsData.reports || []);
            }
            if (appraisalsData.success) {
                setAppraisals(appraisalsData.data || []);
            }
            if (appointmentsData.success) {
                setAppointments(appointmentsData.appointments || []);
            }
        } catch {
            setError("Failed to load dealer data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [router]);
    
    // Fetch single scan report detail
    const fetchScanDetail = useCallback(async (scanId: string) => {
        const token = localStorage.getItem("dealer_token");
        if (!token) return;
        
        setScanDetailLoading(true);
        try {
            const res = await fetch(`${API_BASE}/scan/report/${scanId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && data.status === 'completed') {
                setScanDetail(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch scan detail:', err);
        } finally {
            setScanDetailLoading(false);
        }
    }, []);
    
    // Handle panel clicks
    const handleTotalScansClick = () => {
        setScanListFilter('all');
        setShowScanListModal(true);
    };
    
    const handleRepairCostsClick = () => {
        setScanListFilter('repairs');
        setShowScanListModal(true);
    };
    
    // Handle scan item click to show detail
    const handleScanItemClick = (scanId: string) => {
        setSelectedScanId(scanId);
        fetchScanDetail(scanId);
    };
    
    // Close modals
    const closeScanListModal = () => {
        setShowScanListModal(false);
        setScanListFilter('all');
    };
    
    const closeScanDetailModal = () => {
        setSelectedScanId(null);
        setScanDetail(null);
    };
    
    const closeAppraisalModal = () => {
        setSelectedAppraisal(null);
    };

    const closeScheduleModal = () => {
        setShowScheduleModal(false);
        setScheduleForm({ name: '', email: '', phone: '', dealership: '', vehicle: '', vin: '', serviceType: '', preferredDate: '', preferredTime: '', additionalNotes: '' });
        setScheduleErrors({});
        setScheduleSuccess(false);
    };

    const openEmailCompose = (toEmail: string) => {
        setComposeEmail({ to: toEmail, subject: '', body: '' });
        setComposeSent(false);
        setShowEmailCompose(true);
    };

    const closeEmailCompose = () => {
        setShowEmailCompose(false);
        setComposeEmail({ to: '', subject: '', body: '' });
        setComposeSent(false);
    };

    const handleSendEmail = async () => {
        if (!composeEmail.to || !composeEmail.subject.trim()) return;
        setComposeSending(true);
        try {
            const token = localStorage.getItem("dealer_token");
            const res = await fetch(`${API_BASE}/dealer/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ to: composeEmail.to, subject: composeEmail.subject, body: composeEmail.body }),
            });
            if (res.ok) {
                setComposeSent(true);
            } else {
                alert('Failed to send email. Please try again.');
            }
        } catch {
            alert('Network error. Please try again.');
        } finally {
            setComposeSending(false);
        }
    };

    const validateScheduleForm = () => {
        const errors: Record<string, string> = {};
        if (!scheduleForm.name.trim()) errors.name = 'Name is required';
        if (!scheduleForm.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(scheduleForm.email)) errors.email = 'Enter a valid email';
        if (!scheduleForm.phone.trim()) errors.phone = 'Phone is required';
        if (!scheduleForm.dealership.trim()) errors.dealership = 'Dealership is required';
        if (!scheduleForm.vehicle.trim()) errors.vehicle = 'Vehicle is required';
        if (!scheduleForm.vin.trim()) errors.vin = 'VIN is required';
        if (!scheduleForm.serviceType) errors.serviceType = 'Service type is required';
        if (!scheduleForm.preferredDate) errors.preferredDate = 'Preferred date is required';
        return errors;
    };

    const handleScheduleSubmit = async () => {
        const errors = validateScheduleForm();
        if (Object.keys(errors).length > 0) {
            setScheduleErrors(errors);
            return;
        }
        setScheduleErrors({});
        setScheduleSubmitting(true);
        try {
            const token = localStorage.getItem("dealer_token");
            const res = await fetch(`${API_BASE}/dealer/schedule-appointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(scheduleForm),
            });
            if (res.ok) {
                setScheduleSuccess(true);
            } else {
                setScheduleErrors({ submit: 'Failed to submit request. Please try again.' });
            }
        } catch {
            setScheduleErrors({ submit: 'Network error. Please try again.' });
        } finally {
            setScheduleSubmitting(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("dealer_token");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchDealerData(token);
    }, [fetchDealerData, router]);

    const formatCurrency = (val: number | null | undefined) =>
        val !== null && val !== undefined ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Helper to get total repair cost for a report
    const getTotalRepairCost = (r: OBDScanReport) => 
        (r.totalReconditioningCost || 0) + (r.additionalRepairsCost || 0);
    
    // Computed statistics from reports
    const completedReports = obdReports.filter(r => r.status === 'COMPLETED');
    const totalScans = completedReports.length;
    const totalRepairCosts = completedReports.reduce((sum, r) => sum + getTotalRepairCost(r), 0);
    const scansWithRepairs = completedReports.filter(r => getTotalRepairCost(r) > 0).length;
    
    // Scan activity based on selected period
    const getActivityData = () => {
        const now = new Date();
        const data: { month: string; scans: number }[] = [];
        
        if (scanActivityPeriod === '1w') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayName = date.toLocaleString('en-US', { weekday: 'short' });
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
                const count = completedReports.filter(r => {
                    const scanDate = new Date(r.scanDate);
                    return scanDate >= dayStart && scanDate <= dayEnd;
                }).length;
                data.push({ month: dayName, scans: count });
            }
        } else {
            // Monthly data for 1m, 3m, 6m, 12m
            const monthCount = scanActivityPeriod === '1m' ? 4 : 
                               scanActivityPeriod === '3m' ? 3 : 
                               scanActivityPeriod === '6m' ? 6 : 12;
            
            if (scanActivityPeriod === '1m') {
                // Last 4 weeks
                for (let i = 3; i >= 0; i--) {
                    const weekStart = new Date(now);
                    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
                    const weekEnd = new Date(now);
                    weekEnd.setDate(weekEnd.getDate() - i * 7);
                    const count = completedReports.filter(r => {
                        const scanDate = new Date(r.scanDate);
                        return scanDate >= weekStart && scanDate < weekEnd;
                    }).length;
                    data.push({ month: `Week ${4 - i}`, scans: count });
                }
            } else {
                for (let i = monthCount - 1; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthName = date.toLocaleString('en-US', { month: 'short' });
                    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
                    const count = completedReports.filter(r => {
                        const scanDate = new Date(r.scanDate);
                        return scanDate >= monthStart && scanDate <= monthEnd;
                    }).length;
                    data.push({ month: monthName, scans: count });
                }
            }
        }
        return data;
    };
    
    // Chart data
    const scanActivityData = getActivityData();
    
    const periodOptions = [
        { value: '1w', label: 'Last Week' },
        { value: '1m', label: 'Last Month' },
        { value: '3m', label: 'Last 3 Months' },
        { value: '6m', label: 'Last 6 Months' },
        { value: '12m', label: 'Last 12 Months' },
    ];
    
    // Cost distribution for bar chart
    const costDistribution = [
        { range: "No Cost", count: completedReports.filter(r => getTotalRepairCost(r) === 0).length, fill: "#10b981" },
        { range: "$1-$500", count: completedReports.filter(r => { const c = getTotalRepairCost(r); return c > 0 && c <= 500; }).length, fill: "#22c55e" },
        { range: "$500-$1k", count: completedReports.filter(r => { const c = getTotalRepairCost(r); return c > 500 && c <= 1000; }).length, fill: "#eab308" },
        { range: "$1k-$2k", count: completedReports.filter(r => { const c = getTotalRepairCost(r); return c > 1000 && c <= 2000; }).length, fill: "#f97316" },
        { range: "$2k+", count: completedReports.filter(r => getTotalRepairCost(r) > 2000).length, fill: "#ef4444" },
    ];
    
    // Filtered reports for scan list modal
    const filteredScanReports = completedReports.filter(r => {
        if (scanListFilter === 'repairs') return getTotalRepairCost(r) > 0;
        return true;
    }).filter(r => {
        if (!obdSearchQuery) return true;
        const query = obdSearchQuery.toLowerCase();
        return r.vin.toLowerCase().includes(query) ||
               r.vehicleMake?.toLowerCase().includes(query) ||
               r.vehicleModel?.toLowerCase().includes(query) ||
               r.stockNumber?.toLowerCase().includes(query) ||
               r.userFullName?.toLowerCase().includes(query) ||
               r.vehicleOwnerName?.toLowerCase().includes(query) ||
               r.scannerOwnerName?.toLowerCase().includes(query) ||
               r.emailOwnerName?.toLowerCase().includes(query) ||
               r.emailOwnerEmail?.toLowerCase().includes(query);
    });
    
    // Filtered appraisals
    const filteredAppraisals = appraisals.filter(a => {
        if (!appraisalSearchQuery) return true;
        const query = appraisalSearchQuery.toLowerCase();
        return a.vin.toLowerCase().includes(query) ||
               a.vehicle.make?.toLowerCase().includes(query) ||
               a.vehicle.model?.toLowerCase().includes(query) ||
               a.userFullName?.toLowerCase().includes(query) ||
               a.vehicleOwnerName?.toLowerCase().includes(query) ||
               a.userEmail?.toLowerCase().includes(query);
    });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400">Loading dealer portal…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="rounded-xl bg-slate-800 p-8 shadow-lg text-center max-w-sm border border-slate-700">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <style jsx>{`
                :root {
                  --background: 2 6 23;
                  --foreground: 248 250 252;
                  --card: 15 23 42;
                  --card-foreground: 248 250 252;
                  --popover: 15 23 42;
                  --popover-foreground: 248 250 252;
                  --primary: 27 58 95;
                  --primary-foreground: 255 255 255;
                  --secondary: 30 41 59;
                  --secondary-foreground: 248 250 252;
                  --muted: 30 41 59;
                  --muted-foreground: 148 163 184;
                  --accent: 139 35 50;
                  --accent-foreground: 255 255 255;
                  --destructive: 239 68 68;
                  --destructive-foreground: 255 255 255;
                  --border: 51 65 85;
                  --input: 51 65 85;
                  --ring: 27 58 95;
                }
            `}</style>

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
                    logoUrl: data.logoUrl || prev.logoUrl,
                    originalLogoUrl: data.originalLogoUrl || prev.originalLogoUrl,
                    qrCodeUrl: data.qrCodeUrl || prev.qrCodeUrl,
                    pricePerLaborHour: data.pricePerLaborHour ?? prev.pricePerLaborHour,
                    fullName: data.fullName || prev.fullName,
                    email: data.email || prev.email,
                } : null)}
            />

            <main className="pt-16 min-h-screen">
                <div className="min-h-screen bg-slate-50">
                    {/* Header */}
                    <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B3A5F] mb-1">VinTraxx SmartScan Dashboard</h1>
                                    <p className="text-sm sm:text-base text-slate-600">View and manage all diagnostic scans and appraisals</p>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/MultiPointInspection" className="w-full sm:w-auto">
                                        <button className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-10 rounded-md px-4 sm:px-8 bg-[#1B3A5F] hover:bg-[#2d5278] text-white gap-2">
                                            <ClipboardList className="w-5 h-5" />
                                            <span className="hidden xs:inline">Multi-Point</span> Inspection
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => setShowScheduleModal(true)}
                                        className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-10 rounded-md px-4 sm:px-8 bg-[#8B2332] hover:bg-[#a12d3e] text-white gap-2"
                                    >
                                        <CalendarDays className="w-5 h-5" />
                                        Schedule Service Appointment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                        {/* OBD Scan Section Header */}
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1B3A5F] flex items-center gap-2">
                                <Activity className="w-6 h-6" />
                                OBD Scan Analytics
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Click panels to view detailed scan reports</p>
                        </div>
                        
                        {/* Stats Cards - Clickable Panels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            <div 
                                onClick={handleTotalScansClick}
                                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                            >
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <Scan className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                                </div>
                                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{totalScans}</p>
                                <p className="text-blue-100 text-xs sm:text-sm">Total OBD Scans</p>
                                <p className="text-blue-200 text-xs mt-1 sm:mt-2">Click to view all scan reports →</p>
                            </div>
                            <div 
                                onClick={handleRepairCostsClick}
                                className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-4 sm:p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                            >
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                                </div>
                                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{formatCurrency(totalRepairCosts)}</p>
                                <p className="text-emerald-100 text-xs sm:text-sm">Repair Costs Identified</p>
                                <p className="text-emerald-200 text-xs mt-1 sm:mt-2">{scansWithRepairs} vehicles need repairs →</p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                            <div className="rounded-xl border text-card-foreground shadow bg-white border-slate-200 p-4 sm:p-6">
                                <h3 className="text-sm sm:text-base text-slate-900 font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                                    Repair Cost Distribution
                                </h3>
                                {completedReports.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                                        <BarChart data={costDistribution} style={{ outline: 'none' }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                            <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#64748b" allowDecimals={false} axisLine={false} tickLine={false} />
                                            <Tooltip 
                                                cursor={false}
                                                contentStyle={{ 
                                                    backgroundColor: 'rgb(255, 255, 255)', 
                                                    border: '1px solid rgb(226, 232, 240)', 
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }} 
                                            />
                                            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#10b981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-slate-400 text-sm">
                                        No scan data available
                                    </div>
                                )}
                            </div>
                            <div className="rounded-xl border text-card-foreground shadow bg-white border-slate-200 p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                                    <h3 className="text-sm sm:text-base text-slate-900 font-semibold flex items-center gap-2">
                                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                                        Scan Activity
                                    </h3>
                                    <select
                                        value={scanActivityPeriod}
                                        onChange={(e) => setScanActivityPeriod(e.target.value as '1w' | '1m' | '3m' | '6m' | '12m')}
                                        className="text-xs sm:text-sm border border-slate-300 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer w-full sm:w-auto"
                                    >
                                        {periodOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {scanActivityData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                                        <LineChart data={scanActivityData} style={{ outline: 'none' }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#64748b" allowDecimals={false} axisLine={false} tickLine={false} />
                                            <Tooltip 
                                                cursor={false}
                                                contentStyle={{ 
                                                    backgroundColor: 'rgb(255, 255, 255)', 
                                                    border: '1px solid rgb(226, 232, 240)', 
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }} 
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="scans" 
                                                stroke="#1B3A5F" 
                                                strokeWidth={3}
                                                dot={{ fill: "#1B3A5F", r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-slate-400 text-sm">
                                        No scan data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Appraisal Data Section */}
                        <div className="mb-8 sm:mb-12">
                            <div className="mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1B3A5F] flex items-center gap-2">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                    Vehicle Appraisals
                                </h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">Click on any row to view detailed appraisal information</p>
                            </div>
                            
                            <div className="flex gap-3 w-full sm:max-w-2xl mb-4 sm:mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        className="flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" 
                                        placeholder="Search by VIN, Make, Model, Email, or Owner..." 
                                        value={appraisalSearchQuery}
                                        onChange={(e) => setAppraisalSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="block md:hidden space-y-3">
                                {filteredAppraisals.length === 0 ? (
                                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-400">
                                        {appraisals.length === 0 ? 'No appraisals found' : 'No matching appraisals'}
                                    </div>
                                ) : (
                                    filteredAppraisals.map((appraisal) => (
                                        <div 
                                            key={appraisal.appraisalId}
                                            onClick={() => setSelectedAppraisal(appraisal)}
                                            className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Car className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">{appraisal.vehicle.year} {appraisal.vehicle.make}</p>
                                                        <p className="text-xs text-slate-500">{appraisal.vehicle.model} {appraisal.vehicle.trim || ''}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400">{formatDate(appraisal.createdAt)}</span>
                                            </div>
                                            <p className="font-mono text-xs text-slate-500 mb-3 truncate">{appraisal.vin}</p>
                                            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                                <span>{appraisal.vehicle.mileage?.toLocaleString() || '—'} mi</span>
                                                {appraisal.pdfUrl && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); window.open(appraisal.pdfUrl!, '_blank'); }}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        PDF
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {appraisal.vehicleOwnerName && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">
                                                        <User className="w-3 h-3" />
                                                        {appraisal.vehicleOwnerName}
                                                    </span>
                                                )}
                                                {appraisal.userEmail && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEmailCompose(appraisal.userEmail); }}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-medium hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <Send className="w-3 h-3" />
                                                        {appraisal.userEmail}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                                <div className="relative w-full overflow-x-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead>
                                            <tr className="bg-[#1B3A5F]">
                                                <th className="text-white px-4 py-3 font-semibold text-left">Vehicle</th>
                                                <th className="text-white px-4 py-3 font-semibold text-left">VIN</th>
                                                <th className="text-white px-4 py-3 font-semibold text-left">Mileage</th>
                                                <th className="text-white px-4 py-3 font-semibold text-left">Date</th>
                                                <th className="text-white px-4 py-3 font-semibold text-left">Email</th>
                                                <th className="text-white px-4 py-3 font-semibold text-left">Customer</th>
                                                <th className="text-white px-4 py-3 font-semibold text-center w-20">PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAppraisals.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-12 text-slate-400">
                                                        {appraisals.length === 0 ? 'No appraisals found' : 'No matching appraisals'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAppraisals.map((appraisal) => (
                                                    <tr 
                                                        key={appraisal.appraisalId} 
                                                        onClick={() => setSelectedAppraisal(appraisal)}
                                                        className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                                    >
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <Car className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900 text-sm">{appraisal.vehicle.year} {appraisal.vehicle.make}</p>
                                                                    <p className="text-xs text-slate-500">{appraisal.vehicle.model} {appraisal.vehicle.trim || ''}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{appraisal.vin}</td>
                                                        <td className="px-4 py-3.5 text-slate-600 text-sm">{appraisal.vehicle.mileage?.toLocaleString() || '—'} mi</td>
                                                        <td className="px-4 py-3.5 text-slate-500 text-sm">{formatDate(appraisal.createdAt)}</td>
                                                        <td className="px-4 py-3.5">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEmailCompose(appraisal.userEmail); }}
                                                                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                                                                title={appraisal.userEmail}
                                                            >
                                                                <Send className="w-3 h-3" />
                                                                <span className="truncate max-w-[160px]">{appraisal.userEmail}</span>
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            {appraisal.vehicleOwnerName ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                                                                    <User className="w-3 h-3" />
                                                                    {appraisal.vehicleOwnerName}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 text-xs">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {appraisal.pdfUrl ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); window.open(appraisal.pdfUrl!, '_blank'); }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors"
                                                                >
                                                                    <FileText className="w-3 h-3" />
                                                                    PDF
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-300 text-xs">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        {/* Service Appointment Activity History */}
                        <div className="mb-8 sm:mb-12">
                            <div className="mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1B3A5F] flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
                                    Service Appointment Activity
                                </h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">History of scheduled service appointments</p>
                            </div>

                            {appointments.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-400 border border-slate-200">
                                    No service appointments scheduled yet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {appointments.map((apt) => (
                                        <div key={apt.id} className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        apt.status === 'confirmed' ? 'bg-emerald-100' :
                                                        apt.status === 'completed' ? 'bg-blue-100' :
                                                        apt.status === 'cancelled' ? 'bg-red-100' : 'bg-amber-100'
                                                    }`}>
                                                        <CalendarDays className={`w-5 h-5 ${
                                                            apt.status === 'confirmed' ? 'text-emerald-600' :
                                                            apt.status === 'completed' ? 'text-blue-600' :
                                                            apt.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                                                        }`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">{apt.serviceType}</p>
                                                        <p className="text-xs text-slate-500">{apt.name} &bull; <a href={`mailto:${apt.email}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">{apt.email}</a></p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 ml-13 sm:ml-0">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                        apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                        apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>{apt.status}</span>
                                                    <span className="text-xs text-slate-400">{formatDate(apt.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
                                                {apt.vehicle && <div><span className="text-slate-400">Vehicle:</span> {apt.vehicle}</div>}
                                                {apt.vin && <div><span className="text-slate-400">VIN:</span> <span className="font-mono">{apt.vin}</span></div>}
                                                {apt.preferredDate && <div><span className="text-slate-400">Date:</span> {apt.preferredDate}</div>}
                                                {apt.preferredTime && <div><span className="text-slate-400">Time:</span> {apt.preferredTime}</div>}
                                                {apt.dealership && <div><span className="text-slate-400">Dealership:</span> {apt.dealership}</div>}
                                                {apt.phone && <div><span className="text-slate-400">Phone:</span> {apt.phone}</div>}
                                            </div>
                                            {apt.additionalNotes && (
                                                <p className="mt-2 text-xs text-slate-400 italic truncate">Note: {apt.additionalNotes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Scan List Modal - Shows when clicking blue or green panels */}
            {showScanListModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={closeScanListModal}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#1B3A5F] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-base sm:text-xl font-bold text-white">
                                    {scanListFilter === 'all' ? 'All OBD Scan Reports' : 'Vehicles Needing Repairs'}
                                </h2>
                                <p className="text-blue-200 text-xs sm:text-sm">
                                    {filteredScanReports.length} {filteredScanReports.length === 1 ? 'vehicle' : 'vehicles'} found
                                </p>
                            </div>
                            <button onClick={closeScanListModal} className="text-white/80 hover:text-white p-1 sm:p-2">
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <div className="p-3 sm:p-4">
                            <div className="relative mb-3 sm:mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    className="w-full h-9 sm:h-10 rounded-lg border px-3 py-2 text-sm pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    placeholder="Search by VIN, Make, Model, Email, Owner..." 
                                    value={obdSearchQuery}
                                    onChange={(e) => setObdSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="overflow-y-auto max-h-[60vh] sm:max-h-[50vh]">
                                {filteredScanReports.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">No scan reports found</div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredScanReports.map((report) => {
                                            const repairCost = getTotalRepairCost(report);
                                            return (
                                                <div 
                                                    key={report.scanId}
                                                    onClick={() => handleScanItemClick(report.scanId)}
                                                    className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 text-sm sm:text-base">
                                                                    {report.vehicleYear} {report.vehicleMake} {report.vehicleModel}
                                                                </p>
                                                                <p className="text-xs sm:text-sm text-slate-500 font-mono truncate max-w-[200px] sm:max-w-none">{report.vin}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-left sm:text-right ml-11 sm:ml-0">
                                                            <p className={`font-semibold text-sm sm:text-base ${repairCost > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {repairCost > 0 ? formatCurrency(repairCost) : 'No repairs'}
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-slate-500">{formatDate(report.scanDate)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        {repairCost > 0 && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] sm:text-xs font-medium">
                                                                <Wrench className="w-3 h-3" />
                                                                Repairs needed
                                                            </span>
                                                        )}
                                                        {report.stockNumber && (
                                                            <span className="text-[10px] sm:text-xs text-slate-400">Stock: {report.stockNumber}</span>
                                                        )}
                                                        {report.pdfUrl && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); window.open(report.pdfUrl!, '_blank'); }}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                View PDF File
                                                            </button>
                                                        )}
                                                    </div>
                                                    {/* Owner Info Badges */}
                                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                                                        {(report.emailOwnerName || report.userFullName) && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] sm:text-xs font-medium">
                                                                <Mail className="w-3 h-3" />
                                                                {report.emailOwnerName || report.userFullName}
                                                            </span>
                                                        )}
                                                        {report.scannerOwnerName && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] sm:text-xs font-medium">
                                                                <Scan className="w-3 h-3" />
                                                                {report.scannerOwnerName}
                                                            </span>
                                                        )}
                                                        {report.vehicleOwnerName && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-medium">
                                                                <User className="w-3 h-3" />
                                                                {report.vehicleOwnerName}
                                                            </span>
                                                        )}
                                                        {report.emailOwnerEmail && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEmailCompose(report.emailOwnerEmail!); }}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
                                                            >
                                                                <Send className="w-3 h-3" />
                                                                {report.emailOwnerEmail}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Scan Detail Modal */}
            {selectedScanId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={closeScanDetailModal}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        {scanDetailLoading ? (
                            <div className="p-8 sm:p-12 text-center">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-500 text-sm sm:text-base">Loading report details...</p>
                            </div>
                        ) : scanDetail ? (
                            <>
                                <div className="bg-[#1B3A5F] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base sm:text-xl font-bold text-white truncate">
                                            {scanDetail.vehicle.year} {scanDetail.vehicle.make} {scanDetail.vehicle.model}
                                        </h2>
                                        <p className="text-blue-200 text-xs sm:text-sm font-mono truncate">{scanDetail.vehicle.vin}</p>
                                    </div>
                                    <button onClick={closeScanDetailModal} className="text-white/80 hover:text-white p-1 sm:p-2 flex-shrink-0 ml-2">
                                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                </div>
                                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-70px)] sm:max-h-[calc(85vh-80px)]">
                                    {/* Health Score */}
                                    <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-200">
                                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0 ${
                                            scanDetail.healthScore >= 90 ? 'bg-emerald-500' :
                                            scanDetail.healthScore >= 70 ? 'bg-yellow-500' :
                                            scanDetail.healthScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                        }`}>
                                            {scanDetail.healthScore}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm text-slate-500">Health Score</p>
                                            <p className="text-xl sm:text-2xl font-bold text-slate-900">
                                                {scanDetail.healthScore >= 90 ? 'Excellent' :
                                                 scanDetail.healthScore >= 70 ? 'Good' :
                                                 scanDetail.healthScore >= 50 ? 'Fair' : 'Poor'}
                                            </p>
                                            <p className="text-xs sm:text-sm text-slate-500 capitalize">{scanDetail.overallStatus.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Vehicle Info */}
                                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                                        <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm text-slate-500">Mileage</p>
                                            <p className="font-semibold text-slate-900 text-sm sm:text-base">{scanDetail.vehicle.mileage?.toLocaleString() || '—'} mi</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm text-slate-500">Stock Number</p>
                                            <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">{scanDetail.stockNumber || '—'}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm text-slate-500">DTC Codes</p>
                                            <p className="font-semibold text-slate-900 text-sm sm:text-base">{scanDetail.dtcAnalysis?.length || 0}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm text-slate-500">Emissions Status</p>
                                            <p className={`font-semibold capitalize text-sm sm:text-base ${
                                                scanDetail.emissionsAnalysis?.status === 'pass' ? 'text-emerald-600' : 
                                                scanDetail.emissionsAnalysis?.status === 'fail' ? 'text-red-600' : 'text-yellow-600'
                                            }`}>
                                                {scanDetail.emissionsAnalysis?.status || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Costs */}
                                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                                        <h3 className="font-semibold text-slate-900 mb-2 sm:mb-3 text-sm sm:text-base">Repair Costs</h3>
                                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                                            <div>
                                                <p className="text-[10px] sm:text-sm text-slate-500">DTC Repairs</p>
                                                <p className="text-sm sm:text-lg font-bold text-slate-900">{formatCurrency(scanDetail.totalEstimatedRepairCost)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] sm:text-sm text-slate-500">Additional</p>
                                                <p className="text-sm sm:text-lg font-bold text-slate-900">{formatCurrency(scanDetail.additionalRepairsTotalCost || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] sm:text-sm text-slate-500">Grand Total</p>
                                                <p className="text-sm sm:text-lg font-bold text-emerald-600">{formatCurrency(scanDetail.grandTotalCost || scanDetail.totalEstimatedRepairCost)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* AI Summary */}
                                    {scanDetail.aiSummary && (
                                        <div className="mb-4 sm:mb-6">
                                            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">AI Analysis Summary</h3>
                                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{scanDetail.aiSummary}</p>
                                        </div>
                                    )}
                                    
                                    {/* DTC Analysis */}
                                    {scanDetail.dtcAnalysis && scanDetail.dtcAnalysis.length > 0 && (
                                        <div className="mb-4 sm:mb-6">
                                            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">DTC Codes ({scanDetail.dtcAnalysis.length})</h3>
                                            <div className="space-y-2">
                                                {scanDetail.dtcAnalysis.map((dtc, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-50">
                                                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold text-white flex-shrink-0 ${
                                                            dtc.severity === 'critical' ? 'bg-red-500' :
                                                            dtc.severity === 'moderate' ? 'bg-orange-500' :
                                                            dtc.severity === 'minor' ? 'bg-yellow-500' : 'bg-blue-500'
                                                        }`}>
                                                            {dtc.code}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-slate-900">{dtc.description}</p>
                                                            <p className="text-[10px] sm:text-xs text-slate-500 capitalize">{dtc.severity} • {dtc.urgency}</p>
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
                            <div className="p-8 sm:p-12 text-center text-slate-500 text-sm sm:text-base">Report not available</div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Schedule Service Appointment Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={closeScheduleModal}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#8B2332] px-5 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="w-5 h-5 text-white" />
                                <h2 className="text-base sm:text-xl font-bold text-white">Schedule Service Appointment</h2>
                            </div>
                            <button onClick={closeScheduleModal} className="text-white/80 hover:text-white p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {scheduleSuccess ? (
                            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted!</h3>
                                <p className="text-slate-500 text-sm mb-6">Your service appointment request has been sent successfully.</p>
                                <button
                                    onClick={closeScheduleModal}
                                    className="px-6 py-2.5 rounded-lg bg-[#8B2332] hover:bg-[#a12d3e] text-white font-medium text-sm transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-y-auto flex-1 p-5 sm:p-6">
                                    {/* Row 1: Name + Email */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Full name"
                                                value={scheduleForm.name}
                                                onChange={e => setScheduleForm(f => ({ ...f, name: e.target.value }))}
                                                className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.name ? 'border-red-400' : 'border-slate-300'}`}
                                            />
                                            {scheduleErrors.name && <p className="text-red-500 text-xs mt-1">{scheduleErrors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                                            <input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={scheduleForm.email}
                                                onChange={e => setScheduleForm(f => ({ ...f, email: e.target.value }))}
                                                className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.email ? 'border-red-400' : 'border-slate-300'}`}
                                            />
                                            {scheduleErrors.email && <p className="text-red-500 text-xs mt-1">{scheduleErrors.email}</p>}
                                        </div>
                                    </div>
                                    {/* Row 2: Phone + Dealership */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone <span className="text-red-500">*</span></label>
                                            <input
                                                type="tel"
                                                placeholder="(555) 000-0000"
                                                value={scheduleForm.phone}
                                                onChange={e => setScheduleForm(f => ({ ...f, phone: e.target.value }))}
                                                className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.phone ? 'border-red-400' : 'border-slate-300'}`}
                                            />
                                            {scheduleErrors.phone && <p className="text-red-500 text-xs mt-1">{scheduleErrors.phone}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Dealership <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Dealership name"
                                                value={scheduleForm.dealership}
                                                onChange={e => setScheduleForm(f => ({ ...f, dealership: e.target.value }))}
                                                className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.dealership ? 'border-red-400' : 'border-slate-300'}`}
                                            />
                                            {scheduleErrors.dealership && <p className="text-red-500 text-xs mt-1">{scheduleErrors.dealership}</p>}
                                        </div>
                                    </div>
                                    {/* Row 3: Vehicle + VIN */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Year Make Model"
                                                value={scheduleForm.vehicle}
                                                onChange={e => setScheduleForm(f => ({ ...f, vehicle: e.target.value }))}
                                                className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.vehicle ? 'border-red-400' : 'border-slate-300'}`}
                                            />
                                            {scheduleErrors.vehicle && <p className="text-red-500 text-xs mt-1">{scheduleErrors.vehicle}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">VIN <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="VIN number"
                                                value={scheduleForm.vin}
                                                onChange={e => setScheduleForm(f => ({ ...f, vin: e.target.value }))}
                                                className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.vin ? 'border-red-400' : 'border-slate-300'}`}
                                            />
                                            {scheduleErrors.vin && <p className="text-red-500 text-xs mt-1">{scheduleErrors.vin}</p>}
                                        </div>
                                    </div>
                                    {/* Service Type */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Service Type <span className="text-red-500">*</span></label>
                                        <select
                                            value={scheduleForm.serviceType}
                                            onChange={e => setScheduleForm(f => ({ ...f, serviceType: e.target.value }))}
                                            className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.serviceType ? 'border-red-400' : 'border-slate-300'} ${!scheduleForm.serviceType ? 'text-slate-400' : 'text-slate-900'}`}
                                        >
                                            <option value="" disabled>Select service type...</option>
                                            <option value="Oil Change">Oil Change</option>
                                            <option value="Tire Rotation / Alignment">Tire Rotation / Alignment</option>
                                            <option value="Brake Service">Brake Service</option>
                                            <option value="Diagnostic / Check Engine">Diagnostic / Check Engine</option>
                                            <option value="Multi-Point Inspection">Multi-Point Inspection</option>
                                            <option value="Transmission Service">Transmission Service</option>
                                            <option value="AC / Heating Service">AC / Heating Service</option>
                                            <option value="General Repair">General Repair</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {scheduleErrors.serviceType && <p className="text-red-500 text-xs mt-1">{scheduleErrors.serviceType}</p>}
                                    </div>
                                    {/* Row 4: Preferred Date + Preferred Time */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                value={scheduleForm.preferredDate}
                                                onChange={e => setScheduleForm(f => ({ ...f, preferredDate: e.target.value }))}
                                                className={`w-full h-10 rounded-lg border px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent ${scheduleErrors.preferredDate ? 'border-red-400' : 'border-slate-300'}`}
                                            />
                                            {scheduleErrors.preferredDate && <p className="text-red-500 text-xs mt-1">{scheduleErrors.preferredDate}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred Time</label>
                                            <input
                                                type="time"
                                                value={scheduleForm.preferredTime}
                                                onChange={e => setScheduleForm(f => ({ ...f, preferredTime: e.target.value }))}
                                                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    {/* Additional Notes */}
                                    <div className="mb-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Notes</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Describe any concerns or additional requests..."
                                            value={scheduleForm.additionalNotes}
                                            onChange={e => setScheduleForm(f => ({ ...f, additionalNotes: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2332] focus:border-transparent resize-none"
                                        />
                                    </div>
                                    {scheduleErrors.submit && (
                                        <p className="text-red-500 text-xs mt-2">{scheduleErrors.submit}</p>
                                    )}
                                </div>
                                {/* Footer Buttons */}
                                <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
                                    <button
                                        onClick={closeScheduleModal}
                                        disabled={scheduleSubmitting}
                                        className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleScheduleSubmit}
                                        disabled={scheduleSubmitting}
                                        className="px-5 py-2.5 rounded-lg bg-[#8B2332] hover:bg-[#a12d3e] text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {scheduleSubmitting && (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        Submit Request
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Email Compose Modal */}
            {showEmailCompose && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-2 sm:p-4" onClick={closeEmailCompose}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 sm:px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-white" />
                                <h2 className="text-base sm:text-lg font-bold text-white">New Message</h2>
                            </div>
                            <button onClick={closeEmailCompose} className="text-white/80 hover:text-white p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {composeSent ? (
                            <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Email Sent!</h3>
                                <p className="text-slate-500 text-sm mb-6">Your message has been sent to {composeEmail.to}</p>
                                <button onClick={closeEmailCompose} className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors">
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div className="p-5 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                                    <input
                                        type="email"
                                        value={composeEmail.to}
                                        readOnly
                                        className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-50 text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Enter subject..."
                                        value={composeEmail.subject}
                                        onChange={e => setComposeEmail(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Type your message..."
                                        value={composeEmail.body}
                                        onChange={e => setComposeEmail(prev => ({ ...prev, body: e.target.value }))}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={closeEmailCompose} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={composeSending || !composeEmail.subject.trim()}
                                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                    >
                                        {composeSending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        <Send className="w-4 h-4" />
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Appraisal Detail Modal */}
            {selectedAppraisal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={closeAppraisalModal}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#1B3A5F] to-[#2d5278] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base sm:text-xl font-bold text-white truncate">
                                    {selectedAppraisal.vehicle.year} {selectedAppraisal.vehicle.make} {selectedAppraisal.vehicle.model}
                                </h2>
                                <p className="text-blue-200 text-xs sm:text-sm truncate">{selectedAppraisal.vehicle.trim || ''}</p>
                            </div>
                            <button onClick={closeAppraisalModal} className="text-white/80 hover:text-white p-1 sm:p-2 flex-shrink-0 ml-2">
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            {/* VIN & Mileage */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-slate-500">VIN</p>
                                    <p className="font-mono text-slate-900 text-xs sm:text-base truncate">{selectedAppraisal.vin}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm text-slate-500">Mileage</p>
                                    <p className="font-semibold text-slate-900 text-sm sm:text-base">{selectedAppraisal.vehicle.mileage?.toLocaleString() || '—'} mi</p>
                                </div>
                            </div>
                            
                            {/* Valuation */}
                            <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Vehicle Valuation</h3>
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                                <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center border border-emerald-200">
                                    <p className="text-[10px] sm:text-sm text-emerald-700 mb-0.5 sm:mb-1">Wholesale</p>
                                    <p className="text-sm sm:text-2xl font-bold text-emerald-600">{formatCurrency(selectedAppraisal.valuation.wholesale)}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center border border-blue-200">
                                    <p className="text-[10px] sm:text-sm text-blue-700 mb-0.5 sm:mb-1">Retail</p>
                                    <p className="text-sm sm:text-2xl font-bold text-blue-600">{formatCurrency(selectedAppraisal.valuation.retail)}</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center border border-amber-200">
                                    <p className="text-[10px] sm:text-sm text-amber-700 mb-0.5 sm:mb-1">Trade-In</p>
                                    <p className="text-sm sm:text-2xl font-bold text-amber-600">{formatCurrency(selectedAppraisal.valuation.tradeIn)}</p>
                                </div>
                            </div>
                            
                            {/* Date */}
                            <div className="text-xs sm:text-sm text-slate-500">
                                Appraisal Date: {formatDate(selectedAppraisal.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
