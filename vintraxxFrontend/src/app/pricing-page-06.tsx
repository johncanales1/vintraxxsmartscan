"use client";

import { type FC, Fragment } from "react";
import { CheckCircle, HelpCircle, LayersThree01, LayersTwo01, Minus, Zap } from "@untitledui/icons";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Slider } from "@/components/base/slider/slider";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { IPhoneMockup } from "@/components/shared-assets/iphone-mockup";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

type Tier = {
    name: string;
    canChatToSales?: boolean;
    highlighted?: boolean;
    badge?: string;
    href?: string;
    priceMonthly: number;
    description: string;
    icon?: FC;
};
type Section = { name: string; features: { name: string; tooltip: { title: string; description: string }; tiers: Record<string, boolean | string> }[] };

const tiers: Tier[] = [
    { name: "Basic", href: "#", priceMonthly: 10, description: "Our most popular plan.", icon: Zap },
    {
        name: "Business",
        highlighted: true,
        href: "#",
        priceMonthly: 20,
        description: "Best for growing teams.",
        icon: LayersTwo01,
    },
    {
        name: "Enterprise",
        href: "#",
        priceMonthly: 40,
        description: "Best for large teams.",
        icon: LayersThree01,
    },
];

const sections2: Section[] = [
    {
        name: "Overview",
        features: [
            {
                name: "Basic features",
                tooltip: {
                    title: "Core platform tools",
                    description: "Access to essential tools required to manage your workspace and start using the platform.",
                },
                tiers: { Basic: true, Business: true, Enterprise: true },
            },
            {
                name: "Users",
                tooltip: {
                    title: "Manage team members",
                    description: "Add, remove, and manage users with control over access and permissions",
                },
                tiers: { Basic: "10", Business: "20", Enterprise: "Unlimited" },
            },
            {
                name: "Individual data",
                tooltip: {
                    title: "User-level insights",
                    description: "View data and activity specific to individual users in your workspace.",
                },
                tiers: { Basic: "20 GB", Business: "40 GB", Enterprise: "Unlimited" },
            },
            {
                name: "Support",
                tooltip: {
                    title: "Customer support access",
                    description: "Includes access to our help center, email support, and in-app assistance during business hours.",
                },
                tiers: { Basic: true, Business: true, Enterprise: true },
            },
            {
                name: "Automated workflows",
                tooltip: {
                    title: "Streamline recurring tasks",
                    description: "Set up workflows that automate repetitive actions to save time and reduce manual effort.",
                },
                tiers: { Business: true, Enterprise: true },
            },
            {
                name: "200+ integrations",
                tooltip: {
                    title: "Connect your tools",
                    description: "Integrate with 200+ apps like Slack, Google Workspace, and Salesforce for a seamless workflow.",
                },
                tiers: { Business: true, Enterprise: true },
            },
        ],
    },
    {
        name: "Reporting and analytics",
        features: [
            {
                name: "Analytics",
                tooltip: {
                    title: "Platform usage insights",
                    description: "Monitor trends, usage patterns, and key metrics across your account.",
                },
                tiers: { Basic: "Basic", Business: "Advanced", Enterprise: "Advanced" },
            },
            {
                name: "Export reports",
                tooltip: {
                    title: "Downloadable reporting",
                    description: "Export reports as CSV or PDF files for offline analysis and sharing.",
                },
                tiers: { Basic: true, Business: true, Enterprise: true },
            },
            {
                name: "Scheduled reports",
                tooltip: {
                    title: "Automated report delivery",
                    description: "Set up reports to be generated and emailed at regular intervals.",
                },
                tiers: { Basic: true, Business: true, Enterprise: true },
            },
            {
                name: "API Access",
                tooltip: {
                    title: "Build with our API",
                    description: "Use our REST API to programmatically interact with data, users, and workflows.",
                },
                tiers: { Business: true, Enterprise: true },
            },
            {
                name: "Advanced reports",
                tooltip: {
                    title: "Deeper analytics tools",
                    description: "Create custom visualizations, filters, and drilldowns for more complex reporting needs.",
                },
                tiers: { Business: true, Enterprise: true },
            },
            {
                name: "Saved reports",
                tooltip: {
                    title: "Quick access to key data",
                    description: "Save and reuse frequently used report configurations for fast insights.",
                },
                tiers: { Business: true, Enterprise: true },
            },
            {
                name: "Customer properties",
                tooltip: {
                    title: "Track customer attributes",
                    description: "Define and manage custom data points for each customer in your system.",
                },
                tiers: { Enterprise: true },
            },
            {
                name: "Custom fields",
                tooltip: {
                    title: "Flexible data structure",
                    description: "Add custom fields to users, reports, or properties to tailor the platform to your needs.",
                },
                tiers: { Enterprise: true },
            },
        ],
    },
    {
        name: "User access",
        features: [
            {
                name: "SSO/SAML authentication",
                tooltip: {
                    title: "Enterprise-grade login",
                    description: "Enable secure, single sign-on (SSO) with identity providers using SAML 2.0.",
                },
                tiers: { Basic: true, Business: true, Enterprise: true },
            },
            {
                name: "Advanced permissions",
                tooltip: {
                    title: "Granular access control",
                    description: "Control who can view, edit, or manage specific areas and features within the platform.",
                },
                tiers: { Business: true, Enterprise: true },
            },
            {
                name: "Audit log",
                tooltip: {
                    title: "Track account activity",
                    description: "Keep a detailed history of user actions and changes across your organization.",
                },
                tiers: { Enterprise: true },
            },
            {
                name: "Data history",
                tooltip: {
                    title: "Access historical records",
                    description: "View changes and trends over time with historical data access.",
                },
                tiers: { Enterprise: true },
            },
        ],
    },
];

const footerNavList = [
    {
        label: "Product",
        items: [
            { label: "Overview", href: "#" },
            { label: "Features", href: "#" },
            {
                label: "Solutions",
                href: "#",
                badge: (
                    <Badge color="gray" type="modern" size="sm" className="ml-1">
                        New
                    </Badge>
                ),
            },
            { label: "Tutorials", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Releases", href: "#" },
        ],
    },
    {
        label: "Company",
        items: [
            { label: "About us", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Press", href: "#" },
            { label: "News", href: "#" },
            { label: "Media kit", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
    {
        label: "Resources",
        items: [
            { label: "Blog", href: "#" },
            { label: "Newsletter", href: "#" },
            { label: "Events", href: "#" },
            { label: "Help centre", href: "#" },
            { label: "Tutorials", href: "#" },
            { label: "Support", href: "#" },
        ],
    },
    {
        label: "Use cases",
        items: [
            { label: "Startups", href: "#" },
            { label: "Enterprise", href: "#" },
            { label: "Government", href: "#" },
            { label: "SaaS centre", href: "#" },
            { label: "Marketplaces", href: "#" },
            { label: "Ecommerce", href: "#" },
        ],
    },
    {
        label: "Social",
        items: [
            { label: "Twitter", href: "#" },
            { label: "LinkedIn", href: "#" },
            { label: "Facebook", href: "#" },
            { label: "GitHub", href: "#" },
            { label: "AngelList", href: "#" },
            { label: "Dribbble", href: "#" },
        ],
    },
    {
        label: "Legal",
        items: [
            { label: "Terms", href: "#" },
            { label: "Privacy", href: "#" },
            { label: "Cookies", href: "#" },
            { label: "Licenses", href: "#" },
            { label: "Settings", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
];

const BannerSlimBrandFullWidth = () => {
    return (
        <div className="relative border-b border-brand_alt bg-brand-section_subtle md:border-brand">
            <div className="p-4 md:py-3.5">
                <div className="flex flex-col gap-0.5 md:flex-row md:justify-center md:gap-1.5 md:text-center">
                    <p className="pr-8 text-md font-semibold text-primary_on-brand md:truncate md:pr-0">We've just launched a new feature!</p>
                    <p className="text-md text-tertiary_on-brand md:truncate">
                        Check out the{" "}
                        <a
                            href="#"
                            className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            new dashboard
                        </a>
                        .
                    </p>
                </div>
            </div>
            <div className="absolute top-2 right-2 md:top-1.5 md:right-2">
                <CloseButton size="md" theme="dark" label="Dismiss" />
            </div>
        </div>
    );
};

const PricingLargeTable02 = () => {
    return (
        <section className="overflow-hidden bg-primary">
            <div className="mx-auto max-w-container px-4 py-16 md:px-8 md:py-24">
                <div className="flex w-full max-w-3xl flex-col">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Pricing</span>

                    <h2 className="mt-3 text-display-md font-semibold text-primary md:text-display-lg">Simple, transparent pricing</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">
                        We believe Untitled should be accessible to all companies, no matter the size.
                    </p>
                    <Tabs className="hidden md:flex">
                        <TabList
                            type="button-border"
                            size="md"
                            items={[
                                { id: "monthly", label: "Monthly billing" },
                                { id: "annually", label: "Annual billing" },
                            ]}
                            className="w-max md:mt-12"
                        />
                    </Tabs>
                </div>
            </div>

            <div className="mx-auto h-14 w-full max-w-container px-4 md:px-8">
                <div className="h-14 w-full px-4 md:pr-0">
                    <Slider
                        labelPosition="bottom"
                        minValue={1}
                        maxValue={12}
                        defaultValue={[1, 12]}
                        labelFormatter={(value) => `${value} ${value === 1 ? "user" : "users"}`}
                    />
                </div>
            </div>

            <div className="w-full py-16 md:px-8 md:py-24 lg:mx-auto lg:max-w-container">
                {/* xs to lg */}
                <div className="space-y-16 lg:hidden">
                    {tiers.map((tier) => (
                        <section key={tier.name}>
                            <div className="mb-8 flex flex-col px-4">
                                <FeaturedIcon icon={Zap} color="gray" theme="modern" size="md" />
                                <p key={tier.name} className="mt-5 flex items-center gap-2 text-xl font-semibold text-brand-secondary">
                                    {tier.name} plan
                                    {tier.badge && (
                                        <Badge size="md" type="pill-color" color="brand">
                                            {tier.badge}
                                        </Badge>
                                    )}
                                </p>
                                <p className="mt-2 text-display-md font-semibold text-primary">${tier.priceMonthly}/mth</p>
                                <p className="mt-2 text-md text-tertiary">{tier.description}</p>
                                <div className="mt-8 flex flex-col gap-3">
                                    <Button size="xl">Get started</Button>
                                </div>
                            </div>

                            {sections2.map((section, index) => (
                                <table key={section.name} className="mb-8 w-full last:mb-0">
                                    <caption className={cx("px-4 pb-4 text-left text-sm font-semibold text-brand-secondary", index === 0 && "sr-only")}>
                                        {section.name}
                                    </caption>
                                    <thead>
                                        <tr>
                                            <th className="sr-only" scope="col">
                                                Feature
                                            </th>
                                            <th className="sr-only" scope="col">
                                                Included
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.features.map((feature, index) => (
                                            <tr key={feature.name} className={cx(index % 2 === 0 && "bg-secondary_alt")}>
                                                <th className="flex py-4.5 pl-4 text-left text-sm font-medium text-primary" scope="row">
                                                    {feature.name}
                                                </th>
                                                <td className="py-4.5 pr-4">
                                                    <div className="flex items-center justify-end text-right">
                                                        {typeof feature.tiers[tier.name] === "string" ? (
                                                            <span className="block text-sm text-tertiary">{feature.tiers[tier.name]}</span>
                                                        ) : (
                                                            <>
                                                                {feature.tiers[tier.name] === true ? (
                                                                    <CheckCircle className="-my-1 size-6 text-fg-success-primary" />
                                                                ) : (
                                                                    <Minus className="ml-auto size-5 text-fg-disabled" aria-hidden="true" />
                                                                )}

                                                                <span className="sr-only">{feature.tiers[tier.name] === true ? "Yes" : "No"}</span>
                                                            </>
                                                        )}{" "}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ))}

                            <div className="mt-8 flex flex-col gap-3 px-4">
                                <Button size="xl">Get started</Button>
                                {tier.canChatToSales && (
                                    <Button color="secondary" size="xl">
                                        Chat to sales
                                    </Button>
                                )}
                            </div>
                        </section>
                    ))}
                </div>

                {/* lg+ */}
                <div className="max-lg:hidden">
                    <table className="h-px w-full table-fixed">
                        <caption className="sr-only">Pricing plan comparison</caption>
                        <thead>
                            <tr>
                                <th scope="col">
                                    <span className="sr-only">Feature by plans</span>
                                </th>
                                {tiers.map((tier) => (
                                    <th key={tier.name} className={cx("relative w-1/4 px-6 pt-6 pb-2")} scope="col">
                                        {tier.highlighted && (
                                            <div className="pointer-events-none absolute -inset-x-px inset-y-0 rounded-t-2xl border-x-2 border-t-2 border-brand"></div>
                                        )}
                                        <div className="flex flex-col items-center gap-5 text-center">
                                            <FeaturedIcon icon={tier.icon} color="gray" theme="modern" size="md" />
                                            <p className="inline-flex items-center gap-2 text-xl font-semibold text-brand-secondary">
                                                {tier.name} plan
                                                {tier.badge && (
                                                    <Badge size="md" type="pill-color" color="brand">
                                                        {tier.badge}
                                                    </Badge>
                                                )}
                                            </p>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th scope="row"></th>
                                {tiers.map((tier) => (
                                    <td key={tier.name} className={cx("h-full px-6 pb-8 align-top md:pb-10", tier.highlighted && "border-x-2 border-brand")}>
                                        <div className="flex h-full flex-col items-center justify-between text-center">
                                            <div className="flex flex-col">
                                                <p className="text-display-lg font-semibold text-primary">${tier.priceMonthly}/mth</p>
                                                <p className="mt-2 text-md text-tertiary">{tier.description}</p>
                                            </div>
                                            <div className="mt-8 flex w-full flex-col gap-3">
                                                <Button size="xl">Get started</Button>
                                            </div>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            {sections2.map((section, index) => (
                                <Fragment key={section.name}>
                                    <tr className={cx(index === 0 && "sr-only")}>
                                        <th
                                            scope="colgroup"
                                            className={cx(index > 0 ? "pt-10" : "pt-0", "px-6 pb-4 text-left text-sm font-semibold text-brand-secondary")}
                                        >
                                            {section.name}
                                        </th>
                                        {tiers.map((tier) => (
                                            <td key={tier.name} className={cx("px-6 pb-4", tier.highlighted && "border-x-2 border-brand")}></td>
                                        ))}
                                    </tr>
                                    {section.features.map((feature, index) => (
                                        <tr key={feature.name} className={cx(index % 2 === 0 && "bg-secondary_alt")}>
                                            <th className="px-6 py-5.5 text-left text-sm font-medium text-primary" scope="row">
                                                {feature.name}
                                                <Tooltip title={feature.tooltip.title} description={feature.tooltip.description} delay={0} closeDelay={0}>
                                                    <TooltipTrigger className="cursor-pointer text-fg-quaternary transition duration-100 hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover">
                                                        <HelpCircle className="ml-1 inline-block size-4" />
                                                    </TooltipTrigger>
                                                </Tooltip>
                                            </th>
                                            {tiers.map((tier) => (
                                                <td key={tier.name} className={cx("px-6 py-5", tier.highlighted && "border-x-2 border-brand")}>
                                                    <div className="flex items-center justify-center text-center">
                                                        {typeof feature.tiers[tier.name] === "string" ? (
                                                            <span className="block text-sm text-tertiary">{feature.tiers[tier.name]}</span>
                                                        ) : (
                                                            <>
                                                                {feature.tiers[tier.name] === true ? (
                                                                    <CheckCircle className="size-6 text-fg-success-primary" />
                                                                ) : (
                                                                    <Minus className="mx-auto size-5 text-fg-disabled" aria-hidden="true" />
                                                                )}

                                                                <span className="sr-only">
                                                                    {feature.tiers[tier.name] === true ? "Included" : "Not included"} in {tier.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th className="sr-only" scope="row">
                                    Choose your plan
                                </th>
                                {tiers.map((tier) => (
                                    <td key={tier.name} className="relative px-6 py-8">
                                        {tier.highlighted && (
                                            <div className="pointer-events-none absolute -inset-x-px inset-y-0 rounded-b-2xl border-x-2 border-b-2 border-brand"></div>
                                        )}
                                        <div className="flex flex-col gap-3">
                                            <Button size="xl">Get started</Button>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </section>
    );
};

const ScreenMockup02 = () => {
    return (
        <section className="overflow-hidden bg-primary pt-16 md:py-24">
            <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
                <div className="flex w-full max-w-3xl flex-col">
                    <h1 className="text-display-sm font-semibold text-primary md:text-display-lg">Join 4,000+ startups growing with Untitled</h1>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">Start your 30-day free trial today.</p>
                    <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>

                <div className="relative mx-auto min-h-90 md:min-h-100 lg:mx-0 lg:min-h-142">
                    {/* Light mode image (hidden in dark mode) */}
                    <img
                        className="aspect-3/2 h-auto w-full max-w-5xl rounded object-cover shadow-3xl ring-4 ring-screen-mockup-border max-md:hidden md:ml-24 md:h-90 md:w-auto md:rounded-xl lg:absolute lg:inset-0 lg:left-24 lg:ml-0 lg:h-128 dark:hidden"
                        src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                        alt="Modern business dashboard displaying analytics, charts, and key performance metrics"
                    />
                    {/* Dark mode image (hidden in light mode) */}
                    <img
                        className="aspect-3/2 h-auto w-full max-w-5xl rounded object-cover shadow-3xl ring-4 ring-screen-mockup-border not-dark:hidden max-md:hidden md:ml-24 md:h-90 md:w-auto md:rounded-xl lg:absolute lg:inset-0 lg:left-24 lg:ml-0 lg:h-128"
                        src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                        alt="Modern business dashboard displaying analytics, charts, and key performance metrics"
                    />

                    <IPhoneMockup
                        image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                        imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                        className="absolute left-1/2 max-w-71 -translate-x-1/2 md:top-12 md:left-0 md:max-w-45 md:translate-x-0 lg:top-18 lg:max-w-61"
                    />
                </div>
            </div>
        </section>
    );
};

const SimpleCentered = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Start your free trial</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Join over 4,000+ startups already growing with Untitled.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-8 md:flex-row md:self-center">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FooterLarge09 = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Let's get started on something great</h2>
                    <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Join over 4,000+ startups already growing with Untitled.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl">
                            Chat to us
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>

                <nav className="mt-12 md:mt-16">
                    <ul className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
                        {footerNavList.map((category) => (
                            <li key={category.label}>
                                <h4 className="text-sm font-semibold text-quaternary">{category.label}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (
                                        <li key={item.label}>
                                            <Button color="link-gray" size="lg" href={item.href} iconTrailing={item.badge} className="gap-1">
                                                {item.label}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row md:items-center">
                    <UntitledLogo className="h-8 w-min" />
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const PricingPage06 = () => {
    return (
        <div className="bg-primary">
            <BannerSlimBrandFullWidth />

            <Header />

            <PricingLargeTable02 />

            <SectionDivider />

            <ScreenMockup02 />

            <SimpleCentered />

            <FooterLarge09 />
        </div>
    );
};

export default PricingPage06;
