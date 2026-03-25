"use client";

import { ArrowUp, ArrowUpRight, Edit04, FilterLines, UserPlus01 } from "@untitledui/icons";
import { Area, AreaChart, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis } from "recharts";
import type { FeedItemType } from "@/components/application/activity-feed/activity-feed";
import { FeedItem } from "@/components/application/activity-feed/activity-feed";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { TableRowActionsDropdown } from "@/components/application/table/table";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import johnImage from "@/assets/images/team/john.jpg";
import paulImage from "@/assets/images/team/paul.jpg";
import billImage from "@/assets/images/team/bill.jpg";
import travisImage from "@/assets/images/team/travis.jpg";
import sheilaImage from "@/assets/images/team/shiela.jpg";
import dyannaImage from "@/assets/images/team/dyanna.jpg";
import articleImage1 from "@/assets/images/writings/image1.png";
import articleImage2 from "@/assets/images/writings/image2.png";

const lineData = [
    {
        date: "2025-01-01",
        A: 600,
        B: 430,
    },
    {
        date: "2025-02-01",
        A: 620,
        B: 450,
    },
    {
        date: "2025-03-01",
        A: 630,
        B: 460,
    },
    {
        date: "2025-04-01",
        A: 650,
        B: 480,
    },
    {
        date: "2025-05-01",
        A: 600,
        B: 430,
    },
    {
        date: "2025-06-01",
        A: 650,
        B: 480,
    },
    {
        date: "2025-07-01",
        A: 620,
        B: 450,
    },
    {
        date: "2025-08-01",
        A: 750,
        B: 580,
    },
    {
        date: "2025-09-01",
        A: 780,
        B: 610,
    },
    {
        date: "2025-10-01",
        A: 750,
        B: 580,
    },
    {
        date: "2025-11-01",
        A: 780,
        B: 610,
    },
    {
        date: "2025-12-01",
        A: 820,
        B: 650,
    },
];

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
        title: "SmartScan Now Live",
        summary: "AI-powered vehicle diagnostics and inspection reports are now available for all dealers.",
        href: "/app/products/smartscan",
        category: { name: "Product Update", href: "#" },
        thumbnailUrl: articleImage1.src,
        publishedAt: "18 Jan 2025",
        readingTime: "3 min read",
        author: {
            name: "John Canales",
            href: "#",
            avatarUrl: johnImage.src,
        },
        tags: [
            { name: "SmartScan", color: "brand", href: "#" },
            { name: "AI", color: "indigo", href: "#" },
            { name: "Diagnostics", color: "pink", href: "#" },
        ],
        isFeatured: true,
    },
    {
        id: "article-2",
        title: "Acquisition.io Beta Launch",
        summary: "AI-powered vehicle consignment is entering beta—source smarter, sell faster.",
        href: "/app/products/acquisition",
        category: { name: "Announcement", href: "#" },
        thumbnailUrl: articleImage2.src,
        publishedAt: "14 Jan 2025",
        readingTime: "4 min read",
        author: {
            name: "Paul Machin",
            href: "#",
            avatarUrl: paulImage.src,
        },
        tags: [
            { name: "Acquisition", color: "blue-light", href: "#" },
            { name: "Consignment", color: "pink", href: "#" },
            { name: "AI", color: "pink", href: "#" },
        ],
    },
];

const feed: FeedItemType[] = [
    {
        id: "user-1",
        unseen: true,
        user: {
            avatarUrl: johnImage.src,
            name: "John Canales",
            href: "#",
            status: "online",
        },
        action: { content: "Founder & CEO" },
    },
    {
        id: "user-2",
        unseen: true,
        user: {
            avatarUrl: paulImage.src,
            name: "Paul Machin",
            href: "#",
            status: "online",
        },
        action: { content: "Chief Revenue Officer" },
    },
    {
        id: "user-3",
        unseen: true,
        user: {
            avatarUrl: billImage.src,
            name: "Bill Randolph",
            href: "#",
            status: "online",
        },
        action: { content: "Chief Commercial Officer" },
    },
    {
        id: "user-4",
        unseen: false,
        user: {
            avatarUrl: travisImage.src,
            name: "Travis Wisenbarger",
            href: "#",
            status: "online",
        },
        action: { content: "Chief Sales Officer" },
    },
    {
        id: "user-5",
        unseen: false,
        user: {
            avatarUrl: sheilaImage.src,
            name: "Sheila Hartwell",
            href: "#",
            status: "online",
        },
        action: { content: "Co-Founder & Chief Success Officer" },
    },
    {
        id: "user-6",
        unseen: false,
        user: {
            avatarUrl: dyannaImage.src,
            name: "Dyanna Rossini",
            href: "#",
            status: "online",
        },
        action: { content: "Chief Innovation Officer" },
    },
];

const Simple04Vertical = ({ article, imageClassName, className }: { article: Article; imageClassName?: string; className?: string }) => (
    <div className={cx("flex flex-col gap-4", className)}>
        <div className="relative">
            <a href={article.href} className="w-full" tabIndex={-1}>
                <img src={article.thumbnailUrl} alt={article.title} className={cx("aspect-[1.5] w-full object-cover", imageClassName)} />
            </a>
            <div className="absolute inset-x-0 bottom-0 overflow-hidden bg-linear-to-b from-transparent to-black/40">
                <div className="relative flex items-start justify-between bg-alpha-white/30 p-4 backdrop-blur-md before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-alpha-white/30 md:p-5">
                    <div>
                        <a
                            href={article.author.href}
                            className="block rounded-xs text-sm font-semibold text-white outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            {article.author.name}
                        </a>
                        <p className="text-sm text-white">{article.publishedAt}</p>
                    </div>
                    <a
                        href={article.category.href}
                        className="rounded-xs text-sm font-semibold text-white outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        {article.category.name}
                    </a>
                </div>
            </div>
        </div>

        <div className="flex flex-col items-start gap-5">
            <div className="flex flex-col gap-1">
                <a
                    href={article.category.href}
                    className="flex justify-between gap-x-4 rounded-md text-lg font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    {article.title}
                </a>
                <p className="line-clamp-2 text-md text-tertiary">{article.summary}</p>
            </div>

            <Button href={article.href} color="link-color" size="lg" iconTrailing={ArrowUpRight}>
                Read post
            </Button>
        </div>
    </div>
);

export const Dashboard01 = () => {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8">
                        <div className="mx-auto flex w-full max-w-container flex-col gap-5 px-4 lg:px-8">
                            {/* Page header simple with search */}
                            <div className="relative flex flex-col gap-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                                    <div className="flex flex-col gap-0.5 lg:gap-1">
                                        <h1 className="text-xl font-semibold text-primary lg:text-display-xs">Welcome back to VinTraxx</h1>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 lg:justify-between">
                                <ButtonGroup defaultSelectedKeys={["12-months"]}>
                                    <ButtonGroupItem id="12-months">
                                        <span className="max-lg:hidden">12 months</span>
                                        <span className="lg:hidden">12m</span>
                                    </ButtonGroupItem>
                                    <ButtonGroupItem id="30-days">
                                        <span className="max-lg:hidden">30 days</span>
                                        <span className="lg:hidden">30d</span>
                                    </ButtonGroupItem>
                                    <ButtonGroupItem id="7-days">
                                        <span className="max-lg:hidden">7 days</span>
                                        <span className="lg:hidden">7d</span>
                                    </ButtonGroupItem>
                                    <ButtonGroupItem id="24-hours">
                                        <span className="max-lg:hidden">24 hours</span>
                                        <span className="lg:hidden">24h</span>
                                    </ButtonGroupItem>
                                </ButtonGroup>

                                <div className="hidden gap-3 lg:flex">
                                    <DateRangePicker />

                                    <Button color="secondary" size="md" iconLeading={FilterLines}>
                                        Filters
                                    </Button>
                                </div>

                                <div className="lg:hidden">
                                    <Button color="secondary" size="md" iconLeading={FilterLines} />
                                </div>
                            </div>
                        </div>

                        <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-4 lg:flex-row lg:gap-8 lg:px-8">
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-tertiary">Total Inventory Value</p>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-start gap-0.5">
                                        <span className="pt-0.5 text-xl font-medium text-primary">$</span>
                                        <span className="text-display-md font-semibold text-primary">2.4M</span>
                                    </div>

                                    <BadgeWithIcon type="modern" color="success" iconLeading={ArrowUp}>
                                        7.4%
                                    </BadgeWithIcon>
                                </div>
                            </div>

                            <div className="flex h-50 w-full flex-col gap-1.5 lg:h-60">
                                <ResponsiveContainer className="h-full">
                                    <AreaChart
                                        data={lineData}
                                        className="text-tertiary [&_.recharts-text]:text-xs"
                                        margin={{
                                            left: 5,
                                            right: 5,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="currentColor" className="text-utility-gray-500" stopOpacity="0.8" />
                                                <stop offset="80%" stopColor="currentColor" className="text-utility-gray-500" stopOpacity="0" />
                                            </linearGradient>

                                            <pattern id="verticalLines" width="8" height="100%" fill="url(#gradient)" patternUnits="userSpaceOnUse">
                                                <line
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="100%"
                                                    stroke="currentColor"
                                                    className="text-utility-gray-200"
                                                    strokeWidth="1.5"
                                                />
                                                <rect width="100%" height="100%" fill="url(#gradient)" fillOpacity={0.15} />
                                            </pattern>
                                        </defs>

                                        <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />

                                        <XAxis
                                            fill="currentColor"
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={10}
                                            interval="preserveStartEnd"
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short" })}
                                        />

                                        <RechartsTooltip
                                            content={<ChartTooltipContent />}
                                            formatter={(value) =>
                                                value?.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }) ?? ""
                                            }
                                            labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                                            cursor={{
                                                className: "stroke-utility-brand-600 stroke-2",
                                            }}
                                        />

                                        <Area
                                            isAnimationActive={false}
                                            className="text-utility-brand-600 [&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]"
                                            dataKey="A"
                                            name="Current period"
                                            type="linear"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            fill="url(#verticalLines)"
                                            activeDot={{
                                                className: "fill-bg-primary stroke-utility-brand-600 stroke-2",
                                            }}
                                        />

                                        <Area
                                            isAnimationActive={false}
                                            className="text-utility-brand-400 [&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]"
                                            dataKey="B"
                                            name="Previous period"
                                            type="linear"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            fill="none"
                                            activeDot={{
                                                className: "fill-bg-primary stroke-utility-brand-600 stroke-2",
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>{" "}
                            </div>

                            <dl className="flex w-full max-w-60 flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <dt className="text-sm font-medium text-tertiary">Active Vehicles</dt>
                                    <dd className="flex items-center gap-4">
                                        <span className="text-display-sm font-semibold text-primary">186</span>
                                        <BadgeWithIcon type="modern" color="success" iconLeading={ArrowUp}>
                                            9.2%
                                        </BadgeWithIcon>
                                    </dd>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <dt className="text-sm font-medium text-tertiary">Vehicles Sold (MTD)</dt>
                                    <dd className="flex items-center gap-4">
                                        <span className="text-display-sm font-semibold text-primary">42</span>
                                        <BadgeWithIcon type="modern" color="success" iconLeading={ArrowUp}>
                                            6.6%
                                        </BadgeWithIcon>
                                    </dd>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <dt className="text-sm font-medium text-tertiary">Avg Days on Lot</dt>
                                    <dd className="flex items-center gap-4">
                                        <span className="text-display-sm font-semibold text-primary">28</span>
                                        <BadgeWithIcon type="modern" color="success" iconLeading={ArrowUp}>
                                            8.1%
                                        </BadgeWithIcon>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-4 lg:px-8">
                            <SectionHeader.Root>
                                <SectionHeader.Group>
                                    <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
                                        <SectionHeader.Heading>Quick Actions</SectionHeader.Heading>
                                    </div>

                                    <div className="absolute top-0 right-0 md:static">
                                        <TableRowActionsDropdown />
                                    </div>
                                </SectionHeader.Group>
                            </SectionHeader.Root>

                            <div className="flex flex-col gap-8 lg:flex-row">
                                <div className="flex flex-col gap-8">
                                    <div className="flex flex-col gap-5 md:flex-row md:flex-wrap lg:gap-6">
                                        <a href="/app/products/vinlane" className="flex flex-1 cursor-pointer gap-3 rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary outline-focus-ring ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 md:min-w-[320px]">
                                            <FeaturedIcon icon={UserPlus01} color="brand" theme="dark" size="lg" className="hidden lg:flex" />
                                            <FeaturedIcon icon={UserPlus01} color="brand" theme="dark" size="md" className="lg:hidden" />

                                            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                                                <p className="text-md font-semibold text-secondary">Add New Vehicle</p>
                                                <p className="max-w-full truncate text-sm text-tertiary">Add manually or import from CSV</p>
                                            </div>
                                        </a>
                                        <a href="/app/products/smartscan" className="flex flex-1 cursor-pointer gap-3 rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary outline-focus-ring ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 md:min-w-[320px]">
                                            <FeaturedIcon icon={Edit04} color="brand" theme="dark" size="lg" className="hidden lg:flex" />
                                            <FeaturedIcon icon={Edit04} color="brand" theme="dark" size="md" className="lg:hidden" />

                                            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                                                <p className="text-md font-semibold text-secondary">Run SmartScan</p>
                                                <p className="max-w-full truncate text-sm text-tertiary">Start a vehicle diagnostic inspection</p>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <SectionHeader.Root>
                                            <SectionHeader.Group>
                                                <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
                                                    <SectionHeader.Heading>Recent Activity</SectionHeader.Heading>
                                                </div>

                                                <div className="absolute top-0 right-0 md:static">
                                                    <TableRowActionsDropdown />
                                                </div>
                                            </SectionHeader.Group>
                                        </SectionHeader.Root>

                                        <div className="flex flex-col gap-6 md:flex-row md:flex-wrap">
                                            <Simple04Vertical article={articles[0]} className="flex-1 md:min-w-[320px]" />
                                            <Simple04Vertical article={articles[1]} className="flex-1 md:min-w-[320px]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col gap-6 lg:max-w-60">
                                    <p className="hidden text-sm font-medium text-secondary lg:block">Team Activity</p>

                                    <SectionHeader.Root className="lg:hidden">
                                        <SectionHeader.Group>
                                            <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
                                                <SectionHeader.Heading>Team Activity</SectionHeader.Heading>
                                            </div>

                                            <div className="absolute top-0 right-0 md:static">
                                                <TableRowActionsDropdown />
                                            </div>
                                        </SectionHeader.Group>
                                    </SectionHeader.Root>

                                    <ul className="flex flex-col gap-6 lg:gap-5">
                                        {feed.map((item) => (
                                            <li key={item.id}>
                                                <FeedItem {...item} size="sm" connector={false} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    );
};
