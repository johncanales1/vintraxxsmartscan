"use client";

/* ─── VinTraxx Landing Page — exact match of https://vintraxx.com/ ─── */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Scan, Zap, DollarSign, ChevronDown, ChevronRight, Phone, Mail, X } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695cac8c2981bc8a1da18bbf/7fd883e0e_Vintraxxcomlogo1.png";

/* ─── Animated section hook ─── */
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

/* ─── About Modal ─── */
const TEAM_IMAGE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695cac8c2981bc8a1da18bbf/about-team.jpg";

const AboutModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80" onClick={onClose} />
            <dialog
                open
                className="relative bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto p-6 z-10 border border-slate-200"
                aria-label="About VinTraxx Automotive LLC"
            >
                <div className="flex flex-col space-y-1.5 text-left mb-4">
                    <h2 className="tracking-tight text-2xl font-bold text-[#1B3A5F]">About VinTraxx Automotive LLC</h2>
                </div>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Close</span>
                </button>
                <div className="space-y-6 text-slate-700 leading-relaxed">
                    <div className="bg-gradient-to-br from-[#1B3A5F] to-[#234A6F] rounded-2xl p-8 text-white text-center">
                        <h3 className="text-2xl font-bold mb-2">Driving the Future of Automotive</h3>
                        <p className="text-blue-200 text-sm">VinTraxx Automotive Holdings, LLC</p>
                    </div>
                    <p className="text-lg">
                        VinTraxx was founded with a clear mission: give dealerships and businesses the technology to scan, appraise, finance, and close — faster and smarter than ever before.
                    </p>
                    <p>
                        At the core of our platform is <strong>SmartScan</strong> — an AI-powered vehicle diagnostic and appraisal tool that connects to any vehicle via OBD-II in seconds. SmartScan reads every system, generates a professional condition report, estimates reconditioning costs, and delivers data-driven pricing recommendations. Know exactly what you&apos;re buying before you make an offer.
                    </p>
                    <p>
                        <strong>SmartScan + Capital</strong> takes it further by combining vehicle diagnostics with instant consumer financing in a single, seamless workflow. Appraise the vehicle, present financing options, and close the deal — all without switching tools or losing momentum. It&apos;s the most efficient path from lot to funded deal in the industry.
                    </p>
                    <p>
                        <strong>VinTraxx Capital</strong> is our standalone consumer financing program, built for any business that sells products or services. Offer $1,000–$25,000 in flexible consumer loans with terms up to 72 months, high approval rates, and same-day funding — at no cost to get started. Whether you&apos;re a dealership, medspa, roofing company, or tire shop, VinTraxx Capital helps you close more deals.
                    </p>
                    <p>
                        We don&apos;t just sell software — we build partnerships. Every product we offer is designed to eliminate friction, increase profitability, and give your team the tools to compete and win.
                    </p>
                    <p>
                        Headquartered in Texas and trusted by dealerships and businesses nationwide, VinTraxx is led by a team with deep roots in automotive retail, fintech, and enterprise software. We move fast, listen to our customers, and ship technology that actually works.
                    </p>
                    <div className="my-6">
                        <img src="/assets/images/60202e8d3_image.png" alt="VinTraxx Leadership Team" className="w-full rounded-lg shadow-lg" />
                    </div>
                    <div className="border-t border-slate-200 pt-4 text-sm text-slate-500 text-center">
                        © 2026 VinTraxx Automotive Holdings, LLC — All Rights Reserved.
                    </div>
                </div>
            </dialog>
        </div>
    );
};

/* ─── Nav ─── */
const Nav = () => {
    const [aboutOpen, setAboutOpen] = useState(false);

    return (
        <>
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <img src={LOGO_URL} alt="VinTraxx" className="h-32 transition-transform hover:scale-105" />
                            </Link>
                        </div>
                        <div className="hidden lg:flex items-center gap-8">
                            {[
                                { label: "SmartScan", href: "/VehicleAppraisal", color: "#1B3A5F" },
                                { label: "SmartScan + Capital", href: "/login", color: "#8B2332" },
                                { label: "VinTraxx Capital", href: "/VinTraxxCapital", color: "#8B2332" },
                            ].map(({ label, href, color }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="text-slate-700 font-medium transition-colors relative group"
                                    style={{ "--hover-color": color } as React.CSSProperties}
                                >
                                    <span className="hover:text-[#1B3A5F] transition-colors">{label}</span>
                                    <span
                                        className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                                        style={{ backgroundColor: color }}
                                    />
                                </Link>
                            ))}
                            <button
                                onClick={() => setAboutOpen(true)}
                                className="text-slate-600 font-medium transition-colors relative group cursor-pointer"
                            >
                                <span className="hover:text-[#1B3A5F] transition-colors">About</span>
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#1B3A5F] group-hover:w-full transition-all duration-300" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border bg-white shadow-sm h-9 px-4 py-2 border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-[#1B3A5F] transition-all">
                                    Client Login
                                </button>
                            </Link>
                            <a href="mailto:admin@vintraxx.com">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm h-9 px-4 py-2 bg-[#8B2332] hover:bg-[#6d1c27] text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                    Request a Demo
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
            <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
        </>
    );
};

/* ─── Hero ─── */
const Hero = () => (
    <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 bg-black">
        {/* Video background */}
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" src="/assets/videos/intro_min.mp4" />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55 z-[1] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold mb-8 bg-white/15 border border-white/30 text-white">
                <span className="w-2 h-2 rounded-full bg-[#8B2332] animate-pulse" />
                Powered by AI · Built for Dealers
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 text-white" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                Scan. Appraise.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B2332] to-[#e53e3e]">Finance. Close.</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-14 leading-relaxed text-white/85">
                VinTraxx gives dealerships and businesses the tools to diagnose vehicles, generate professional appraisals, and offer instant consumer financing — all in one platform.
            </p>

            {/* Product cards */}
            <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* SmartScan */}
                <Link href="/VehicleAppraisal" className="relative group block rounded-2xl p-7 text-left shadow-lg hover:shadow-2xl transition-all ring-1 ring-slate-200 bg-white overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1B3A5F] to-[#2d5278]" />
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-[#1B3A5F]/10 text-[#1B3A5F]">Diagnostics</span>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] flex items-center justify-center mb-4 shadow-md">
                        <Scan className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1B3A5F] mb-1">SmartScan</h3>
                    <p className="text-xs font-semibold text-[#8B2332] mb-3">AI Diagnostics &amp; Appraisals</p>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">Comprehensive vehicle health scans with instant reports and AI-powered pricing.</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1B3A5F] group-hover:gap-2 transition-all">
                        Learn More <ChevronRight className="w-4 h-4" />
                    </span>
                </Link>

                {/* SmartScan + Capital */}
                <Link href="/login" className="relative group block rounded-2xl p-7 text-left shadow-lg hover:shadow-2xl transition-all ring-2 ring-[#8B2332] ring-offset-2 bg-white overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B2332] to-[#c0392b]" />
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-[#8B2332] text-white">Most Popular</span>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B2332] to-[#c0392b] flex items-center justify-center mb-4 shadow-md">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1B3A5F] mb-1">SmartScan + Capital</h3>
                    <p className="text-xs font-semibold text-[#8B2332] mb-3">Diagnose. Finance. Close.</p>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">Combine vehicle appraisals with instant consumer financing — all in one workflow.</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1B3A5F] group-hover:gap-2 transition-all">
                        Learn More <ChevronRight className="w-4 h-4" />
                    </span>
                </Link>

                {/* VinTraxx Capital */}
                <Link href="/VinTraxxCapital" className="relative group block rounded-2xl p-7 text-left shadow-lg hover:shadow-2xl transition-all ring-1 ring-slate-200 bg-white overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1B3A5F] to-[#8B2332]" />
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-[#1B3A5F]/10 text-[#1B3A5F]">Financing</span>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B3A5F] to-[#8B2332] flex items-center justify-center mb-4 shadow-md">
                        <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1B3A5F] mb-1">VinTraxx Capital</h3>
                    <p className="text-xs font-semibold text-[#8B2332] mb-3">Consumer Financing for Any Business</p>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">Offer $1K–$25K loans with same-day funding. No cost to get started.</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1B3A5F] group-hover:gap-2 transition-all">
                        Learn More <ChevronRight className="w-4 h-4" />
                    </span>
                </Link>
            </div>

            <p className="mt-12 text-sm text-slate-400 font-medium">
                Trusted by dealerships nationwide · Same-day funding available · No cost to get started
            </p>
        </div>
    </section>
);

/* ─── Animated bars section (reused for both scroll sections) ─── */
const AnimatedBarsSection = ({ heading, text }: { heading: string; text: string }) => {
    const { ref, visible } = useScrollReveal();
    return (
        <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute -top-40 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-400 rounded-full blur-3xl transition-all duration-1000"
                    style={{ opacity: visible ? 0.1 : 0, transform: visible ? "translateY(0)" : "translateY(100px)" }}
                />
            </div>
            <div className="max-w-4xl mx-auto relative z-10" ref={ref}>
                {/* Text */}
                <div
                    className="text-center mb-12 transition-all duration-700"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)" }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[#1B3A5F] mb-6 leading-tight">{heading}</h2>
                    <p
                        className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-150"
                        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
                    >
                        {text}
                    </p>
                </div>

                {/* Bouncing chevron */}
                <div className="flex justify-center animate-bounce">
                    <ChevronDown className="w-8 h-8 text-[#1B3A5F]" />
                </div>
            </div>
        </section>
    );
};

/* ─── Three Powerful Products (dark section) ─── */
const ThreePowerfulProducts = () => {
    const { ref, visible } = useScrollReveal();
    return (
        <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1B3A5F] via-[#1e3f6a] to-[#152d4a] overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#1B3A5F] opacity-20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B2332] opacity-10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10" ref={ref}>
                <div
                    className="text-center mb-16 transition-all duration-700"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Three Powerful Products. One Platform.</h2>
                    <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                        Everything your dealership or business needs to scan, appraise, and finance — seamlessly connected.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* SmartScan */}
                    <Link
                        href="/VehicleAppraisal"
                        className="block rounded-2xl p-8 bg-white/10 backdrop-blur border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
                        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transitionDelay: "100ms" }}
                    >
                        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-4">
                            AI Diagnostics &amp; Appraisals
                        </span>
                        <h3 className="text-xl font-bold text-white mb-3">VinTraxx SmartScan</h3>
                        <p className="text-blue-200 text-sm leading-relaxed mb-6">
                            Scan any vehicle in seconds. Get professional appraisal reports, DTC codes, recon cost estimates, and AI-powered pricing — all from a mobile device.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-white">25%</div>
                                <div className="text-xs text-blue-300 mt-1">Appraisals Up</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-white">$850</div>
                                <div className="text-xs text-blue-300 mt-1">More Profit/Trade</div>
                            </div>
                        </div>
                    </Link>

                    {/* SmartScan + Capital */}
                    <Link
                        href="/login"
                        className="block rounded-2xl p-8 bg-white/10 backdrop-blur border border-[#8B2332] ring-2 ring-[#8B2332]/50 hover:bg-white/15 transition-all cursor-pointer"
                        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transitionDelay: "200ms" }}
                    >
                        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-[#8B2332] to-rose-500 text-white mb-4">
                            Diagnose. Finance. Close.
                        </span>
                        <h3 className="text-xl font-bold text-white mb-3">SmartScan + Capital</h3>
                        <p className="text-blue-200 text-sm leading-relaxed mb-6">
                            Combine instant vehicle diagnostics with same-day consumer financing. The fastest path from appraisal to funded deal.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-white">65%+</div>
                                <div className="text-xs text-blue-300 mt-1">Conversion Rate</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-white">✓</div>
                                <div className="text-xs text-blue-300 mt-1">Same-Day Funding</div>
                            </div>
                        </div>
                    </Link>

                    {/* VinTraxx Capital */}
                    <Link
                        href="/VinTraxxCapital"
                        className="block rounded-2xl p-8 bg-white/10 backdrop-blur border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
                        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transitionDelay: "300ms" }}
                    >
                        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white mb-4">
                            Consumer Financing for Any Business
                        </span>
                        <h3 className="text-xl font-bold text-white mb-3">VinTraxx Capital</h3>
                        <p className="text-blue-200 text-sm leading-relaxed mb-6">
                            Offer $1K–$25K loans with 24–72 month terms to your customers. High approval rates, competitive APR, zero cost to get started.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-white">$25K</div>
                                <div className="text-xs text-blue-300 mt-1">Max Loan</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-white">72 Mo.</div>
                                <div className="text-xs text-blue-300 mt-1">Max Term</div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
};

/* ─── CTA ─── */
const CTA = () => {
    const { ref, visible } = useScrollReveal();
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-5xl mx-auto" ref={ref}>
                <div
                    className="bg-gradient-to-br from-[#1B3A5F] to-[#234A6F] rounded-3xl p-12 sm:p-16 text-center shadow-2xl border border-[#1B3A5F]/20 transition-all duration-700"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)" }}
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">Ready to Drive Your Success?</h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Join dealerships nationwide using VinTraxx to streamline operations and boost profitability
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="h-10 rounded-md bg-white hover:bg-slate-50 text-[#1B3A5F] text-lg px-10 py-6 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-flex items-center justify-center">
                            Get Started Free
                        </button>
                        <a href="mailto:admin@vintraxx.com">
                            <button className="h-10 rounded-md bg-[#8B2332] hover:bg-[#6d1c27] text-white text-lg px-10 py-6 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-flex items-center justify-center">
                                Request Demo
                            </button>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ─── Footer ─── */
const Footer = () => (
    <footer className="bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <img src={LOGO_URL} alt="VinTraxx" className="h-16 brightness-0 invert" />
                    </div>
                    <p className="text-slate-400 text-sm">The complete automotive platform for modern dealerships</p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Products</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li className="hover:text-white cursor-pointer transition-colors">VinLane IMS</li>
                        <li className="hover:text-white cursor-pointer transition-colors">VinTraxx CRM</li>
                        <li className="hover:text-white cursor-pointer transition-colors">VinTraxx Recon</li>
                        <li className="hover:text-white cursor-pointer transition-colors">View All</li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Company</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                        <li><a href="mailto:admin@vintraxx.com" className="hover:text-white transition-colors">Contact</a></li>
                        <li><a href="mailto:admin@vintraxx.com" className="hover:text-white transition-colors">Support</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">© 2026 VinTraxx Automotive. All rights reserved.</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-2 hover:text-slate-400 transition-colors">
                        <Phone className="w-4 h-4" />888-555-1234
                    </span>
                    <span>•</span>
                    <span className="hover:text-slate-400 transition-colors">admin@vintraxx.com</span>
                </div>
            </div>
        </div>
    </footer>
);

/* ─── Page export ─── */
const LandingPage = () => (
    <div className="min-h-screen bg-white">
        <Nav />
        <Hero />
        <AnimatedBarsSection
            heading="Unlock Intelligent Features"
            text="Beyond smart sourcing, VinTraxx leverages cutting-edge artificial intelligence throughout your dealership operations—from predictive analytics to automated workflows that save you time and money."
        />
        <ThreePowerfulProducts />
        <AnimatedBarsSection
            heading="Scan, Finance &amp; Close — All in One Place"
            text="Stop juggling disconnected tools. VinTraxx SmartScan, SmartScan + Capital, and VinTraxx Capital work together to take you from vehicle appraisal to funded deal faster than ever before."
        />
        <CTA />
        <Footer />
    </div>
);

export default LandingPage;
