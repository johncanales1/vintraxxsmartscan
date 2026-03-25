"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Dataflow03, FileCheck02, Scan, Share07, Shield01, Star01, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { VideoPlayer } from "@/components/base/video-player/video-player";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import Link from "next/link";
import smartscanLogo from "@/assets/logo/brands/smartscan.png";
import videoThumbnail from "@/assets/videos/thumbnail-1.jpg";

const CheckItemText = (props: { size?: "sm" | "md" | "lg"; text?: string; color?: "primary" | "success" }) => {
    const { text, color, size } = props;
    return (
        <li className="flex gap-3">
            <div className={cx(
                "flex shrink-0 items-center justify-center rounded-full",
                color === "success" ? "bg-success-secondary text-featured-icon-light-fg-success" : "bg-brand-primary text-featured-icon-light-fg-brand",
                size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
            )}>
                <svg width={size === "lg" ? 16 : size === "md" ? 15 : 13} height={size === "lg" ? 14 : size === "md" ? 13 : 11} viewBox="0 0 13 11" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.0964 0.390037L3.93638 7.30004L2.03638 5.27004C1.68638 4.94004 1.13638 4.92004 0.736381 5.20004C0.346381 5.49004 0.236381 6.00004 0.476381 6.41004L2.72638 10.07C2.94638 10.41 3.32638 10.62 3.75638 10.62C4.16638 10.62 4.55638 10.41 4.77638 10.07C5.13638 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z" fill="currentColor" />
                </svg>
            </div>
            <span className={cx("text-tertiary", size === "lg" ? "pt-0.5 text-lg md:pt-0" : size === "md" ? "pt-0.5 text-md md:pt-0 md:text-lg" : "text-md")}>{text}</span>
        </li>
    );
};

const features = [
    { icon: Scan, title: "OBD Diagnostics", desc: "Comprehensive vehicle diagnostics with instant trouble code reading" },
    { icon: Dataflow03, title: "AI-Powered Analysis", desc: "Machine learning identifies issues and predicts potential problems" },
    { icon: FileCheck02, title: "Multi-Point Inspection", desc: "Cover mechanical, electrical, and cosmetic conditions" },
    { icon: Share07, title: "Shareable Reports", desc: "Generate branded reports with unique links and QR codes" },
    { icon: Shield01, title: "Trust Badges", desc: "Add verification badges to your listings for customer confidence" },
    { icon: Star01, title: "Customer Portal", desc: "Give buyers access to vehicle history and service records" },
];

const benefits = [
    { metric: "156", label: "Reports Created" },
    { metric: "92%", label: "Trust Score Impact" },
    { metric: "2.8K", label: "Report Views" },
    { metric: "35%", label: "Faster Sales" },
];

const inspectionPoints = [
    { title: "Engine & Transmission", desc: "Complete powertrain analysis and diagnostics" },
    { title: "Brakes & Suspension", desc: "Safety system inspection and wear assessment" },
    { title: "Electrical Systems", desc: "Battery, alternator, and electronic components" },
    { title: "Body & Interior", desc: "Cosmetic condition and feature verification" },
];

const HeroSection = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            <img alt="Grid pattern" aria-hidden="true" loading="lazy" src="https://www.untitledui.com/patterns/light/grid-sm-desktop.svg" className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]" />
            <img alt="Grid pattern" aria-hidden="true" loading="lazy" src="https://www.untitledui.com/patterns/light/grid-sm-mobile.svg" className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]" />

            <Header />

            <section className="relative py-16 md:py-24">
                <div className="mx-auto flex w-full max-w-container flex-col justify-between gap-8 px-4 md:px-8 lg:flex-row lg:items-center">
                    <div className="flex max-w-3xl flex-1 flex-col items-start">
                        <img src={smartscanLogo.src} alt="SmartScan" className="mb-6 h-16 object-contain" />
                        
                        <Badge color="success" type="pill-color" size="md" className="mb-4">
                            Vehicle Diagnostics & Inspection
                        </Badge>

                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Build <span className="text-success-primary">Trust</span> With Every Vehicle
                        </h1>
                        <p className="mt-4 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            Advanced OBD diagnostics and AI-powered vehicle appraisals. Create comprehensive inspection reports that build customer confidence and accelerate sales.
                        </p>

                        <ul className="mt-8 flex shrink-0 flex-col gap-4 pl-2 lg:hidden">
                            <CheckItemText text="Instant OBD diagnostics" size="lg" color="success" />
                            <CheckItemText text="AI-powered condition analysis" size="lg" color="success" />
                            <CheckItemText text="Shareable inspection reports" size="lg" color="success" />
                        </ul>

                        <Form onSubmit={(e) => { e.preventDefault(); }} className="mt-8 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                            <Input isRequired size="md" name="email" type="email" wrapperClassName="py-0.5" placeholder="Enter your email" />
                            <Button type="submit" size="xl" iconTrailing={ArrowRight}>Request Demo</Button>
                        </Form>
                    </div>

                    <ul className="hidden shrink-0 flex-col gap-5 pb-6 pl-4 lg:flex">
                        <CheckItemText text="Instant OBD diagnostics" size="lg" color="success" />
                        <CheckItemText text="AI-powered condition analysis" size="lg" color="success" />
                        <CheckItemText text="Shareable inspection reports" size="lg" color="success" />
                    </ul>
                </div>

                <div className="relative mt-16 w-full max-w-container px-4 md:mx-auto md:px-8">
                    <div className="mx-auto flex justify-center">
                        <VideoPlayer
                            size="lg"
                            thumbnailUrl={videoThumbnail.src}
                            thumbnailAlt="Watch how SmartScan works — vehicle diagnostics demo"
                            src="/assets/videos/SmartScan-Appraisals.mp4"
                            className="aspect-video w-full overflow-hidden rounded-xl shadow-3xl md:max-w-240"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const BenefitsSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <h2 className="mb-12 text-center text-display-sm font-semibold text-primary md:mb-16 md:text-display-md">Platform Results</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {benefits.map((benefit, idx) => (
                        <div key={idx} className="flex flex-col items-center rounded-2xl bg-primary p-8 text-center shadow-lg ring-1 ring-secondary_alt">
                            <div className="text-display-md font-bold text-success-primary md:text-display-lg">{benefit.metric}</div>
                            <p className="mt-2 text-md text-tertiary">{benefit.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FeaturesSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col items-center text-center md:mb-16">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Complete Inspection Suite</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to inspect, document, and share vehicle condition.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div key={idx} className="flex flex-col rounded-2xl bg-primary p-8 shadow-lg ring-1 ring-secondary_alt transition-shadow hover:shadow-xl">
                                <FeaturedIcon icon={Icon} size="lg" color="success" theme="light" />
                                <h3 className="mt-5 text-lg font-semibold text-primary">{feature.title}</h3>
                                <p className="mt-2 text-md text-tertiary">{feature.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const InspectionSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                    <div>
                        <span className="text-sm font-semibold text-brand-secondary md:text-md">Multi-Point Inspection</span>
                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Comprehensive Coverage</h2>
                        <p className="mt-4 text-lg text-tertiary">Every inspection covers all critical vehicle systems to ensure nothing is missed.</p>

                        <ul className="mt-8 space-y-6">
                            {inspectionPoints.map((item, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <CheckCircle className="mt-1 size-6 shrink-0 text-fg-success-primary" />
                                    <div>
                                        <h3 className="font-semibold text-primary">{item.title}</h3>
                                        <p className="mt-1 text-md text-tertiary">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-primary p-8 shadow-lg ring-1 ring-secondary_alt md:p-12">
                        <FeaturedIcon icon={Shield01} size="xl" color="success" theme="light" />
                        <h3 className="mt-6 text-xl font-bold text-primary md:text-2xl">Trust Badge Program</h3>
                        <p className="mt-4 text-md text-tertiary">Add verification badges to your listings showing customers your vehicles have been thoroughly inspected and verified.</p>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-md text-tertiary">Customer Trust Impact</span>
                                <span className="font-semibold text-success-primary">+92%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full w-11/12 rounded-full bg-success-solid" />
                            </div>
                        </div>

                        <Button size="xl" className="mt-8 w-full" iconTrailing={ArrowRight}>Get Badge Code</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTASection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Ready to Build Customer Trust?</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">Join dealerships using SmartScan to create transparent, trustworthy vehicle listings.</p>
                    <Form onSubmit={(e) => { e.preventDefault(); }} className="mx-auto mt-8 flex w-full max-w-md flex-col items-stretch gap-4 md:mt-12 md:flex-row">
                        <Input isRequired size="md" name="email" type="email" wrapperClassName="py-0.5 flex-1" placeholder="your@email.com" />
                        <Button type="submit" size="xl">Free Demo</Button>
                    </Form>
                </div>
            </div>
        </section>
    );
};

const footerNavList = [
    { label: "Products", items: [{ label: "VinTraxx Capital", href: "/products/capital" }, { label: "SmartScan", href: "/products/smartscan" }, { label: "VinLane IMS", href: "/products/vinlane" }, { label: "VinClips", href: "/products/vinclips" }, { label: "Acquisition.io", href: "/products/acquisition" }] },
    { label: "Company", items: [{ label: "About us", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Press", href: "/press" }, { label: "News", href: "/news" }, { label: "Contact", href: "/contact" }] },
    { label: "Resources", items: [{ label: "Blog", href: "/blog" }, { label: "Help Center", href: "/help" }, { label: "Documentation", href: "/docs" }, { label: "Training", href: "/training" }, { label: "Support", href: "/support" }] },
    { label: "For Dealers", items: [{ label: "Independent Dealers", href: "/dealers/independent" }, { label: "Franchise Dealers", href: "/dealers/franchise" }, { label: "Dealer Groups", href: "/dealers/groups" }, { label: "Success Stories", href: "/success-stories" }] },
    { label: "Social", items: [{ label: "Twitter", href: "#" }, { label: "LinkedIn", href: "#" }, { label: "Facebook", href: "#" }, { label: "TikTok", href: "#" }, { label: "YouTube", href: "#" }] },
    { label: "Legal", items: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }, { label: "Cookies", href: "/cookies" }, { label: "Settings", href: "/settings" }] },
];

const FooterLarge = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Let's Revolutionize Your Dealership Together</h2>
                    <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Get in touch to see how VinTraxx can boost your operations and profits.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl">Contact Us</Button>
                        <Button size="xl">Request a Demo</Button>
                    </div>
                </div>
                <nav className="mt-12 md:mt-16">
                    <ul className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
                        {footerNavList.map((category) => (
                            <li key={category.label}>
                                <h4 className="text-sm font-semibold text-quaternary">{category.label}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (<li key={item.label}><Button color="link-gray" size="lg" href={item.href}>{item.label}</Button></li>))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row md:items-center">
                    <Link href="/"><UntitledLogo className="h-10" /></Link>
                    <p className="text-md text-quaternary">© 2025 Vintraxx. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default function SmartScanPage() {
    return (
        <div className="bg-primary">
            <HeroSection />
            <BenefitsSection />
            <SectionDivider />
            <FeaturesSection />
            <SectionDivider />
            <InspectionSection />
            <CTASection />
            <FooterLarge />
        </div>
    );
}
