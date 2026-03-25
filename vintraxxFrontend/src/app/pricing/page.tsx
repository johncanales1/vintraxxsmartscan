"use client";

import { Fragment } from "react";
import { CheckCircle, HelpCircle, LayersThree01, LayersTwo01, Minus, Zap } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import Link from "next/link";

const tiers = [
    { 
        name: "Starter", 
        priceMonthly: 299, 
        description: "Perfect for independent dealers getting started.",
        icon: Zap,
        features: [
            "VinLane IMS Basic",
            "Up to 50 vehicles",
            "Basic reporting",
            "Email support",
            "1 user seat",
        ]
    },
    {
        name: "Professional",
        highlighted: true,
        badge: "Most Popular",
        priceMonthly: 599,
        description: "Best for growing dealerships.",
        icon: LayersTwo01,
        features: [
            "VinLane IMS Pro",
            "Up to 200 vehicles",
            "SmartScan Diagnostics",
            "VinClips Video Marketing",
            "Advanced analytics",
            "Priority support",
            "5 user seats",
        ]
    },
    {
        name: "Enterprise",
        priceMonthly: 999,
        description: "For dealer groups and high-volume operations.",
        icon: LayersThree01,
        features: [
            "All Professional features",
            "Unlimited vehicles",
            "VinTraxx Recon",
            "Acquisition.io",
            "Auto Mall listing",
            "Custom integrations",
            "Dedicated account manager",
            "Unlimited user seats",
        ]
    },
];

const comparisonSections = [
    {
        name: "Inventory Management",
        features: [
            { name: "Vehicle listings", tiers: { Starter: "50", Professional: "200", Enterprise: "Unlimited" } },
            { name: "Photo management", tiers: { Starter: true, Professional: true, Enterprise: true } },
            { name: "Pricing tools", tiers: { Starter: "Basic", Professional: "Advanced", Enterprise: "Advanced" } },
            { name: "Market analysis", tiers: { Starter: false, Professional: true, Enterprise: true } },
        ],
    },
    {
        name: "Marketing & Sales",
        features: [
            { name: "VinClips video", tiers: { Starter: false, Professional: true, Enterprise: true } },
            { name: "Website integration", tiers: { Starter: "Basic", Professional: "Full", Enterprise: "Custom" } },
            { name: "Lead management", tiers: { Starter: true, Professional: true, Enterprise: true } },
            { name: "Auto Mall listing", tiers: { Starter: false, Professional: false, Enterprise: true } },
        ],
    },
    {
        name: "Operations",
        features: [
            { name: "SmartScan diagnostics", tiers: { Starter: false, Professional: true, Enterprise: true } },
            { name: "VinTraxx Recon", tiers: { Starter: false, Professional: false, Enterprise: true } },
            { name: "Acquisition.io", tiers: { Starter: false, Professional: false, Enterprise: true } },
            { name: "Custom workflows", tiers: { Starter: false, Professional: true, Enterprise: true } },
        ],
    },
    {
        name: "Support & Training",
        features: [
            { name: "Email support", tiers: { Starter: true, Professional: true, Enterprise: true } },
            { name: "Phone support", tiers: { Starter: false, Professional: true, Enterprise: true } },
            { name: "Dedicated manager", tiers: { Starter: false, Professional: false, Enterprise: true } },
            { name: "Onboarding training", tiers: { Starter: "Self-serve", Professional: "Guided", Enterprise: "White-glove" } },
        ],
    },
];

const footerNavList = [
    { label: "Products", items: [{ label: "VinTraxx Capital", href: "/products/capital" }, { label: "SmartScan", href: "/products/smartscan" }, { label: "VinLane IMS", href: "/products/vinlane" }, { label: "VinClips", href: "/products/vinclips" }, { label: "Acquisition.io", href: "/products/acquisition" }] },
    { label: "Company", items: [{ label: "About us", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Press", href: "/press" }, { label: "News", href: "/news" }, { label: "Contact", href: "/contact" }] },
    { label: "Resources", items: [{ label: "Blog", href: "/blog" }, { label: "Help Center", href: "/help" }, { label: "Documentation", href: "/docs" }, { label: "Training", href: "/training" }, { label: "Support", href: "/support" }] },
    { label: "For Dealers", items: [{ label: "Independent Dealers", href: "/dealers/independent" }, { label: "Franchise Dealers", href: "/dealers/franchise" }, { label: "Dealer Groups", href: "/dealers/groups" }, { label: "Success Stories", href: "/success-stories" }] },
    { label: "Social", items: [{ label: "Twitter", href: "#" }, { label: "LinkedIn", href: "#" }, { label: "Facebook", href: "#" }, { label: "TikTok", href: "#" }, { label: "YouTube", href: "#" }] },
    { label: "Legal", items: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }, { label: "Cookies", href: "/cookies" }, { label: "Settings", href: "/settings" }] },
];

const PricingHeader = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex w-full max-w-3xl flex-col">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Pricing</span>
                    <h1 className="mt-3 text-display-md font-semibold text-primary md:text-display-lg">Simple, transparent pricing</h1>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">
                        Choose the plan that fits your dealership. All plans include a 14-day free trial.
                    </p>
                </div>
            </div>
        </section>
    );
};

const PricingCards = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={cx(
                                "relative flex flex-col rounded-2xl p-8",
                                tier.highlighted
                                    ? "ring-2 ring-brand-primary"
                                    : "bg-secondary ring-1 ring-secondary_alt"
                            )}
                            style={tier.highlighted ? { backgroundColor: '#254268' } : undefined}
                        >
                            {tier.badge && (
                                <Badge size="md" type="pill-color" color="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    {tier.badge}
                                </Badge>
                            )}
                            
                            <div className="flex items-center gap-3">
                                <FeaturedIcon 
                                    icon={tier.icon} 
                                    color={tier.highlighted ? "gray" : "brand"} 
                                    theme="modern" 
                                    size="md" 
                                />
                                <h3 className={cx(
                                    "text-xl font-semibold",
                                    tier.highlighted ? "text-white" : "text-primary"
                                )}>
                                    {tier.name}
                                </h3>
                            </div>
                            
                            <p className={cx(
                                "mt-4 text-md",
                                tier.highlighted ? "text-white/80" : "text-tertiary"
                            )}>
                                {tier.description}
                            </p>
                            
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className={cx(
                                    "text-display-md font-semibold",
                                    tier.highlighted ? "text-white" : "text-primary"
                                )}>
                                    ${tier.priceMonthly}
                                </span>
                                <span className={cx(
                                    "text-md",
                                    tier.highlighted ? "text-white/80" : "text-tertiary"
                                )}>
                                    /month
                                </span>
                            </div>
                            
                            <ul className="mt-8 flex flex-col gap-4">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <CheckCircle className={cx(
                                            "size-5 shrink-0 mt-0.5",
                                            tier.highlighted ? "text-white" : "text-fg-success-primary"
                                        )} />
                                        <span className={cx(
                                            "text-md",
                                            tier.highlighted ? "text-white" : "text-tertiary"
                                        )}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            
                            <div className="mt-8 flex flex-col gap-3">
                                <Button 
                                    size="xl" 
                                    color={tier.highlighted ? "secondary" : "primary"}
                                    className="w-full"
                                >
                                    Get started
                                </Button>
                                <Button 
                                    size="xl" 
                                    color={tier.highlighted ? "tertiary" : "secondary"}
                                    className="w-full"
                                >
                                    Contact sales
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ComparisonTable = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mb-12 text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Compare plans</h2>
                    <p className="mt-4 text-lg text-tertiary">See which plan is right for your dealership.</p>
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="pb-4 text-left text-sm font-semibold text-tertiary">Features</th>
                                {tiers.map((tier) => (
                                    <th key={tier.name} className="pb-4 text-center">
                                        <span className={cx(
                                            "text-lg font-semibold",
                                            tier.highlighted ? "text-brand-primary" : "text-primary"
                                        )}>
                                            {tier.name}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonSections.map((section) => (
                                <Fragment key={section.name}>
                                    <tr>
                                        <td colSpan={4} className="pt-8 pb-4 text-sm font-semibold text-brand-secondary">
                                            {section.name}
                                        </td>
                                    </tr>
                                    {section.features.map((feature, idx) => (
                                        <tr key={feature.name} className={cx(idx % 2 === 0 && "bg-primary")}>
                                            <td className="py-4 px-4 text-sm text-primary">{feature.name}</td>
                                            {tiers.map((tier) => (
                                                <td key={tier.name} className="py-4 text-center">
                                                    {typeof feature.tiers[tier.name as keyof typeof feature.tiers] === "string" ? (
                                                        <span className="text-sm text-tertiary">
                                                            {feature.tiers[tier.name as keyof typeof feature.tiers]}
                                                        </span>
                                                    ) : feature.tiers[tier.name as keyof typeof feature.tiers] ? (
                                                        <CheckCircle className="mx-auto size-5 text-fg-success-primary" />
                                                    ) : (
                                                        <Minus className="mx-auto size-5 text-fg-disabled" />
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-8">
                    {tiers.map((tier) => (
                        <div key={tier.name} className="rounded-2xl bg-primary p-6 ring-1 ring-secondary_alt">
                            <h3 className="text-lg font-semibold text-primary mb-4">{tier.name}</h3>
                            {comparisonSections.map((section) => (
                                <div key={section.name} className="mb-6 last:mb-0">
                                    <h4 className="text-sm font-semibold text-brand-secondary mb-3">{section.name}</h4>
                                    <ul className="space-y-2">
                                        {section.features.map((feature) => (
                                            <li key={feature.name} className="flex justify-between text-sm">
                                                <span className="text-tertiary">{feature.name}</span>
                                                <span className="text-primary font-medium">
                                                    {typeof feature.tiers[tier.name as keyof typeof feature.tiers] === "string" 
                                                        ? feature.tiers[tier.name as keyof typeof feature.tiers]
                                                        : feature.tiers[tier.name as keyof typeof feature.tiers] 
                                                            ? "✓" 
                                                            : "—"
                                                    }
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQSection = () => {
    const faqs = [
        { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle." },
        { q: "Is there a contract?", a: "No long-term contracts. All plans are month-to-month and you can cancel anytime." },
        { q: "Do you offer discounts for annual billing?", a: "Yes! Save 20% when you pay annually instead of monthly." },
        { q: "What happens after my free trial?", a: "After your 14-day trial, you'll be billed for your chosen plan. You can cancel anytime during the trial with no charge." },
    ];

    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mb-12 text-center">
                    <FeaturedIcon icon={HelpCircle} size="lg" color="brand" theme="light" className="mx-auto" />
                    <h2 className="mt-5 text-display-sm font-semibold text-primary md:text-display-md">Frequently asked questions</h2>
                    <p className="mt-4 text-lg text-tertiary">Everything you need to know about our pricing.</p>
                </div>
                <div className="mx-auto max-w-3xl space-y-6">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="rounded-2xl bg-secondary p-6 ring-1 ring-secondary_alt">
                            <h3 className="text-lg font-semibold text-primary">{faq.q}</h3>
                            <p className="mt-2 text-md text-tertiary">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FooterLarge = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Ready to get started?</h2>
                    <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Start your 14-day free trial today. No credit card required.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl">Contact Sales</Button>
                        <Button size="xl">Start Free Trial</Button>
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

export default function PricingPage() {
    return (
        <div className="bg-primary">
            <Header />
            
            <PricingHeader />
            
            <PricingCards />
            
            <SectionDivider />
            
            <ComparisonTable />
            
            <SectionDivider />
            
            <FAQSection />
            
            <FooterLarge />
        </div>
    );
}
