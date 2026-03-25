"use client";

import type { ComponentPropsWithRef, FC, ReactNode } from "react";
import {
    ArrowLeft,
    ArrowRight,
    ChartBreakoutSquare,
    CheckCircle,
    Command,
    MessageChatCircle,
    MessageHeartCircle,
    MessageSmileCircle,
    PlayCircle,
    Zap,
} from "@untitledui/icons";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { Badge } from "@/components/base/badges/badges";
import { AppStoreButton, GooglePlayButton } from "@/components/base/buttons/app-store-buttons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { StarIcon } from "@/components/foundations/rating-stars";
import { AngelList, Dribbble, Facebook, GitHub, Layers, LinkedIn, X } from "@/components/foundations/social-icons";
import { Header } from "@/components/marketing/header-navigation/header";
import { CreditCard } from "@/components/shared-assets/credit-card/credit-card";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

const HeroCardMockup09 = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            {/* Background pattern */}
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-dot-sm-desktop.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]"
            />
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-dot-sm-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]"
            />

            <Header />

            <section className="relative py-16 md:pb-24">
                <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
                    <div className="flex max-w-3xl flex-col items-start">
                        <a href="#" className="rounded-[10px] outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                            <BadgeGroup className="hidden md:flex" size="lg" addonText="New!" iconTrailing={ArrowRight} theme="modern" color="success">
                                Download the new iOS app
                            </BadgeGroup>
                            <BadgeGroup className="md:hidden" size="md" addonText="New!" iconTrailing={ArrowRight} theme="modern" color="success">
                                Download the new iOS app
                            </BadgeGroup>
                        </a>
                        <h1 className="mt-4 text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">Smart business credit cards</h1>
                        <p className="mt-4 max-w-120 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            <span className="max-md:hidden">Untitled is a next-gen financial technology company in the process of reinventing banking.</span>
                            <span className="md:hidden">
                                Mo money, no problems. Untitled is a next-generation financial technology company in the process of reinventing banking. 30-day
                                free trial.
                            </span>
                        </p>

                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 md:mt-12 md:flex-row md:items-start">
                            <Button color="secondary" size="xl" iconLeading={PlayCircle}>
                                Demo
                            </Button>
                            <Button size="xl">Sign up</Button>
                        </div>
                    </div>

                    <div className="relative -mx-4 flex h-80 items-center justify-center bg-tertiary md:mr-0 md:h-120 md:rounded-2xl lg:h-full lg:min-h-140">
                        <div className="-space-y-[146px] md:translate-y-3.5 md:-space-y-[126px]">
                            <div
                                className="relative z-4 [--scale:1.13] md:[--scale:1.641]"
                                style={{
                                    transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)",
                                }}
                            >
                                <CreditCard type="transparent-gradient" cardHolder="Demi Wilkinson" />
                            </div>
                            <div
                                className="relative z-3 [--scale:1.13] md:[--scale:1.641]"
                                style={{
                                    transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)",
                                }}
                            >
                                <CreditCard type="brand-dark" cardHolder="Lana Steiner" />
                            </div>
                            <div
                                className="relative z-2 [--scale:1.13] md:[--scale:1.641]"
                                style={{
                                    transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)",
                                }}
                            >
                                <CreditCard type="transparent" cardHolder="OLIVIA RHYE" />
                            </div>
                            <div
                                className="relative z-1 [--scale:1.13] md:[--scale:1.641]"
                                style={{
                                    transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)",
                                }}
                            >
                                <CreditCard type="gray-dark" cardHolder="Phoenix Baker" />
                            </div>
                            <div
                                className="relative z-0 [--scale:1.13] md:[--scale:1.641]"
                                style={{
                                    transform: "scale(var(--scale)) rotateX(63deg) rotateY(1deg) rotateZ(51deg) skewX(14deg)",
                                }}
                            >
                                <div className="h-47.5 w-79 rounded-2xl bg-gray-900 opacity-15 blur-md"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
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

const FeatureTextFeaturedIconTopCentered = ({
    color = "gray",
    theme = "modern",
    icon,
    title,
    subtitle,
    footer,
}: FeatureTextIcon & {
    color?: "brand" | "gray" | "success" | "warning" | "error";
    theme?: "light" | "gradient" | "dark" | "outline" | "modern";
}) => (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <FeaturedIcon icon={icon} size="lg" color={color} theme={theme} className="hidden md:inline-flex" />
        <FeaturedIcon icon={icon} size="md" color={color} theme={theme} className="inline-flex md:hidden" />

        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>

        {footer}
    </div>
);

const FeaturesSimpleIcons02 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">All you need to run your finances effectively</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Open a full-featured account in with virtual cards in less than 5 minutes. </p>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 md:gap-y-16 lg:grid-cols-3">
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
                            {
                                title: "Connect the tools you already use",
                                subtitle:
                                    "Explore 100+ integrations that make your day-to-day workflow more efficient and familiar. Plus, our extensive developer tools.",
                                icon: Command,
                            },
                            {
                                title: "Our people make the difference",
                                subtitle:
                                    "We're an extension of your customer service team, and all of our resources are free. Chat to our friendly team 24/7 when you need help.",
                                icon: MessageHeartCircle,
                            },
                        ].map((item) => (
                            <li key={item.title}>
                                <FeatureTextFeaturedIconTopCentered icon={item.icon} title={item.title} subtitle={item.subtitle} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

const plans = [
    {
        title: "Basic plan",
        price: "$10",
        description: "Basic features for up to 10 users.",
        badge: "Popular",
        contentTitle: "FEATURES",
        contentDescription: (
            <>
                Everything in <span className="text-md font-semibold">Starter</span> plus....
            </>
        ),
        features: [
            "Access to basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
    },
    {
        title: "Business plan",
        price: "$20",
        description: "Advanced features and reporting.",
        contentTitle: "FEATURES",
        contentDescription: (
            <>
                Everything in <span className="text-md font-semibold">Basic</span> plus....
            </>
        ),
        features: [
            "Access to basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
    },
    {
        title: "Enterprise plan",
        price: "$40",
        description: "Unlimited features.",
        contentTitle: "FEATURES",
        contentDescription: (
            <>
                Everything in <span className="text-md font-semibold">Business</span> plus....
            </>
        ),
        features: [
            "Access to basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
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

const PricingTierCardDualAction = (props: {
    title: string;
    description?: string;
    contentTitle: string;
    contentDescription: ReactNode;
    badge?: string;
    price: string;
    features: string[];
    className?: string;
}) => (
    <div key={props.title} className="flex flex-col overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt">
        <div className="flex flex-col p-6 pb-8 md:p-8">
            <div className="flex justify-between">
                <span className="text-lg font-semibold text-tertiary">{props.title}</span>
                {props.badge && (
                    <Badge size="lg" type="pill-color" color="brand">
                        {props.badge}
                    </Badge>
                )}
            </div>

            <div className="mt-4 flex items-end gap-1">
                <p className="text-display-lg font-semibold text-primary md:text-display-xl">{props.price}</p>
                <span className="pb-2 text-md font-medium text-tertiary">per month</span>
            </div>

            <p className="mt-4 text-md text-tertiary">{props.description}</p>

            <div className="mt-8 flex flex-col gap-3 self-stretch">
                <Button size="xl">Get started</Button>
                <Button color="secondary" size="xl">
                    Chat to sales
                </Button>
            </div>
        </div>

        <div className="flex flex-col gap-6 px-6 pt-8 pb-10 ring-1 ring-secondary md:px-8">
            <div>
                <p className="text-md font-semibold text-primary uppercase">{props.contentTitle}</p>
                <p className="mt-1 text-md text-tertiary">{props.contentDescription}</p>
            </div>
            <ul className="flex flex-col gap-4">
                {props.features.map((feat) => (
                    <CheckItemText key={feat} iconStyle="outlined" color="primary" text={feat} />
                ))}
            </ul>
        </div>
    </div>
);

const PricingSectionSimpleCards03 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Pricing</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Plans that fit your scale</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Simple, transparent pricing that grows with you. Try any plan free for 30 days.
                    </p>
                </div>

                <div className="mt-12 grid w-full grid-cols-1 gap-4 md:mt-16 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
                    {plans.map((plan) => (
                        <PricingTierCardDualAction key={plan.title} {...plan} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const reviews = [
    {
        author: "Alisa Hester",
        imageUrl: "https://www.untitledui.com/images/portraits/alisa-hester",
        cite: "PM, Hourglass",
        industry: "Web Design Agency",
    },
    {
        quote: "We've really sped up our workflow using Untitled.",
        author: "Rich Wilson",
        imageUrl: "https://www.untitledui.com/images/portraits/rich-wilson",
        cite: "COO, Command+R",
        industry: "Web Development Agency",
    },
    {
        author: "Annie Stanley",
        imageUrl: "https://www.untitledui.com/images/portraits/annie-stanley",
        cite: "Designer, Catalog",
        industry: "UX Agency",
    },
    {
        author: "Johnny Bell",
        imageUrl: "https://www.untitledui.com/images/portraits/johnny-bell",
        cite: "PM, Sisyphus ",
        industry: "Machine Learning",
    },
];

interface RoundButtonProps extends ComponentPropsWithRef<"button"> {
    icon?: FC<{ className?: string }>;
}

const RoundButton = ({ icon: Icon, ...props }: RoundButtonProps) => {
    return (
        <Button
            {...props}
            color="link-gray"
            className={cx(
                "group flex size-12 items-center justify-center rounded-full bg-primary ring-1 ring-secondary backdrop-blur transition duration-100 ease-linear ring-inset hover:bg-secondary md:size-14",
                props.className,
            )}
        >
            {props.children ??
                (isReactComponent(Icon) ? (
                    <Icon className="size-5 text-fg-quaternary transition-inherit-all group-hover:text-fg-quaternary_hover md:size-6" />
                ) : null)}
        </Button>
    );
};

const TestimonialGlassmorphicCards01 = () => {
    return (
        <section className="overflow-hidden bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:gap-0">
                    <div className="flex max-w-3xl flex-col gap-4 md:gap-5">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Don't just take our word for it</h2>
                        <p className="text-lg text-tertiary md:text-xl">Hear from some of our amazing customers who are building faster.</p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 self-stretch sm:flex-row sm:self-start">
                        <Button color="secondary" size="xl">
                            Our customers
                        </Button>
                        <Button size="xl">Create account</Button>
                    </div>
                </div>

                <Carousel.Root
                    className="mt-12 md:mt-16"
                    opts={{
                        align: "start",
                    }}
                >
                    <Carousel.Content overflowHidden={false} className="gap-6 pr-4 md:gap-8 md:pr-8">
                        {reviews.map((review) => (
                            <Carousel.Item key={review.author} className="h-96 max-w-72 shrink-0 cursor-grab md:h-120 md:max-w-90">
                                <img src={review.imageUrl} className="size-full object-cover" alt="Olivia Rhye" />

                                <div className="relative">
                                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/40 to-black/0 p-3 pt-16 md:p-4 md:pt-20 lg:pt-24">
                                        <div className="flex cursor-auto flex-col gap-6 rounded-xl bg-primary/30 px-4 py-6 ring-1 ring-alpha-white/30 backdrop-blur-md ring-inset md:rounded-2xl md:p-5">
                                            {review.quote && <q className="text-xl font-semibold text-balance text-white">{review.quote}</q>}

                                            <div className="flex flex-col gap-1.5 md:gap-2">
                                                <div className="flex flex-col gap-4">
                                                    <div aria-hidden="true" className="flex gap-1">
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                    </div>

                                                    <p className="text-xl font-semibold text-white md:text-display-xs">{review.author}</p>
                                                </div>

                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-md font-semibold text-white">{review.cite}</p>
                                                    <p className="text-sm font-medium text-white">{review.industry}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Carousel.Item>
                        ))}
                    </Carousel.Content>
                    <div className="mt-8 flex gap-4 md:gap-8">
                        <Carousel.PrevTrigger asChild>
                            <RoundButton icon={ArrowLeft} />
                        </Carousel.PrevTrigger>
                        <Carousel.NextTrigger asChild>
                            <RoundButton icon={ArrowRight} />
                        </Carousel.NextTrigger>
                    </div>
                </Carousel.Root>
            </div>
        </section>
    );
};

const SocialProofCard = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container md:px-8">
                <div className="flex flex-col gap-8 bg-secondary px-6 py-12 md:rounded-2xl md:p-16">
                    <p className="text-center text-md font-medium text-tertiary md:text-xl">Trusted by 4,000+ companies</p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 xl:gap-x-8">
                        {/* Light mode images (hidden in dark mode) */}
                        <img alt="Catalog" src="https://www.untitledui.com/logos/logotype/color/catalog.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Pictelai" src="https://www.untitledui.com/logos/logotype/color/pictelai.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Leapyear" src="https://www.untitledui.com/logos/logotype/color/leapyear.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Peregrin" src="https://www.untitledui.com/logos/logotype/color/peregrin.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Easytax" src="https://www.untitledui.com/logos/logotype/color/easytax.svg" className="h-9 md:h-12 dark:hidden" />
                        <img
                            alt="Coreos"
                            src="https://www.untitledui.com/logos/logotype/color/coreos.svg"
                            className="inline-flex h-9 md:hidden md:h-12 dark:hidden"
                        />

                        {/* Dark mode images (hidden in light mode) */}
                        <img
                            alt="Catalog"
                            src="https://www.untitledui.com/logos/logotype/white/catalog.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Pictelai"
                            src="https://www.untitledui.com/logos/logotype/white/pictelai.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Leapyear"
                            src="https://www.untitledui.com/logos/logotype/white/leapyear.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Peregrin"
                            src="https://www.untitledui.com/logos/logotype/white/peregrin.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Easytax"
                            src="https://www.untitledui.com/logos/logotype/white/easytax.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Coreos"
                            src="https://www.untitledui.com/logos/logotype/white/coreos.svg"
                            className="inline-flex h-9 opacity-85 not-dark:hidden md:hidden md:h-12"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTAScreenMockup01 = () => {
    return (
        <section className="overflow-hidden bg-primary pb-16 md:pb-24">
            <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
                <div className="flex w-full max-w-3xl flex-col">
                    <h1 className="text-display-sm font-semibold text-primary md:text-display-lg">Get started in 5 minutes</h1>
                    <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
                        {["30-day free trial", "Personalized onboarding", "Access to all features"].map((feat) => (
                            <CheckItemText key={feat} size="md" iconStyle="outlined" color="primary" text={feat} />
                        ))}
                    </ul>
                    <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>

                <div className="relative mx-auto w-full lg:h-128">
                    <div className="top-0 left-0 w-full max-w-5xl rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px] lg:absolute lg:w-max">
                        <div className="rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[23.58px] md:p-1 md:shadow-modern-mockup-inner-lg">
                            <div className="relative overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[20.21px] md:ring-[1.68px]">
                                <img
                                    src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                    alt="Modern dashboard interface displaying financial analytics and business metrics in a clean layout"
                                    className="object-cover object-left-top dark:hidden"
                                />
                                <img
                                    src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                    alt="Modern dashboard interface displaying financial analytics and business metrics in a clean layout"
                                    className="object-cover object-left-top not-dark:hidden"
                                />
                            </div>
                        </div>
                    </div>
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

const FooterLarge11 = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col items-center border-b border-secondary pb-8 text-center md:pb-16">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">No long-term contracts. No catches. Simple.</h2>
                    <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Start your 30-day free trial. Cancel anytime.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl" iconLeading={PlayCircle}>
                            View demo
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>

                <div className="mt-12 flex flex-col justify-between gap-x-8 gap-y-12 md:mt-16 lg:flex-row">
                    <div className="flex flex-col gap-8 md:items-start">
                        <div className="flex w-full flex-col gap-6 md:max-w-xs md:gap-8">
                            <UntitledLogo className="h-8 w-min shrink-0" />
                            <p className="text-md text-tertiary">Design amazing digital experiences that create more happy in the world.</p>
                        </div>
                        <nav>
                            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-[repeat(6,max-content)]">
                                {[
                                    { title: "Overview", href: "#" },
                                    { title: "Features", href: "#" },
                                    { title: "Pricing", href: "#" },
                                    { title: "Careers", href: "#" },
                                    { title: "Help", href: "#" },
                                    { title: "Privacy", href: "#" },
                                ].map((item) => (
                                    <li key={item.title}>
                                        <Button color="link-gray" size="lg" href={item.href}>
                                            {item.title}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <div>
                        <h4 className="text-md font-medium text-brand-secondary">Get the app</h4>
                        <div className="mt-4 flex w-max flex-row gap-4 lg:flex-col">
                            <AppStoreButton href="#" className="w-[135px]" />
                            <GooglePlayButton href="#" className="w-[135px]" />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col-reverse justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row">
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>
                    <ul className="flex gap-6">
                        {footerSocials.map(({ label, icon: Icon, href }) => (
                            <li key={label}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
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

const LandingPage11 = () => {
    return (
        <div className="bg-primary">
            <HeroCardMockup09 />

            <FeaturesSimpleIcons02 />

            <SectionDivider />

            <PricingSectionSimpleCards03 />

            <SectionDivider />

            <TestimonialGlassmorphicCards01 />

            <SocialProofCard />

            <CTAScreenMockup01 />

            <FooterLarge11 />
        </div>
    );
};

export default LandingPage11;
