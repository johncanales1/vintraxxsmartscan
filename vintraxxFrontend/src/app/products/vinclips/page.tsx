"use client";

import { ArrowRight, CheckCircle, CurrencyDollar, Play, Share07, Stars02, TrendUp01, Users01, Zap } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import Link from "next/link";
import vinclipsLogo from "@/assets/logo/brands/vinclips.png";
import dashboardImage from "@/assets/images/dashboard.png";

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
    { icon: Stars02, title: "AI-Powered Videos", desc: "Automatically create professional vehicle videos from your inventory" },
    { icon: Share07, title: "Multi-Platform Distribution", desc: "Auto-post to TikTok, Facebook, Instagram, and YouTube" },
    { icon: TrendUp01, title: "Viral Reach", desc: "3.2x more reach compared to traditional advertising" },
    { icon: Users01, title: "Organic Leads", desc: "187% increase in organic lead generation" },
    { icon: CurrencyDollar, title: "Lower Acquisition Cost", desc: "64% lower cost per customer acquisition" },
    { icon: Zap, title: "Daily Content", desc: "Automated posting every single day without manual work" },
];

const stats = [
    { metric: "3.2x", label: "More Reach Than Traditional Ads" },
    { metric: "187%", label: "Organic Lead Increase" },
    { metric: "64%", label: "Lower Cost Per Acquisition" },
    { metric: "4x", label: "More Engagement Than Posts" },
];

const howItWorks = [
    { step: "1", title: "Daily Video Creation", desc: "AI automatically creates professional videos of your hottest inventory" },
    { step: "2", title: "TikTok Publishing", desc: "Videos go live daily on your TikTok account to millions of viewers" },
    { step: "3", title: "Multi-Platform Sharing", desc: "Same content automatically pushed to Facebook and Instagram" },
    { step: "4", title: "Organic Leads", desc: "Track engagement and watch quality leads roll in" },
];

const HeroSection = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-[#00f5d4]/5 via-transparent to-[#f72585]/5" />

            <Header />

            <section className="relative py-16 md:py-24">
                <div className="mx-auto flex w-full max-w-container flex-col justify-between gap-8 px-4 md:px-8 lg:flex-row lg:items-center">
                    <div className="flex max-w-3xl flex-1 flex-col items-start">
                        <img src={vinclipsLogo.src} alt="VinClips" className="mb-6 h-16 object-contain" />
                        
                        <Badge color="pink" type="pill-color" size="md" className="mb-4">
                            Video Marketing Automation
                        </Badge>

                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Daily Videos That <span className="bg-gradient-to-r from-[#00f5d4] via-[#f72585] to-[#ffd60a] bg-clip-text text-transparent">Go Viral</span>
                        </h1>
                        <p className="mt-4 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            VinClips automatically creates professional vehicle videos and distributes them across TikTok, Facebook, and Instagram—driving real leads without the production costs.
                        </p>

                        <ul className="mt-8 flex shrink-0 flex-col gap-4 pl-2 lg:hidden">
                            <CheckItemText text="Automated daily video posting" size="lg" color="success" />
                            <CheckItemText text="Multi-platform distribution" size="lg" color="success" />
                            <CheckItemText text="Zero manual work required" size="lg" color="success" />
                        </ul>

                        <Form onSubmit={(e) => { e.preventDefault(); }} className="mt-8 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                            <Input isRequired size="md" name="email" type="email" wrapperClassName="py-0.5" placeholder="Enter your email" />
                            <Button type="submit" size="xl" iconTrailing={ArrowRight}>Learn More</Button>
                        </Form>
                    </div>

                    <ul className="hidden shrink-0 flex-col gap-5 pb-6 pl-4 lg:flex">
                        <CheckItemText text="Automated daily video posting" size="lg" color="success" />
                        <CheckItemText text="Multi-platform distribution" size="lg" color="success" />
                        <CheckItemText text="Zero manual work required" size="lg" color="success" />
                    </ul>
                </div>

                <div className="relative mt-16 w-full max-w-container px-4 md:mx-auto md:px-8">
                    <div className="rounded-2xl bg-gradient-to-br from-[#00f5d4]/20 to-[#f72585]/20 p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00f5d4] via-[#f72585] to-[#ffd60a]">
                                <Play className="size-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-primary">TikTok</span>
                        </div>
                        <p className="mb-6 text-tertiary">Post daily vehicle videos to 1 billion+ active users</p>
                        <div className="space-y-3">
                            {["Automated daily posting", "Professional video quality", "Multi-platform distribution", "Organic lead generation"].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="size-5 text-fg-success-primary" />
                                    <span className="text-secondary">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatsSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <h2 className="mb-12 text-center text-display-sm font-semibold text-primary md:mb-16 md:text-display-md">Results Dealers See</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center rounded-2xl bg-primary p-8 text-center shadow-lg ring-1 ring-secondary_alt">
                            <div className="bg-gradient-to-r from-[#00f5d4] to-[#f72585] bg-clip-text text-display-md font-bold text-transparent md:text-display-lg">{stat.metric}</div>
                            <p className="mt-2 text-md text-tertiary">{stat.label}</p>
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
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Powerful Video Marketing</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Turn your inventory into viral social media content automatically.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div key={idx} className="flex flex-col rounded-2xl bg-primary p-8 shadow-lg ring-1 ring-secondary_alt transition-shadow hover:shadow-xl">
                                <FeaturedIcon icon={Icon} size="lg" color="brand" theme="light" />
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

const HowItWorksSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col items-center text-center md:mb-16">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">How It Works</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Simple 4-Step Process</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">From inventory to viral content in minutes.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {howItWorks.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center rounded-2xl bg-primary p-8 text-center shadow-lg ring-1 ring-secondary_alt">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00f5d4] to-[#f72585] font-bold text-white text-xl">{item.step}</div>
                            <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                            <p className="mt-2 text-sm text-tertiary">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const IntegrationSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                    <div>
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Integrates with VinLane IMS</h2>
                        <ul className="mt-8 space-y-6">
                            {[
                                { title: "Real-Time Sync", desc: "Your hottest inventory is automatically featured" },
                                { title: "Complete Automation", desc: "Zero manual work—videos post daily without you" },
                                { title: "Lead Tracking", desc: "See which videos drive the most engagement" },
                                { title: "Cost Control", desc: "Flat monthly fee, unlimited videos" },
                            ].map((item, idx) => (
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
                    <div className="rounded-2xl bg-gradient-to-br from-[#00f5d4]/10 to-[#f72585]/10 p-8 md:p-12">
                        <TrendUp01 className="mb-6 size-12 text-[#00f5d4]" />
                        <h3 className="text-2xl font-bold text-primary">Increase Social Media Reach</h3>
                        <p className="mt-4 text-tertiary">Stop struggling with social media. VinClips turns your inventory into viral content automatically.</p>
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-md text-tertiary">Video Posts Per Month</span>
                                <span className="font-semibold text-[#00f5d4]">30</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full w-full rounded-full bg-gradient-to-r from-[#00f5d4] to-[#f72585]" />
                            </div>
                        </div>
                        <Button size="xl" className="mt-8 w-full" iconTrailing={ArrowRight}>Learn More</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTASection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Ready to Dominate Social Media?</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">Join dealerships using VinClips to generate 4x more engagement without extra effort.</p>
                    <Form onSubmit={(e) => { e.preventDefault(); }} className="mx-auto mt-8 flex w-full max-w-md flex-col items-stretch gap-4 md:mt-12 md:flex-row">
                        <Input isRequired size="md" name="email" type="email" wrapperClassName="py-0.5 flex-1" placeholder="your@email.com" />
                        <Button type="submit" size="xl">Learn More</Button>
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

export default function VinClipsPage() {
    return (
        <div className="bg-primary">
            <HeroSection />
            <StatsSection />
            <SectionDivider />
            <FeaturesSection />
            <SectionDivider />
            <HowItWorksSection />
            <IntegrationSection />
            <CTASection />
            <FooterLarge />
        </div>
    );
}
