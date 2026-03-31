"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Eye, Trash2, Car, Calendar, User, X, ChevronRight } from "lucide-react";
import { DealerNav } from "@/components/shared-assets/navigation/dealer-nav";

const API_BASE = "https://api.vintraxx.com/api/v1";

interface InspectionItem {
    id: string;
    vehicleInfo: string;
    vin: string;
    mileage: string;
    color: string;
    inspector: string;
    date: string;
    createdAt: string;
    ratings: Record<string, 'good' | 'fair' | 'poor' | null>;
    damageMarks: Array<{ zone: string; severity: 'major' | 'moderate' | 'minor' }>;
}

interface InspectionFormData {
    vehicleInfo: string;
    vin: string;
    mileage: string;
    color: string;
    inspector: string;
    date: string;
    ratings: Record<string, 'good' | 'fair' | 'poor' | null>;
    damageMarks: Array<{ zone: string; severity: 'major' | 'moderate' | 'minor' }>;
}

const INSPECTION_CATEGORIES = {
    tiresAndBrakes: {
        title: "Tires & Brakes",
        items: ["Front Left Tire", "Front Right Tire", "Rear Left Tire", "Rear Right Tire", "Spare Tire", "Front Brakes", "Rear Brakes", "Brake Fluid"]
    },
    exteriorBody: {
        title: "Exterior Body",
        items: ["Hood", "Front Bumper", "Rear Bumper", "Driver Door", "Pass. Door", "Rear Driver Door", "Rear Pass. Door", "Trunk / Tailgate", "Roof", "Paint / Finish"]
    },
    underHood: {
        title: "Under Hood",
        items: ["Engine Oil", "Coolant", "Power Steering", "Trans. Fluid", "Battery", "Belts & Hoses", "Air Filter", "Exhaust"]
    },
    lights: {
        title: "Lights",
        items: ["Headlights", "Tail Lights", "Turn Signals", "Brake Lights", "Reverse Lights", "Hazards"]
    },
    interiorCheck: {
        title: "Interior Check",
        items: ["Dashboard", "Seats / Upholstery", "Carpets / Mats", "Headliner", "A/C & Heat", "Radio / Nav", "Power Windows", "Door Locks", "Seat Belts", "Horn"]
    }
};

const DAMAGE_ZONES = [
    { id: "hood", title: "Hood", style: { left: '38%', top: '8%', width: '24%', height: '14%' } },
    { id: "roof", title: "Roof", style: { left: '35%', top: '25%', width: '30%', height: '22%' } },
    { id: "trunk", title: "Trunk", style: { left: '38%', top: '74%', width: '24%', height: '12%' } },
    { id: "driverFront", title: "Driver Front", style: { left: '12%', top: '14%', width: '22%', height: '12%' } },
    { id: "driverRear", title: "Driver Rear", style: { left: '12%', top: '60%', width: '22%', height: '12%' } },
    { id: "passFront", title: "Pass. Front", style: { left: '66%', top: '14%', width: '22%', height: '12%' } },
    { id: "passRear", title: "Pass. Rear", style: { left: '66%', top: '60%', width: '22%', height: '12%' } },
    { id: "frontBumper", title: "Front Bumper", style: { left: '30%', top: '2%', width: '40%', height: '6%' } },
    { id: "rearBumper", title: "Rear Bumper", style: { left: '30%', top: '88%', width: '40%', height: '6%' } },
];

const getDefaultRatings = (): Record<string, 'good' | 'fair' | 'poor' | null> => {
    const ratings: Record<string, 'good' | 'fair' | 'poor' | null> = {};
    Object.values(INSPECTION_CATEGORIES).forEach(category => {
        category.items.forEach(item => {
            ratings[item] = 'good';
        });
    });
    return ratings;
};

interface DealerUser {
    id: string;
    email: string;
    logoUrl?: string;
    pricePerLaborHour?: number;
    createdAt?: string;
}

export default function MultiPointInspectionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [inspections, setInspections] = useState<InspectionItem[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedDamageSeverity, setSelectedDamageSeverity] = useState<'major' | 'moderate' | 'minor'>('major');
    const [dealerUser, setDealerUser] = useState<DealerUser | null>(null);
    
    const [formData, setFormData] = useState<InspectionFormData>(() => ({
        vehicleInfo: "",
        vin: "",
        mileage: "",
        color: "",
        inspector: "",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ratings: getDefaultRatings(),
        damageMarks: []
    }));
    
    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchInspections = useCallback(async (token: string) => {
        try {
            const res = await fetch(`${API_BASE}/inspection/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("dealer_token");
                router.push("/login");
                return;
            }
            
            const data = await res.json();
            if (data.success) {
                setInspections(data.inspections || []);
            }
        } catch (err) {
            console.error("Failed to fetch inspections:", err);
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
        
        // Load dealer user data
        const storedUser = localStorage.getItem("dealer_user");
        if (storedUser) {
            try {
                setDealerUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse dealer user:", e);
            }
        }
        
        fetchInspections(token);
    }, [router, fetchInspections]);

    const resetForm = () => {
        setFormData({
            vehicleInfo: "",
            vin: "",
            mileage: "",
            color: "",
            inspector: "",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            ratings: getDefaultRatings(),
            damageMarks: []
        });
    };

    const handleOpenAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setSelectedInspection(null);
        resetForm();
    };

    const handleRatingClick = (itemName: string, rating: 'good' | 'fair' | 'poor') => {
        setFormData(prev => ({
            ...prev,
            ratings: {
                ...prev.ratings,
                [itemName]: prev.ratings[itemName] === rating ? null : rating
            }
        }));
    };

    const handleDamageZoneClick = (zoneId: string) => {
        setFormData(prev => {
            const existingIndex = prev.damageMarks.findIndex(d => d.zone === zoneId);
            if (existingIndex >= 0) {
                // Remove if clicking same zone
                return {
                    ...prev,
                    damageMarks: prev.damageMarks.filter((_, i) => i !== existingIndex)
                };
            } else {
                // Add new damage mark
                return {
                    ...prev,
                    damageMarks: [...prev.damageMarks, { zone: zoneId, severity: selectedDamageSeverity }]
                };
            }
        });
    };

    const getDamageColor = (severity: 'major' | 'moderate' | 'minor') => {
        switch (severity) {
            case 'major': return 'rgba(239, 68, 68, 0.6)';
            case 'moderate': return 'rgba(249, 115, 22, 0.6)';
            case 'minor': return 'rgba(250, 204, 21, 0.6)';
        }
    };

    const handleSaveInspection = async () => {
        const token = localStorage.getItem("dealer_token");
        if (!token) return;

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/inspection/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            if (data.success) {
                setInspections(prev => [data.inspection, ...prev]);
                handleCloseModal();
            } else {
                alert(data.error || 'Failed to save inspection');
            }
        } catch (err) {
            console.error("Failed to save inspection:", err);
            alert('Failed to save inspection');
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (id: string) => {
        setDeleteTargetId(id);
        setDeleteModalOpen(true);
    };
    
    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteTargetId(null);
    };

    const handleDeleteInspection = async () => {
        if (!deleteTargetId) return;
        
        const token = localStorage.getItem("dealer_token");
        if (!token) return;

        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/inspection/${deleteTargetId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = await res.json();
            if (data.success) {
                setInspections(prev => prev.filter(i => i.id !== deleteTargetId));
            }
        } catch (err) {
            console.error("Failed to delete inspection:", err);
        } finally {
            setDeleting(false);
            closeDeleteModal();
        }
    };

    const getRatingButtonClass = (itemName: string, rating: 'good' | 'fair' | 'poor') => {
        const currentRating = selectedInspection ? selectedInspection.ratings[itemName] : formData.ratings[itemName];
        const baseClass = "w-5 h-5 sm:w-7 sm:h-7 rounded border-2 transition-all";
        
        if (currentRating === rating) {
            switch (rating) {
                case 'good': return `${baseClass} bg-green-500 border-green-600`;
                case 'fair': return `${baseClass} bg-yellow-400 border-yellow-500`;
                case 'poor': return `${baseClass} bg-red-500 border-red-600`;
            }
        }
        return `${baseClass} border-slate-300 bg-white hover:border-slate-400`;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400">Loading inspections…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            <DealerNav 
                dealerLogo={dealerUser?.logoUrl}
                userEmail={dealerUser?.email}
                userId={dealerUser?.id}
                pricePerLaborHour={dealerUser?.pricePerLaborHour}
                createdAt={dealerUser?.createdAt}
            />
            
            <main className="pt-16 sm:pt-20 pb-8 sm:pb-12">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Clipboard SVG Icon */}
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B3A5F]">Multi-Point Inspection</h1>
                                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Manage vehicle inspection reports</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                href="/VinTraxxSmartScanDashboard"
                                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-[#8B2332] rounded-lg hover:bg-[#a12d3e] transition-colors shadow-lg"
                            >
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden xs:inline">Go </span>Back
                            </Link>
                            <button
                                onClick={handleOpenAddModal}
                                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-[#1B3A5F] text-white rounded-lg hover:bg-[#2d5278] transition-colors shadow-lg"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Add </span>Inspection<span className="hidden sm:inline"> Item</span>
                            </button>
                        </div>
                    </div>

                    {/* Inspection List */}
                    {inspections.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
                            <Car className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">No Inspections Yet</h3>
                            <p className="text-slate-500 text-sm sm:text-base">Create your first multi-point inspection report</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:gap-4">
                            {inspections.map((inspection) => (
                                <div
                                    key={inspection.id}
                                    className="bg-white rounded-xl shadow-lg p-3 sm:p-5 hover:shadow-xl transition-shadow cursor-pointer"
                                    onClick={() => setSelectedInspection(inspection)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{inspection.vehicleInfo || 'Unknown Vehicle'}</h3>
                                                <p className="text-xs sm:text-sm text-slate-500 font-mono truncate">{inspection.vin || 'No VIN'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 ml-[52px] sm:ml-0">
                                            <div className="text-left sm:text-right">
                                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                                                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    <span className="truncate max-w-[100px] sm:max-w-none">{inspection.inspector || 'Unknown'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    {inspection.date}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteModal(inspection.id);
                                                    }}
                                                    className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Inspection Modal */}
            {(showAddModal || selectedInspection) && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                    <div className="max-w-6xl w-full mx-auto mt-2 sm:mt-4 mb-4 sm:mb-8">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Header */}
                            <div className="bg-[#1B3A5F] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                                <div className="w-6"></div>
                                <div className="text-center flex-1">
                                    <h1 className="text-white font-black text-lg sm:text-2xl tracking-wider sm:tracking-widest uppercase">Car Inspection</h1>
                                    <div className="bg-[#8B2332] text-white text-xs sm:text-sm font-bold tracking-widest px-3 sm:px-4 py-0.5 rounded mt-1 inline-block">FORM</div>
                                </div>
                                <button 
                                    onClick={handleCloseModal}
                                    className="text-white/60 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>

                            {/* Vehicle Info */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3">
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">YEAR / MAKE / MODEL</p>
                                    <input
                                        className="font-semibold text-slate-800 text-xs sm:text-sm w-full bg-transparent outline-none placeholder:text-slate-300"
                                        placeholder="2023 Ford F-150"
                                        value={selectedInspection?.vehicleInfo || formData.vehicleInfo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleInfo: e.target.value }))}
                                        disabled={!!selectedInspection}
                                    />
                                </div>
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">VIN</p>
                                    <input
                                        className="font-semibold text-slate-800 text-xs sm:text-sm w-full bg-transparent outline-none placeholder:text-slate-300"
                                        placeholder="1FTFW1E53NFA19284"
                                        value={selectedInspection?.vin || formData.vin}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value }))}
                                        disabled={!!selectedInspection}
                                    />
                                </div>
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">MILEAGE</p>
                                    <input
                                        className="font-semibold text-slate-800 text-xs sm:text-sm w-full bg-transparent outline-none placeholder:text-slate-300"
                                        placeholder="18,400 mi"
                                        value={selectedInspection?.mileage || formData.mileage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                                        disabled={!!selectedInspection}
                                    />
                                </div>
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">COLOR</p>
                                    <input
                                        className="font-semibold text-slate-800 text-xs sm:text-sm w-full bg-transparent outline-none placeholder:text-slate-300"
                                        placeholder="Stone Gray"
                                        value={selectedInspection?.color || formData.color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                        disabled={!!selectedInspection}
                                    />
                                </div>
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">INSPECTOR</p>
                                    <input
                                        className="font-semibold text-slate-800 text-xs sm:text-sm w-full bg-transparent outline-none placeholder:text-slate-300"
                                        placeholder="J. Martinez"
                                        value={selectedInspection?.inspector || formData.inspector}
                                        onChange={(e) => setFormData(prev => ({ ...prev, inspector: e.target.value }))}
                                        disabled={!!selectedInspection}
                                    />
                                </div>
                                <div className="border-b border-slate-100 pb-2">
                                    <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">DATE</p>
                                    <input
                                        className="font-semibold text-slate-800 text-xs sm:text-sm w-full bg-transparent outline-none placeholder:text-slate-300"
                                        placeholder="Mar 31, 2026"
                                        value={selectedInspection?.date || formData.date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                        disabled={!!selectedInspection}
                                    />
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="px-4 sm:px-6 py-2 flex justify-center sm:justify-end gap-3 sm:gap-4 border-b border-slate-100">
                                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-600">
                                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full inline-block bg-green-500"></span>
                                    Good
                                </div>
                                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-600">
                                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full inline-block bg-yellow-400"></span>
                                    Fair
                                </div>
                                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-600">
                                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full inline-block bg-red-500"></span>
                                    Poor
                                </div>
                            </div>

                            {/* Inspection Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x divide-slate-200">
                                {/* Column 1: Tires & Brakes, Exterior Body */}
                                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border-b md:border-b-0 border-slate-200">
                                    {/* Tires & Brakes */}
                                    <div>
                                        <div className="bg-[#1B3A5F] text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded mb-2 uppercase tracking-wide">
                                            {INSPECTION_CATEGORIES.tiresAndBrakes.title}
                                        </div>
                                        {INSPECTION_CATEGORIES.tiresAndBrakes.items.map(item => (
                                            <div key={item} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-xs sm:text-sm text-slate-700">{item}</span>
                                                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                                    <button
                                                        className={getRatingButtonClass(item, 'good')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'good')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'fair')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'fair')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'poor')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'poor')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Exterior Body */}
                                    <div>
                                        <div className="bg-[#1B3A5F] text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded mb-2 uppercase tracking-wide">
                                            {INSPECTION_CATEGORIES.exteriorBody.title}
                                        </div>
                                        {INSPECTION_CATEGORIES.exteriorBody.items.map(item => (
                                            <div key={item} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-xs sm:text-sm text-slate-700">{item}</span>
                                                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                                    <button
                                                        className={getRatingButtonClass(item, 'good')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'good')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'fair')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'fair')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'poor')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'poor')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Column 2: Body Damage Map, Under Hood */}
                                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border-b md:border-b-0 border-slate-200">
                                    {/* Body Damage Map */}
                                    <div>
                                        <div className="bg-[#8B2332] text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded mb-2 uppercase tracking-wide">
                                            Body Damage Map
                                        </div>
                                        <div>
                                            <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 justify-center flex-wrap">
                                                <button
                                                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-bold border-2 transition-all ${
                                                        selectedDamageSeverity === 'major' 
                                                            ? 'text-slate-900 border-slate-500 bg-slate-200' 
                                                            : 'text-slate-900 border-slate-300 bg-white hover:border-slate-400'
                                                    }`}
                                                    onClick={() => setSelectedDamageSeverity('major')}
                                                >
                                                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full inline-block flex-shrink-0 bg-red-500"></span>
                                                    <span className="text-slate-800 font-semibold">Major</span>
                                                </button>
                                                <button
                                                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-bold border-2 transition-all ${
                                                        selectedDamageSeverity === 'moderate' 
                                                            ? 'text-slate-900 border-slate-500 bg-slate-200' 
                                                            : 'text-slate-900 border-slate-300 bg-white hover:border-slate-400'
                                                    }`}
                                                    onClick={() => setSelectedDamageSeverity('moderate')}
                                                >
                                                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full inline-block flex-shrink-0 bg-orange-500"></span>
                                                    <span className="text-slate-800 font-semibold">Moderate</span>
                                                </button>
                                                <button
                                                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-bold border-2 transition-all ${
                                                        selectedDamageSeverity === 'minor' 
                                                            ? 'text-slate-900 border-slate-500 bg-slate-200' 
                                                            : 'text-slate-900 border-slate-300 bg-white hover:border-slate-400'
                                                    }`}
                                                    onClick={() => setSelectedDamageSeverity('minor')}
                                                >
                                                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full inline-block flex-shrink-0 bg-yellow-400"></span>
                                                    <span className="text-slate-800 font-semibold">Minor</span>
                                                </button>
                                            </div>
                                            <div className="relative mx-auto w-[140px] h-[220px] sm:w-[180px] sm:h-[280px]">
                                                <svg viewBox="0 0 100 160" className="w-full h-full absolute top-0 left-0">
                                                    <rect x="20" y="10" width="60" height="140" rx="10" fill="#dde3ea" stroke="#b0bec5" strokeWidth="1.5" />
                                                    <rect x="26" y="25" width="48" height="22" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
                                                    <rect x="26" y="105" width="48" height="20" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
                                                    <rect x="5" y="22" width="14" height="20" rx="5" fill="#64748b" />
                                                    <rect x="81" y="22" width="14" height="20" rx="5" fill="#64748b" />
                                                    <rect x="5" y="112" width="14" height="20" rx="5" fill="#64748b" />
                                                    <rect x="81" y="112" width="14" height="20" rx="5" fill="#64748b" />
                                                    <line x1="20" y1="75" x2="80" y2="75" stroke="#b0bec5" strokeWidth="1" strokeDasharray="3,2" />
                                                </svg>
                                                {DAMAGE_ZONES.map(zone => {
                                                    const damage = (selectedInspection?.damageMarks || formData.damageMarks).find(d => d.zone === zone.id);
                                                    return (
                                                        <button
                                                            key={zone.id}
                                                            className="absolute rounded transition-all hover:bg-blue-200/50 hover:border-blue-400"
                                                            title={zone.title}
                                                            style={{
                                                                ...zone.style,
                                                                background: damage ? getDamageColor(damage.severity) : 'transparent',
                                                                border: damage ? '2px solid rgba(0,0,0,0.3)' : '1.5px dashed rgba(100,116,139,0.5)'
                                                            }}
                                                            onClick={() => !selectedInspection && handleDamageZoneClick(zone.id)}
                                                            disabled={!!selectedInspection}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-2 sm:mt-3 space-y-1">
                                                <p className="text-[10px] sm:text-xs text-slate-400 text-center">Click zones above to mark damage</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Under Hood */}
                                    <div>
                                        <div className="bg-[#1B3A5F] text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded mb-2 uppercase tracking-wide">
                                            {INSPECTION_CATEGORIES.underHood.title}
                                        </div>
                                        {INSPECTION_CATEGORIES.underHood.items.map(item => (
                                            <div key={item} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-xs sm:text-sm text-slate-700">{item}</span>
                                                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                                    <button
                                                        className={getRatingButtonClass(item, 'good')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'good')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'fair')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'fair')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'poor')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'poor')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Column 3: Lights, Interior Check */}
                                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                    {/* Lights */}
                                    <div>
                                        <div className="bg-[#1B3A5F] text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded mb-2 uppercase tracking-wide">
                                            {INSPECTION_CATEGORIES.lights.title}
                                        </div>
                                        {INSPECTION_CATEGORIES.lights.items.map(item => (
                                            <div key={item} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-xs sm:text-sm text-slate-700">{item}</span>
                                                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                                    <button
                                                        className={getRatingButtonClass(item, 'good')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'good')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'fair')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'fair')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'poor')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'poor')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Interior Check */}
                                    <div>
                                        <div className="bg-[#1B3A5F] text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded mb-2 uppercase tracking-wide">
                                            {INSPECTION_CATEGORIES.interiorCheck.title}
                                        </div>
                                        {INSPECTION_CATEGORIES.interiorCheck.items.map(item => (
                                            <div key={item} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-xs sm:text-sm text-slate-700">{item}</span>
                                                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                                    <button
                                                        className={getRatingButtonClass(item, 'good')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'good')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'fair')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'fair')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                    <button
                                                        className={getRatingButtonClass(item, 'poor')}
                                                        onClick={() => !selectedInspection && handleRatingClick(item, 'poor')}
                                                        disabled={!!selectedInspection}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                                <p className="text-[10px] sm:text-xs text-slate-400 text-center sm:text-left">VinTraxx SmartScan • Car Inspection Form • {formData.date}</p>
                                {!selectedInspection && (
                                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={handleCloseModal}
                                            className="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveInspection}
                                            disabled={saving}
                                            className="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white bg-[#1B3A5F] rounded-lg hover:bg-[#2d5278] transition-colors disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                )}
                                {selectedInspection && (
                                    <button
                                        onClick={handleCloseModal}
                                        className="w-full sm:w-auto px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white bg-[#1B3A5F] rounded-lg hover:bg-[#2d5278] transition-colors"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modern Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeDeleteModal}
                    />
                    <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 sm:px-6 py-6 sm:py-8 text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Delete Inspection</h2>
                            <p className="text-red-100 mt-1 sm:mt-2 text-xs sm:text-sm">This action cannot be undone</p>
                        </div>
                        
                        {/* Content */}
                        <div className="px-4 sm:px-6 py-4 sm:py-6">
                            <p className="text-slate-600 text-center leading-relaxed text-sm sm:text-base">
                                Are you sure you want to permanently delete this inspection record? 
                                All associated data including ratings and damage marks will be removed.
                            </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex gap-2 sm:gap-3">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteInspection}
                                disabled={deleting}
                                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
