"use client";

import { type ComponentPropsWithRef, type FC, type ReactNode, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, PlayCircle } from "@untitledui/icons";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { Badge, type BadgeColor } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { AngelList, Dribbble, Facebook, GitHub, Layers, LinkedIn, X } from "@/components/foundations/social-icons";
import { Header } from "@/components/marketing/header-navigation/header";
import { CreditCard } from "@/components/shared-assets/credit-card/credit-card";
import { IPhoneMockup } from "@/components/shared-assets/iphone-mockup";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

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

const HeroCardMockup02 = () => {
    return (
        <div className="relative overflow-hidden bg-secondary_alt">
            <Header />

            <section className="relative py-16 md:pb-24">
                <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
                    <div className="flex max-w-3xl flex-col items-start">
                        <a href="#" className="rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                            <BadgeGroup className="hidden md:flex" size="lg" addonText="What's new?" iconTrailing={ArrowRight} theme="light" color="brand">
                                Instantly issue virtual cards
                            </BadgeGroup>
                            <BadgeGroup className="md:hidden" size="md" addonText="What's new?" iconTrailing={ArrowRight} theme="light" color="brand">
                                Instantly issue virtual cards
                            </BadgeGroup>
                        </a>
                        <h1 className="mt-4 text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            No more business banking headaches
                        </h1>
                        <p className="mt-4 max-w-120 text-lg text-tertiary md:mt-6 md:text-xl">
                            Untitled is a next-gen financial technology company in the process of reinventing banking.{" "}
                        </p>

                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 md:mt-12 md:flex-row md:items-start">
                            <Button color="secondary" size="xl" iconLeading={PlayCircle}>
                                Demo
                            </Button>
                            <Button size="xl">Sign up</Button>
                        </div>
                    </div>

                    <div className="relative -mx-4 flex h-80 items-center justify-center bg-quaternary md:mx-0 md:h-120 lg:h-full lg:min-h-160">
                        <div className="-translate-x-0.5 -space-y-[106px] md:translate-x-[9px] md:-translate-y-[1px] md:-space-y-16 lg:-space-y-8">
                            <div
                                className="relative z-1 [--scale:0.84] md:[--scale:1.3] lg:[--scale:1.57]"
                                style={{ transform: "scale(var(--scale)) rotate(60deg) translate(38px, -53px)" }}
                            >
                                <CreditCard type="transparent" cardHolder="OLIVIA RHYE" />
                            </div>
                            <div
                                className="relative z-0 [--scale:0.84] md:[--scale:1.3] lg:[--scale:1.57]"
                                style={{ transform: "scale(var(--scale)) rotate(30deg) translate(-23px, 24px)" }}
                            >
                                <CreditCard type="brand-dark" cardHolder="Phoenix Baker" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const logos = [
    {
        name: "Odeaolabs",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/odeaolabs.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/odeaolabs.svg",
    },
    {
        name: "Kintsugi",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/kintsugi.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/kintsugi.svg",
    },
    {
        name: "Stackedlab",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/stackedlab.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/stackedlab.svg",
    },
    {
        name: "Magnolia",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/magnolia.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/magnolia.svg",
    },
    {
        name: "Powersurge",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/powersurge.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/powersurge.svg",
    },
    {
        name: "Warpspeed",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/warpspeed.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/warpspeed.svg",
    },
    {
        name: "Leapyear",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/leapyear.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/leapyear.svg",
    },
    {
        name: "Easytax",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/easytax.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/easytax.svg",
    },
    {
        name: "Sisyphus",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/sisyphus.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/sisyphus.svg",
    },
    {
        name: "Catalog",
        imageUrl: "https://www.untitledui.com/logos/logotype/color/catalog.svg",
        darkModeImageUrl: "https://www.untitledui.com/logos/logotype/white/catalog.svg",
    },
];

export const SocialProofFullWidthMasked = () => {
    return (
        <section className="overflow-hidden bg-primary_alt py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md font-medium text-tertiary">Trusted by 4,000+ companies</p>
                    <div className="flex max-w-full flex-col items-center gap-y-4 mask-x-from-80%">
                        {/* Top layer of logos (visible on all viewports) */}
                        <div className="flex">
                            <div className="flex w-auto max-w-none shrink-0 animate-marquee justify-center gap-5 pl-5 motion-reduce:animate-none md:gap-6 md:pl-6">
                                {/* Light mode images (hidden in dark mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.imageUrl} className="h-8 opacity-85 md:h-12 dark:hidden" />
                                ))}

                                {/* Dark mode images (hidden in light mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.darkModeImageUrl} className="h-8 opacity-85 not-dark:hidden md:h-12" />
                                ))}
                            </div>

                            <div className="flex w-auto max-w-none shrink-0 animate-marquee justify-center gap-5 pl-5 motion-reduce:animate-none md:gap-6 md:pl-6">
                                {/* Light mode images (hidden in dark mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.imageUrl} className="h-8 opacity-85 md:h-12 dark:hidden" />
                                ))}

                                {/* Dark mode images (hidden in light mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.darkModeImageUrl} className="h-8 opacity-85 not-dark:hidden md:h-12" />
                                ))}
                            </div>
                        </div>

                        {/* Bottom layer of logos (visible on mobile only) */}
                        <div className="flex md:hidden">
                            <div className="flex w-auto max-w-none shrink-0 animate-marquee justify-center gap-5 pl-5 delay-[-3s] direction-reverse motion-reduce:-translate-x-1/2 motion-reduce:animate-none md:gap-6 md:pl-6">
                                {/* Light mode images (hidden in dark mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.imageUrl} className="h-8 opacity-85 md:h-12 dark:hidden" />
                                ))}

                                {/* Dark mode images (hidden in light mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.darkModeImageUrl} className="h-8 opacity-85 not-dark:hidden md:h-12" />
                                ))}
                            </div>

                            <div className="flex w-auto max-w-none shrink-0 animate-marquee justify-center gap-5 pl-5 delay-[-3s] direction-reverse motion-reduce:-translate-x-1/2 motion-reduce:animate-none md:gap-6 md:pl-6">
                                {/* Light mode images (hidden in dark mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.imageUrl} className="h-8 opacity-85 md:h-12 dark:hidden" />
                                ))}

                                {/* Dark mode images (hidden in light mode) */}
                                {logos.map((logo) => (
                                    <img key={logo.name} alt={logo.name} src={logo.darkModeImageUrl} className="h-8 opacity-85 not-dark:hidden md:h-12" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const studies = [
    {
        company: "Layers",
        quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects faster.",
        background: "bg-utility-brand-600",
        logo: "https://www.untitledui.com/logos/logotype/white/layers.svg",
        href: "#",
    },
    {
        company: "Sisyphus",
        quote: "We've been using Untitled to kick start every new project and can't work without it.",
        background: "bg-utility-success-600",
        logo: "https://www.untitledui.com/logos/logotype/white/sisyphus.svg",
        href: "#",
    },
    {
        company: "Capsule",
        quote: "Love the simplicity of the service and the prompt customer support.",
        background: "bg-utility-blue-600",
        logo: "https://www.untitledui.com/logos/logotype/white/capsule.svg",
        href: "#",
    },
    {
        company: "Catalog",
        quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects faster.",
        background: "bg-utility-indigo-600",
        logo: "https://www.untitledui.com/logos/logotype/white/catalog.svg",
        href: "#",
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

const TestimonialCaseStudyCards = () => {
    return (
        <section className="overflow-hidden bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:gap-0">
                    <div className="flex max-w-3xl flex-col gap-4 md:gap-5">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">We've helped hundreds of global companies</h2>
                        <p className="text-lg text-tertiary md:text-xl">Case studies from some of our amazing customers who are building faster.</p>
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
                        {studies.map((study) => (
                            <Carousel.Item
                                key={study.company}
                                className={cx(
                                    "relative flex h-118 max-w-76 shrink-0 cursor-grab items-end p-6 md:h-126 md:w-full md:max-w-sm md:p-5",
                                    study.background,
                                )}
                            >
                                <img src={study.logo} alt={study.company} className="absolute top-6 left-6 h-10 object-contain md:top-8 md:left-8 md:h-12" />

                                <div className="flex cursor-auto flex-col bg-alpha-white/30 px-4 py-5 ring-1 ring-alpha-white/30 backdrop-blur-md ring-inset md:p-5 md:px-6 md:py-8">
                                    <p className="text-display-xs font-semibold text-white">{study.company}</p>
                                    <q className="mt-3 text-lg font-medium text-balance text-white">{study.quote}</q>

                                    <Button
                                        color="link-gray"
                                        size="lg"
                                        href={study.href}
                                        className="mt-6 text-white"
                                        iconTrailing={<ArrowUpRight data-icon className="text-fg-white!" />}
                                    >
                                        Read case study
                                    </Button>
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

interface FeatureTabProps {
    title: string;
    subtitle: string;
    footer?: ReactNode;
    isCurrent?: boolean;
}

const FeatureTabVertical = ({ title, subtitle, footer, isCurrent }: FeatureTabProps) => (
    <div
        className={cx(
            "relative flex max-w-[405px] cursor-pointer flex-col items-center gap-4 border-t-4 border-tertiary pt-5 text-center transition duration-100 ease-linear hover:border-brand md:gap-5 md:px-4",
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

const FeaturesTabsMockup02 = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <Badge size="lg" className="hidden md:inline-flex" color="brand" type="pill-color">
                        Features
                    </Badge>
                    <Badge size="md" className="inline-flex md:hidden" color="brand" type="pill-color">
                        Features
                    </Badge>
                    <h2 className="mt-4 text-display-sm font-semibold text-primary md:text-display-md">All-in-one finance for any business</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Get a deposit account, credit card, and spend management software—in one refreshingly easy solution. No fees or minimums.{" "}
                    </p>
                </div>
            </div>

            <div className="mx-auto w-full max-w-container overflow-hidden px-4 pt-12 md:px-8 md:pt-16">
                <div className="flex h-104 w-full items-start justify-center md:h-128">
                    <div className="relative flex w-144 justify-center">
                        <IPhoneMockup
                            image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                            imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                            className="absolute top-16 left-0 hidden h-[579px] w-71 drop-shadow-iphone-mockup md:block md:h-auto md:w-[313px]"
                        />
                        <IPhoneMockup
                            image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                            imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                            className="h-[579px] w-71 drop-shadow-iphone-mockup md:absolute md:right-0 md:h-auto md:w-[313px]"
                        />
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-12 w-full max-w-container px-4 md:mt-20 md:px-8">
                <ul className="flex flex-1 flex-wrap justify-center gap-y-11 lg:flex-nowrap">
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
                            <FeatureTabVertical title={item.title} subtitle={item.subtitle} isCurrent={index === currentTab} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

const PressMentions = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md font-medium text-tertiary">We're changing the game</p>
                    <div className="flex flex-col flex-wrap justify-center gap-x-8 gap-y-4 md:flex-row">
                        {/* Light mode images (hidden in dark mode) */}
                        <img alt="Washington" src="https://www.untitledui.com/logos/logotype/color/washington.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Techcrunch" src="https://www.untitledui.com/logos/logotype/color/techcrunch.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Bloomberg" src="https://www.untitledui.com/logos/logotype/color/bloomberg.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Gizmodo" src="https://www.untitledui.com/logos/logotype/color/gizmodo.svg" className="h-8 md:h-10 dark:hidden" />
                        <img alt="Forbes" src="https://www.untitledui.com/logos/logotype/color/forbes.svg" className="h-8 md:h-10 dark:hidden" />

                        {/* Dark mode images (hidden in light mode) */}
                        <img
                            alt="Washington"
                            src="https://www.untitledui.com/logos/logotype/white/washington.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Techcrunch"
                            src="https://www.untitledui.com/logos/logotype/white/techcrunch.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Bloomberg"
                            src="https://www.untitledui.com/logos/logotype/white/bloomberg.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Gizmodo"
                            src="https://www.untitledui.com/logos/logotype/white/gizmodo.svg"
                            className="h-8 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img alt="Forbes" src="https://www.untitledui.com/logos/logotype/white/forbes.svg" className="h-8 opacity-85 not-dark:hidden md:h-10" />
                    </div>
                </div>
            </div>
        </section>
    );
};

type Article = {
    id: string;
    href: string;
    thumbnailUrl: string;
    title: string;
    summary: string;
    category: {
        href: string;
        name: string;
    };
    author: {
        href: string;
        name: string;
        avatarUrl: string;
    };
    publishedAt: string;
    readingTime: string;
    tags: Array<{ name: string; color: BadgeColor<"color">; href: string }>;
    isFeatured?: boolean;
};

const articles: Article[] = [
    {
        id: "article-1",
        title: "UX review presentations",
        summary: "How do you create compelling presentations that wow your colleagues and impress your managers?",
        href: "#",
        category: { name: "Design", href: "#" },
        thumbnailUrl: "https://www.untitledui.com/marketing/spirals.webp",
        publishedAt: "20 Jan 2025",
        readingTime: "8 min read",
        author: { name: "Olivia Rhye", href: "#", avatarUrl: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" },
        tags: [
            { name: "Design", color: "brand", href: "#" },
            { name: "Research", color: "indigo", href: "#" },
            { name: "Presentation", color: "pink", href: "#" },
        ],
        isFeatured: true,
    },
    {
        id: "article-2",
        title: "Migrating to Linear 101",
        summary: "Linear helps streamline software projects, sprints, tasks, and bug tracking. Here's how to get started.",
        href: "#",
        category: { name: "Product", href: "#" },
        thumbnailUrl: "https://www.untitledui.com/marketing/conversation.webp",

        publishedAt: "19 Jan 2025",
        readingTime: "8 min read",
        author: { name: "Phoenix Baker", href: "#", avatarUrl: "https://www.untitledui.com/images/avatars/phoenix-baker?fm=webp&q=80" },
        tags: [
            { name: "Product", color: "blue-light", href: "#" },
            { name: "Tools", color: "pink", href: "#" },
            { name: "SaaS", color: "pink", href: "#" },
        ],
    },
    {
        id: "article-3",
        title: "Building your API stack",
        summary: "The rise of RESTful APIs has been met by a rise in tools for creating, testing, and managing them.",
        href: "#",
        category: { name: "Software Engineering", href: "#" },
        thumbnailUrl: "https://www.untitledui.com/blog/two-mobile-shapes-pattern.webp",
        publishedAt: "18 Jan 2025",
        readingTime: "8 min read",
        author: { name: "Lana Steiner", href: "#", avatarUrl: "https://www.untitledui.com/images/avatars/lana-steiner?fm=webp&q=80" },
        tags: [
            { name: "Software Development", color: "success", href: "#" },
            { name: "Tools", color: "pink", href: "#" },
        ],
    },
];

const Simple01Vertical = ({ article, imageClassName }: { article: Article; imageClassName?: string }) => (
    <article className="flex flex-col gap-4">
        <a href={article.href} className="overflow-hidden rounded-2xl" tabIndex={-1}>
            <img
                src={article.thumbnailUrl}
                alt={article.title}
                className={cx("aspect-[1.5] w-full object-cover transition duration-100 ease-linear hover:scale-105", imageClassName)}
            />
        </a>

        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-brand-secondary">{article.category.name}</span>
                <div className="flex flex-col gap-1">
                    <a
                        href={article.href}
                        className="group/title flex justify-between gap-x-4 rounded-md text-lg font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        {article.title}
                        <ArrowUpRight
                            className="mt-0.5 size-6 shrink-0 text-fg-quaternary transition duration-100 ease-linear group-hover/title:text-fg-quaternary_hover"
                            aria-hidden="true"
                        />
                    </a>

                    <p className="line-clamp-2 text-md text-tertiary">{article.summary}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <a href={article.author.href} tabIndex={-1} className="flex">
                    <Avatar focusable alt={article.author.name} src={article.author.avatarUrl} size="md" />
                </a>

                <div>
                    <a
                        href={article.author.href}
                        className="block rounded-xs text-sm font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        {article.author.name}
                    </a>
                    <time className="block text-sm text-tertiary">{article.publishedAt}</time>
                </div>
            </div>
        </div>
    </article>
);

const BlogSectionSimpleLeftAligned01 = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col items-start justify-between lg:flex-row">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold text-brand-secondary md:text-md">Our blog</p>
                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Latest blog posts</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Tool and strategies modern teams need to help their companies grow.</p>
                    </div>

                    <div className="hidden gap-3 lg:flex">
                        <Button size="xl">View all posts</Button>
                    </div>
                </div>

                <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-16 md:grid-cols-2 md:gap-y-16 lg:grid-cols-3">
                    {articles.slice(0, 3).map((article) => (
                        <li key={article.id}>
                            <Simple01Vertical article={article} />
                        </li>
                    ))}
                </ul>
                <div className="mt-12 flex flex-col gap-3 lg:hidden">
                    <Button size="xl">View all posts</Button>
                </div>
            </div>
        </section>
    );
};

const CTASimpleLogos02 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 items-start lg:grid-cols-2 lg:gap-16">
                    <div className="flex flex-col">
                        <div className="max-w-3xl">
                            <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Join over 4,000+ startups growing with Untitled</h2>
                            <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Start your 30-day free trial today.</p>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 self-stretch sm:flex-row sm:self-start md:mt-12 lg:flex-row-reverse">
                            <Button size="xl">Get started</Button>
                            <Button color="secondary" size="xl">
                                Learn more
                            </Button>
                        </div>
                    </div>
                    <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-y-6 lg:mt-0">
                        {/* Light mode images (hidden in dark mode) */}
                        <img alt="Ephemeral" src="https://www.untitledui.com/logos/logotype/color/ephemeral.svg" className="h-9 md:h-10 dark:hidden" />
                        <img alt="Wildcrafted" src="https://www.untitledui.com/logos/logotype/color/wildcrafted.svg" className="h-9 md:h-10 dark:hidden" />
                        <img alt="Codecraft" src="https://www.untitledui.com/logos/logotype/color/codecraft.svg" className="h-9 md:h-10 dark:hidden" />
                        <img alt="Convergence" src="https://www.untitledui.com/logos/logotype/color/convergence.svg" className="h-9 md:h-10 dark:hidden" />
                        <img alt="Imgcompress" src="https://www.untitledui.com/logos/logotype/color/imgcompress.svg" className="h-9 md:h-10 dark:hidden" />
                        <img alt="Epicurious" src="https://www.untitledui.com/logos/logotype/color/epicurious.svg" className="h-9 md:h-10 dark:hidden" />
                        <img
                            alt="Watchtower"
                            src="https://www.untitledui.com/logos/logotype/color/watchtower.svg"
                            className="h-9 max-md:hidden md:h-10 dark:hidden"
                        />
                        <img
                            alt="Renaissance"
                            src="https://www.untitledui.com/logos/logotype/color/renaissance.svg"
                            className="h-9 max-md:hidden md:h-10 dark:hidden"
                        />
                        <img
                            alt="Contrastai"
                            src="https://www.untitledui.com/logos/logotype/color/contrastai.svg"
                            className="h-9 max-md:hidden md:h-10 dark:hidden"
                        />

                        {/* Dark mode images (hidden in light mode) */}
                        <img
                            alt="Ephemeral"
                            src="https://www.untitledui.com/logos/logotype/white/ephemeral.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Wildcrafted"
                            src="https://www.untitledui.com/logos/logotype/white/wildcrafted.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Codecraft"
                            src="https://www.untitledui.com/logos/logotype/white/codecraft.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Convergence"
                            src="https://www.untitledui.com/logos/logotype/white/convergence.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Imgcompress"
                            src="https://www.untitledui.com/logos/logotype/white/imgcompress.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Epicurious"
                            src="https://www.untitledui.com/logos/logotype/white/epicurious.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-10"
                        />
                        <img
                            alt="Watchtower"
                            src="https://www.untitledui.com/logos/logotype/white/watchtower.svg"
                            className="h-9 opacity-85 not-dark:hidden max-md:hidden md:h-10"
                        />
                        <img
                            alt="Renaissance"
                            src="https://www.untitledui.com/logos/logotype/white/renaissance.svg"
                            className="h-9 opacity-85 not-dark:hidden max-md:hidden md:h-10"
                        />
                        <img
                            alt="Contrastai"
                            src="https://www.untitledui.com/logos/logotype/white/contrastai.svg"
                            className="h-9 opacity-85 not-dark:hidden max-md:hidden md:h-10"
                        />
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

const LandingPage10 = () => {
    return (
        <div className="bg-primary">
            <HeroCardMockup02 />

            <SocialProofFullWidthMasked />

            <SectionDivider />

            <TestimonialCaseStudyCards />

            <FeaturesTabsMockup02 />

            <PressMentions />

            <BlogSectionSimpleLeftAligned01 />

            <CTASimpleLogos02 />

            <NewsletterSimpleLeft />

            <FooterLarge10 />
        </div>
    );
};

export default LandingPage10;
