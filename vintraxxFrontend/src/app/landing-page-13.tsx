"use client";

import type { FC, ReactNode, SVGProps } from "react";
import { ArrowRight, ChartBreakoutSquare, CheckCircle, MessageChatCircle, MessageSmileCircle, PlayCircle, Zap } from "@untitledui/icons";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { AppStoreButton, GooglePlayButton } from "@/components/base/buttons/app-store-buttons";
import { AppStoreButton as AppStoreButtonOutline, GooglePlayButton as GooglePlayButtonOutline } from "@/components/base/buttons/app-store-buttons-outline";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { AngelList, Dribbble, Facebook, GitHub, Layers, LinkedIn, X } from "@/components/foundations/social-icons";
import { Header } from "@/components/marketing/header-navigation/header";
import { IPhoneMockup } from "@/components/shared-assets/iphone-mockup";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

const BlobPattern = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg width="532" height="480" viewBox="0 0 532 480" fill="none" {...props}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M182.034 461.691C74.9901 428.768 1.32278 329.846 0.0121784 217.408C-1.15817 117.003 82.1936 43.2414 176.777 10.7273C260.07 -17.9056 346.327 12.9156 406.143 77.7959C484.913 163.236 571.343 274.645 512.702 375.097C449.003 484.212 302.448 498.727 182.034 461.691Z"
                className="fill-bg-secondary"
            />
        </svg>
    );
};

const HeroIPhoneMockup01 = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            {/* Background pattern */}
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-md-desktop.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]"
            />
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-md-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]"
            />

            <Header />

            <section className="relative overflow-hidden pt-16 md:py-24">
                <div className="mx-auto flex max-w-container flex-col gap-16 px-4 md:px-8 lg:flex-row lg:items-center lg:gap-16">
                    <div className="flex w-full max-w-3xl flex-1 flex-col items-start">
                        <a href="#" className="rounded-[10px] outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                            <BadgeGroup className="hidden md:flex" size="lg" addonText="New feature" iconTrailing={ArrowRight} theme="modern" color="brand">
                                Personalized coaching in-app
                            </BadgeGroup>
                            <BadgeGroup className="md:hidden" size="md" addonText="New feature" iconTrailing={ArrowRight} theme="modern" color="brand">
                                Personalized coaching in-app
                            </BadgeGroup>
                        </a>

                        <h1 className="mt-4 text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Portfolio performance tracking made easy
                        </h1>
                        <p className="mt-4 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            Designed by marketers. Untitled gives you the guidance, data and innovation you need to become a better marketer.
                        </p>
                        <div className="mt-8 flex gap-3 md:mt-12">
                            <AppStoreButton size="lg" />
                            <GooglePlayButton size="lg" />
                        </div>
                    </div>

                    <div className="relative flex h-90 w-full items-start justify-center lg:h-160 lg:max-w-lg lg:items-center">
                        <div className="absolute top-24 w-133 lg:top-auto">
                            <BlobPattern />
                        </div>
                        <IPhoneMockup
                            image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                            imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                            className="h-[579px] w-71 drop-shadow-iphone-mockup md:h-auto md:w-[313px]"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const SocialProofFullWidth = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md font-medium text-tertiary">Official partner of these companies</p>
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

interface FeatureTextIcon extends TextCentered {
    icon: FC<{ className?: string }>;
}

const FeatureTextFeaturedIconTopLeft = ({ icon, title, subtitle, footer }: FeatureTextIcon) => (
    <div className="flex max-w-sm flex-col gap-4">
        <FeaturedIcon icon={icon} size="lg" color="gray" theme="modern" className="hidden md:inline-flex" />
        <FeaturedIcon icon={icon} size="md" color="gray" theme="modern" className="inline-flex md:hidden" />

        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>

        {footer}
    </div>
);

const IconsAndMockup01 = () => {
    return (
        <section className="overflow-hidden bg-primary pt-16 lg:py-24">
            <div className="mx-auto w-full max-w-container">
                <div className="flex w-full flex-col px-4 md:px-8 lg:max-w-210">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>

                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Overflowing with useful features</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-12 px-4 md:mt-16 md:gap-16 md:px-8 lg:grid-cols-2 lg:items-start">
                    <ul className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-y-12">
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
                            {
                                title: "Connect with customers",
                                subtitle:
                                    "Solve a problem or close a sale in real-time with chat. If no one is available, customers are seamlessly routed to email without confusion.",
                                icon: MessageSmileCircle,
                            },
                        ].map((item) => (
                            <li key={item.title}>
                                <FeatureTextFeaturedIconTopLeft icon={item.icon} title={item.title} subtitle={item.subtitle} />
                            </li>
                        ))}
                    </ul>

                    <div className="relative -ml-4 hidden w-screen md:ml-0 lg:flex lg:h-128 lg:w-full">
                        {/* Light mode image (hidden in dark mode) */}
                        <img
                            alt="Iphone and Screen Mockup 02"
                            src="https://www.untitledui.com/marketing/screen-mockups/iphone-and-screen-mockup-light-01.webp"
                            className="absolute -top-5 h-183 max-w-none object-contain dark:hidden"
                        />
                        {/* Dark mode image (hidden in light mode) */}
                        <img
                            alt="Iphone and Screen Mockup 02"
                            src="https://www.untitledui.com/marketing/screen-mockups/iphone-and-screen-mockup-dark-01.webp"
                            className="absolute -top-5 h-183 max-w-none object-contain not-dark:hidden"
                        />
                    </div>
                    <div className="relative flex h-90 w-full justify-center lg:hidden">
                        <IPhoneMockup
                            image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                            imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                            className="absolute top-0 w-71 shadow-3xl drop-shadow-iphone-mockup"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTAIPhoneMockup04 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="relative grid grid-cols-1 overflow-hidden rounded-2xl bg-brand-section md:rounded-3xl md:shadow-xl lg:min-h-120 lg:grid-cols-2 lg:items-center">
                    <div className="flex flex-1 flex-col px-6 pt-10 pb-12 sm:p-12 lg:p-16">
                        <h2 className="text-display-sm font-semibold text-white xl:text-display-md">Start your free trial</h2>
                        <p className="mt-4 text-lg text-tertiary_on-brand md:mt-5 lg:text-xl">Personal performance tracking made easy.</p>
                        <div className="mt-8 flex w-full gap-3 md:mt-12">
                            <AppStoreButtonOutline size="lg" className="dark-mode" />
                            <GooglePlayButtonOutline size="lg" className="dark-mode" />
                        </div>
                    </div>

                    <IPhoneMockup
                        image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                        imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                        className="top-10 right-16 max-h-70 w-full max-w-67 justify-self-center drop-shadow-iphone-mockup lg:absolute lg:max-h-none lg:max-w-78.5"
                    />

                    {/*  Notifications List */}
                    <ul className="absolute bottom-10 left-1/2 hidden -translate-x-2 flex-col gap-3 lg:flex" aria-hidden="true">
                        <li className="flex w-full max-w-xs gap-3 rounded-lg bg-alpha-white/90 p-4 backdrop-blur-lg">
                            <img
                                alt="Olivia Rhye"
                                src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"
                                className="size-10 rounded-full object-cover outline-1 -outline-offset-1 outline-avatar-contrast-border"
                            />
                            <div>
                                <p className="text-sm text-tertiary">
                                    <span className="font-medium text-brand-secondary">Olivia Rhye</span> followed you!
                                </p>
                                <p className="text-sm text-tertiary">@oliviarhye</p>
                            </div>
                        </li>
                        <li className="flex w-full max-w-xs gap-3 rounded-lg bg-alpha-white/90 p-4 backdrop-blur-lg">
                            <img
                                alt="Candice Wu"
                                src="https://www.untitledui.com/images/avatars/candice-wu?fm=webp&q=80"
                                className="size-10 rounded-full object-cover outline-1 -outline-offset-1 outline-avatar-contrast-border"
                            />
                            <div>
                                <p className="text-sm text-tertiary">
                                    <span className="font-medium text-brand-secondary">Candice Wu</span> and 2 other gave you kudos on{" "}
                                    <span className="font-medium text-brand-secondary">Clubhouse 101</span> post
                                </p>
                            </div>
                        </li>
                        <li className="flex w-full max-w-xs gap-3 rounded-lg bg-alpha-white/90 p-4 opacity-75 backdrop-blur-lg">
                            <img
                                alt="Phoenix Baker"
                                src="https://www.untitledui.com/images/avatars/phoenix-baker?fm=webp&q=80"
                                className="size-10 rounded-full object-cover outline-1 -outline-offset-1 outline-avatar-contrast-border"
                            />
                            <div>
                                <p className="text-sm text-tertiary">
                                    <span className="font-medium text-brand-secondary">Phoenix Baker</span> joined your team{" "}
                                    <span className="font-medium text-brand-secondary">Melbourne Startups Growth</span>
                                </p>
                            </div>
                        </li>
                        <li className="flex w-full max-w-xs gap-3 rounded-lg bg-alpha-white/90 p-4 opacity-50 backdrop-blur-lg">
                            <img
                                alt="Lana Steiner"
                                src="https://www.untitledui.com/images/avatars/lana-steiner?fm=webp&q=80"
                                className="size-10 rounded-full object-cover outline-1 -outline-offset-1 outline-avatar-contrast-border"
                            />
                            <div>
                                <p className="text-sm text-tertiary">
                                    <span className="font-medium text-brand-secondary">Lana Steiner</span> just launched{" "}
                                    <span className="font-medium text-brand-secondary">The 10k users challenge</span>
                                </p>
                            </div>
                        </li>
                    </ul>
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
        callOut: "Most popular!",
        features: [
            "Access to all basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
        hasCallout: true,
    },
    {
        title: "Business plan",
        subtitle: "$20/mth",
        description: "Billed annually.",
        features: ["200+ integrations", "Advanced reporting", "Up to 20 individual users", "40 GB individual data", "Priority chat and email support"],
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

const PricingTierCardCallout = (props: {
    title: string;
    subtitle: string;
    description?: string;
    features: string[];
    secondAction?: string;
    checkItemTextColor?: "primary" | "success";
    hasCallout?: boolean;
    className?: string;
}) => {
    return (
        <div className={cx("relative flex flex-col rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt", props.className)}>
            {props.hasCallout && (
                <div className="absolute -top-6 right-2 md:-right-16">
                    <div className="flex text-brand-secondary">
                        <svg width="60" height="46" viewBox="0 0 60 46" fill="none">
                            <path
                                d="M9.22056 42.4485C9.06321 43.2619 9.595 44.0488 10.4084 44.2061C11.2217 44.3635 12.0086 43.8317 12.166 43.0184L9.22056 42.4485ZM50.5841 3.7912C51.405 3.68023 51.9806 2.92474 51.8696 2.10378C51.7586 1.28282 51.0032 0.707267 50.1822 0.818242L50.5841 3.7912ZM4.78725 32.3308C4.36038 31.6208 3.43878 31.3913 2.7288 31.8182C2.01882 32.2451 1.78931 33.1667 2.21618 33.8766L4.78725 32.3308ZM8.9767 42.2098L7.69117 42.9828L7.69189 42.984L8.9767 42.2098ZM12.5932 43.2606L11.9803 41.8916L11.979 41.8921L12.5932 43.2606ZM23.5123 40.0155C24.2684 39.677 24.6069 38.7897 24.2684 38.0336C23.9299 37.2774 23.0425 36.9389 22.2864 37.2774L23.5123 40.0155ZM10.6933 42.7334C12.166 43.0184 12.1659 43.0187 12.1658 43.019C12.1658 43.0189 12.1658 43.0192 12.1658 43.0192C12.1658 43.0192 12.1658 43.0189 12.166 43.0184C12.1662 43.0173 12.1666 43.0152 12.1672 43.012C12.1684 43.0058 12.1705 42.9953 12.1735 42.9808C12.1794 42.9517 12.1887 42.9064 12.2016 42.8456C12.2274 42.7239 12.2676 42.5403 12.3233 42.3008C12.4349 41.8216 12.6088 41.1193 12.8551 40.2421C13.3481 38.4863 14.1291 36.0371 15.2773 33.2782C17.5833 27.7375 21.3236 21.0615 27.0838 16.2002L25.1489 13.9076C18.8763 19.2013 14.905 26.3651 12.5076 32.1255C11.3042 35.0171 10.4856 37.5837 9.96684 39.4311C9.7073 40.3554 9.52235 41.1015 9.40152 41.6204C9.34109 41.8799 9.29667 42.0827 9.26695 42.2227C9.25209 42.2927 9.24091 42.3471 9.23323 42.385C9.22939 42.4039 9.22643 42.4187 9.22432 42.4294C9.22327 42.4347 9.22243 42.4389 9.22181 42.4421C9.22149 42.4437 9.22123 42.4451 9.22103 42.4461C9.22092 42.4467 9.22081 42.4473 9.22075 42.4475C9.22065 42.4481 9.22056 42.4485 10.6933 42.7334ZM27.0838 16.2002C38.8964 6.23107 48.2848 4.10201 50.5841 3.7912L50.1822 0.818242C47.3237 1.20465 37.402 3.56662 25.1489 13.9076L27.0838 16.2002ZM2.21618 33.8766L7.69117 42.9828L10.2622 41.4369L4.78725 32.3308L2.21618 33.8766ZM7.69189 42.984C8.83415 44.8798 11.2204 45.5209 13.2074 44.6291L11.979 41.8921C11.2779 42.2068 10.5661 41.9412 10.2615 41.4357L7.69189 42.984ZM13.2061 44.6297L23.5123 40.0155L22.2864 37.2774L11.9803 41.8916L13.2061 44.6297Z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="-mt-2 text-sm font-semibold">Most popular!</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-center px-6 pt-10 text-center md:px-8">
                <h2 className="text-display-md font-semibold text-primary md:text-display-lg">{props.subtitle}</h2>
                <p className="mt-4 text-xl font-semibold text-primary md:text-xl">{props.title}</p>
                <p className="mt-1 text-md text-tertiary">{props.description}</p>
            </div>

            <ul className="flex flex-col gap-4 px-6 pt-8 pb-8 md:p-8 md:pb-10">
                {props.features.map((feat) => (
                    <CheckItemText key={feat} text={feat} color={props.checkItemTextColor} />
                ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 px-6 pb-8 md:px-8">
                <Button size="xl">Get started</Button>
                {props.secondAction && (
                    <Button color="secondary" size="xl">
                        {props.secondAction}
                    </Button>
                )}
            </div>
        </div>
    );
};

const PricingSectionFeaturedCards02 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-16 xl:flex-row">
                    <div className="w-full max-w-3xl xl:max-w-md">
                        <span className="block text-sm font-semibold text-brand-secondary md:text-md">Upgrade</span>
                        <h2 className="mt-3 hidden text-display-sm font-semibold text-primary md:flex md:text-display-md">Pricing plans that scale</h2>
                        <h2 className="mt-3 flex text-display-sm font-semibold text-primary md:hidden md:text-display-md">Pricing plans that scale with you</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5">Simple, transparent pricing that grows with you. Try any plan free for 30 days.</p>
                    </div>

                    <div className="grid w-full grid-cols-1 items-start gap-4 md:-ml-2 md:grid-cols-2 md:gap-8">
                        {plans.map((plan) => (
                            <PricingTierCardCallout key={plan.title} {...plan} checkItemTextColor="success" />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const NewsletterIPhoneMockup03 = () => {
    return (
        <section className="bg-primary pt-16 md:py-24">
            <div className="mx-auto grid w-full max-w-container grid-cols-1 gap-16 px-4 md:px-8 lg:grid-cols-2 lg:items-center">
                <div className="z-20 flex flex-col items-start md:max-w-xl md:pr-18">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md lg:text-display-lg">Be the first to know when we launch</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">
                        We're still building. Subscribe for updates and 20% off when we launch. <span className="max-md:hidden">No spam, we promise!</span>
                    </p>
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(new FormData(e.currentTarget));
                            console.log("Form data:", data);
                        }}
                        className="mt-8 flex w-full flex-col gap-4 md:mt-12 md:max-w-120 md:flex-row"
                    >
                        <Input
                            isRequired
                            size="md"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            wrapperClassName="py-0.5 md:max-w-[345px]"
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
                            Subscribe
                        </Button>
                    </Form>
                </div>

                <div className="relative -mx-4 min-h-90 w-screen overflow-hidden bg-tertiary md:mx-0 md:min-h-128 md:w-full">
                    <IPhoneMockup
                        image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                        imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                        className="absolute top-14 left-[47%] w-full max-w-67 -translate-x-[60%] drop-shadow-iphone-mockup sm:top-28 md:max-w-78.5 lg:left-12 lg:translate-x-0"
                    />
                    <IPhoneMockup
                        image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                        imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                        className="absolute top-6 right-[47%] w-full max-w-67 translate-x-[60%] drop-shadow-iphone-mockup sm:top-12 md:max-w-78.5 lg:right-12 lg:translate-x-0"
                    />
                </div>
            </div>
        </section>
    );
};

const footerSocials = [
    { label: "X (formerly Twitter)", icon: X, href: "https://x.com/" },
    { label: "LinkedIn", icon: LinkedIn, href: "https://www.linkedin.com/" },
    { label: "Facebook", icon: Facebook, href: "https://www.facebook.com/" },
    { label: "GitHub", icon: GitHub, href: "https://github.com/" },
    { label: "AngelList", icon: AngelList, href: "https://angel.co/" },
    { label: "Dribbble", icon: Dribbble, href: "https://dribbble.com/" },
    { label: "Layers", icon: Layers, href: "https://layers.com/" },
];

const FooterLarge11Brand = () => {
    return (
        <footer className="bg-brand-section py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col items-center border-b border-brand_alt pb-8 text-center md:pb-16">
                    <h2 className="text-display-xs font-semibold text-primary_on-brand md:text-display-sm">No long-term contracts. No catches. Simple.</h2>
                    <p className="mt-2 text-md text-tertiary_on-brand md:mt-4 md:text-xl">Start your 30-day free trial. Cancel anytime.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl" iconLeading={PlayCircle} className="shadow-xs! ring-0">
                            View demo
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>

                <div className="mt-12 flex flex-col justify-between gap-x-8 gap-y-12 md:mt-16 lg:flex-row">
                    <div className="flex flex-col gap-8 md:items-start">
                        <div className="flex w-full flex-col gap-6 md:max-w-xs md:gap-8">
                            <UntitledLogo className="dark-mode" />
                            <p className="text-md text-tertiary_on-brand">Design amazing digital experiences that create more happy in the world.</p>
                        </div>
                        <nav>
                            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-[repeat(6,max-content)]">
                                {[
                                    { label: "Overview", href: "#" },
                                    { label: "Features", href: "#" },
                                    { label: "Pricing", href: "#" },
                                    { label: "Careers", href: "#" },
                                    { label: "Help", href: "#" },
                                    { label: "Privacy", href: "#" },
                                ].map((item) => (
                                    <li key={item.label}>
                                        <Button
                                            className="text-footer-button-fg hover:text-footer-button-fg_hover"
                                            color="link-color"
                                            size="lg"
                                            href={item.href}
                                        >
                                            {item.label}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <div>
                        <h4 className="text-md font-medium text-primary_on-brand">Get the app</h4>
                        <div className="mt-4 flex w-max flex-row gap-4 lg:flex-col">
                            <AppStoreButtonOutline href="#" className="dark-mode w-[135px]" />
                            <GooglePlayButtonOutline href="#" className="dark-mode w-[135px]" />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col-reverse justify-between gap-6 border-t border-brand_alt pt-8 md:mt-16 md:flex-row">
                    <p className="text-md text-quaternary_on-brand">© 2077 Untitled UI. All rights reserved.</p>
                    <ul className="flex gap-6">
                        {footerSocials.map(({ label, icon: Icon, href }) => (
                            <li key={label}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex rounded-xs text-icon-fg-brand_on-brand outline-focus-ring transition duration-100 ease-linear hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    <Icon size={24} aria-label={label} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
};

const LandingPage13 = () => {
    return (
        <div className="bg-primary">
            <HeroIPhoneMockup01 />

            <SocialProofFullWidth />

            <IconsAndMockup01 />

            <CTAIPhoneMockup04 />

            <SectionDivider />

            <PricingSectionFeaturedCards02 />

            <SectionDivider />

            <NewsletterIPhoneMockup03 />

            <FooterLarge11Brand />
        </div>
    );
};

export default LandingPage13;
