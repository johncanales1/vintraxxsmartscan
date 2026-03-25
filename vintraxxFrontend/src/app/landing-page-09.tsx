"use client";

import { type ReactNode, useState } from "react";
import { ArrowRight, ChartBreakoutSquare, CheckCircle, MessageChatCircle, Zap } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { CreditCard } from "@/components/shared-assets/credit-card/credit-card";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

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

const HeroCardMockup08 = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            {/* Background pattern */}
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-sm-desktop.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]"
            />
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-sm-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]"
            />

            <Header />

            <section className="relative py-16 md:py-24">
                <div className="mx-auto flex w-full max-w-container flex-col justify-between gap-8 px-4 md:px-8 lg:flex-row lg:items-end">
                    <div className="flex max-w-3xl flex-1 flex-col items-start">
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Simple, transparent business credit cards
                        </h1>
                        <p className="mt-4 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            Mo money, no problems. Untitled is a next-generation financial technology company in the process of reinventing banking. 30-day free
                            trial.
                        </p>

                        <ul className="mt-8 flex shrink-0 flex-col gap-4 pl-2 lg:hidden">
                            <CheckItemText text="Instantly issue virtual corporate cards" size="lg" color="success" />
                            <CheckItemText text="Control spending before it happens" size="lg" color="success" />
                            <CheckItemText text="Automate your expense management" size="lg" color="success" />
                        </ul>

                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = Object.fromEntries(new FormData(e.currentTarget));
                                console.log("Form data:", data);
                            }}
                            className="mt-8 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start"
                        >
                            <Input
                                isRequired
                                size="md"
                                name="email"
                                type="email"
                                wrapperClassName="py-0.5"
                                placeholder="Enter your email"
                                hint={
                                    <span>
                                        We care about your data in our{" "}
                                        <a
                                            href="#"
                                            className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                        >
                                            privacy policy
                                        </a>
                                        .
                                    </span>
                                }
                            />
                            <Button type="submit" size="xl">
                                Get started
                            </Button>
                        </Form>
                    </div>

                    <ul className="hidden shrink-0 flex-col gap-5 pb-6 pl-4 lg:flex">
                        <CheckItemText text="Instantly issue virtual corporate cards" size="lg" color="success" />
                        <CheckItemText text="Control spending before it happens" size="lg" color="success" />
                        <CheckItemText text="Automate your expense management" size="lg" color="success" />
                    </ul>
                </div>

                <div className="relative mt-16 w-full max-w-container px-4 md:mx-auto md:px-8">
                    <img
                        src="https://www.untitledui.com/marketing/glass-cards.webp"
                        alt="Hero card mockup"
                        className="h-68 w-full overflow-hidden rounded-2xl object-cover md:h-120 md:rounded-2xl"
                    />
                </div>
            </section>
        </div>
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

const SocialProofFullWidth = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
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

const FeaturesLargeScreenMockup02 = () => {
    return (
        <section className="bg-primary pb-16 md:pb-0">
            <div className="bg-secondary pt-16 pb-28 md:pt-24 md:pb-40">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                        <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>

                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">All-in-one finance for any business</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            Get a deposit account, credit card, and spend management software—in one refreshingly easy solution. No fees or minimums.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto -mt-17 w-full max-w-container px-4 pt-1 md:-mt-26 md:overflow-hidden md:px-8 md:pt-2">
                <div className="flex flex-col md:items-start">
                    <div className="flex h-full w-full items-center justify-center md:max-h-105 md:w-full md:items-start lg:max-h-140">
                        {/* Light mode image (hidden in dark mode) */}
                        <img
                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                            alt="Comprehensive business finance dashboard showing charts, metrics, and account overview in a clean interface"
                            className="size-full rounded object-cover ring-4 ring-screen-mockup-border md:rounded-xl md:ring-8 dark:hidden"
                        />
                        {/* Dark mode image (hidden in light mode) */}
                        <img
                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                            alt="Comprehensive business finance dashboard showing charts, metrics, and account overview in a clean interface"
                            className="size-full rounded object-cover ring-4 ring-screen-mockup-border not-dark:hidden md:rounded-xl md:ring-8"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const TestimonialSimpleCentered02 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <figure className="flex w-full shrink-0 snap-start flex-col gap-8 text-center">
                    {/* Light mode image (hidden in dark mode) */}
                    <img
                        alt="Wildcrafted"
                        src="https://www.untitledui.com/logos/logotype/color/wildcrafted.svg"
                        className="h-10 dark:hidden"
                        aria-hidden="true"
                    />
                    {/* Dark mode image (hidden in light mode) */}
                    <img
                        alt="Wildcrafted"
                        src="https://www.untitledui.com/logos/logotype/white/wildcrafted.svg"
                        className="h-10 opacity-85 not-dark:hidden"
                        aria-hidden="true"
                    />
                    <blockquote className="text-display-sm font-medium text-primary md:text-display-lg">
                        We've been able to scale faster by combining our deposits, spend and controls in one account.
                    </blockquote>
                    <figcaption className="flex justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar src="https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80" alt="Amelie Laurent" size="2xl" />
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-semibold text-primary">Amélie Laurent</p>
                                <cite className="text-md text-tertiary not-italic">Finance Manager, Sisyphus</cite>
                            </div>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </section>
    );
};

const CTACardHorizontal = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-x-8 gap-y-8 rounded-2xl bg-secondary px-6 py-10 lg:flex-row lg:p-16">
                    <div className="flex max-w-3xl flex-1 flex-col">
                        <h2 className="text-display-sm font-semibold text-primary">
                            <span className="hidden md:inline">Start your 30-day free trial</span>
                            <span className="md:hidden">Start your free trial</span>
                        </h2>
                        <p className="mt-4 text-lg text-tertiary lg:text-xl">Join over 4,000+ startups already growing with Untitled.</p>
                    </div>
                    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start">
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

const FeaturesTabsMockup11 = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <section className="overflow-hidden bg-primary pb-16 lg:pb-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="flex w-full flex-col lg:max-w-3xl">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>

                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">The only card you'll ever need. Simple.</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Spend smarter, lower your bills, get cashback on everything you buy, and unlock credit to grow your business.{" "}
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

                    <div className="relative -mx-4 flex h-80 items-center justify-center bg-tertiary md:mr-0 md:h-120 md:rounded-2xl lg:h-140">
                        <div className="-space-y-[146px] md:-translate-x-2 md:translate-y-3.5 md:-space-y-[126px]">
                            <div
                                className="relative z-4 [--scale:1.13] md:[--scale:1.641]"
                                style={{ transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)" }}
                            >
                                <CreditCard type="transparent-gradient" cardHolder="Demi Wilkinson" />
                            </div>
                            <div
                                className="relative z-3 [--scale:1.13] md:[--scale:1.641]"
                                style={{ transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)" }}
                            >
                                <CreditCard type="brand-dark" cardHolder="Lana Steiner" />
                            </div>
                            <div
                                className="relative z-2 [--scale:1.13] md:[--scale:1.641]"
                                style={{ transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)" }}
                            >
                                <CreditCard type="transparent" cardHolder="OLIVIA RHYE" />
                            </div>
                            <div
                                className="relative z-1 [--scale:1.13] md:[--scale:1.641]"
                                style={{ transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)" }}
                            >
                                <CreditCard type="gray-dark" cardHolder="Phoenix Baker" />
                            </div>
                            <div
                                className="relative z-0 [--scale:1.13] md:[--scale:1.641]"
                                style={{ transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)" }}
                            >
                                <div className="h-47.5 w-79 rounded-2xl bg-gray-900 opacity-15 blur-md"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const PricingTierCardDualCheckItems = (props: {
    title: string;
    description?: string;
    contentTitle: string;
    contentDescription: ReactNode;
    price?: number;
    badge?: string;
    features: string[];
    className?: string;
}) => {
    return (
        <div className={cx("flex flex-col overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt", props.className)}>
            <div className="flex flex-col-reverse gap-4 px-6 pt-6 pb-8 md:flex-row md:justify-between md:gap-8 md:px-8 md:pt-8 md:pb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-primary">{props.title}</h2>
                        {props.badge && (
                            <Badge size="md" type="pill-color" color="brand">
                                {props.badge}
                            </Badge>
                        )}
                    </div>
                    <p className="text-md text-tertiary">{props.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="-translate-y-[5px] text-display-md font-semibold text-primary md:-translate-y-[15px]">$</span>
                    <span className="text-display-lg font-semibold text-primary md:text-display-xl">{props.price || 10}</span>
                    <span className="text-md font-medium text-tertiary">per month</span>
                </div>
            </div>

            <div className="flex flex-col gap-6 border-t border-secondary px-6 py-8 md:px-8 md:pt-8 md:pb-10">
                <div className="flex flex-col gap-1">
                    <p className="text-md font-semibold text-primary">{props.contentTitle}</p>
                    <p className="text-md text-tertiary">{props.contentDescription}</p>
                </div>
                <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                    {props.features.map((feat) => (
                        <CheckItemText key={feat} color="success" text={feat} />
                    ))}
                </ul>
            </div>

            <div className="mt-auto flex flex-col gap-3 border-t border-secondary px-6 pt-6 pb-8 md:p-8">
                <Button size="xl">Get started</Button>
            </div>
        </div>
    );
};

const PricingSectionFeaturedCards04 = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-2xl flex-col xl:mx-0 xl:max-w-3xl">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Upgrade</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Unlock more features</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5">Simple, transparent pricing that grows with you. Try any plan free for 30 days.</p>
                </div>

                <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-12 md:mt-16 md:gap-16 xl:mx-0 xl:max-w-none xl:grid-cols-2 xl:items-center">
                    <ul className="grid max-w-xl grid-cols-1 gap-10 md:gap-12">
                        {[
                            {
                                title: "Share team inboxes",
                                subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
                                icon: MessageChatCircle,
                            },
                            {
                                title: "Deliver instant answers",
                                subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
                                icon: Zap,
                            },
                            {
                                title: "Manage your team with reports",
                                subtitle:
                                    "Measure what matters with Untitled's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
                                icon: ChartBreakoutSquare,
                            },
                        ].map((item) => (
                            <li key={item.title}>
                                <div className="flex gap-4">
                                    <FeaturedIcon icon={item.icon} size="lg" color="gray" theme="modern" className="hidden md:inline-flex" />
                                    <FeaturedIcon icon={item.icon} size="md" color="gray" theme="modern" className="inline-flex md:hidden" />

                                    <div className="pt-1.5 md:pt-2.5">
                                        <h3 className="text-lg font-semibold text-primary md:text-xl">{item.title}</h3>
                                        <p className="mt-1 text-md text-tertiary md:mt-2">{item.subtitle}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <PricingTierCardDualCheckItems
                        title="Basic plan"
                        description="Our most popular plan for small teams."
                        contentTitle="FEATURES"
                        contentDescription={
                            <>
                                Everything in our <span className="text-md font-semibold">free plan</span> plus....
                            </>
                        }
                        badge="Popular"
                        features={[
                            "Access to basic features",
                            "Basic reporting + analytics",
                            "Up to 10 individual users",
                            "20 GB individual data",
                            "Basic chat support",
                            "Attend events",
                            "Automatic updates",
                            "Backup your account",
                            "Audit log and notes",
                            "Feature requests",
                        ]}
                        className="md:-ml-4"
                    />
                </div>
            </div>
        </section>
    );
};

const NewsletterSimpleLeftBrand = () => {
    return (
        <section className="bg-brand-section py-16 md:py-24">
            <div className="mx-auto flex w-full max-w-container flex-col items-start justify-between gap-8 px-4 md:px-8 lg:flex-row">
                <div>
                    <h1 className="text-display-sm font-semibold text-primary_on-brand md:text-display-md">Sign up for our newsletter</h1>
                    <p className="mt-4 text-lg text-tertiary_on-brand md:mt-5 md:text-xl">
                        Be the first to know about releases and industry news and insights.
                    </p>
                </div>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const data = Object.fromEntries(new FormData(e.currentTarget));
                        console.log("Form data:", data);
                    }}
                    className="flex w-full flex-col gap-4 md:max-w-120 md:flex-row"
                >
                    <Input
                        isRequired
                        size="md"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        inputClassName="border-none"
                        wrapperClassName="py-0.5 md:max-w-[345px]"
                        hint={
                            <span className="text-tertiary_on-brand">
                                We care about your data in our{" "}
                                <a
                                    href="#"
                                    className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    privacy policy
                                </a>
                                .
                            </span>
                        }
                    />
                    <Button type="submit" size="xl">
                        Subscribe
                    </Button>
                </Form>
            </div>
        </section>
    );
};

const FooterLarge09 = () => {
    return (
        <footer className="bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Start growing with Untitled</h2>
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

const LandingPage09 = () => {
    return (
        <div className="bg-primary">
            <HeroCardMockup08 />

            <SocialProofFullWidth />

            <FeaturesLargeScreenMockup02 />

            <SectionDivider />

            <TestimonialSimpleCentered02 />

            <CTACardHorizontal />

            <FeaturesTabsMockup11 />

            <PricingSectionFeaturedCards04 />

            <NewsletterSimpleLeftBrand />

            <FooterLarge09 />
        </div>
    );
};

export default LandingPage09;
