"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, DollarSign, TrendingUp, CircleCheckBig } from "lucide-react";

const SMARTSCAN_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695cac8c2981bc8a1da18bbf/564c8464e_Screenshot2026-01-12at100513AM.png";
const VEHICLE_IMAGE = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=800&fit=crop";

export default function VehicleAppraisalPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Hero */}
            <div className="relative bg-gradient-to-br from-[#1B3A5F] via-[#2d5278] to-[#8B2332] overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)",
                        }}
                    />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-24">
                    {/* Top bar: logo + back button */}
                    <div className="flex items-center justify-between mb-8">
                        <img src={SMARTSCAN_LOGO} alt="VinTraxx SmartScan" className="h-12 w-auto" />
                        <Link href="/">
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-9 px-4 py-2 bg-white text-[#1B3A5F] hover:bg-blue-50 gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Home
                            </button>
                        </Link>
                    </div>

                    {/* Hero grid */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center rounded-md font-semibold bg-white/20 text-white border-0 mb-4 text-sm px-4 py-1">
                                Powered by AI &amp; Live Market Data
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                                SMART APPRAISALS WITH REAL-TIME ACCURACY
                            </h1>
                            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                                Make confident buying decisions with AI-powered valuations and instant market insights.
                            </p>
                            <div className="flex gap-4">
                                <a href="mailto:admin@vintraxx.com">
                                    <button className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors shadow h-10 rounded-md bg-white text-[#1B3A5F] hover:bg-blue-50 gap-2 text-lg px-8">
                                        Learn More <ChevronRight className="w-5 h-5" />
                                    </button>
                                </a>
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors shadow h-10 rounded-md bg-white text-[#1B3A5F] hover:bg-blue-50 text-lg px-8">
                                    See Video
                                </button>
                            </div>
                        </div>

                        {/* Vehicle image with floating card */}
                        <div className="relative">
                            <img
                                src={VEHICLE_IMAGE}
                                alt="Vehicle Appraisal"
                                className="rounded-2xl w-full shadow-2xl"
                            />
                            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-2xl max-w-xs">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Estimated Value</p>
                                        <p className="text-2xl font-bold text-slate-900">$24,500</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-emerald-600">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>+$1,200 above book value</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                {/* Stats section */}
                <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 mb-20">
                    <h2 className="text-3xl font-bold text-center text-[#1B3A5F] mb-12">
                        VinTraxx SmartScan Dealers Experience:
                    </h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-8 h-8 text-[#1B3A5F]" />
                            </div>
                            <p className="text-5xl font-bold text-[#1B3A5F] mb-2">25%</p>
                            <p className="text-lg text-slate-600">Increase in Appraisals</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-5xl font-bold text-emerald-600 mb-2">$850</p>
                            <p className="text-lg text-slate-600">More Profit Per Trade</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CircleCheckBig className="w-8 h-8 text-[#8B2332]" />
                            </div>
                            <p className="text-5xl font-bold text-[#8B2332] mb-2">65%+</p>
                            <p className="text-lg text-slate-600">Customer Conversion</p>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center text-[#1B3A5F] mb-12">Vehicle Appraisal FAQs</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "What is vehicle appraisal software and how does it work?",
                                a: "Vehicle appraisal software helps dealerships quickly and accurately determine a vehicle's worth for trade-in, wholesale, or retail. It aggregates real-time market data including recent diagnostics, local retail listings, and historical pricing to calculate fair market value with data-backed precision.",
                            },
                            {
                                q: "How does VinTraxx use market data to determine vehicle value?",
                                a: "VinTraxx SmartScan combines live diagnostic data from OBD-II scans with extensive market analysis to show exactly what vehicles are selling for right now. It analyzes condition factors, recon costs, and local demand trends to pinpoint accurate market values for smarter buy/sell decisions.",
                            },
                            {
                                q: "What factors determine a used vehicle's trade-in value?",
                                a: "A vehicle's trade-in value depends on mechanical condition, diagnostic health scores, mileage, market demand, and history. Vehicles with clean diagnostic scans, lower mileage, and no major issues typically command higher offers. Regional demand and seasonal trends also influence final valuations.",
                            },
                            {
                                q: "What advantages does VinTraxx provide over traditional tools?",
                                a: "Traditional tools rely on static book values or delayed data. VinTraxx delivers live, diagnostic-verified valuations with OBD-II scan integration, AI-powered condition analysis, and automated damage detection. Dealers get instant recon cost estimates, condition insights, and profit projections all in one platform.",
                            },
                        ].map(({ q, a }) => (
                            <div key={q} className="rounded-xl shadow bg-white p-6 border-2 border-slate-200">
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{q}</h3>
                                <p className="text-slate-600 leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="rounded-xl shadow bg-gradient-to-r from-[#1B3A5F] to-[#2d5278] p-12 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Appraisal Process?</h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of dealers using VinTraxx to improve gross profits through every stage of a vehicle's lifecycle.
                    </p>
                    <a href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_demo@thread.v2/0?context=%7B%22Tid%22%3A%22vintraxx-demo%22%2C%22Oid%22%3A%22demo-user%22%7D" target="_blank" rel="noopener noreferrer">
                        <button className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors shadow h-10 rounded-md bg-white text-[#1B3A5F] hover:bg-blue-50 gap-2 text-lg px-8">
                            Schedule a Demo <ChevronRight className="w-5 h-5" />
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
}
