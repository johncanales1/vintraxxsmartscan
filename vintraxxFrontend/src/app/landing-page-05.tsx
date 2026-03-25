"use client";

import { type ComponentProps, type FC, type ReactNode, useState } from "react";
import { ArrowRight, CheckCircle, LayersTwo01, PlayCircle, Zap, ZapFast } from "@untitledui/icons";
import { AnimatePresence, type Transition, motion } from "motion/react";
import { PaginationDot } from "@/components/application/pagination/pagination-dot";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { PlayButtonIcon } from "@/components/foundations/play-button-icon";
import { StarIcon } from "@/components/foundations/rating-stars";
import { Header } from "@/components/marketing/header-navigation/header";
import { CreditCard } from "@/components/shared-assets/credit-card/credit-card";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

const HeaderPrimaryDark = (props: ComponentProps<typeof Header>) => {
    return (
        <Header
            {...props}
            className={cx(
                "bg-brand-section [&_nav>ul>li>a]:text-secondary_on-brand [&_nav>ul>li>a]:hover:text-secondary_on-brand [&_nav>ul>li>button]:text-secondary_on-brand [&_nav>ul>li>button]:hover:text-secondary_on-brand [&_nav>ul>li>button>svg]:text-fg-brand-secondary_alt [&_svg_path.fill-fg-primary]:fill-fg-white",
                props.className,
            )}
        />
    );
};

const HeroCardMockup06 = () => {
    return (
        <div className="relative overflow-hidden bg-brand-section">
            {/* Background pattern */}
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-sm-desktop.svg"
                className="pointer-events-none absolute -top-2 left-1/2 z-0 hidden max-w-none -translate-x-1/2 opacity-20 md:block dark:opacity-100 dark:brightness-[0.2]"
            />
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-sm-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 opacity-20 md:hidden dark:opacity-100 dark:brightness-[0.2]"
            />

            <HeaderPrimaryDark className="bg-transparent" />

            <section className="relative overflow-hidden pt-16 md:pt-24 md:pb-0">
                <img
                    alt="Light Accent"
                    aria-hidden="true"
                    src="https://www.untitledui.com/marketing/light-accent.webp"
                    className="absolute -right-2/3 -bottom-12 max-w-160 opacity-90 mix-blend-screen sm:-right-1/3 md:max-w-7xl"
                />

                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex max-w-3xl flex-col md:items-center md:text-center">
                        <span className="text-sm font-semibold text-secondary_on-brand md:text-md">Super. Simple. Banking.</span>

                        <h1 className="mt-3 text-display-md font-semibold text-primary_on-brand md:text-display-lg lg:text-display-2xl">
                            Banking technology that has your back.
                        </h1>
                        <p className="mt-4 max-w-3xl text-lg text-balance text-tertiary_on-brand md:mt-6 md:text-xl">
                            Simple, transparent banking. No hidden fees and free overdrafts.
                        </p>
                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                            <Button iconLeading={PlayCircle} color="secondary" size="xl" className="shadow-xs! ring-0">
                                Demo
                            </Button>
                            <Button size="xl">Sign up</Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 w-full max-w-container md:px-8">
                    <div className="flex h-46 items-end justify-center md:h-114">
                        <div className="flex -translate-y-[53px] items-start justify-end md:translate-y-2">
                            <div
                                className="absolute origin-right [transform:var(--transform-mobile)] md:[transform:var(--transform-desktop)]"
                                style={
                                    {
                                        "--transform-mobile": "scale(0.7) translate(-59px, 39px) rotate(30deg)",
                                        "--transform-desktop": "scale(1.77) translate(-59px, 39px) rotate(30deg)",
                                    } as React.CSSProperties
                                }
                            >
                                <CreditCard type="transparent-gradient" cardHolder="Phoenix Baker" />
                            </div>
                            <div
                                className="absolute origin-right [transform:var(--transform-mobile)] md:[transform:var(--transform-desktop)]"
                                style={
                                    {
                                        "--transform-mobile": "scale(0.7) translate(-38px, 10px) rotate(60deg)",
                                        "--transform-desktop": "scale(1.77) translate(-38px, 10px) rotate(60deg)",
                                    } as React.CSSProperties
                                }
                            >
                                <CreditCard type="transparent-gradient" cardHolder="OLIVIA RHYE" />
                            </div>
                            <div
                                className="absolute origin-right [transform:var(--transform-mobile)] md:[transform:var(--transform-desktop)]"
                                style={
                                    {
                                        "--transform-mobile": "scale(0.7) translate(0px, 0px) rotate(90deg)",
                                        "--transform-desktop": "scale(1.77) translate(0px, 0px) rotate(90deg)",
                                    } as React.CSSProperties
                                }
                            >
                                <CreditCard type="transparent-gradient" cardHolder="Lana Steiner" />
                            </div>
                            <div
                                className="absolute origin-right [transform:var(--transform-mobile)] md:[transform:var(--transform-desktop)]"
                                style={
                                    {
                                        "--transform-mobile": "scale(0.7) translate(36px, 10px) rotate(120deg)",
                                        "--transform-desktop": "scale(1.77) translate(36px, 10px) rotate(120deg)",
                                    } as React.CSSProperties
                                }
                            >
                                <CreditCard type="transparent-gradient" cardHolder="Demi Wilkinson" />
                            </div>
                            <div
                                className="absolute origin-right [transform:var(--transform-mobile)] md:[transform:var(--transform-desktop)]"
                                style={
                                    {
                                        "--transform-mobile": "scale(0.7) translate(59px, 39px) rotate(150deg)",
                                        "--transform-desktop": "scale(1.77) translate(59px, 39px)  rotate(150deg)",
                                    } as React.CSSProperties
                                }
                            >
                                <CreditCard type="transparent-gradient" cardHolder="Candice wu" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const SocialProofFullWidth = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md font-medium text-tertiary">Join 4,000+ companies already growing</p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 xl:gap-x-6">
                        {/* Light mode images (hidden in dark mode) */}
                        <img alt="Odeaolabs" src="https://www.untitledui.com/logos/logotype/color/odeaolabs.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Kintsugi" src="https://www.untitledui.com/logos/logotype/color/kintsugi.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Stackedlab" src="https://www.untitledui.com/logos/logotype/color/stackedlab.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Magnolia" src="https://www.untitledui.com/logos/logotype/color/magnolia.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Warpspeed" src="https://www.untitledui.com/logos/logotype/color/warpspeed.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Sisyphus" src="https://www.untitledui.com/logos/logotype/color/sisyphus.svg" className="h-9 md:h-12 dark:hidden" />

                        {/* Dark mode images (hidden in light mode) */}
                        <img
                            alt="Odeaolabs"
                            src="https://www.untitledui.com/logos/logotype/white/odeaolabs.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Kintsugi"
                            src="https://www.untitledui.com/logos/logotype/white/kintsugi.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Stackedlab"
                            src="https://www.untitledui.com/logos/logotype/white/stackedlab.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Magnolia"
                            src="https://www.untitledui.com/logos/logotype/white/magnolia.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Warpspeed"
                            src="https://www.untitledui.com/logos/logotype/white/warpspeed.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Sisyphus"
                            src="https://www.untitledui.com/logos/logotype/white/sisyphus.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

interface TextCentered {
    title: string;
    subtitle: string;
    footer?: ReactNode;
}

const FeatureTextLeft = ({ title, subtitle, footer }: TextCentered) => (
    <div className="flex max-w-sm flex-col gap-4">
        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>

        {footer}
    </div>
);

const FeaturesSimpleIcons04 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 gap-12 md:gap-16 lg:grid-cols-3">
                    <div className="max-w-3xl lg:col-span-1">
                        <FeaturedIcon icon={ZapFast} color="brand" size="xl" theme="light" className="hidden md:flex" />
                        <FeaturedIcon icon={ZapFast} color="brand" size="lg" theme="light" className="md:hidden" />

                        <h2 className="mt-5 text-display-sm font-semibold text-primary md:text-display-md">The only card you'll ever need. Simple.</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            Spend smarter, lower your bills, get cashback on everything you buy, and unlock credit to grow your business.{" "}
                        </p>
                    </div>

                    <div className="lg:col-span-2">
                        <ul className="grid w-full grid-cols-1 gap-x-16 gap-y-10 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-3 md:gap-y-8 lg:grid-cols-2">
                            {[
                                {
                                    title: "Share team inboxes",
                                    subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
                                },
                                {
                                    title: "Manage your team with reports",
                                    subtitle:
                                        "Measure what matters with Untitled's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
                                },
                                {
                                    title: "Connect the tools you already use",
                                    subtitle:
                                        "Explore 100+ integrations that make your day-to-day workflow more efficient and familiar. Plus, our extensive developer tools.",
                                },
                                {
                                    title: "Deliver instant answers",
                                    subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
                                },
                                {
                                    title: "Connect with customers",
                                    subtitle:
                                        "Solve a problem or close a sale in real-time with chat. If no one is available, customers are seamlessly routed to email without confusion.",
                                },
                                {
                                    title: "Our people make the difference",
                                    subtitle:
                                        "We're an extension of your customer service team, and all of our resources are free. Chat to our friendly team 24/7 when you need help.",
                                },
                            ].map((item) => (
                                <li key={item.title}>
                                    <FeatureTextLeft title={item.title} subtitle={item.subtitle} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTASplitImage04 = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col overflow-hidden rounded-2xl bg-brand-section shadow-xl md:flex-row md:items-center md:rounded-3xl">
                    <div className="flex flex-1 flex-col px-6 pt-10 pb-12 lg:p-16">
                        <h2 className="text-display-sm font-semibold text-primary_on-brand md:text-display-md">Give us a shot</h2>
                        <p className="mt-4 text-lg text-tertiary_on-brand md:mt-5 md:text-xl">Join over 4,000+ startups already growing with Untitled.</p>
                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 md:mt-12 md:flex-row md:items-start">
                            <Button color="secondary" size="xl">
                                Learn more
                            </Button>
                            <Button size="xl">Get started</Button>
                        </div>
                    </div>

                    <img
                        src="https://www.untitledui.com/marketing/girl-2.webp"
                        className="h-70 w-full object-cover md:h-100 md:w-95 lg:w-120"
                        alt="Team member working on laptop in modern office"
                    />
                </div>
            </div>
        </section>
    );
};

interface FeatureTabProps {
    title: string;
    subtitle: string;
    footer?: ReactNode;
    isCurrent?: boolean;
}

const FeatureTabHorizontal = ({ title, subtitle, footer, isCurrent }: FeatureTabProps) => (
    <div
        className={cx(
            "relative flex cursor-pointer flex-col items-start gap-4 border-l-4 border-tertiary py-4 pl-5 transition duration-100 ease-linear hover:border-brand",
            isCurrent && "border-brand",
        )}
    >
        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>

        {footer}
    </div>
);

const FeaturesTabsMockup08 = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <section className="overflow-hidden bg-primary pb-16 md:pb-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="flex w-full flex-col lg:max-w-3xl">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>

                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">All-in-one finance for any business</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Get a deposit account, credit card, and spend management software—in one refreshingly easy solution. No fees or minimums.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:gap-16 lg:grid-cols-2 lg:items-center">
                    <ul className="flex flex-col">
                        {[
                            {
                                title: "Share team inboxes",
                                subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
                            },
                            {
                                title: "Deliver instant answers",
                                subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
                            },
                            {
                                title: "Manage your team with reports",
                                subtitle:
                                    "Measure what matters with Untitled's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
                            },
                        ].map((item, index) => (
                            <li key={item.title} onClick={() => setCurrentTab(index)}>
                                <FeatureTabHorizontal
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    isCurrent={index === currentTab}
                                    footer={
                                        <Button color="link-color" size="lg" href="#" iconTrailing={ArrowRight}>
                                            Learn more
                                        </Button>
                                    }
                                />
                            </li>
                        ))}
                    </ul>

                    <div className="lg:-ml-4 lg:h-128">
                        <div className="w-full lg:w-max lg:lg:max-w-5xl">
                            <div className="size-full rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px]">
                                <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[23.58px] md:p-1 md:shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[20.21px] md:ring-[1.68px]">
                                        {/* Light mode image (hidden in dark mode) */}
                                        <img
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                            className="size-full object-cover object-left-top dark:hidden"
                                            alt="Business dashboard interface showing analytics and data visualization"
                                        />
                                        {/* Dark mode image (hidden in light mode) */}
                                        <img
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                            className="size-full object-cover object-left-top not-dark:hidden"
                                            alt="Business dashboard interface showing analytics and data visualization"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const plans = [
    {
        title: "Basic plan",
        subtitle: "$10/mth",
        description: "Billed annually.",
        features: [
            "Access to all basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
        icon: Zap,
    },
    {
        title: "Business plan",
        subtitle: "$20/mth",
        description: "Billed annually.",
        features: ["200+ integrations", "Advanced reporting", "Up to 20 individual users", "40 GB individual data", "Priority chat and email support"],
        icon: LayersTwo01,
    },
];

const CheckItemText = (props: {
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    color?: "primary" | "success";
    iconStyle?: "outlined" | "contained" | "filled";
    textClassName?: string;
}) => {
    const { text, color, size, iconStyle = "contained" } = props;

    return (
        <li className="flex gap-3">
            {iconStyle === "contained" && (
                <div
                    className={cx(
                        "flex shrink-0 items-center justify-center rounded-full",
                        color === "success" ? "bg-success-secondary text-featured-icon-light-fg-success" : "bg-brand-primary text-featured-icon-light-fg-brand",
                        size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
                    )}
                >
                    <svg
                        width={size === "lg" ? 16 : size === "md" ? 15 : 13}
                        height={size === "lg" ? 14 : size === "md" ? 13 : 11}
                        viewBox="0 0 13 11"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M11.0964 0.390037L3.93638 7.30004L2.03638 5.27004C1.68638 4.94004 1.13638 4.92004 0.736381 5.20004C0.346381 5.49004 0.236381 6.00004 0.476381 6.41004L2.72638 10.07C2.94638 10.41 3.32638 10.62 3.75638 10.62C4.16638 10.62 4.55638 10.41 4.77638 10.07C5.13638 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            )}

            {iconStyle === "filled" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1.5 4L4.5 7L10.5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

            {iconStyle === "outlined" && (
                <CheckCircle
                    className={cx(
                        "shrink-0",
                        color === "success" ? "text-fg-success-primary" : "text-fg-brand-primary",
                        size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
                    )}
                />
            )}

            <span
                className={cx(
                    "text-tertiary",
                    size === "lg" ? "pt-0.5 text-lg md:pt-0" : size === "md" ? "pt-0.5 text-md md:pt-0 md:text-lg" : "text-md",
                    iconStyle === "filled" && "text-brand-secondary",
                    props.textClassName,
                )}
            >
                {text}
            </span>
        </li>
    );
};

interface PricingTierCardProps {
    icon: FC<{ className?: string }>;
    iconTheme?: "light" | "gradient" | "dark" | "outline" | "modern";
    iconColor?: "brand" | "gray" | "success" | "warning" | "error";
    title: string;
    subtitle: string;
    description?: string;
    features: string[];
    className?: string;
}

const PricingTierCardIcon = (props: PricingTierCardProps) => {
    return (
        <div className={cx("flex flex-col overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt", props.className)}>
            <div className="flex flex-col items-center px-6 pt-6 text-center md:px-8 md:pt-8">
                <FeaturedIcon icon={props.icon} color={props.iconColor || "brand"} theme={props.iconTheme || "light"} size="lg" />

                <h2 className="mt-4 text-xl font-semibold text-brand-secondary">{props.title}</h2>
                <p className="mt-2 text-display-md font-semibold text-primary md:text-display-lg">{props.subtitle}</p>
                <p className="mt-2 text-md text-tertiary">{props.description}</p>
            </div>

            <ul className="flex flex-col gap-4 px-6 pt-8 pb-6 md:p-8 md:pb-10">
                {props.features.map((feat) => (
                    <CheckItemText key={feat} text={feat} />
                ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 rounded-b-2xl border-t border-secondary bg-secondary px-6 pt-6 pb-8 md:p-8">
                <Button size="xl">Get started</Button>
            </div>
        </div>
    );
};

const PricingSectionFeaturedCards01 = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-12 md:gap-16 xl:flex-row">
                    <div className="w-full max-w-3xl xl:max-w-md">
                        <span className="block text-sm font-semibold text-brand-secondary md:text-md">Upgrade</span>
                        <h2 className="mt-3 hidden text-display-sm font-semibold text-primary md:flex md:text-display-md">Pricing plans that scale</h2>
                        <h2 className="mt-3 flex text-display-sm font-semibold text-primary md:hidden md:text-display-md">Pricing plans that scale with you</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">Simple, transparent pricing that grows with you. Try any plan free for 30 days.</p>
                    </div>

                    <div className="grid w-full grid-cols-1 items-start gap-4 md:-ml-2 md:grid-cols-2 md:gap-8">
                        {plans.map((plan) => (
                            <PricingTierCardIcon key={plan.title} {...plan} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const reviews = [
    {
        quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
        author: {
            name: "Renee Wells",
            title: "Product Designer, Quotient",
            avatarUrl: "https://www.untitledui.com/images/avatars/renee-wells?fm=webp&q=80",
        },
    },
    {
        quote: "We've really sped up our workflow using Untitled and haven't looked back. We're so happy!",
        author: {
            name: "Sienna Hewitt",
            title: "Project Manager, Warpspeed",
            avatarUrl: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80",
        },
    },

    {
        quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects and features faster.",
        author: {
            name: "Lulu Meyers",
            title: "PM, Hourglass",
            avatarUrl: "https://www.untitledui.com/images/avatars/lulu-meyers?fm=webp&q=80",
        },
    },
];

const TestimonialCardSplitImageBrand = () => {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    const transition: Transition = {
        type: "spring",
        duration: 0.8,
    };

    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 items-center overflow-hidden rounded-2xl bg-brand-section md:rounded-3xl lg:grid-cols-[auto_auto]">
                    <div className="flex flex-1 flex-col gap-8 px-6 py-10 md:gap-8 md:px-8 md:py-12 lg:p-16">
                        <figure className="flex flex-col gap-8">
                            <div className="flex flex-col gap-4 md:gap-6">
                                <AnimatePresence initial={false} mode="popLayout">
                                    <motion.div key={currentReviewIndex + "-rating"} aria-hidden="true" className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <motion.div
                                                key={`${currentReviewIndex}-${index}`}
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 6,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                    transition: {
                                                        ...transition,
                                                        delay: 0.5 + index * 0.1,
                                                    },
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 6,
                                                    transition: {
                                                        ...transition,
                                                        delay: 0.12,
                                                    },
                                                }}
                                                className="will-change-transform"
                                            >
                                                <StarIcon />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                    <motion.blockquote
                                        key={currentReviewIndex + "-quote"}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.99,
                                            y: 12,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                            transition: {
                                                ...transition,
                                                delay: 0.4,
                                            },
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.99,
                                            y: 12,
                                            transition: {
                                                ...transition,
                                                delay: 0.06,
                                            },
                                        }}
                                        className="origin-bottom-left text-display-xs font-medium text-balance text-white will-change-transform sm:text-display-sm md:text-display-md"
                                    >
                                        {reviews[currentReviewIndex].quote}
                                    </motion.blockquote>
                                </AnimatePresence>
                            </div>
                            <AnimatePresence initial={false} mode="popLayout">
                                <motion.figcaption
                                    key={currentReviewIndex}
                                    initial={{
                                        opacity: 0,
                                        scale: 0.99,
                                        y: 12,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                        transition: {
                                            ...transition,
                                            delay: 0.3,
                                        },
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.99,
                                        y: 12,
                                        transition,
                                    }}
                                    className="flex origin-bottom-left flex-col gap-1 will-change-transform"
                                >
                                    <p className="text-lg font-semibold text-white">— {reviews[currentReviewIndex].author.name}</p>
                                    <cite className="text-md text-secondary_on-brand not-italic">{reviews[currentReviewIndex].author.title}</cite>
                                </motion.figcaption>
                            </AnimatePresence>
                        </figure>
                        <PaginationDot isBrand page={currentReviewIndex + 1} total={3} size="lg" onPageChange={(page) => setCurrentReviewIndex(page - 1)} />
                    </div>
                    <div className="relative flex h-70 w-full items-center justify-center overflow-hidden sm:h-full sm:min-h-90 lg:min-h-112 lg:w-120">
                        <img
                            alt="Mathilde Lewis"
                            src="https://www.untitledui.com/images/portraits/annie-stanley"
                            className="absolute inset-0 size-full object-cover"
                        />
                        <span className="absolute flex size-full items-center justify-center">
                            <PlayButtonIcon className="size-16" />
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

const footerNavList = [
    {
        label: "Product",
        items: [
            { label: "Overview", href: "#" },
            { label: "Features", href: "#" },
            {
                label: "Solutions",
                href: "#",
                badge: <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white ring-1 ring-white/30 ring-inset">New</span>,
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

const FooterLarge05Brand = () => {
    return (
        <footer className="bg-brand-section py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col items-start justify-between gap-8 border-brand_alt md:flex-row md:border-b md:pb-16">
                    <div className="flex flex-col gap-2">
                        <p id="newsletter-label" className="text-lg font-semibold text-primary_on-brand md:text-xl">
                            Join our newsletter
                        </p>
                        <p id="newsletter-hint" className="text-md text-tertiary_on-brand">
                            We'll send you a nice letter once per week. No spam.
                        </p>
                    </div>
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(new FormData(e.currentTarget));
                            console.log("Form data:", data);
                        }}
                        className="w-full sm:w-100"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Input
                                isRequired
                                aria-labelledby="newsletter-label"
                                aria-describedby="newsletter-hint"
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                size="md"
                                wrapperClassName="flex-1"
                            />
                            <Button type="submit" size="lg">
                                Subscribe
                            </Button>
                        </div>
                    </Form>
                </div>

                <nav className="mt-12 md:mt-16">
                    <ul className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
                        {footerNavList.map((category) => (
                            <li key={category.label}>
                                <h4 className="text-sm font-semibold text-quaternary_on-brand">{category.label}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (
                                        <li key={item.label}>
                                            <Button
                                                className="gap-1 text-footer-button-fg hover:text-footer-button-fg_hover"
                                                color="link-color"
                                                size="lg"
                                                href={item.href}
                                                iconTrailing={item.badge}
                                            >
                                                {item.label}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-brand_alt pt-8 md:mt-16 md:flex-row md:items-center">
                    <UntitledLogo className="dark-mode" />
                    <p className="text-md text-quaternary_on-brand">© 2077 Untitled UI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const LandingPage05 = () => {
    return (
        <div className="bg-primary">
            <HeroCardMockup06 />

            <SocialProofFullWidth />

            <SectionDivider />

            <FeaturesSimpleIcons04 />

            <CTASplitImage04 />

            <FeaturesTabsMockup08 />

            <PricingSectionFeaturedCards01 />

            <TestimonialCardSplitImageBrand />

            <FooterLarge05Brand />
        </div>
    );
};

export default LandingPage05;
