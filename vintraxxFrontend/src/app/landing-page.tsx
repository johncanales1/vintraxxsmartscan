"use client";

import { type ComponentProps, type ComponentPropsWithRef, type FC, type ReactNode, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, PlayCircle } from "@untitledui/icons";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { Badge, type BadgeColor } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { VideoPlayer } from "@/components/base/video-player/video-player";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";
import Link from "next/link";
import videoThumbnail from "@/assets/videos/thumbnail.png";
import acquisitionLogo from "@/assets/logo/brands/acquisition.png";
import smartscanLogo from "@/assets/logo/brands/smartscan.png";
import vinclipsLogo from "@/assets/logo/brands/vinclips.png";
import vinlaneLogo from "@/assets/logo/brands/vinlane.png";
import capitalLogo from "@/assets/logo/brands/capital.png";
import writingImage1 from "@/assets/images/writings/image1.png";
import writingImage2 from "@/assets/images/writings/image2.png";
import writingImage3 from "@/assets/images/writings/image3.png";
import writingImage4 from "@/assets/images/writings/image4.png";
import dashboardImage from "@/assets/images/dashboard.png";
import macBookImageDark from "@/assets/images/macbook/mackbook-pro-screen-mockup-dark.png";
import macBookImageLight from "@/assets/images/macbook/mackbook-pro-screen-mockup-light.png";

const HeaderPrimary = (props: ComponentProps<typeof Header>) => {
    return (
        <Header
            {...props}
            className="bg-utility-brand-50_alt [&_nav>ul>li>a]:text-brand-primary [&_nav>ul>li>a]:hover:text-brand-primary [&_nav>ul>li>button]:text-brand-primary [&_nav>ul>li>button]:hover:text-brand-primary [&_nav>ul>li>button>svg]:text-fg-brand-secondary_alt"
        />
    );
};

export const BackgroundStripes = () => {
    return (
        <div className="absolute top-0 h-108 w-full overflow-hidden pt-[152px] md:pt-[94px] 2xl:h-128 2xl:pt-[136px]">
            <div className="-skew-y-[7deg] [--column-width:minmax(0,calc(1280px/var(--content-columns)))] [--content-columns:12] [--gutter-columns:4] [--stripe-height:34px] sm:[--stripe-height:48px] lg:[--stripe-height:72px]">
                {/* BG MASK */}
                <div className="absolute bottom-[var(--stripe-height)] h-110 w-full bg-utility-brand-50_alt"></div>
                {/* STRIPES */}
                <div
                    className="relative grid h-full"
                    style={{
                        gridTemplateRows: "repeat(3,var(--stripe-height))",
                        gridTemplateColumns:
                            "[viewport-start] 1fr [left-gutter-start] repeat(var(--gutter-columns),var(--column-width)) [left-gutter-end content-start] repeat(var(--content-columns),var(--column-width)) [content-end right-gutter-start] repeat(var(--gutter-columns),var(--column-width)) [right-gutter-end] 1fr [viewport-end]",
                    }}
                >
                    <div style={{ gridArea: "2 / left-gutter-start / auto / span 5" }} className="bg-utility-brand-100_alt"></div>
                    <div style={{ gridArea: "3 / viewport-start / auto / span 4" }} className="bg-utility-brand-400_alt"></div>
                    <div style={{ gridArea: "1 / span 7 / auto / viewport-end" }} className="bg-utility-brand-400_alt"></div>
                    <div style={{ gridArea: "2 / span 8 / auto / right-gutter-end" }} className="bg-utility-brand-200_alt"></div>
                    <div style={{ gridArea: "3 / span 3 / auto / viewport-end" }} className="bg-utility-brand-100_alt"></div>
                </div>
            </div>
        </div>
    );
};

const HeroAbstractAngles01 = () => {
    return (
        <div className="bg-primary">
            <HeaderPrimary />
            <section>
                <div className="relative flex flex-col items-center overflow-hidden pt-16 md:pt-24 min-h-[800px] md:min-h-[900px]">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 z-0 size-full object-cover"
                        src="/assets/videos/intro.mp4"
                    />
                    <div className="absolute inset-0 z-0 bg-black/50" />

                    <div className="relative z-10 mx-auto flex w-full max-w-container flex-col px-4 md:px-8">
                        <div className="flex flex-col items-start sm:items-center sm:text-center">
                            <a href="#" className="rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                                <BadgeGroup className="hidden md:flex" size="lg" addonText="New feature" iconTrailing={ArrowRight} theme="light" color="brand">
                                    AI-Powered Vehicle Consignment
                                </BadgeGroup>
                                <BadgeGroup className="md:hidden" size="md" addonText="New feature" iconTrailing={ArrowRight} theme="light" color="brand">
                                    AI-Powered Vehicle Consignment
                                </BadgeGroup>
                            </a>

                            <h1 className="mt-4 text-display-md font-semibold text-white md:text-display-lg lg:text-display-xl">
                                The Smarter Way to Stock a Dealership
                            </h1>
                            <p className="mt-4 max-w-3xl text-lg text-white/80 md:mt-6 md:text-xl">
                                A modern approach to choosing the right vehicles—using real demand data, faster sourcing, and smarter pricing - so you sell more, reduce aging inventory, and improve profit.
                            </p>
                            <div className="relative z-1 mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                                <Button iconLeading={PlayCircle} color="secondary" size="xl">
                                    Request a Demo
                                </Button>
                                {/* <Button size="xl">Sign up</Button> */}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto w-full px-4 pb-8 md:px-8 md:pb-12">
                        <div className="mx-auto max-w-5xl rounded-2xl bg-white/10 px-6 py-6 ring-1 ring-white/20 backdrop-blur-xl ring-inset md:px-10 md:py-8">
                            <p className="mb-5 text-center text-md font-medium text-white/70">Our AI-Powered Products</p>
                            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 xl:gap-x-8">
                                <img alt="Capital" src={capitalLogo.src} className="h-10 brightness-0 invert opacity-80 md:h-14" />
                                <img alt="SmartScan" src={smartscanLogo.src} className="h-10 brightness-0 invert opacity-80 md:h-14" />
                                <img alt="VinLane" src={vinlaneLogo.src} className="h-10 brightness-0 invert opacity-80 md:h-14" />
                                <img alt="VinClips" src={vinclipsLogo.src} className="h-10 brightness-0 invert opacity-80 md:h-14" />
                                <img alt="Acquisition" src={acquisitionLogo.src} className="h-10 brightness-0 invert opacity-80 md:h-14" />
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
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md mt-16 font-medium text-tertiary">Our AI-Powered Products</p>
                    <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 xl:gap-x-8">
                        <img alt="Capital" src={capitalLogo.src} className="h-12 md:h-16" />
                        <img alt="SmartScan" src={smartscanLogo.src} className="h-12 md:h-16" />
                        <img alt="VinLane" src={vinlaneLogo.src} className="h-12 md:h-16" />
                        <img alt="VinClips" src={vinclipsLogo.src} className="h-12 md:h-16" />
                        <img alt="Acquisition" src={acquisitionLogo.src} className="h-12 md:h-16" />
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

const FeaturesTabsMockup07 = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <section className="overflow-hidden bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="flex w-full flex-col lg:max-w-3xl">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Full Suite of Tools</span>

                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Everything You Need, All in One Platform</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Stop jumping between tools. VinTraxx brings together inventory management, reconditioning, diagnostics, and media production in one seamless ecosystem.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:gap-16 lg:grid-cols-2 lg:items-center">
                    <ul className="flex flex-col">
                        {[
                            {
                                title: "VinLane IMS - Master Your Inventory",
                                subtitle: "Real-time inventory tracking across multiple lots, floorplan optimization, and one-click syncing to marketplaces.",
                            },
                            {
                                title: "SmartScan - Appraise with Confidence",
                                subtitle: "Advanced OBD scanning for comprehensive vehicle health assessments, professional reports, and AI-powered pricing recommendations.",
                            },
                            {
                                title: "VinTraxx Capital - Finance Your Customers",
                                subtitle: "Offer short-term financing at checkout so your customers can pay for accessories, repairs, tires, and more over time.",
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

                    <div className="relative -ml-4 w-screen md:w-full lg:h-140">
                        <div className="-mx-4 flex items-center justify-center lg:absolute lg:mr-9.5 lg:-ml-0 lg:h-140 lg:w-[50vw] lg:justify-start">
                            {/* Light mode image (hidden in dark mode) testing */}
                            <img
                                src={macBookImageLight.src}
                                alt="MacBook Pro displaying a professional application interface with modern design and functionality"
                                className="h-full object-contain lg:max-w-none dark:hidden"
                            />
                            {/* Dark mode image (hidden in light mode) */}
                            <img
                                src={macBookImageDark.src}
                                alt="MacBook Pro displaying a professional application interface with modern design and functionality"
                                className="h-full object-contain not-dark:hidden lg:max-w-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const studies = [
    {
        company: "VinTraxx Capital",
        quote: "Offering financing at checkout increased our average ticket size and helped us close more service customers.",
        background: "bg-[#1e3a5f]",
        logo: capitalLogo.src,
        href: "#",
    },
    {
        company: "SmartScan",
        quote: "AI-powered vehicle inspections have reduced our reconditioning costs significantly.",
        background: "bg-[#33B87F]",
        logo: smartscanLogo.src,
        href: "#",
    },
    {
        company: "VinLane",
        quote: "VinLane streamlined our vehicle sourcing process, cutting acquisition time by 40%.",
        background: "bg-[#52A0BF]",
        logo: vinlaneLogo.src,
        href: "#",
    },
    {
        company: "VinClips",
        quote: "Video marketing with VinClips increased our online engagement by 60%.",
        background: "bg-[#A645ED]",
        logo: vinclipsLogo.src,
        href: "#",
    },
    {
        company: "Acquisition",
        quote: "Smarter pricing and faster sourcing helped us maximize profit on every vehicle.",
        background: "bg-[#6A65F7]",
        logo: acquisitionLogo.src,
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
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">AI-Powered Products for Modern Dealerships</h2>
                        <p className="text-lg text-tertiary md:text-xl">Discover how our suite of tools helps dealerships streamline operations and maximize profits.</p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 self-stretch sm:flex-row sm:self-start">
                        <Button color="secondary" size="xl">
                            Explore Products
                        </Button>
                        <Button size="xl">Request a Demo</Button>
                    </div>
                </div>

                <Carousel.Root className="mt-12 md:mt-16" opts={{ align: "start" }}>
                    <Carousel.Content overflowHidden={false} className="gap-6 pr-4 md:gap-8 md:pr-8">
                        {studies.map((study) => (
                            <Carousel.Item
                                key={study.company}
                                className={cx(
                                    "relative flex h-118 max-w-76 shrink-0 cursor-grab items-end p-6 md:h-126 md:w-full md:max-w-sm md:p-5",
                                    study.background,
                                )}
                            >
                                <img src={study.logo} alt={study.company} className="absolute top-6 left-6 h-14 object-contain md:top-8 md:left-8 md:h-22" />

                                <div className="flex cursor-auto flex-col bg-alpha-white/30 px-4 py-5 ring-1 ring-alpha-white/30 backdrop-blur-md ring-inset md:p-5 md:px-6 md:py-8">
                                    <p className="text-display-xs font-semibold text-white md:text-display-sm">{study.company}</p>
                                    <q className="mt-3 text-lg font-medium text-balance text-white md:mt-4">{study.quote}</q>

                                    <Button color="link-gray" size="lg" href={study.href} className="mt-8 text-white" iconTrailing={ArrowUpRight}>
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

const CTAScreenMockup03 = () => {
    return (
        <section className="overflow-hidden bg-primary py-16 md:pt-24 md:pb-0">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">
                        <span className="hidden md:inline">Ready to Transform Your Dealership?</span>
                        <span className="md:hidden">Transform Your Dealership</span>
                    </h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Join dealerships already maximizing profits with VinTraxx.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:flex-row md:self-center">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Request a Demo</Button>
                    </div>
                </div>
            </div>
            <div className="mx-auto mt-16 w-full max-w-container px-4 md:max-h-100 md:overflow-hidden md:px-8">
                <div className="size-full rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[32px] md:p-1 md:ring-[2px]">
                    <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[28px] md:p-[5.4px] md:shadow-modern-mockup-inner-lg">
                        <div className="relative size-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[24px] md:ring-[2px]">
                            {/* Light mode image (hidden in dark mode) */}
                            <img
                                src={dashboardImage.src}
                                className="size-full object-cover dark:hidden"
                                alt="Dashboard mockup showing application interface"
                            />
                            {/* Dark mode image (hidden in light mode) */}
                            <img
                                src={dashboardImage.src}
                                className="size-full object-cover not-dark:hidden"
                                alt="Dashboard mockup showing application interface"
                            />
                        </div>
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
        title: "Maximizing Dealership Profits with AI-Powered Inventory",
        summary: "Learn how AI-driven insights can optimize your vehicle sourcing and reduce aging inventory by up to 40%.",
        href: "#",
        category: { name: "Inventory", href: "#" },
        thumbnailUrl: writingImage1.src,
        publishedAt: "28 Jan 2026",
        readingTime: "6 min read",
        author: { name: "VinTraxx Team", href: "#", avatarUrl: "" },
        tags: [
            { name: "AI", color: "brand", href: "#" },
            { name: "Inventory", color: "blue-light", href: "#" },
        ],
        isFeatured: true,
    },
    {
        id: "article-2",
        title: "Streamlining Vehicle Reconditioning Workflows",
        summary: "Discover how digital task management and vendor coordination can reduce recon time by 32%.",
        href: "#",
        category: { name: "Recon", href: "#" },
        thumbnailUrl: writingImage2.src,
        publishedAt: "25 Jan 2026",
        readingTime: "5 min read",
        author: { name: "VinTraxx Team", href: "#", avatarUrl: "" },
        tags: [
            { name: "Recon", color: "orange", href: "#" },
            { name: "Efficiency", color: "success", href: "#" },
        ],
    },
    {
        id: "article-3",
        title: "The Power of Video Marketing for Dealerships",
        summary: "How VinClips helps dealers reach millions of potential buyers on TikTok with daily automated video content.",
        href: "#",
        category: { name: "Marketing", href: "#" },
        thumbnailUrl: writingImage3.src,
        publishedAt: "22 Jan 2026",
        readingTime: "7 min read",
        author: { name: "VinTraxx Team", href: "#", avatarUrl: "" },
        tags: [
            { name: "VinClips", color: "pink", href: "#" },
            { name: "Social Media", color: "indigo", href: "#" },
        ],
    },
    {
        id: "article-4",
        title: "SmartScan: Revolutionizing Vehicle Appraisals",
        summary: "Advanced OBD diagnostics and AI-powered pricing recommendations for confident vehicle acquisitions.",
        href: "#",
        category: { name: "Diagnostics", href: "#" },
        thumbnailUrl: writingImage4.src,
        publishedAt: "18 Jan 2026",
        readingTime: "5 min read",
        author: { name: "VinTraxx Team", href: "#", avatarUrl: "" },
        tags: [
            { name: "SmartScan", color: "success", href: "#" },
            { name: "Appraisal", color: "gray-blue", href: "#" },
        ],
    },
];

const Simple03Vertical = ({
    article,
    imageClassName,
    titleClassName,
    className,
}: {
    article: Article;
    imageClassName?: string;
    titleClassName?: string;
    className?: string;
}) => (
    <article className={cx("flex flex-col gap-4", className)}>
        <a href={article.href} className="overflow-hidden rounded-2xl" tabIndex={-1}>
            <img src={article.thumbnailUrl} alt={article.title} className={cx("aspect-[1.5] w-full object-cover", imageClassName)} />
        </a>

        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-start gap-2">
                <p className="text-sm font-semibold text-brand-secondary">
                    {article.author.name} • <time>{article.publishedAt}</time>
                </p>
                <div className="flex w-full flex-col gap-1">
                    <a
                        href={article.category.href}
                        className={cx(
                            "flex justify-between gap-x-4 rounded-md text-lg font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                            titleClassName,
                        )}
                    >
                        {article.title}
                        <ArrowUpRight className="mt-0.5 size-6 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    </a>
                    <p className="line-clamp-2 text-md text-tertiary">{article.summary}</p>
                </div>
            </div>

            <div className="flex gap-2">
                {article.tags.map((tag) => (
                    <a key={tag.name} href={tag.href} className="rounded-xl outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                        <Badge color={tag.color} size="md">
                            {tag.name}
                        </Badge>
                    </a>
                ))}
            </div>
        </div>
    </article>
);

const BlogSectionCarouselLayout02 = () => {
    return (
        <section className="overflow-hidden bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col items-start justify-between lg:flex-row">
                    <div className="max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Latest writings</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">The latest news, technologies, and resources from our team.</p>
                    </div>

                    <div className="hidden gap-3 lg:flex">
                        <Button size="xl">View all posts</Button>
                    </div>
                </div>

                <Carousel.Root className="mt-12 md:mt-16" opts={{ align: "start" }}>
                    <Carousel.Content overflowHidden={false} className="gap-6 pr-4 md:gap-8 md:pr-8">
                        {articles.slice(0, 4).map((article) => (
                            <Carousel.Item key={article.id} className="max-w-xs md:max-w-96">
                                <Simple03Vertical article={article} />
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
                            <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Transform Your Dealership with VinTraxx</h2>
                            <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">7 AI-powered products working together to maximize your profit.</p>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 self-stretch sm:flex-row sm:self-start md:mt-12 lg:flex-row-reverse">
                            <Button size="xl">Request a Demo</Button>
                            <Button color="secondary" size="xl">
                                Learn more
                            </Button>
                        </div>
                    </div>
                    <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-6 lg:mt-0">
                        <img alt="Capital" src={capitalLogo.src} className="h-10 md:h-12" />
                        <img alt="SmartScan" src={smartscanLogo.src} className="h-10 md:h-12" />
                        <img alt="VinLane" src={vinlaneLogo.src} className="h-10 md:h-12" />
                        <img alt="VinClips" src={vinclipsLogo.src} className="h-10 md:h-12" />
                        <img alt="Acquisition" src={acquisitionLogo.src} className="h-10 md:h-12" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const footerNavList = [
    {
        label: "Products",
        items: [
            { label: "VinTraxx Capital", href: "/products/capital" },
            { label: "SmartScan", href: "/products/smartscan" },
            { label: "VinLane IMS", href: "/products/vinlane" },
            { label: "VinClips", href: "/products/vinclips" },
            { label: "Acquisition.io", href: "/products/acquisition" },
        ],
    },
    {
        label: "Company",
        items: [
            { label: "About us", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Press", href: "/press" },
            { label: "News", href: "/news" },
            { label: "Contact", href: "/contact" },
        ],
    },
    {
        label: "Resources",
        items: [
            { label: "Blog", href: "/blog" },
            { label: "Help Center", href: "/help" },
            { label: "Documentation", href: "/docs" },
            { label: "Training", href: "/training" },
            { label: "Support", href: "/support" },
        ],
    },
    {
        label: "For Dealers",
        items: [
            { label: "Independent Dealers", href: "/dealers/independent" },
            { label: "Franchise Dealers", href: "/dealers/franchise" },
            { label: "Dealer Groups", href: "/dealers/groups" },
            { label: "Success Stories", href: "/success-stories" },
        ],
    },
    {
        label: "Social",
        items: [
            { label: "Twitter", href: "#" },
            { label: "LinkedIn", href: "#" },
            { label: "Facebook", href: "#" },
            { label: "TikTok", href: "#" },
            { label: "YouTube", href: "#" },
        ],
    },
    {
        label: "Legal",
        items: [
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "Cookies", href: "/cookies" },
            { label: "Settings", href: "/settings" },
        ],
    },
];

const FooterLarge09 = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Let's Revolutionize Your Dealership Together</h2>
                    <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Get in touch to see how VinTraxx can boost your operations and profits.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl">
                            Contact Us
                        </Button>
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
                                        <li key={item.label}>
                                            <Button color="link-gray" size="lg" href={item.href}>
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
                    <Link href="/">
                    <UntitledLogo className="h-10" />
                </Link>
                    <p className="text-md text-quaternary">© 2025 Vintraxx. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const LandingPage = () => {
    return (
        <div className="bg-primary">
            <HeroAbstractAngles01 />

            <SocialProofFullWidth />

            <SectionDivider />

            <FeaturesTabsMockup07 />

            <SectionDivider />

            <TestimonialCaseStudyCards />

            <SectionDivider />

            <CTAScreenMockup03 />

            <BlogSectionCarouselLayout02 />

            <CTASimpleLogos02 />

            <FooterLarge09 />
        </div>
    );
};

export default LandingPage;
