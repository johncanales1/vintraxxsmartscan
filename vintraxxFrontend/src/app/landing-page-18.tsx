"use client";

import { type ReactNode, useState } from "react";
import { ArrowRight, ChartBreakoutSquare, CheckCircle, MessageChatCircle, ZapFast } from "@untitledui/icons";
import { AnimatePresence, type Transition, motion } from "motion/react";
import { PaginationDot } from "@/components/application/pagination/pagination-dot";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { PlayButtonIcon } from "@/components/foundations/play-button-icon";
import { StarIcon } from "@/components/foundations/rating-stars";
import { AngelList, Dribbble, Facebook, GitHub, Layers, LinkedIn, X } from "@/components/foundations/social-icons";
import { Header } from "@/components/marketing/header-navigation/header";
import { IPhoneMockup } from "@/components/shared-assets/iphone-mockup";
import { cx } from "@/utils/cx";

const HeroSplitImage06 = () => {
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

            <section className="py-16 md:pb-24">
                <div className="relative mx-auto grid max-w-container grid-cols-1 gap-16 px-4 md:px-8 lg:min-h-160 lg:items-center">
                    <div className="z-10 flex max-w-200 flex-col items-start">
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Customer service software for customer-first teams
                        </h1>
                        <p className="mt-4 max-w-xl text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            The best customer service software for customer-first teams. Industry-leading email and live chat support.{" "}
                        </p>

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
                                placeholder="Enter your email"
                                wrapperClassName="py-0.5"
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

                    <div className="relative lg:absolute lg:top-0 lg:right-8 lg:h-full lg:w-140">
                        <svg
                            className="absolute -bottom-2 left-4 hidden -translate-x-1/2 text-fg-brand-secondary lg:block"
                            width="305"
                            height="297"
                            viewBox="0 0 305 297"
                            fill="none"
                        >
                            <path
                                d="M15.0243 137.273C15.0243 137.273 117.788 224.619 301.934 145.676M31.6228 176.648C31.6228 176.648 10.7487 138.769 12.6572 136.157C14.5721 133.538 44.762 125.838 48.6753 125.389"
                                stroke="currentColor"
                                strokeWidth="6"
                                strokeMiterlimit="10"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>

                        <img
                            className="inset-0 h-60 w-full object-cover md:h-110 lg:h-full"
                            src="https://www.untitledui.com/images/portraits/lana-steiner"
                            alt="Portrait"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

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

const FeaturesAlternatingLayout03 = () => {
    return (
        <section className="flex flex-col gap-12 overflow-hidden bg-primary pb-16 sm:gap-16 md:gap-20 md:pb-24 lg:gap-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Beautiful analytics to grow smarter</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                    </p>
                </div>
            </div>

            <div className="mx-auto flex w-full max-w-container flex-col gap-12 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24">
                <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24">
                    <div className="max-w-xl flex-1 self-center">
                        <FeaturedIcon icon={MessageChatCircle} color="brand" size="lg" theme="light" />

                        <h2 className="mt-5 text-display-xs font-semibold text-primary md:text-display-sm">Share team inboxes</h2>
                        <p className="mt-2 text-md text-tertiary md:mt-4 md:text-lg">
                            Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.
                        </p>
                        <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
                            {[
                                "Leverage automation to move fast",
                                "Always give customers a human to chat to",
                                "Automate customer support and close leads faster",
                            ].map((feat) => (
                                <CheckItemText key={feat} size="md" iconStyle="outlined" color="primary" text={feat} />
                            ))}
                        </ul>
                    </div>

                    <div className="relative -ml-4 w-screen flex-1 bg-tertiary px-4 py-6 md:ml-0 md:min-h-128 md:w-full md:overflow-hidden md:p-0 lg:overflow-visible">
                        <div className="top-0 left-0 bg-tertiary md:absolute md:h-full md:w-screen lg:overflow-hidden">
                            {/* Light mode image (hidden in dark mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                className="top-12 left-12 w-full rounded object-contain object-left-top ring-4 ring-screen-mockup-border md:absolute md:h-[120%] md:w-auto md:max-w-5xl md:rounded-[10px] lg:max-w-3xl dark:hidden"
                            />
                            {/* Dark mode image (hidden in light mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                className="top-12 left-12 w-full rounded object-contain object-left-top ring-4 ring-screen-mockup-border not-dark:hidden md:absolute md:h-[120%] md:w-auto md:max-w-5xl md:rounded-[10px] lg:max-w-3xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24">
                    <div className="max-w-xl flex-1 self-center lg:order-last">
                        <FeaturedIcon icon={ZapFast} color="brand" size="lg" theme="light" />

                        <h2 className="mt-5 text-display-xs font-semibold text-primary md:text-display-sm">Deliver instant answers</h2>
                        <p className="mt-2 text-md text-tertiary md:mt-4 md:text-lg">
                            An all-in-one customer service platform that helps you balance everything your customers need to be happy.
                        </p>
                        <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
                            {[
                                "Keep your customers in the loop with live chat",
                                "Embed help articles right on your website",
                                "Customers never have to leave the page to find an answer",
                            ].map((feat) => (
                                <CheckItemText key={feat} size="md" iconStyle="outlined" color="primary" text={feat} />
                            ))}
                        </ul>
                    </div>

                    <div className="relative -ml-4 h-90 w-screen overflow-hidden bg-tertiary px-4 pt-6 md:ml-0 md:min-h-128 md:w-full md:flex-1 md:overflow-hidden md:p-0 md:px-12 lg:overflow-visible">
                        <div className="top-0 right-0 h-full bg-tertiary md:absolute md:w-screen lg:overflow-hidden">
                            <IPhoneMockup
                                image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                                imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                                className="absolute top-28 right-1/2 hidden w-full translate-x-[30%] md:block md:w-78.5 md:max-w-none lg:right-62 lg:translate-x-0"
                            />
                            <IPhoneMockup
                                image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                                imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                                className="top-12 right-1/2 mx-auto w-71 drop-shadow-iphone-mockup md:absolute md:mx-0 md:w-78.5 md:max-w-none md:translate-x-[70%] lg:right-12 lg:translate-x-0"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24">
                    <div className="max-w-xl flex-1 self-center">
                        <FeaturedIcon icon={ChartBreakoutSquare} color="brand" size="lg" theme="light" />

                        <h2 className="mt-5 text-display-xs font-semibold text-primary md:text-display-sm">Manage your team with reports</h2>
                        <p className="mt-2 text-md text-tertiary md:mt-4 md:text-lg">
                            Measure what matters with Untitled's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.
                        </p>
                        <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
                            {[
                                "Filter, export, and drilldown on the data quickly",
                                "Save, schedule, and automate reports to your inbox",
                                "Connect the tools you already use with 100+ integrations",
                            ].map((feat) => (
                                <CheckItemText key={feat} size="md" iconStyle="outlined" color="primary" text={feat} />
                            ))}
                        </ul>
                    </div>

                    <div className="relative -ml-4 h-90 w-screen overflow-hidden bg-tertiary px-4 pt-6 md:ml-0 md:min-h-128 md:w-full md:flex-1 md:overflow-hidden md:p-0 md:px-12 lg:overflow-visible">
                        <div className="top-0 left-0 bg-tertiary md:absolute md:h-full md:w-screen lg:overflow-hidden">
                            {/* Light mode image (hidden in dark mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                className="absolute top-12 left-50 w-full rounded object-contain object-left-top ring-4 ring-screen-mockup-border max-md:hidden md:h-[120%] md:w-auto md:max-w-3xl md:rounded-[10px] dark:hidden"
                            />
                            {/* Dark mode image (hidden in light mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                className="absolute top-12 left-50 w-full rounded object-contain object-left-top ring-4 ring-screen-mockup-border not-dark:hidden max-md:hidden md:h-[120%] md:w-auto md:max-w-3xl md:rounded-[10px]"
                            />

                            <IPhoneMockup
                                image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                                imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                                className="top-28 left-12 mx-auto w-71 object-contain shadow-2xl drop-shadow-iphone-mockup md:absolute md:mx-0 md:w-78.5 md:max-w-none"
                            />
                        </div>
                    </div>
                </div>
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

const FeaturesTabsMockup06 = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <section className="overflow-hidden bg-primary pb-16 md:pb-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="flex w-full flex-col lg:max-w-3xl">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Hire faster</span>

                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">A seamless experience for candidates</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Treat candidates with a rich careers site and a wonderful application process.
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

                    <div className="relative -ml-4 flex h-90 w-screen items-start justify-center sm:w-auto lg:h-128">
                        {/* Desktop */}
                        <div className="absolute top-0 left-16 hidden w-max lg:block lg:h-168.5 lg:max-h-168.5">
                            <div className="size-full rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px]">
                                <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[23.58px] md:p-1 md:shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[20.21px] md:ring-[1.68px]">
                                        {/* Light mode image (hidden in dark mode) */}
                                        <img
                                            alt="Dashboard mockup showing application interface"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                            className="size-full object-cover object-left-top dark:hidden"
                                        />
                                        {/* Dark mode image (hidden in light mode) */}
                                        <img
                                            alt="Dashboard mockup showing application interface"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                            className="size-full object-cover object-left-top not-dark:hidden"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="w-max max-w-70 lg:absolute lg:top-26 lg:left-0">
                            <div className="size-full rounded-[23.89px] bg-primary p-[3px] shadow-lg ring-[1.49px] ring-utility-gray-300 ring-inset">
                                <div className="size-full rounded-[20.91px] bg-primary p-1 shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[17.92px] bg-utility-gray-50 ring-[1.49px] ring-utility-gray-200">
                                        {/* Light mode image (hidden in dark mode) */}
                                        <img
                                            alt="Mobile app interface mockup"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                                            className="size-full object-cover object-left-top dark:hidden"
                                        />
                                        {/* Dark mode image (hidden in light mode) */}
                                        <img
                                            alt="Mobile app interface mockup"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                                            className="size-full object-cover object-left-top not-dark:hidden"
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

const TestimonialCardSplitImage = () => {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    const transition: Transition = {
        type: "spring",
        duration: 0.8,
    };

    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 items-center overflow-hidden rounded-2xl bg-secondary md:rounded-3xl lg:grid-cols-[auto_auto]">
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
                                        className="origin-bottom-left text-display-xs font-medium text-balance text-primary will-change-transform sm:text-display-sm md:text-display-md"
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
                                    <p className="text-lg font-semibold text-primary">— {reviews[currentReviewIndex].author.name}</p>
                                    <cite className="text-md text-tertiary not-italic">{reviews[currentReviewIndex].author.title}</cite>
                                </motion.figcaption>
                            </AnimatePresence>
                        </figure>
                        <PaginationDot page={currentReviewIndex + 1} total={3} size="lg" onPageChange={(page) => setCurrentReviewIndex(page - 1)} />
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

const CTAScreenMockup04 = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 overflow-hidden rounded-3xl bg-secondary lg:grid-cols-2 lg:items-center">
                    <div className="flex flex-1 flex-col px-6 pt-10 pb-12 sm:p-12 lg:p-16">
                        <h2 className="text-display-sm font-semibold text-primary xl:text-display-md">Join 4,000+ startups growing with Untitled</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 lg:text-xl">Start your 30-day free trial today.</p>
                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start md:mt-12">
                            <Button color="secondary" size="xl">
                                Learn more
                            </Button>
                            <Button size="xl">Get started</Button>
                        </div>
                    </div>
                    <div className="h-52 w-full translate-x-6 translate-y-0 sm:h-90 sm:translate-x-12 sm:translate-y-12 md:h-120 lg:w-auto">
                        <div className="w-max max-w-full rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[20.91px] md:p-0.5 md:ring-[1.26px] lg:max-w-3xl">
                            <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[17.68px] md:p-1 md:shadow-modern-mockup-inner-lg">
                                <div className="relative size-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[15.16px] md:ring-[1.26px]">
                                    {/* Light mode image (hidden in dark mode) */}
                                    <img
                                        alt="Dashboard mockup showing application interface"
                                        src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                        className="size-full object-cover object-left-top dark:hidden"
                                    />
                                    {/* Dark mode image (hidden in light mode) */}
                                    <img
                                        alt="Dashboard mockup showing application interface"
                                        src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                        className="size-full object-cover object-left-top not-dark:hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const NewsletterSimpleLeft = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto flex w-full max-w-container flex-col items-start justify-between gap-8 px-4 md:px-8 lg:flex-row">
                <div>
                    <h1 className="text-display-sm font-semibold text-primary md:text-display-md">Sign up for our newsletter</h1>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Be the first to know about releases and industry news and insights.</p>
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

const FooterLarge10 = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-between border-b border-secondary pb-8 md:pb-16 lg:flex-row">
                    <div className="max-w-3xl">
                        <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Start your 30-day free trial</h2>
                        <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Join over 4,000+ startups already growing with Untitled.</p>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch sm:flex-row sm:self-start lg:mt-0">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-12 md:mt-16 md:gap-16 xl:flex-row">
                    <div className="flex flex-col gap-6 md:w-80 md:gap-8">
                        <UntitledLogo className="h-8 w-min shrink-0" />
                        <p className="text-md text-tertiary">Design amazing digital experiences that create more happy in the world.</p>
                    </div>
                    <nav className="flex-1">
                        <ul className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-5">
                            {footerNavList.slice(0, 5).map((category) => (
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

const LandingPage18 = () => {
    return (
        <div className="bg-primary">
            <HeroSplitImage06 />

            <FeaturesAlternatingLayout03 />

            <CTACardHorizontal />

            <FeaturesTabsMockup06 />

            <TestimonialCardSplitImage />

            <CTAScreenMockup04 />

            <NewsletterSimpleLeft />

            <FooterLarge10 />
        </div>
    );
};

export default LandingPage18;
