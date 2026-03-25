"use client";

import { useState } from "react";
import { Phone, ArrowRight, ChevronLeft, ChevronRight, Star, TriangleAlert, FileText, Plug, Car, TrendingUp, Users, BarChart3, CircleCheckBig } from "lucide-react";

const US_STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

const IMAGES = {
    logo: "/assets/images/b1bf5f282_IMG_4727.jpg",
    heroBackground: "/assets/images/b35396f95_generated_image.png",
    dealershipLot: "/assets/images/99cc269d7_generated_image.png",
    f150Truck: "/assets/images/185cccbae_generated_image.png",
    technicianObd: "/assets/images/3b1c7a26d_Screenshot2026-01-12at101442AM.png",
    serviceDrive: "/assets/images/0a06d0e31_generated_image.png",
    marketIntelligence: "/assets/images/8e28649d9_generated_image.png",
    customerOnline: "/assets/images/photo-1573496359142-b8d87734a5a2.jpg",
    vehicleSmall: "/assets/images/photo-1533473359331-0135ef1b58bf.jpg",
    auctionBackground: "/assets/images/photo-1486262715619-67b85e0b08d3.jpg",
};

const TopBar = () => (
    <div className="bg-gray-100 border-b border-gray-200 py-2 px-6 text-sm text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            SmartScan Support: 832-491-4917
        </div>
        <a href="#form" className="text-[#8B2F3E] font-medium hover:underline flex items-center gap-1">
            SmartScan Log-in <ArrowRight className="w-3 h-3" />
        </a>
    </div>
);

const Header = () => (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
                <img src={IMAGES.logo} alt="VinTraxx SmartScan" className="h-12 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
                <a href="#features" className="hover:text-[#8B2F3E] transition-colors">Solutions</a>
                <a href="#stats" className="hover:text-[#8B2F3E] transition-colors">Results</a>
                <a href="#testimonials" className="hover:text-[#8B2F3E] transition-colors">Reviews</a>
            </nav>
            <a href="#form">
                <button className="bg-[#8B2F3E] hover:bg-[#7A2837] text-white font-semibold px-6 h-9 rounded-md text-sm shadow transition-colors">
                    Get Demo
                </button>
            </a>
        </div>
    </header>
);

const HeroSection = () => (
    <section className="relative min-h-[620px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
            <img src={IMAGES.heroBackground} alt="Saleswoman showing customer VinTraxx SmartScan results on iPad" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e]/75 via-[#2B5278]/50 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
            <div className="max-w-xl">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                    Buy Smarter.<br />Profit More.
                </h1>
                <p className="text-lg text-white/85 mb-8 leading-relaxed">
                    SmartScan gives your team the power to appraise any vehicle in minutes — using <strong className="text-white">AI-driven valuations and live market data</strong> so you always pay the right price and maximize your margins.
                </p>
                <a href="#form">
                    <button className="bg-[#8B2F3E] hover:bg-[#7A2837] text-white text-lg px-8 py-2.5 font-semibold rounded-md shadow transition-colors inline-flex items-center gap-2">
                        Get your demo
                    </button>
                </a>
            </div>
        </div>
    </section>
);

const StatsSection = () => (
    <section id="stats" className="py-16 px-6 bg-[#1a2744]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">98%</div>
                <div className="text-[#8B2F3E] font-bold text-sm uppercase tracking-wide mb-1">appraisal accuracy</div>
                <div className="text-white/50 text-xs">powered by AI &amp; live market data</div>
            </div>
            <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">$850</div>
                <div className="text-[#8B2F3E] font-bold text-sm uppercase tracking-wide mb-1">avg. recon cost savings</div>
                <div className="text-white/50 text-xs">per vehicle with OBD-II diagnostics</div>
            </div>
            <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">+92%</div>
                <div className="text-[#8B2F3E] font-bold text-sm uppercase tracking-wide mb-1">more profit per VIN</div>
                <div className="text-white/50 text-xs">acquired through service drive</div>
            </div>
            <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">Up to $3,100</div>
                <div className="text-[#8B2F3E] font-bold text-sm uppercase tracking-wide mb-1">more profit per VIN</div>
                <div className="text-white/50 text-xs">with real-time market pricing</div>
            </div>
        </div>
    </section>
);

const FeaturesSection = () => (
    <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Everything you need in one appraisal</h2>
                <p className="text-lg text-gray-500">From instant offer to profitable exit — SmartScan covers the full lifecycle.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                {/* Feature Card 1 - Transparent Offers */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                    <div className="relative h-72 overflow-hidden">
                        <img src={IMAGES.dealershipLot} alt="Car dealership lot" className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-xl p-4 w-52">
                            <div className="text-xs text-gray-500 mb-1">Your Instant Offer</div>
                            <div className="text-2xl font-bold text-[#8B2F3E] mb-3">$33,500</div>
                            <img src={IMAGES.f150Truck} alt="2023 Ford F-150 King Ranch" className="w-full h-16 object-cover rounded-lg mb-3" />
                            <div className="text-xs font-semibold text-gray-700 mb-2">2023 Ford F-150 King Ranch</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span className="text-gray-500">Options</span><span className="text-green-600 font-medium">+$450</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Mileage</span><span className="text-red-500 font-medium">-$375</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">ABS Fault</span><span className="text-red-500 font-medium">-$1,975</span></div>
                                <div className="flex justify-between border-t pt-1 mt-1"><span className="font-semibold text-gray-700">Your Offer</span><span className="font-bold text-gray-900">$33,500</span></div>
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-[200px]">
                            <TriangleAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <div>
                                <div className="text-xs font-bold text-gray-800">ABS Fault</div>
                                <div className="text-xs text-gray-500">Reverse Gear Signal</div>
                                <div className="text-xs font-semibold text-red-500">-$1,975</div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Transparent, defensible offers</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">Generate precise appraisals in minutes with OBD-II diagnostics automatically factored in — giving you offers you can <strong className="text-gray-700">stand behind every time.</strong></p>
                    </div>
                </div>

                {/* Feature Card 2 - Three Offers */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                    <div className="bg-gray-50 flex items-center justify-center p-5">
                        <div className="w-full border-2 border-[#1a2744]/20 rounded-xl overflow-hidden shadow-md bg-white">
                            <div className="bg-[#1a2744] px-4 py-2.5 flex items-center justify-between">
                                <div>
                                    <div className="text-white text-xs font-black">VinTraxx SmartScan</div>
                                    <div className="text-white/50 text-[9px]">Trade-In Appraisal Report</div>
                                </div>
                                <div className="bg-white rounded px-2 py-0.5">
                                    <img src={IMAGES.technicianObd} alt="VinTraxx" className="h-4 w-auto object-contain" />
                                </div>
                            </div>
                            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                                <img src={IMAGES.f150Truck} alt="F-150" className="w-14 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                                <div>
                                    <div className="text-[10px] font-black text-gray-900 uppercase">2023 Ford F-150 King Ranch</div>
                                    <div className="text-[8px] text-gray-400">VIN: 1FTFW1E53NFA · 18,400 mi · Condition: Good</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                                <div className="px-3 py-2.5 text-center">
                                    <div className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold tracking-wide">Cash Offer</div>
                                    <div className="text-base font-black text-green-600">$33,500</div>
                                </div>
                                <div className="px-3 py-2.5 text-center">
                                    <div className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold tracking-wide">Wholesale</div>
                                    <div className="text-base font-black text-blue-600">$31,200</div>
                                </div>
                                <div className="px-3 py-2.5 text-center">
                                    <div className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold tracking-wide">Trade-In</div>
                                    <div className="text-base font-black text-[#8B2F3E]">$34,800</div>
                                </div>
                            </div>
                            <div className="px-4 py-2.5 border-b border-gray-100">
                                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Source Anchors</div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-4 bg-gray-100 px-2 py-1">
                                        <div className="text-[7px] font-bold text-gray-600">Source</div>
                                        <div className="text-[7px] font-bold text-gray-600">Trade-In</div>
                                        <div className="text-[7px] font-bold text-gray-600">Retail</div>
                                        <div className="text-[7px] font-bold text-gray-600">Private Party</div>
                                    </div>
                                    <div className="grid grid-cols-4 px-2 py-1 border-t border-gray-100">
                                        <div className="text-[7px] text-gray-700 font-semibold">Black Book</div>
                                        <div className="text-[7px] text-gray-600">$33,500</div>
                                        <div className="text-[7px] text-gray-600">$42,000</div>
                                        <div className="text-[7px] text-gray-600">$38,500</div>
                                    </div>
                                    <div className="grid grid-cols-4 px-2 py-1 border-t border-gray-100">
                                        <div className="text-[7px] text-gray-700 font-semibold">MMR (Manheim)</div>
                                        <div className="text-[7px] text-gray-600">$32,800</div>
                                        <div className="text-[7px] text-gray-600">$41,200</div>
                                        <div className="text-[7px] text-gray-600">$37,900</div>
                                    </div>
                                    <div className="grid grid-cols-4 px-2 py-1 border-t border-gray-100">
                                        <div className="text-[7px] text-gray-700 font-semibold">JD Power (NADA)</div>
                                        <div className="text-[7px] text-gray-600">$34,200</div>
                                        <div className="text-[7px] text-gray-600">$43,000</div>
                                        <div className="text-[7px] text-gray-600">$39,100</div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-2.5 border-b border-gray-100">
                                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Value Adjustments</div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-3 bg-gray-100 px-2 py-1">
                                        <div className="text-[7px] font-bold text-gray-600">Factor</div>
                                        <div className="text-[7px] font-bold text-gray-600">Impact</div>
                                        <div className="text-[7px] font-bold text-gray-600">Notes</div>
                                    </div>
                                    <div className="grid grid-cols-3 px-2 py-1 border-t border-gray-100">
                                        <div className="text-[7px] text-gray-700">Mileage Adj.</div>
                                        <div className="text-[7px] font-bold text-red-500">-$375</div>
                                        <div className="text-[7px] text-gray-400">Above avg. mileage</div>
                                    </div>
                                    <div className="grid grid-cols-3 px-2 py-1 border-t border-gray-100">
                                        <div className="text-[7px] text-gray-700">Condition Adj.</div>
                                        <div className="text-[7px] font-bold text-green-600">+$200</div>
                                        <div className="text-[7px] text-gray-400">Good condition</div>
                                    </div>
                                    <div className="grid grid-cols-3 px-2 py-1 border-t border-gray-100">
                                        <div className="text-[7px] text-gray-700">Regional Adj.</div>
                                        <div className="text-[7px] font-bold text-green-600">+$150</div>
                                        <div className="text-[7px] text-gray-400">High local demand</div>
                                    </div>
                                    <div className="grid grid-cols-3 px-2 py-1 border-t border-gray-100">
                                        <div className="text-[7px] text-gray-700">OBD-II Faults</div>
                                        <div className="text-[7px] font-bold text-red-500">-$1,630</div>
                                        <div className="text-[7px] text-gray-400">ABS + TPMS codes</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-1.5 flex justify-between">
                                <div className="text-[7px] text-gray-400">dealer@vintraxx.com</div>
                                <div className="text-[7px] text-gray-400">appr-8821 · Date: 03/25/2026</div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Three offers, one scan</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">SmartScan instantly generates a <strong className="text-gray-700">Cash Offer, Wholesale value, and Trade-In estimate</strong> — all sourced from live market data so every number is defensible.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const OBDDiagnosticsHeader = () => (
    <div className="bg-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-[#8B2F3E] mb-1">OBD-II Diagnostics</div>
                <div className="text-2xl font-black text-gray-900">Plug In. Catch Every Cost.</div>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
        </div>
    </div>
);

const PlugInSection = () => (
    <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 max-w-md">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                    Plug in to avoid<br />profit losses
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                    SmartScan&apos;s OBD-II scan technology automatically factors diagnostic issues into your transparent appraisal and condition report. Catching recon costs early adds up to a serious impact on your bottom line.
                </p>
                <div className="bg-[#FFFFFF]/[0.08] border border-[#8B2F3E]/20 rounded-xl px-6 py-4 inline-flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900">$850</span>
                    <span className="text-sm text-gray-600"><strong className="text-gray-900">avg. recon cost savings</strong><br />per vehicle with OBD-II diagnostics</span>
                </div>
            </div>
            <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-4 items-center">
                <div className="flex flex-col gap-4 flex-1 w-full md:w-auto">
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                        <img src={IMAGES.auctionBackground} alt="Technician plugging in OBD scanner" className="w-full h-40 object-cover" />
                    </div>
                    <div className="bg-white rounded-xl shadow-lg px-5 py-4 flex items-center gap-4 border border-amber-100">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <TriangleAlert className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-gray-800">ABS Fault</div>
                            <div className="text-xs text-gray-500">Reverse Gear Signal Circuit · C0010-5A</div>
                        </div>
                        <div className="text-sm font-bold text-red-500">-$1,550</div>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                        <img src={IMAGES.f150Truck} alt="2023 Ford F-150 King Ranch" className="w-full h-40 object-cover" />
                    </div>
                </div>
                <div className="w-full md:w-52 max-w-[208px] flex-shrink-0">
                    <div className="bg-[#f0f4f8] rounded-3xl shadow-2xl border-4 border-gray-800 overflow-hidden">
                        <div className="bg-gray-800 h-6 flex items-center justify-center">
                            <div className="w-16 h-2 bg-gray-600 rounded-full"></div>
                        </div>
                        <div className="bg-[#1a2744] px-3 py-2 flex items-center justify-between">
                            <span className="text-white text-xs font-bold tracking-wide">VinTraxx</span>
                            <span className="text-white text-[9px] bg-white/20 rounded px-2 py-0.5 font-medium">Dealer</span>
                        </div>
                        <div className="px-3 pt-3">
                            <img src={IMAGES.f150Truck} alt="2023 Ford F-150 King Ranch" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                        </div>
                        <div className="px-3 py-2">
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-5 h-5 rounded-full bg-[#1a2744] flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-[8px] font-bold">7</span>
                                </div>
                                <span className="text-xs font-black text-gray-900">Appraisal Summary</span>
                            </div>
                            <div className="space-y-1.5 text-[9px]">
                                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Vehicle</span><span className="font-bold text-gray-900 text-right max-w-[100px]">2023 Ford F-150 King Ranch</span></div>
                                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Mileage</span><span className="font-bold text-gray-900 text-right max-w-[100px]">18,400 mi</span></div>
                                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Condition</span><span className="font-bold text-gray-900 text-right max-w-[100px]">Good</span></div>
                                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Health Score</span><span className="font-bold text-green-600 text-right max-w-[100px]">82/100</span></div>
                                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Wholesale</span><span className="font-bold text-gray-900">$30,200 – $31,800</span></div>
                                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Trade-In</span><span className="font-bold text-green-600">$33,500 – $34,200</span></div>
                                <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-500">Retail</span><span className="font-bold text-gray-900">$37,500 – $39,800</span></div>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-2 mb-2">
                                <div className="text-[9px] font-bold text-red-600 mb-1">OBD Faults · -$1,630</div>
                                <div className="grid grid-cols-3 gap-1">
                                    <div className="text-center text-[8px] py-0.5 rounded font-medium bg-red-100 text-red-600">ABS</div>
                                    <div className="text-center text-[8px] py-0.5 rounded font-medium bg-red-100 text-red-600">TPMS</div>
                                    <div className="text-center text-[8px] py-0.5 rounded font-medium bg-gray-100 text-gray-500">Clear</div>
                                </div>
                            </div>
                            <div className="bg-green-50 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                                <CircleCheckBig className="w-3 h-3 text-green-600 flex-shrink-0" />
                                <div className="text-[8px] text-green-700 font-medium">Diagnostic Scan Complete (2 Issues)</div>
                            </div>
                        </div>
                        <div className="bg-white border-t border-gray-200 px-2 py-1.5 flex justify-around">
                            <div className="text-center text-[7px] text-gray-400">Connect</div>
                            <div className="text-center text-[7px] text-gray-400">Scan</div>
                            <div className="text-center text-[7px] text-[#1a2744] font-bold">Appraisal</div>
                            <div className="text-center text-[7px] text-gray-400">History</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const ConditionReportsDivider = () => (
    <div className="bg-gray-50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-[#8B2F3E] mb-1">Condition Reports</div>
                <div className="text-2xl font-black text-gray-900">Full Inspection. Instant Report.</div>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
        </div>
    </div>
);

const InspectionCheckbox = ({ good, fair, poor }: { good?: boolean; fair?: boolean; poor?: boolean }) => (
    <div className="flex gap-0.5">
        <div className={`w-4 h-4 border border-gray-300 rounded-sm flex-shrink-0 ${good ? 'bg-green-400' : 'bg-white'}`}></div>
        <div className={`w-4 h-4 border border-gray-300 rounded-sm flex-shrink-0 ${fair ? 'bg-yellow-400' : 'bg-white'}`}></div>
        <div className={`w-4 h-4 border border-gray-300 rounded-sm flex-shrink-0 ${poor ? 'bg-red-400' : 'bg-white'}`}></div>
    </div>
);

const InspectionRow = ({ label, good, fair, poor }: { label: string; good?: boolean; fair?: boolean; poor?: boolean }) => (
    <div className="flex items-center justify-between py-0.5 border-b border-gray-100 last:border-0">
        <span className="text-[8px] text-gray-600 flex-1 pr-1">{label}</span>
        <InspectionCheckbox good={good} fair={fair} poor={poor} />
    </div>
);

const InspectionCategory = ({ title, color }: { title: string; color?: string }) => (
    <div className={`${color || 'bg-[#1a2744]'} text-white text-[8px] font-bold px-2 py-1 rounded-sm mb-1 uppercase tracking-wide`}>{title}</div>
);

const ConditionReportSection = () => (
    <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-16">
            <div className="flex-1 max-w-md md:pt-8">
                <span className="inline-block bg-[#8B2F3E]/10 text-[#8B2F3E] text-sm font-semibold px-3 py-1 rounded-full mb-4">Condition Reports</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                    A full condition report,<br />generated instantly
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                    SmartScan automatically builds a detailed, shareable vehicle inspection report for every vehicle — complete with photos, diagnostic findings, body damage mapping, and itemized adjustments your team and customers can trust.
                </p>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#8B2F3E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CircleCheckBig className="w-3.5 h-3.5 text-[#8B2F3E]" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-800">VIN-level vehicle details &amp; photos</div>
                            <div className="text-xs text-gray-400">Auto-populated from scan in seconds</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#8B2F3E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CircleCheckBig className="w-3.5 h-3.5 text-[#8B2F3E]" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-800">Itemized condition adjustments</div>
                            <div className="text-xs text-gray-400">Every deduction explained and defensible</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#8B2F3E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CircleCheckBig className="w-3.5 h-3.5 text-[#8B2F3E]" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-800">OBD-II diagnostics included</div>
                            <div className="text-xs text-gray-400">Real fault codes, real dollar impact</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-md" style={{ fontFamily: 'sans-serif' }}>
                    <div className="bg-[#1a2744] px-4 py-3 flex items-center justify-between">
                        <div className="bg-white rounded-md px-2 py-1">
                            <img src={IMAGES.technicianObd} alt="VinTraxx SmartScan" className="h-8 w-auto object-contain" />
                        </div>
                        <div className="text-center">
                            <div className="text-white text-sm font-black tracking-widest uppercase">Car Inspection</div>
                            <div className="text-white/80 text-[9px] font-semibold tracking-widest uppercase">Form</div>
                        </div>
                        <div className="text-white/60 text-xs">📋</div>
                    </div>
                    <div className="px-4 pt-3 pb-2 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>
                                <div className="text-[7px] text-gray-400 uppercase font-semibold">Year / Make / Model</div>
                                <div className="text-[9px] text-gray-800 font-semibold border-b border-gray-300 pb-0.5 mb-1">2023 Ford F-150 King Ranch</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-gray-400 uppercase font-semibold">VIN</div>
                                <div className="text-[9px] text-gray-800 font-semibold border-b border-gray-300 pb-0.5 mb-1">1FTFW1E53NFA19284</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-gray-400 uppercase font-semibold">Mileage</div>
                                <div className="text-[9px] text-gray-800 font-semibold border-b border-gray-300 pb-0.5 mb-1">18,400 mi</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-gray-400 uppercase font-semibold">Color</div>
                                <div className="text-[9px] text-gray-800 font-semibold border-b border-gray-300 pb-0.5 mb-1">Stone Gray</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-gray-400 uppercase font-semibold">Inspector</div>
                                <div className="text-[9px] text-gray-800 font-semibold border-b border-gray-300 pb-0.5 mb-1">J. Martinez</div>
                            </div>
                            <div>
                                <div className="text-[7px] text-gray-400 uppercase font-semibold">Date</div>
                                <div className="text-[9px] text-gray-800 font-semibold border-b border-gray-300 pb-0.5 mb-1">Mar 25, 2026</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 border-b border-gray-200 justify-end">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-400"></div><span className="text-[7px] text-gray-500 font-medium">Good</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-400"></div><span className="text-[7px] text-gray-500 font-medium">Fair</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-400"></div><span className="text-[7px] text-gray-500 font-medium">Poor</span></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 px-0">
                        {/* Column 1: Tires & Brakes + Exterior Body */}
                        <div className="p-3">
                            <InspectionCategory title="Tires & Brakes" />
                            <InspectionRow label="Front Left Tire" good />
                            <InspectionRow label="Front Right Tire" fair />
                            <InspectionRow label="Rear Left Tire" good />
                            <InspectionRow label="Rear Right Tire" good />
                            <InspectionRow label="Spare Tire" good />
                            <InspectionRow label="Front Brakes" good />
                            <InspectionRow label="Rear Brakes" fair />
                            <InspectionRow label="Brake Fluid" good />
                            <div className="mt-2"></div>
                            <InspectionCategory title="Exterior Body" />
                            <InspectionRow label="Hood" good />
                            <InspectionRow label="Front Bumper" good />
                            <InspectionRow label="Rear Bumper" fair />
                            <InspectionRow label="Driver Door" poor />
                            <InspectionRow label="Pass. Door" good />
                            <InspectionRow label="Rear Left Door" good />
                            <InspectionRow label="Rear Right Door" good />
                            <InspectionRow label="Roof" good />
                            <InspectionRow label="Trunk / Tailgate" good />
                            <InspectionRow label="Glass / Windshield" good />
                        </div>
                        {/* Column 2: Body Damage Map + Under Hood + Comments */}
                        <div className="p-3 flex flex-col">
                            <InspectionCategory title="Body Damage Map" color="bg-red-500" />
                            <div className="flex justify-center my-2">
                                <div className="relative" style={{ width: 72, height: 110 }}>
                                    <svg viewBox="0 0 72 110" className="w-full h-full" fill="none">
                                        <rect x="14" y="6" width="44" height="98" rx="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.2" />
                                        <rect x="18" y="18" width="36" height="12" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.5" />
                                        <rect x="18" y="80" width="36" height="12" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.5" />
                                        <rect x="4" y="14" width="10" height="18" rx="3" fill="#6b7280" />
                                        <rect x="58" y="14" width="10" height="18" rx="3" fill="#6b7280" />
                                        <rect x="4" y="78" width="10" height="18" rx="3" fill="#6b7280" />
                                        <rect x="58" y="78" width="10" height="18" rx="3" fill="#6b7280" />
                                        <rect x="14" y="34" width="10" height="8" rx="1.5" fill="#ef4444" opacity="0.85" />
                                        <rect x="28" y="58" width="10" height="8" rx="1.5" fill="#f97316" opacity="0.7" />
                                        <rect x="46" y="46" width="10" height="8" rx="1.5" fill="#fbbf24" opacity="0.7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="space-y-0.5 mb-3">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: 'rgb(239, 68, 68)' }}></div><span className="text-[7px] text-gray-500">Major – Driver Door</span></div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: 'rgb(249, 115, 22)' }}></div><span className="text-[7px] text-gray-500">Moderate – Rear</span></div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: 'rgb(251, 191, 36)' }}></div><span className="text-[7px] text-gray-500">Minor – Pass. Rear</span></div>
                            </div>
                            <InspectionCategory title="Under Hood" />
                            <InspectionRow label="Engine Oil" good />
                            <InspectionRow label="Coolant" good />
                            <InspectionRow label="Power Steering" good />
                            <InspectionRow label="Trans. Fluid" fair />
                            <InspectionRow label="Battery" good />
                            <InspectionRow label="Air Filter" fair />
                            <InspectionRow label="Belts / Hoses" good />
                            <div className="mt-2"></div>
                            <InspectionCategory title="Comments" color="bg-gray-500" />
                            <div className="border border-gray-200 rounded p-1.5 text-[7px] text-gray-400 h-12">Driver door ding noted. ABS &amp; TPMS faults detected via OBD-II scan. Recommend recon review.</div>
                        </div>
                        {/* Column 3: Lights + Interior Check + OBD-II + Fluids */}
                        <div className="p-3">
                            <InspectionCategory title="Lights" />
                            <InspectionRow label="Headlights" good />
                            <InspectionRow label="Tail Lights" good />
                            <InspectionRow label="Turn Signals" good />
                            <InspectionRow label="Brake Lights" good />
                            <InspectionRow label="Reverse Lights" good />
                            <InspectionRow label="Hazards" good />
                            <div className="mt-2"></div>
                            <InspectionCategory title="Interior Check" />
                            <InspectionRow label="Dashboard" good />
                            <InspectionRow label="Seats / Upholstery" good />
                            <InspectionRow label="Carpets / Mats" fair />
                            <InspectionRow label="Headliner" good />
                            <InspectionRow label="A/C & Heat" good />
                            <InspectionRow label="Radio / Nav" good />
                            <InspectionRow label="Power Windows" good />
                            <InspectionRow label="Horn" good />
                            <div className="mt-2"></div>
                            <InspectionCategory title="OBD-II Diagnostics" />
                            <InspectionRow label="ABS Fault (C0010-5A)" poor />
                            <InspectionRow label="TPMS (C1234-00)" fair />
                            <InspectionRow label="Engine / Emissions" good />
                            <InspectionRow label="Airbag / SRS" good />
                            <InspectionRow label="Transmission" good />
                            <div className="mt-2"></div>
                            <InspectionCategory title="Fluids / Components" />
                            <InspectionRow label="Washer Fluid" good />
                            <InspectionRow label="Exhaust" good />
                            <InspectionRow label="Suspension" good />
                            <InspectionRow label="Steering" good />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-200 border-t border-gray-200">
                        <div className="bg-green-50 px-4 py-2 flex items-center gap-2">
                            <CircleCheckBig className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="text-[8px] text-green-700 font-semibold">OBD Scan Complete · 2 Faults</span>
                        </div>
                        <div className="bg-[#1a2744] px-4 py-2 flex items-center justify-center">
                            <span className="text-[9px] font-black text-white">Net Offer: $33,500</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const MarketIntelligenceDivider = () => (
    <div className="bg-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-[#8B2F3E] mb-1">Market Intelligence</div>
                <div className="text-2xl font-black text-gray-900">Real-Time Data. Maximum Profit.</div>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
        </div>
    </div>
);

const DiagnosticScanReportSection = () => (
    <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-16">
            <div className="flex-1 max-w-md md:pt-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                    Maximize every turn<br />with real-time market data
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                    Powered by the most valuable data sources in automotive — including local supply and demand signals — SmartScan updates the value of each VIN every day so you can make the most profitable exit decisions in a volatile market.
                </p>
                <div className="bg-[#FFFFFF]/[0.08] border border-[#8B2F3E]/20 rounded-xl px-6 py-4 inline-flex items-baseline gap-2">
                    <span className="text-sm text-gray-600 font-medium">Up to</span>
                    <span className="text-3xl font-black text-gray-900">$3,100</span>
                    <div className="text-sm text-gray-600 leading-tight"><strong className="text-gray-900">more profit per VIN</strong><br />acquired with SmartScan</div>
                </div>
            </div>
            <div className="flex-1">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden text-xs">
                    <div className="bg-[#1a2744] px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-md px-2 py-1">
                                <img src={IMAGES.technicianObd} alt="VinTraxx SmartScan" className="h-8 w-auto object-contain" />
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-white text-base font-black">Diagnostic Scan Report</div>
                            <div className="text-white/60 text-[10px]">VinTraxx SmartScan</div>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 text-center">
                            <div className="text-[#8B2F3E] text-[10px] font-bold">🚗</div>
                            <div className="text-[#1a2744] text-[9px] font-black">Dealer</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200">
                        <div className="p-4">
                            <div className="text-green-600 font-bold text-[10px] mb-1">Codes Last Reset</div>
                            <div className="text-gray-900 font-black text-sm mb-1">1,200 miles ago</div>
                            <div className="text-[9px] text-gray-400 leading-tight">Emissions monitors are set and codes shown accurately reflect the status of the vehicle.</div>
                        </div>
                        <div className="p-4">
                            <div className="text-blue-600 font-bold text-[10px] mb-1">Emissions Check</div>
                            <div className="text-green-600 font-black text-sm mb-1">Emissions Passed</div>
                            <div className="text-[9px] text-gray-500">· 0 Tests Failed</div>
                            <div className="text-[9px] text-gray-500">· All monitors ready</div>
                        </div>
                        <div className="p-4">
                            <div className="text-orange-500 font-bold text-[10px] mb-1">Vehicle Information</div>
                            <div className="text-gray-900 font-black text-[10px] mb-1">1FTFW1E53NFA19284</div>
                            <div className="text-[9px] text-gray-700 font-semibold">2023 Ford F-150 King Ranch</div>
                            <div className="text-[9px] text-gray-400">18,400 mi · 5.0L V8 · 4WD</div>
                        </div>
                    </div>
                    <div className="px-5 py-4 border-b border-gray-200">
                        <div className="text-sm font-black text-gray-900 mb-3 border-b border-gray-300 pb-1">Estimated Reconditioning Costs</div>
                        <div className="flex gap-4">
                            <div className="border border-gray-200 rounded-lg p-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-400 mb-1">Reconditioning Cost</div>
                                <div className="text-xl font-black text-gray-900">$1,630</div>
                            </div>
                            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                                <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                                    <div className="text-[9px] font-bold text-gray-700">Repairs</div>
                                    <div className="text-[9px] font-bold text-gray-700 text-center">Parts</div>
                                    <div className="text-[9px] font-bold text-gray-700 text-right">Labor</div>
                                </div>
                                <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                    <div className="text-[9px] text-gray-600">ABS Module Repair</div>
                                    <div className="text-[9px] text-gray-600 text-center">$850</div>
                                    <div className="text-[9px] text-gray-600 text-right">$350</div>
                                </div>
                                <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                    <div className="text-[9px] text-gray-600">TPMS Sensor Replace</div>
                                    <div className="text-[9px] text-gray-600 text-center">$120</div>
                                    <div className="text-[9px] text-gray-600 text-right">$80</div>
                                </div>
                                <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                    <div className="text-[9px] text-gray-600">Rear Brake Service</div>
                                    <div className="text-[9px] text-gray-600 text-center">$150</div>
                                    <div className="text-[9px] text-gray-600 text-right">$80</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 py-4 border-b border-gray-200">
                        <div className="text-sm font-black text-gray-900 mb-1 border-b border-gray-300 pb-1">Diagnostic Trouble Codes</div>
                        <div className="text-[9px] text-gray-400 mb-2">1,500 datapoints scanned across Engine, Transmission, ABS, Body Control Module, Powertrain Control Module.</div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                                <div className="text-[9px] font-bold text-gray-700">Code</div>
                                <div className="text-[9px] font-bold text-gray-700">Module</div>
                                <div className="text-[9px] font-bold text-gray-700">Details</div>
                            </div>
                            <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                <div className="text-[9px] text-red-600 font-bold">C0010-5A</div>
                                <div className="text-[9px] text-gray-600">ABS</div>
                                <div className="text-[9px] text-gray-500">Reverse Gear Signal Circuit Fault</div>
                            </div>
                            <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                <div className="text-[9px] text-red-600 font-bold">C1234-00</div>
                                <div className="text-[9px] text-gray-600">TPMS</div>
                                <div className="text-[9px] text-gray-500">Tire Pressure Sensor — Right Front</div>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 py-4 border-b border-gray-200">
                        <div className="text-sm font-black text-gray-900 mb-2 border-b border-gray-300 pb-1">Mileage Based Risk Assessment</div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                                <div className="text-[9px] font-bold text-gray-700">Potential Issue</div>
                                <div className="text-[9px] font-bold text-gray-700">Cost Estimate</div>
                                <div className="text-[9px] font-bold text-gray-700">Mileage Est.</div>
                            </div>
                            <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                <div className="text-[9px] text-gray-600">Transmission fluid degradation</div>
                                <div className="text-[9px] text-gray-600">$150–$250</div>
                                <div className="text-[9px] text-gray-500">~60,000 mi</div>
                            </div>
                            <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                <div className="text-[9px] text-gray-600">Brake pad wear</div>
                                <div className="text-[9px] text-gray-600">$200–$400</div>
                                <div className="text-[9px] text-gray-500">~50,000 mi</div>
                            </div>
                            <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                <div className="text-[9px] text-gray-600">Spark plug wear</div>
                                <div className="text-[9px] text-gray-600">$100–$200</div>
                                <div className="text-[9px] text-gray-500">~60,000 mi</div>
                            </div>
                            <div className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                                <div className="text-[9px] text-gray-600">Fuel pump failure</div>
                                <div className="text-[9px] text-gray-600">$600–$1,000</div>
                                <div className="text-[9px] text-gray-500">~80,000 mi</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-200 px-5 py-2 flex items-center justify-between">
                        <div className="text-[8px] text-gray-400">User: dealer@vintraxx.com</div>
                        <div className="text-[8px] text-gray-400">803ac633 · v5.1</div>
                        <div className="text-[8px] text-gray-400">Date: 03/25/2026</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const OnlineAppraisalsDivider = () => (
    <div className="bg-gray-50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-[#8B2F3E] mb-1">Online Appraisals</div>
                <div className="text-2xl font-black text-gray-900">Online Offer. In-Store Close.</div>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
        </div>
    </div>
);

const OnlineAppraisalsSection = () => (
    <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 max-w-sm">
                <div className="flex items-center gap-2 mb-4">
                    <img src={IMAGES.logo} alt="SmartScan" className="h-7 w-auto object-contain" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                    Turn website visitors<br />into walk-in sellers
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                    SmartScan bridges the gap between online and in-store — giving shoppers a real, AI-powered offer before they ever set foot on your lot. No inconsistent estimates, no lost leads. Just one unified appraisal experience that closes deals faster.
                </p>
                <div className="bg-[#FFFFFF]/[0.08] border border-[#8B2F3E]/20 rounded-xl px-6 py-4 inline-flex items-baseline gap-2">
                    <span className="text-sm text-gray-600 font-medium">3x</span>
                    <span className="text-3xl font-black text-gray-900">more leads</span>
                    <span className="text-sm text-gray-600 leading-tight"><strong className="text-gray-900">converted to appointments</strong> with<br />SmartScan online offers</span>
                </div>
            </div>
            <div className="flex-1 relative">
                <img src={IMAGES.customerOnline} alt="Customer appraising vehicle online" className="w-full h-[420px] object-cover rounded-2xl shadow-xl" />
            </div>
            <div className="flex-shrink-0 w-full md:w-52 max-w-[208px]">
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-800 overflow-hidden">
                    <div className="bg-gray-800 h-6 flex items-center justify-center">
                        <div className="w-16 h-2 bg-gray-600 rounded-full"></div>
                    </div>
                    <div className="bg-[#1a2744] px-3 py-4 text-center">
                        <div className="text-white/70 text-[8px] font-bold tracking-widest uppercase mb-1">Your Instant Offer</div>
                        <div className="text-white text-3xl font-black mb-1">$26,450</div>
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-white/60 text-[8px]">Powered by</span>
                            <div className="bg-white rounded px-1.5 py-0.5">
                                <img src={IMAGES.technicianObd} alt="VinTraxx SmartScan" className="h-3 w-auto object-contain" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#ccdcec] px-3 pt-3 pb-2">
                        <img src={IMAGES.vehicleSmall} alt="Vehicle" className="w-full h-20 object-cover rounded-lg mb-2" />
                        <div className="text-[10px] font-black text-gray-900 uppercase">2022 Toyota RAV4 Hybrid</div>
                        <div className="text-[8px] text-gray-500 uppercase">SE 4-Door SUV · 2.5L Hybrid</div>
                        <div className="text-[8px] text-gray-500">4T3RW · 38,200 Miles</div>
                    </div>
                    <div className="bg-[#ccdcec] px-3 py-2">
                        <div className="bg-[#1a2744] text-white text-[9px] font-bold text-center py-2 rounded-lg">Schedule an Appointment</div>
                    </div>
                    <div className="bg-[#ccdcec] px-3 py-2.5">
                        <div className="bg-white rounded-xl px-3 py-2.5">
                            <div className="text-[8px] font-black text-gray-700 uppercase tracking-wide mb-2">Your Offer Breakdown</div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[9px]"><span className="text-gray-600">2022 Toyota RAV4</span><span className="font-bold text-gray-900">$27,500</span></div>
                                <div className="flex justify-between text-[9px]"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>Options</span><span className="font-bold text-green-600">+$450</span></div>
                                <div className="flex justify-between text-[9px]"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>Condition Disclosures</span><span className="font-bold text-red-500">-$1,500</span></div>
                                <div className="flex justify-between text-[9px] border-t border-gray-200 pt-1.5 mt-1"><span className="font-black text-gray-900">Your Offer</span><span className="font-black text-[#8B2F3E]">$26,450</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const ServiceDriveSection = () => (
    <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
                <span className="inline-block bg-[#8B2F3E]/10 text-[#8B2F3E] text-sm font-semibold px-3 py-1 rounded-full mb-4">Service Drive</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">Turn your service drive into your best buying lane</h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Every day, high-quality vehicles roll through your service drive — and most dealers let them leave. SmartScan gives your team the tools to make instant, data-backed offers right at the point of service, turning routine appointments into acquisition opportunities.
                </p>
                <div className="border-l-4 border-[#8B2F3E] pl-5">
                    <div className="text-4xl font-bold text-gray-900">3x</div>
                    <div className="text-base font-semibold text-gray-700">more vehicles acquired</div>
                    <div className="text-sm text-gray-500">from the service drive with SmartScan</div>
                </div>
            </div>
            <div className="flex-1">
                <img src={IMAGES.serviceDrive} alt="Service Drive" className="w-full rounded-2xl shadow-xl object-cover aspect-[4/3]" />
            </div>
        </div>
    </section>
);

const MarketIntelligenceSection = () => (
    <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="flex-1">
                <span className="inline-block bg-[#8B2F3E]/10 text-[#8B2F3E] text-sm font-semibold px-3 py-1 rounded-full mb-4">Market Intelligence</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">Maximize every turn with real-time market data</h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Powered by the most valuable data sources in automotive, SmartScan updates the value of each VIN every day so you can make the most profitable exit decisions — even in a volatile market.
                </p>
                <div className="border-l-4 border-[#8B2F3E] pl-5">
                    <div className="text-4xl font-bold text-gray-900">Up to $3,100</div>
                    <div className="text-base font-semibold text-gray-700">more profit per VIN</div>
                    <div className="text-sm text-gray-500">acquired with SmartScan</div>
                </div>
            </div>
            <div className="flex-1">
                <img src={IMAGES.marketIntelligence} alt="Market Intelligence" className="w-full rounded-2xl shadow-xl object-cover aspect-[4/3]" />
            </div>
        </div>
    </section>
);

const TestimonialsSection = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const testimonials = [
        {
            quote: "SmartScan is going to help your dealership — significantly. The accuracy is unlike anything we've used before.",
            name: "Marcus Rivera",
            title: "General Sales Manager",
            company: "Summit Honda"
        },
        {
            quote: "SmartScan has helped tremendously in our service drive. It scales our acquisitions for the right money every time.",
            name: "Carla Jensen",
            title: "Sales Manager",
            company: "Premier Toyota"
        },
        {
            quote: "We haven't gone to an auction in over a year. With SmartScan, the majority of our cars come from the service drive.",
            name: "Tyler Brooks",
            title: "VDP Manager",
            company: "Westside Chevrolet"
        },
        {
            quote: "The proof is in the results. Our gross profit is up by about $400 per unit since we started using SmartScan.",
            name: "David Park",
            title: "Group Used Car Director",
            company: "Apex Auto Group"
        },
        {
            quote: "I can explain exactly how we arrived at every number. I'm not the bad guy anymore - SmartScan gives us full transparency.",
            name: "Sophia Mendez",
            title: "Sales Associate",
            company: "Lakeview Ford"
        },
        {
            quote: "I don't believe there's any other tool on the market that gives you this much data and insight per VIN.",
            name: "Robert Chang",
            title: "Executive GM",
            company: "Dynasty Motors"
        }
    ];

    const visibleCount = 3;
    const maxIndex = testimonials.length - visibleCount;

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < maxIndex) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + visibleCount);

    return (
        <section className="py-20 px-6 bg-white" id="testimonials">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">Appraising SmartScan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {visibleTestimonials.map((t, idx) => (
                        <div key={currentIndex + idx} className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-[#F7C815] text-[#F7C815]" />
                                ))}
                            </div>
                            <p className="text-gray-700 text-base leading-relaxed mb-6 italic">&quot;{t.quote}&quot;</p>
                            <div>
                                <div className="font-bold text-gray-900">{t.name}</div>
                                <div className="text-sm text-gray-500">{t.title}</div>
                                <div className="text-sm text-[#8B2F3E] font-medium">{t.company}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center gap-4 mt-8">
                    <button 
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#8B2F3E] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={currentIndex >= maxIndex}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#8B2F3E] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </section>
    );
};

const ContactFormSection = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        title: "",
        dealershipName: "",
        email: "",
        phone: "",
        state: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
    };

    return (
        <section className="py-20 px-6 bg-gray-50" id="form">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Simplify and scale your used car business</h2>
                    <p className="text-lg text-gray-600">Connect with us to demo SmartScan and see how you can transform your used car profits.</p>
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2F3E]/40 focus:border-[#8B2F3E]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2F3E]/40 focus:border-[#8B2F3E]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2F3E]/40 focus:border-[#8B2F3E]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Dealership Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.dealershipName}
                            onChange={(e) => setFormData({ ...formData, dealershipName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2F3E]/40 focus:border-[#8B2F3E]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2F3E]/40 focus:border-[#8B2F3E]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2F3E]/40 focus:border-[#8B2F3E]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                        <select
                            required
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2F3E]/40 focus:border-[#8B2F3E]"
                        >
                            <option value="">Please Select</option>
                            {US_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2 mt-2">
                        <button
                            type="submit"
                            className="w-full bg-[#8B2F3E] hover:bg-[#7A2837] text-white font-semibold py-3 text-lg rounded-md shadow transition-colors"
                        >
                            Request Your SmartScan Demo
                        </button>
                        <p className="text-xs text-gray-400 mt-3 text-center">By submitting, you agree to our Terms of Use and Privacy Policy.</p>
                    </div>
                </form>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="bg-[#1a1a2e] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
                <div className="bg-white rounded-lg px-3 py-2">
                    <img src={IMAGES.logo} alt="VinTraxx SmartScan" className="h-9 w-auto" />
                </div>
            </div>
            <div className="flex gap-8 text-sm text-white/60">
                <a href="#features" className="hover:text-white transition-colors">Solutions</a>
                <a href="#stats" className="hover:text-white transition-colors">Results</a>
                <a href="#form" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-white/40">© 2026 VinTraxx. All rights reserved.</div>
        </div>
    </footer>
);

export default function SmartScanPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="min-h-screen bg-white font-sans">
                <TopBar />
                <Header />
                <HeroSection />
                <StatsSection />
                <FeaturesSection />
                <OBDDiagnosticsHeader />
                <PlugInSection />
                <ConditionReportsDivider />
                <ConditionReportSection />
                <MarketIntelligenceDivider />
                <DiagnosticScanReportSection />
                <OnlineAppraisalsDivider />
                <OnlineAppraisalsSection />
                <div id="features">
                    <ServiceDriveSection />
                    <MarketIntelligenceSection />
                </div>
                <TestimonialsSection />
                <ContactFormSection />
                <Footer />
            </div>
        </div>
    );
}
