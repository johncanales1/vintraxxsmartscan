"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Zap, Phone, Mail, DollarSign, Clock, ArrowRight,
    CircleCheckBig, ChevronRight, TrendingUp, Shield,
    Users, Star, CheckCircle, Building2, Wrench,
} from "lucide-react";

const CAPITAL_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695cac8c2981bc8a1da18bbf/b8367dd73_IMG_4709.jpg";

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

/* ─── FAQ item ─── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-6 text-left font-semibold text-[#1B3A5F] hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(!open)}
            >
                {question}
                <ChevronRight
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
                />
            </button>
            {open && (
                <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                    <p className="pt-4">{answer}</p>
                </div>
            )}
        </div>
    );
}

export default function VinTraxxCapitalPage() {
    const heroReveal = useScrollReveal();
    const statsReveal = useScrollReveal();
    const loanReveal = useScrollReveal();
    const industryReveal = useScrollReveal();
    const whyReveal = useScrollReveal();
    const howReveal = useScrollReveal();
    const faqReveal = useScrollReveal();
    const ctaReveal = useScrollReveal();

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ─── Nav ─── */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
                    <img src={CAPITAL_LOGO} alt="VinTraxx Capital" className="h-14 object-contain" />
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
                        <a href="#what-we-do" className="hover:text-[#1B3A5F] transition-colors">Loan Programs</a>
                        <a href="#industries" className="hover:text-[#1B3A5F] transition-colors">Industries</a>
                        <a href="#why-us" className="hover:text-[#1B3A5F] transition-colors">Why VinTraxx</a>
                        <a href="#faq" className="hover:text-[#1B3A5F] transition-colors">FAQ</a>
                        <Link href="/" className="hover:text-[#1B3A5F] transition-colors">VinTraxx Home</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="mailto:capital@vintraxx.com">
                            <button className="items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border bg-white shadow-sm hover:bg-slate-50 h-9 px-4 py-2 border-[#1B3A5F] text-[#1B3A5F] hidden sm:flex">
                                Contact Us
                            </button>
                        </a>
                        <a href="mailto:capital@vintraxx.com">
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-colors shadow h-9 px-4 py-2 bg-[#8B2332] hover:bg-[#6d1c27] text-white font-bold">
                                Apply Now
                            </button>
                        </a>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative bg-white min-h-screen flex items-center px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_#1B3A5F10_0%,_transparent_60%)]" />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_#8B233310_0%,_transparent_60%)]" />
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: "linear-gradient(rgb(27,58,95) 1px, transparent 1px), linear-gradient(90deg, rgb(27,58,95) 1px, transparent 1px)",
                            backgroundSize: "60px 60px",
                        }}
                    />
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10 py-24 md:py-32">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left */}
                        <div ref={heroReveal.ref}>
                            <div
                                className="inline-flex items-center gap-2 bg-[#1B3A5F]/10 border border-[#1B3A5F]/20 rounded-full px-4 py-2 text-sm text-[#1B3A5F] mb-8 transition-all duration-700"
                                style={{ opacity: heroReveal.visible ? 1 : 0, transform: heroReveal.visible ? "none" : "translateY(20px)" }}
                            >
                                <Zap className="w-4 h-4 text-[#8B2332]" />
                                Fast Approvals · No Cost to Get Started
                            </div>
                            <h1
                                className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1B3A5F] mb-6 leading-[1.05] tracking-tight transition-all duration-700 delay-100"
                                style={{ opacity: heroReveal.visible ? 1 : 0, transform: heroReveal.visible ? "none" : "translateY(20px)" }}
                            >
                                Finance Your<br />Customers.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B2332] to-[#e53e3e]">
                                    Grow Your Business.
                                </span>
                            </h1>
                            <p
                                className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed transition-all duration-700 delay-150"
                                style={{ opacity: heroReveal.visible ? 1 : 0, transform: heroReveal.visible ? "none" : "translateY(20px)" }}
                            >
                                Do you sell products or services but can't offer consumer financing? VinTraxx Capital gives your business the tools to close more deals — at no cost to you.
                            </p>
                            <div
                                className="flex flex-col sm:flex-row gap-4 mb-12 transition-all duration-700 delay-200"
                                style={{ opacity: heroReveal.visible ? 1 : 0, transform: heroReveal.visible ? "none" : "translateY(20px)" }}
                            >
                                <a href="mailto:capital@vintraxx.com?subject=Partner Application">
                                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-gradient-to-r from-[#8B2332] to-[#c0392b] hover:from-[#6d1c27] hover:to-[#a93226] text-white text-base px-8 py-6 font-bold shadow-xl hover:shadow-red-900/30 hover:scale-105 transition-all rounded-xl">
                                        Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                </a>
                                <a href="tel:8324914917">
                                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors border bg-white shadow-sm border-[#1B3A5F]/30 text-[#1B3A5F] hover:bg-[#1B3A5F]/5 text-base px-8 py-6 font-semibold rounded-xl">
                                        <Phone className="w-4 h-4 mr-2" /> 832-491-4917
                                    </button>
                                </a>
                            </div>
                            <div
                                className="flex flex-col gap-3 transition-all duration-700 delay-250"
                                style={{ opacity: heroReveal.visible ? 1 : 0 }}
                            >
                                {[
                                    "Offer Consumer Loans from $1,000 to $25,000",
                                    "Flexible Terms Up To 72 Months",
                                    "No Cost to Get Started!",
                                ].map((text) => (
                                    <div key={text} className="flex items-center gap-3 text-slate-700 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-[#1B3A5F]/10 flex items-center justify-center flex-shrink-0">
                                            <CircleCheckBig className="w-3 h-3 text-[#1B3A5F]" />
                                        </div>
                                        {text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — stat cards */}
                        <div className="hidden lg:grid grid-cols-2 gap-4">
                            {[
                                { icon: <DollarSign className="w-5 h-5 text-white" />, iconBg: "from-blue-600 to-blue-800", value: "$25,000", label: "Max Loan Amount" },
                                { icon: <Clock className="w-5 h-5 text-white" />, iconBg: "from-red-700 to-red-900", value: "72 Mo.", label: "Max Loan Term" },
                                { icon: <Zap className="w-5 h-5 text-white" />, iconBg: "from-orange-600 to-orange-800", value: "Fast", label: "Approvals" },
                                { icon: <CheckCircle className="w-5 h-5 text-white" />, iconBg: "from-emerald-600 to-emerald-800", value: "Same-Day", label: "Funding Available" },
                            ].map(({ icon, iconBg, value, label }, i) => (
                                <div
                                    key={label}
                                    className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all"
                                    style={{
                                        opacity: heroReveal.visible ? 1 : 0,
                                        transform: heroReveal.visible ? "none" : "translateY(20px)",
                                        transitionDelay: `${300 + i * 80}ms`,
                                        transition: "all 0.7s",
                                    }}
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center mb-4`}>
                                        {icon}
                                    </div>
                                    <div className="text-3xl font-extrabold text-[#1B3A5F] mb-1">{value}</div>
                                    <div className="text-slate-500 text-sm">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Stats bar ─── */}
            <section className="bg-[#8B2332] py-6 px-4" ref={statsReveal.ref}>
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { value: "$1K–$25K", label: "Consumer Loans" },
                        { value: "24–72", label: "Month terms" },
                        { value: "High", label: "Approval rates" },
                        { value: "Same-Day", label: "Funding available" },
                    ].map(({ value, label }, i) => (
                        <div
                            key={label}
                            className="transition-all duration-700"
                            style={{ opacity: statsReveal.visible ? 1 : 0, transitionDelay: `${i * 100}ms` }}
                        >
                            <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
                            <div className="text-red-200 text-sm">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Loan Programs ─── */}
            <section id="what-we-do" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
                <div className="max-w-6xl mx-auto" ref={loanReveal.ref}>
                    <div
                        className="text-center mb-16 transition-all duration-700"
                        style={{ opacity: loanReveal.visible ? 1 : 0, transform: loanReveal.visible ? "none" : "translateY(20px)" }}
                    >
                        <div className="inline-flex items-center rounded-md bg-red-100 text-red-800 mb-4 text-sm px-4 py-1 font-semibold">
                            Loan Programs
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1B3A5F] mb-4">Simple, Flexible Financing</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Built for businesses that want to offer more — and close faster.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: <DollarSign className="w-6 h-6 text-white" />, bg: "from-[#1B3A5F] to-[#2d5278]", title: "Loans from $1,000 to $25,000", desc: "Consumer loans sized for real purchases in any industry." },
                            { icon: <Clock className="w-6 h-6 text-white" />, bg: "from-[#8B2332] to-[#c0392b]", title: "24–72 Month Terms", desc: "Flexible repayment that works for your customers." },
                            { icon: <TrendingUp className="w-6 h-6 text-white" />, bg: "from-emerald-600 to-emerald-800", title: "High Approval Rates", desc: "More customers qualify, more deals close." },
                            { icon: <Star className="w-6 h-6 text-white" />, bg: "from-orange-600 to-orange-800", title: "Competitive APR Programs", desc: "Rates your customers will actually say yes to." },
                            { icon: <Shield className="w-6 h-6 text-white" />, bg: "from-purple-600 to-purple-800", title: "Soft-Pull Prequalification", desc: "No impact to credit score to check eligibility." },
                            { icon: <Zap className="w-6 h-6 text-white" />, bg: "from-blue-600 to-cyan-600", title: "Same-Day Funding", desc: "Get funded fast — sometimes the same business day." },
                        ].map(({ icon, bg, title, desc }, i) => (
                            <div
                                key={title}
                                className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all duration-700"
                                style={{ opacity: loanReveal.visible ? 1 : 0, transform: loanReveal.visible ? "none" : "translateY(20px)", transitionDelay: `${i * 80}ms` }}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-4`}>
                                    {icon}
                                </div>
                                <h3 className="font-bold text-[#1B3A5F] mb-2">{title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Industries ─── */}
            <section id="industries" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
                <div className="max-w-6xl mx-auto" ref={industryReveal.ref}>
                    <div
                        className="text-center mb-16 transition-all duration-700"
                        style={{ opacity: industryReveal.visible ? 1 : 0, transform: industryReveal.visible ? "none" : "translateY(20px)" }}
                    >
                        <div className="inline-flex items-center rounded-md bg-red-100 text-red-800 mb-4 text-sm px-4 py-1 font-semibold">
                            Industries We Serve
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1B3A5F] mb-4">Built for Every Business</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            If you sell a product or service, VinTraxx Capital can help you offer financing.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {[
                            { emoji: "💆", label: "MedSpa" },
                            { emoji: "🏠", label: "Roofing & Construction" },
                            { emoji: "🪑", label: "Furniture Stores" },
                            { emoji: "🐾", label: "Vet Clinics" },
                            { emoji: "🦷", label: "Dentist Offices" },
                            { emoji: "🚗", label: "Tire & Wheel Centers" },
                            { emoji: "💎", label: "Jewelry Stores" },
                            { emoji: "🚙", label: "Car Dealerships" },
                            { emoji: "🏌️", label: "Golf Cart Dealers" },
                            { emoji: "❄️", label: "HVAC Companies" },
                        ].map(({ emoji, label }, i) => (
                            <div
                                key={label}
                                className="bg-white border border-slate-200 rounded-2xl p-6 text-center hover:shadow-md hover:border-[#1B3A5F]/30 transition-all duration-700"
                                style={{ opacity: industryReveal.visible ? 1 : 0, transform: industryReveal.visible ? "none" : "translateY(20px)", transitionDelay: `${i * 60}ms` }}
                            >
                                <div className="text-3xl mb-3">{emoji}</div>
                                <div className="text-sm font-semibold text-slate-700">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Why VinTraxx ─── */}
            <section id="why-us" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1B3A5F]">
                <div className="max-w-6xl mx-auto" ref={whyReveal.ref}>
                    <div
                        className="text-center mb-16 transition-all duration-700"
                        style={{ opacity: whyReveal.visible ? 1 : 0, transform: whyReveal.visible ? "none" : "translateY(20px)" }}
                    >
                        <div className="inline-flex items-center rounded-md bg-white/20 text-white mb-4 text-sm px-4 py-1 font-semibold">
                            Why VinTraxx Capital
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">The Smarter Financing Partner</h2>
                        <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                            No cost to get started. Fast approvals. Finance your customers today.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: <TrendingUp className="w-6 h-6 text-white" />, title: "Higher Approval Rates", desc: "More of your customers get approved, more of the time." },
                            { icon: <Clock className="w-6 h-6 text-white" />, title: "Longer Repayment Terms", desc: "24–72 month options keep payments affordable." },
                            { icon: <DollarSign className="w-6 h-6 text-white" />, title: "Lower APR Options", desc: "Competitive rates that keep customers coming back." },
                            { icon: <Users className="w-6 h-6 text-white" />, title: "Dedicated Account Managers", desc: "A real person in your corner from day one." },
                            { icon: <Shield className="w-6 h-6 text-white" />, title: "Transparent Pricing", desc: "No hidden fees. No surprises. Ever." },
                            { icon: <Zap className="w-6 h-6 text-white" />, title: "Embedded Financing Technology", desc: "Seamlessly integrated into your existing workflow." },
                        ].map(({ icon, title, desc }, i) => (
                            <div
                                key={title}
                                className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-700"
                                style={{ opacity: whyReveal.visible ? 1 : 0, transform: whyReveal.visible ? "none" : "translateY(20px)", transitionDelay: `${i * 80}ms` }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                                    {icon}
                                </div>
                                <h3 className="font-bold text-white mb-2">{title}</h3>
                                <p className="text-blue-200 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
                <div className="max-w-5xl mx-auto" ref={howReveal.ref}>
                    <div
                        className="text-center mb-16 transition-all duration-700"
                        style={{ opacity: howReveal.visible ? 1 : 0, transform: howReveal.visible ? "none" : "translateY(20px)" }}
                    >
                        <div className="inline-flex items-center rounded-md bg-red-100 text-red-800 mb-4 text-sm px-4 py-1 font-semibold">
                            How It Works
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1B3A5F] mb-4">Simple Onboarding. Fast Results.</h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { num: "01", title: "Apply Online", desc: "Submit your merchant or agent application in minutes." },
                            { num: "02", title: "Get Approved", desc: "Our team reviews and approves your account within 24–48 hours." },
                            { num: "03", title: "Offer Financing", desc: "Start offering your customers flexible payment options immediately." },
                            { num: "04", title: "Get Paid", desc: "Receive same-day or next-day funding on approved transactions." },
                        ].map(({ num, title, desc }, i) => (
                            <div
                                key={num}
                                className="text-center transition-all duration-700"
                                style={{ opacity: howReveal.visible ? 1 : 0, transform: howReveal.visible ? "none" : "translateY(20px)", transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8B2332] to-[#6d1c27] text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    {num}
                                </div>
                                <h3 className="font-bold text-[#1B3A5F] mb-2">{title}</h3>
                                <p className="text-slate-600 text-sm">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FAQ ─── */}
            <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
                <div className="max-w-3xl mx-auto" ref={faqReveal.ref}>
                    <div
                        className="text-center mb-16 transition-all duration-700"
                        style={{ opacity: faqReveal.visible ? 1 : 0, transform: faqReveal.visible ? "none" : "translateY(20px)" }}
                    >
                        <div className="inline-flex items-center rounded-md bg-blue-100 text-[#1B3A5F] mb-4 text-sm px-4 py-1 font-semibold">
                            FAQ
                        </div>
                        <h2 className="text-4xl font-bold text-[#1B3A5F] mb-4">Common Questions</h2>
                    </div>
                    <div className="space-y-4">
                        <FaqItem
                            question="How fast can my business get approved?"
                            answer="Most merchant applications are reviewed and approved within 24–48 business hours. Once approved, you can start offering financing immediately."
                        />
                        <FaqItem
                            question="What is the loan range for customers?"
                            answer="VinTraxx Capital offers consumer loans ranging from $1,000 to $25,000, with repayment terms from 24 to 72 months."
                        />
                        <FaqItem
                            question="Is there a hard credit pull for prequalification?"
                            answer="No. The initial prequalification uses a soft credit pull, which has no impact on your customer's credit score."
                        />
                        <FaqItem
                            question="How do I become an independent agent?"
                            answer="Send an email to capital@vintraxx.com with 'Agent Signup' in the subject line. Our team will reach out with the details and onboarding materials."
                        />
                        <FaqItem
                            question="What industries do you serve?"
                            answer="We serve a wide range of industries including MedSpas, roofing, furniture, veterinary clinics, dentist offices, tire & wheel shops, jewelry stores, car dealerships, golf cart dealers, HVAC companies, and more."
                        />
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#8B2332] to-[#6d1c27]">
                <div className="max-w-4xl mx-auto text-center" ref={ctaReveal.ref}>
                    <div
                        className="transition-all duration-700"
                        style={{ opacity: ctaReveal.visible ? 1 : 0, transform: ctaReveal.visible ? "none" : "translateY(30px)" }}
                    >
                        <img src={CAPITAL_LOGO} alt="VinTraxx Capital" className="h-20 object-contain mx-auto mb-8" />
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to Grow with VinTraxx Capital?</h2>
                        <p className="text-xl text-red-100 mb-4 max-w-2xl mx-auto">
                            Join businesses nationwide that trust VinTraxx Capital to close more deals and drive more revenue.
                        </p>
                        <p className="text-lg text-red-200 mb-10 font-semibold">
                            📞 Call Now: 832-491-4917 &nbsp;|&nbsp; www.VinTraxx.com
                        </p>
                        <p className="text-red-200 mb-10 text-sm">Seeking VinTraxx Independent Agents</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="mailto:capital@vintraxx.com?subject=Partner Application">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-white hover:bg-slate-100 text-[#8B2332] text-lg px-10 py-6 font-bold shadow-xl hover:scale-105 transition-all">
                                    Become a Partner <ArrowRight className="w-5 h-5 ml-2" />
                                </button>
                            </a>
                            <a href="mailto:capital@vintraxx.com?subject=Agent Signup">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors border bg-transparent shadow-sm border-white text-white hover:bg-white/10 text-lg px-10 py-6 font-bold rounded-md">
                                    Become an Agent
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="bg-[#1B3A5F] py-10 px-4 text-center">
                <img src={CAPITAL_LOGO} alt="VinTraxx Capital" className="h-14 object-contain mx-auto mb-4" />
                <p className="text-blue-200 text-sm mb-2">A VinTraxx Automotive Holdings, LLC Company</p>
                <div className="flex items-center justify-center gap-4 text-blue-300 text-sm">
                    <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" /> capital@vintraxx.com
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" /> 832-491-4917
                    </span>
                </div>
                <p className="text-blue-400 text-xs mt-6">© 2026 VinTraxx Capital. All rights reserved.</p>
            </footer>
        </div>
    );
}
