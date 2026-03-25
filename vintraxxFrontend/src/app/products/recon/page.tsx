"use client";

import { ArrowRight, BarChartSquare02, Building07, CheckCircle, ClipboardCheck, Clock, CurrencyDollar, Tool02, TrendUp01, Users01 } from "@untitledui/icons";
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
import reconLogo from "@/assets/logo/brands/recon.png";
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
    { icon: ClipboardCheck, title: "Kanban Task Board", desc: "Drag-and-drop task management with visual workflow stages" },
    { icon: Building07, title: "Vendor Management", desc: "Track vendors, performance metrics, and cost efficiency" },
    { icon: Clock, title: "Time Tracking", desc: "Monitor task duration and optimize recon cycle times" },
    { icon: CurrencyDollar, title: "Cost Management", desc: "Track estimated vs actual costs for every repair" },
    { icon: Users01, title: "Team Collaboration", desc: "Assign tasks, set priorities, and coordinate workflows" },
    { icon: BarChartSquare02, title: "Analytics Dashboard", desc: "Real-time KPIs and performance reporting" },
];

const benefits = [
    { metric: "40%", label: "Faster Recon Cycles" },
    { metric: "25%", label: "Cost Reduction" },
    { metric: "60h", label: "Saved Per Month" },
    { metric: "98%", label: "Task Completion Rate" },
];

const workflowStages = [
    { title: "Pending", desc: "New tasks awaiting assignment", color: "bg-gray-500" },
    { title: "In Progress", desc: "Active work being performed", color: "bg-blue-500" },
    { title: "Awaiting Parts", desc: "Blocked waiting for parts delivery", color: "bg-amber-500" },
    { title: "Awaiting Approval", desc: "Ready for quality review", color: "bg-purple-500" },
    { title: "Completed", desc: "Finished and approved tasks", color: "bg-success-solid" },
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
                        <img src={reconLogo.src} alt="VinTraxx Recon" className="mb-6 h-16 object-contain" />
                        
                        <Badge color="warning" type="pill-color" size="md" className="mb-4">
                            Reconditioning Management
                        </Badge>

                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Streamline Your <span className="text-warning-primary">Recon Process</span>
                        </h1>
                        <p className="mt-4 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            Digital task management, vendor coordination, and quality control—all in one platform. Reduce recon time, cut costs, and get vehicles frontline-ready faster.
                        </p>

                        <ul className="mt-8 flex shrink-0 flex-col gap-4 pl-2 lg:hidden">
                            <CheckItemText text="Kanban-style task management" size="lg" color="success" />
                            <CheckItemText text="Vendor performance tracking" size="lg" color="success" />
                            <CheckItemText text="Real-time cost monitoring" size="lg" color="success" />
                        </ul>

                        <Form onSubmit={(e) => { e.preventDefault(); }} className="mt-8 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start">
                            <Input isRequired size="md" name="email" type="email" wrapperClassName="py-0.5" placeholder="Enter your email" />
                            <Button type="submit" size="xl" iconTrailing={ArrowRight}>Request Demo</Button>
                        </Form>
                    </div>

                    <ul className="hidden shrink-0 flex-col gap-5 pb-6 pl-4 lg:flex">
                        <CheckItemText text="Kanban-style task management" size="lg" color="success" />
                        <CheckItemText text="Vendor performance tracking" size="lg" color="success" />
                        <CheckItemText text="Real-time cost monitoring" size="lg" color="success" />
                    </ul>
                </div>

                <div className="relative mt-16 w-full max-w-container px-4 md:mx-auto md:px-8">
                    <div className="overflow-hidden rounded-2xl ring-4 ring-screen-mockup-border md:ring-8">
                        <img src={dashboardImage.src} alt="VinTraxx Recon Dashboard" className="w-full object-cover" />
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
                <h2 className="mb-12 text-center text-display-sm font-semibold text-primary md:mb-16 md:text-display-md">Results Dealers Achieve</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {benefits.map((benefit, idx) => (
                        <div key={idx} className="flex flex-col items-center rounded-2xl bg-primary p-8 text-center shadow-lg ring-1 ring-secondary_alt">
                            <div className="text-display-md font-bold text-warning-primary md:text-display-lg">{benefit.metric}</div>
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
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Powerful Recon Tools</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to manage reconditioning efficiently.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div key={idx} className="flex flex-col rounded-2xl bg-primary p-8 shadow-lg ring-1 ring-secondary_alt transition-shadow hover:shadow-xl">
                                <FeaturedIcon icon={Icon} size="lg" color="warning" theme="light" />
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

const WorkflowSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col items-center text-center md:mb-16">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Workflow</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Visual Task Management</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Drag-and-drop Kanban board keeps every task visible and on track.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    {workflowStages.map((stage, idx) => (
                        <div key={idx} className="flex flex-col rounded-xl bg-primary p-6 shadow-md ring-1 ring-secondary_alt">
                            <div className="mb-3 flex items-center gap-2">
                                <div className={cx("size-3 rounded-full", stage.color)} />
                                <h3 className="font-semibold text-primary">{stage.title}</h3>
                            </div>
                            <p className="text-sm text-tertiary">{stage.desc}</p>
                        </div>
                    ))}
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
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Ready to Streamline Your Recon?</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">Join dealerships using VinTraxx Recon to cut cycle times and boost efficiency.</p>
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
    { label: "Products", items: [{ label: "VinLane IMS", href: "/products/vinlane" }, { label: "VinTraxx Recon", href: "/products/recon" }, { label: "SmartScan", href: "/products/smartscan" }, { label: "VinClips", href: "/products/vinclips" }, { label: "Auto Mall", href: "/products/automall" }, { label: "Acquisition.io", href: "/products/acquisition" }] },
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
                                    {category.items.map((item) => (
                                        <li key={item.label}><Button color="link-gray" size="lg" href={item.href}>{item.label}</Button></li>
                                    ))}
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

export default function ReconPage() {
    return (
        <div className="bg-primary">
            <HeroSection />
            <BenefitsSection />
            <SectionDivider />
            <FeaturesSection />
            <SectionDivider />
            <WorkflowSection />
            <CTASection />
            <FooterLarge />
        </div>
    );
}
