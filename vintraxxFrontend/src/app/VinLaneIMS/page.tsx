"use client";

import { useState } from "react";
import { Bell, FileText, Eye, Sparkles, Plus, CircleCheckBig, Upload, Download, Search, ChevronDown, LayoutGrid, List, Car, Settings } from "lucide-react";

export default function VinLaneIMSPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All Status");

    const inventoryData = [
        { days: "0-30", count: 8, color: "bg-emerald-500" },
        { days: "31-45", count: 0, color: "bg-yellow-500" },
        { days: "46-60", count: 0, color: "bg-orange-500" },
        { days: "61-90", count: 0, color: "bg-orange-600" },
        { days: "90+", count: 14, color: "bg-red-500" },
    ];

    const valueData = [
        { range: "$0-10k", count: 8, percentage: 36.3636 },
        { range: "$10-15k", count: 5, percentage: 22.7273 },
        { range: "$15-20k", count: 1, percentage: 4.54545 },
        { range: "$20-25k", count: 1, percentage: 4.54545 },
        { range: "$25-35k", count: 4, percentage: 18.1818 },
        { range: "$35-50k", count: 2, percentage: 9.09091 },
        { range: "$50-75k", count: 1, percentage: 4.54545 },
        { range: "$75k+", count: 0, percentage: 0 },
    ];

    const vehicles = [
        {
            id: "697d498267a9385a1992aad6",
            year: "2022",
            make: "Toyota",
            model: "Camry",
            trim: "XSE",
            price: "$29,500",
            mileage: "18,200 mi",
            stock: "HP654321",
            status: "Frontline",
            image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop"
        },
        {
            id: "697d498267a9385a1992aadb",
            year: "2019",
            make: "Lexus",
            model: "ES 350",
            trim: "Luxury",
            price: "$36,900",
            mileage: "35,000 mi",
            stock: "K2567890",
            status: "Frontline",
            image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop"
        },
        // Add more vehicles as needed
    ];

    return (
        <div className="min-h-screen bg-white space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695cac8c2981bc8a1da18bbf/762620977_IMG_4708.jpg" 
                            alt="VinLane IMS" 
                            className="h-16 w-auto max-w-xs object-contain"
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">VinLane Dashboard</h1>
                    <div className="inline-flex items-center rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80 bg-[#8B2332] text-white font-mono text-sm font-semibold px-3 py-1">
                        DLR-MKTAJD2K-Q3BS
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 gap-2 bg-red-600 hover:bg-red-700 animate-bounce">
                        <Bell className="w-4 h-4 animate-bounce" />
                        Alerts
                    </button>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 gap-2 bg-orange-600 hover:bg-orange-700 animate-pulse">
                        <FileText className="w-4 h-4" />
                        Appraisal
                        <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground shadow hover:bg-primary/80 bg-red-500">
                            3
                        </div>
                    </button>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 bg-slate-700 hover:bg-slate-600 gap-2">
                        <Eye className="w-4 h-4" />
                        View Appraisals (2)
                    </button>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 bg-purple-600 hover:bg-purple-700 gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Insights
                    </button>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 bg-blue-600 hover:bg-blue-700 gap-2" type="button">
                        <Plus className="w-4 h-4" />
                        Add Vehicle
                    </button>
                    <a href="/InventoryQuality">
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <CircleCheckBig className="w-4 h-4" />
                            Quality Report
                        </button>
                    </a>
                </div>
                <p className="text-slate-600 text-sm text-center">Performance Manager Contact: john Canales 2812456367</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {/* Inventory Aging Card */}
                <div className="rounded-xl border text-card-foreground shadow bg-gradient-to-br from-[#1B3A5F] to-[#234A6F] border-[#1B3A5F]/50 p-6">
                    <h3 className="text-white text-sm font-medium mb-2">VinTraxx.iO Vehicles Inventory Aging</h3>
                    <p className="text-4xl font-bold text-white mb-4">102 days</p>
                    <div className="space-y-2 text-xs">
                        {inventoryData.map((item) => (
                            <div key={item.days} className="flex items-center justify-between">
                                <span className="text-white w-20">{item.days}</span>
                                <button className={`w-16 h-6 rounded flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${item.color}`}>
                                    <span className="text-white font-semibold">{item.count}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inventory Value Card */}
                <div className="rounded-xl border text-card-foreground shadow bg-gradient-to-br from-[#8B2332] to-[#6d1c27] border-[#8B2332]/50 p-6">
                    <h3 className="text-white text-sm font-medium mb-2">VinTraxx.iO Inventory Value</h3>
                    <p className="text-4xl font-bold text-white mb-4">$0.4M</p>
                    <div className="space-y-1.5 text-xs">
                        {valueData.map((item) => (
                            <div key={item.range} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-white w-16">{item.range}</span>
                                    <div className="h-1.5 bg-slate-700 rounded-full flex-1 overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 rounded-full transition-all" 
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-white font-medium ml-2 w-6 text-right">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vehicles Count Card */}
                <div className="rounded-xl border text-card-foreground shadow bg-gradient-to-br from-[#1B3A5F] to-[#234A6F] border-[#1B3A5F]/50 p-6">
                    <h3 className="text-white text-sm font-medium mb-2">VinTraxx.iO Vehicles</h3>
                    <p className="text-4xl font-bold text-white mb-4">22</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white">VTMAX Prime</span>
                            <span className="text-white font-medium">0</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white">VTMAX Value</span>
                                <span className="text-white font-medium">22</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: "100%" }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Inventory Value Card */}
                <div className="rounded-xl border text-card-foreground shadow bg-gradient-to-br from-[#8B2332] to-[#6d1c27] border-[#8B2332]/50 p-6">
                    <h3 className="text-white text-sm font-medium mb-2">Inventory Value</h3>
                    <p className="text-4xl font-bold text-white mb-4">$0.4M</p>
                    <div className="space-y-1.5 text-xs">
                        {valueData.map((item) => (
                            <div key={item.range} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-white w-16">{item.range}</span>
                                    <div className="h-1.5 bg-slate-700 rounded-full flex-1 overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 rounded-full transition-all" 
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-white font-medium ml-2 w-6 text-right">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Sales Card */}
                <div className="rounded-xl border text-card-foreground shadow bg-gradient-to-br from-[#1B3A5F] to-[#234A6F] border-[#1B3A5F]/50 p-6 cursor-pointer hover:opacity-90 transition-opacity">
                    <h3 className="text-white text-sm font-medium mb-2">Pending Sales</h3>
                    <p className="text-4xl font-bold text-white mb-4">0</p>
                    <p className="text-slate-500 text-sm">No pending sales</p>
                </div>
            </div>

            {/* Import/Export Buttons */}
            <div className="flex items-center gap-2">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
                    <Upload className="w-4 h-4" />
                    Import
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* Vehicle List */}
            <div className="rounded-xl border text-card-foreground shadow bg-slate-900/95 border-slate-700/50 p-4" id="vehicle-list">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            className="flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" 
                            placeholder="Search by VIN, stock, make, model..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="flex h-9 items-center justify-between whitespace-nowrap rounded-md border px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full sm:w-48 bg-slate-900 border-slate-700 text-white">
                        <span style={{ pointerEvents: "none" }}>All Status</span>
                        <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                    </button>
                    <div className="flex gap-2">
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow hover:bg-primary/90 h-9 w-9 bg-blue-600">
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 border-slate-700 text-slate-400">
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Vehicle Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="rounded-xl border text-card-foreground shadow bg-slate-800/70 border-slate-700/50 overflow-hidden relative">
                            <a href={`/VehicleDetails?id=${vehicle.id}`}>
                                <div className="aspect-[4/3] bg-slate-700 relative">
                                    <img src={vehicle.image} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2">
                                        <div className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border font-medium bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                            Frontline
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-white truncate">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                                    <p className="text-sm text-slate-400">{vehicle.trim}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-lg font-bold text-emerald-400">{vehicle.price}</p>
                                        <p className="text-sm text-white font-medium">{vehicle.mileage}</p>
                                    </div>
                                    <p className="text-xs text-white font-medium mt-2">Stock #{vehicle.stock}</p>
                                </div>
                            </a>
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent absolute bottom-2 right-2 h-8 w-8 text-slate-500 hover:text-slate-400">
                                <FileText className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Sections */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="rounded-xl shadow bg-[#1B3A5F] border-0 p-6 text-white">
                    <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                    <p className="text-blue-200 text-sm mb-4">Your dedicated account manager is available to assist with any application questions.</p>
                    <div className="flex gap-3">
                        <a href="tel:8324914917">
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-white text-[#1B3A5F] hover:bg-blue-50 gap-2">
                                <Search className="w-4 h-4" />
                                Call Us
                            </button>
                        </a>
                        <a href="mailto:capital@vintraxx.com">
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 border-white text-white hover:bg-white/10 gap-2">
                                <FileText className="w-4 h-4" />
                                Email
                            </button>
                        </a>
                    </div>
                </div>
                <div className="rounded-xl shadow bg-[#8B2332] border-0 p-6 text-white">
                    <h3 className="font-bold text-lg mb-2">Loan Programs</h3>
                    <p className="text-red-200 text-sm mb-4">$1,000–$25,000 · 24–72 month terms · Same-day funding available</p>
                    <a href="mailto:capital@vintraxx.com?subject=Learn More About Loan Programs">
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-white text-[#8B2332] hover:bg-red-50 gap-2">
                            Learn More <Plus className="w-4 h-4" />
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
}
