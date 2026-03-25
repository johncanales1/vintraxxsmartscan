"use client";

import { type FC, Fragment, type HTMLAttributes, useState } from "react";
import { ChartBreakoutSquare, CheckCircle, MessageChatCircle, PlayCircle, ZapFast } from "@untitledui/icons";
import { Collection, Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { RatingBadge } from "@/components/foundations/rating-badge";
import { AngelList, Dribbble, Facebook, GitHub, Layers, LinkedIn, X } from "@/components/foundations/social-icons";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

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

const HeroScreenMockup01 = () => {
    return (
        <div className="relative overflow-hidden bg-secondary_alt">
            {/* Background pattern */}
            <img
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-md-desktop.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]"
                alt="Grid pattern background"
            />
            <img
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-md-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]"
                alt="Grid pattern background"
            />

            <Header />

            <section className="relative overflow-hidden py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Beautiful analytics to grow smarter{" "}
                        </h1>
                        <p className="mt-4 max-w-3xl text-lg text-tertiary md:mt-6 md:text-xl">
                            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000
                            startups.
                        </p>
                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                            <Button iconLeading={PlayCircle} color="secondary" size="xl">
                                Demo
                            </Button>
                            <Button size="xl">Sign up</Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 w-full max-w-container px-4 md:h-100 md:px-8">
                    <div className="flex flex-col md:items-start">
                        <div className="mx-auto flex h-full w-full items-center justify-center md:max-h-105 md:w-full md:max-w-266 md:items-start lg:max-h-140">
                            <div className="size-full rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[28px] md:p-[3.5px] md:ring-[1.75px]">
                                <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[24.5px] md:p-1 md:shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[21px] md:ring-[1.75px]">
                                        {/* Light mode image (hidden in dark mode) */}
                                        <img
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                            className="size-full object-cover dark:hidden"
                                            alt="Analytics dashboard interface showing charts and data visualizations"
                                        />
                                        {/* Dark mode image (hidden in light mode) */}
                                        <img
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                            className="size-full object-cover not-dark:hidden"
                                            alt="Analytics dashboard interface showing charts and data visualizations"
                                        />
                                    </div>
                                </div>
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

const SocialProofFullWidthMasked = () => {
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

                                {/* Dark mode */}
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

const AlternateImageMockup: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
    return (
        <div
            className={cx(
                "size-full rounded-[9.03px] bg-primary p-[0.9px] shadow-modern-mockup-outer-md ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[20.08px] md:p-0.5 md:shadow-modern-mockup-outer-lg md:ring-[1.25px] lg:absolute lg:w-auto lg:max-w-none",
                props.className,
            )}
        >
            <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[17.57px] md:p-[3.5px] md:shadow-modern-mockup-inner-lg">
                <div className="relative size-full overflow-hidden rounded-[6.77px] ring-[0.56px] ring-utility-gray-200 md:rounded-[15.06px] md:ring-[1.25px]">
                    {props.children}
                </div>
            </div>
        </div>
    );
};

const FeaturesAlternatingLayout01 = () => {
    return (
        <section className="flex flex-col gap-12 overflow-hidden bg-primary py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24">
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
                        <FeaturedIcon icon={MessageChatCircle} size="lg" color="brand" theme="light" />
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

                    <div className="relative w-full flex-1 lg:h-128">
                        <AlternateImageMockup className="lg:left-0">
                            {/* Light mode image (hidden in dark mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                className="size-full object-contain lg:w-auto lg:max-w-none dark:hidden"
                            />
                            {/* Dark mode image (hidden in light mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                className="size-full object-contain not-dark:hidden lg:w-auto lg:max-w-none"
                            />
                        </AlternateImageMockup>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24">
                    <div className="max-w-xl flex-1 self-center lg:order-last">
                        <FeaturedIcon icon={ZapFast} size="lg" color="brand" theme="light" />
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

                    <div className="relative w-full flex-1 lg:h-128">
                        <AlternateImageMockup className="lg:right-0">
                            {/* Light mode image (hidden in dark mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                className="size-full object-contain lg:w-auto lg:max-w-none dark:hidden"
                            />
                            {/* Dark mode image (hidden in light mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                className="size-full object-contain not-dark:hidden lg:w-auto lg:max-w-none"
                            />
                        </AlternateImageMockup>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24">
                    <div className="max-w-xl flex-1 self-center">
                        <FeaturedIcon icon={ChartBreakoutSquare} size="lg" color="brand" theme="light" />
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

                    <div className="relative w-full flex-1 lg:h-128">
                        <AlternateImageMockup className="lg:left-0">
                            {/* Light mode image (hidden in dark mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                className="size-full object-contain lg:w-auto lg:max-w-none dark:hidden"
                            />
                            {/* Dark mode image (hidden in light mode) */}
                            <img
                                alt="Dashboard mockup showing application interface"
                                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                className="size-full object-contain not-dark:hidden lg:w-auto lg:max-w-none"
                            />
                        </AlternateImageMockup>
                    </div>
                </div>
            </div>
        </section>
    );
};

const integrations: { alt: string; src: string }[] = [
    { alt: "notion", src: "https://www.untitledui.com/logos/integrations/notion.svg" },
    { alt: "slack", src: "https://www.untitledui.com/logos/integrations/slack.svg" },
    { alt: "google_drive", src: "https://www.untitledui.com/logos/integrations/google_drive.svg" },
    { alt: "intercom", src: "https://www.untitledui.com/logos/integrations/intercom.svg" },
    { alt: "jira", src: "https://www.untitledui.com/logos/integrations/jira.svg" },
    { alt: "dropbox", src: "https://www.untitledui.com/logos/integrations/dropbox.svg" },
    { alt: "stripe", src: "https://www.untitledui.com/logos/integrations/stripe.svg" },
    { alt: "zapier", src: "https://www.untitledui.com/logos/integrations/zapier.svg" },
    { alt: "figma", src: "https://www.untitledui.com/logos/integrations/figma.svg" },
    { alt: "confluence", src: "https://www.untitledui.com/logos/integrations/confluence.svg" },
    { alt: "mailchimp", src: "https://www.untitledui.com/logos/integrations/mailchimp.svg" },
    { alt: "zendesk", src: "https://www.untitledui.com/logos/integrations/zendesk.svg" },
    { alt: "google calendar", src: "https://www.untitledui.com/logos/integrations/g-calendar.svg" },
    { alt: "whatsapp", src: "https://www.untitledui.com/logos/integrations/whatsapp.svg" },
    { alt: "discord", src: "https://www.untitledui.com/logos/integrations/discord.svg" },
    { alt: "bitbucket", src: "https://www.untitledui.com/logos/integrations/bitbucket.svg" },
];

const FeaturesIntegrationsIcons02 = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="flex flex-col items-center gap-12 md:gap-16">
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                        <span className="text-sm font-semibold text-brand-secondary md:text-md">Integrations</span>
                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Get more value from your tools</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            Connect your tools, connect your teams. With over 200 apps already available in our directory, your team's favorite tools are just a
                            click away.
                        </p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 self-center px-3 lg:grid-cols-8 lg:gap-8 lg:px-14">
                        {integrations.map(({ alt, src }) => (
                            <span
                                key={src + alt}
                                className="flex size-[68px] shrink-0 items-center justify-center rounded-lg bg-primary shadow-xs ring-1 ring-secondary ring-inset md:size-[88px] md:rounded-xl"
                            >
                                <img alt={alt} src={src} className="size-16 md:size-20" />
                            </span>
                        ))}
                    </div>
                    <Button size="xl">All integrations</Button>
                </div>
            </div>
        </section>
    );
};

const MetricsSimpleCenteredText = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-12 md:gap-16">
                    <div className="flex w-full flex-col items-center self-center text-center md:max-w-3xl">
                        <FeaturedIcon icon={ZapFast} color="brand" theme="light" size="xl" />
                        <h2 className="mt-4 text-display-sm font-semibold text-primary md:mt-6 md:text-display-md">Unleash the full power of data</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to convert, engage, and retain more users.</p>
                    </div>
                    <dl className="flex w-full flex-col justify-center gap-8 md:max-w-3xl md:flex-row md:gap-4 md:self-center">
                        {[
                            { title: "400+", subtitle: "Projects completed" },
                            { title: "600%", subtitle: "Return on investment" },
                            { title: "10k", subtitle: "Global downloads" },
                        ].map((item, index) => (
                            <Fragment key={item.title}>
                                {index !== 0 && <div className="hidden border-l border-secondary md:block" />}
                                <div className="flex flex-1 flex-col-reverse gap-3 text-center">
                                    <dt className="text-lg font-semibold text-primary">{item.subtitle}</dt>
                                    <dd className="text-display-lg font-semibold text-brand-tertiary_alt md:text-display-xl">{item.title}</dd>
                                </div>
                            </Fragment>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
};

const CTACardHorizontal = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-x-8 gap-y-8 rounded-2xl bg-secondary px-6 py-10 lg:flex-row lg:p-16">
                    <div className="flex max-w-3xl flex-1 flex-col">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">
                            <span className="hidden md:inline">Start your 30-day free trial</span>
                            <span className="md:hidden">Start your free trial</span>
                        </h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 lg:text-xl">Join over 4,000+ startups already growing with Untitled.</p>
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

const reviews = [
    {
        id: "review-01",
        company: "3Portals",
        companyLogoUrl: "https://www.untitledui.com/logos/logotype/color/3portals.svg",
        companyLogoUrlDark: "https://www.untitledui.com/logos/logotype/white/3portals.svg",
        quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
        author: { name: "Kelly Williams", role: "Head of Design", avatarUrl: "https://www.untitledui.com/images/avatars/kelly-williams?fm=webp&q=80" },
    },
    {
        id: "review-02",
        company: "Warpspeed",
        companyLogoUrl: "https://www.untitledui.com/logos/logotype/color/warpspeed.svg",
        companyLogoUrlDark: "https://www.untitledui.com/logos/logotype/white/warpspeed.svg",
        quote: "We've been using Untitled to kick start every new project and can't imagine working without it.",
        author: { name: "Candice Wu", role: "Product Manager", avatarUrl: "https://www.untitledui.com/images/avatars/candice-wu?fm=webp&q=80" },
    },
    {
        id: "review-03",
        company: "GlobalBank",
        companyLogoUrl: "https://www.untitledui.com/logos/logotype/color/globalbank.svg",
        companyLogoUrlDark: "https://www.untitledui.com/logos/logotype/white/globalbank.svg",
        quote: "Untitled has saved us thousands of hours of work and has unlock data insights we never thought possible.",
        author: { name: "Ammar Foley", role: "UX Designer", avatarUrl: "https://www.untitledui.com/images/avatars/ammar-foley?fm=webp&q=80" },
    },
    {
        id: "review-04",
        company: "Ikigai Labs",
        companyLogoUrl: "https://www.untitledui.com/logos/logotype/color/ikigailabs.svg",
        companyLogoUrlDark: "https://www.untitledui.com/logos/logotype/white/ikigailabs.svg",
        quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
        author: { name: "Olivia Rhye", role: "Head of Product", avatarUrl: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" },
    },
    {
        id: "review-05",
        company: "Eightball",
        companyLogoUrl: "https://www.untitledui.com/logos/logotype/color/eightball.svg",
        companyLogoUrlDark: "https://www.untitledui.com/logos/logotype/white/eightball.svg",
        quote: "We've been using Untitled to kick start every new project and can't imagine working without it.",
        author: { name: "Alisa Hester", role: "Head of Product", avatarUrl: "https://www.untitledui.com/images/avatars/alisa-hester?fm=webp&q=80" },
    },
];

const TestimonialSimpleCentered03 = () => {
    const [selectedReviewIndex, setSelectedReviewIndex] = useState(2);

    return (
        <Tabs
            selectedKey={reviews[selectedReviewIndex].id}
            onSelectionChange={(value) => setSelectedReviewIndex(reviews.findIndex((review) => review.id === value))}
        >
            <section className="bg-secondary py-16 md:py-24">
                <div className="mx-auto max-w-container px-4 md:px-8">
                    <div className="flex flex-col items-center gap-10 md:gap-12">
                        <Collection items={reviews}>
                            {(review) => (
                                <TabPanel className="flex flex-col gap-8 text-center">
                                    <blockquote className="text-display-sm font-medium text-balance text-primary md:text-display-md lg:text-display-lg">
                                        {review.quote}
                                    </blockquote>
                                    <figcaption className="flex justify-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar src={review.author.avatarUrl} alt={review.author.name} size="2xl" />
                                            <div className="flex flex-col gap-1">
                                                <p className="text-lg font-semibold text-primary">{review.author.name}</p>
                                                <cite className="text-md text-tertiary not-italic">
                                                    {review.author.role}, {review.company}
                                                </cite>
                                            </div>
                                        </div>
                                    </figcaption>
                                </TabPanel>
                            )}
                        </Collection>

                        <TabList className="hidden grid-cols-5 justify-items-center gap-8 md:grid" items={reviews}>
                            {(review) => (
                                <Tab>
                                    <img src={review.companyLogoUrl} className="h-12 dark:hidden" alt={review.company} />
                                    <img src={review.companyLogoUrlDark} className="h-12 opacity-85 not-dark:hidden" alt={review.company} />
                                </Tab>
                            )}
                        </TabList>

                        <div className="flex w-full items-center justify-between md:hidden">
                            <Button
                                aria-label="See previous review"
                                color="link-color"
                                className="text-quaternary md:hidden"
                                onClick={() => {
                                    setSelectedReviewIndex(selectedReviewIndex == 0 ? reviews.length - 1 : selectedReviewIndex - 1);
                                }}
                            >
                                <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                                    <path
                                        d="M36.8055 9.99989H3.19434M3.19434 9.99989L9.99989 16.8054M3.19434 9.99989L9.99989 3.19434"
                                        stroke="currentColor"
                                        strokeWidth="1.66667"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Button>

                            <img src={reviews[selectedReviewIndex].companyLogoUrl} className="h-10 object-contain" alt={reviews[selectedReviewIndex].company} />

                            <Button
                                aria-label="See next review"
                                className="md:hidden"
                                color="link-color"
                                onClick={() => {
                                    setSelectedReviewIndex(selectedReviewIndex == reviews.length - 1 ? 0 : selectedReviewIndex + 1);
                                }}
                            >
                                <svg aria-hidden="true" className="h-5 w-10 rotate-180 text-quaternary" viewBox="0 0 40 20" fill="none">
                                    <path
                                        d="M36.8055 9.99989H3.19434M3.19434 9.99989L9.99989 16.8054M3.19434 9.99989L9.99989 3.19434"
                                        stroke="currentColor"
                                        strokeWidth="1.66667"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </Tabs>
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

const CTAScreenMockup01 = () => {
    return (
        <section className="overflow-hidden bg-primary py-16 md:py-24">
            <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
                <div className="flex w-full max-w-3xl flex-col">
                    <h1 className="text-display-sm font-semibold text-primary md:text-display-lg">Join 4,000+ startups growing with Untitled</h1>
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
                                {/* Light mode image (hidden in dark mode) */}
                                <img
                                    alt="Dashboard mockup showing application interface"
                                    src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                    className="object-cover object-left-top dark:hidden"
                                />
                                {/* Dark mode image (hidden in light mode) */}
                                <img
                                    alt="Dashboard mockup showing application interface"
                                    src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
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

const FooterLarge02 = () => {
    return (
        <footer className="dark-mode">
            <div className="bg-primary py-12 md:pt-16">
                <div className="mx-auto max-w-container px-4 md:px-8">
                    <div className="flex flex-col gap-12 md:gap-16 xl:flex-row">
                        <div className="flex flex-col items-start gap-6 md:w-80 md:gap-6">
                            <UntitledLogo className="h-8 w-min shrink-0" />
                            <p className="text-md text-tertiary">Design amazing digital experiences that create more happy in the world.</p>
                            <RatingBadge className="origin-top-left scale-[0.78]" />
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
                </div>
            </div>
            <div className="bg-secondary_alt py-10 md:py-12">
                <div className="mx-auto max-w-container px-4 md:px-8">
                    <div className="flex flex-col-reverse justify-between gap-6 md:flex-row">
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
            </div>
        </footer>
    );
};

const LandingPage02 = () => {
    return (
        <div className="bg-primary">
            <HeroScreenMockup01 />

            <SectionDivider className="max-md:hidden" />

            <SocialProofFullWidthMasked />

            <SectionDivider />

            <FeaturesAlternatingLayout01 />

            <FeaturesIntegrationsIcons02 />

            <MetricsSimpleCenteredText />

            <CTACardHorizontal />

            <TestimonialSimpleCentered03 />

            <CTAScreenMockup01 />

            <FooterLarge02 />
        </div>
    );
};

export default LandingPage02;
