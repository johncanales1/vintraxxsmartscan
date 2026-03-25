"use client";

import { Fragment, type ReactNode } from "react";
import { CheckCircle, PlayCircle, ZapFast } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

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

const HeroSplitImage05 = () => {
    return (
        <div className="relative overflow-hidden bg-secondary">
            {/* Background pattern */}
            <img
                alt="Grid background pattern"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-md-desktop.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]"
            />
            <img
                alt="Grid background pattern"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-md-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]"
            />

            <Header />

            <section className="py-16 md:pb-24">
                <div className="relative mx-auto grid max-w-container grid-cols-1 gap-16 px-4 md:px-8 lg:min-h-160 lg:items-center">
                    <div className="z-10 flex max-w-200 flex-col items-start">
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Customer service software for customer-first teams
                        </h1>
                        <p className="mt-4 max-w-xl text-lg text-tertiary md:mt-6 md:text-xl">
                            The best customer service software for customer-first teams. Industry-leading email and live chat support.{" "}
                        </p>

                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 md:mt-12 md:flex-row md:items-start">
                            <Button color="secondary" size="xl" iconLeading={PlayCircle}>
                                Demo
                            </Button>
                            <Button size="xl">Sign up</Button>
                        </div>
                    </div>

                    <div className="relative lg:absolute lg:top-0 lg:right-8 lg:h-full lg:w-140">
                        <img
                            className="inset-0 h-60 w-full rounded-tr-[32px] rounded-bl-[32px] object-cover md:h-110 md:rounded-tr-[64px] md:rounded-bl-[64px] lg:h-full"
                            src="https://www.untitledui.com/marketing/workspace.webp"
                            alt="Workspace"
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

interface FeatureTextIntegrationIcon extends TextCentered {
    imgUrl: string;
}

const FeatureTextIntegrationIconBox = ({ imgUrl, title, subtitle, footer }: FeatureTextIntegrationIcon) => (
    <div className="mt-6 flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-secondary px-6 pb-8 text-center">
        <span className="-mt-[26px] flex size-13 shrink-0 items-center justify-center rounded-lg bg-primary shadow-xs ring-1 ring-secondary ring-inset md:-mt-8 md:size-16 md:rounded-xl">
            <img alt={title} src={imgUrl} className="size-12 md:size-14" />
        </span>

        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>

        {footer}
    </div>
);

const FeaturesIntegrationsIcons04 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Integrations</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Get more value from your tools</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Connect your tools, connect your teams. With over 100 apps already available in our directory, your team's favorite tools are just a
                        click away.
                    </p>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
                        {[
                            {
                                title: "Notion integration",
                                subtitle: "Work faster and smarter by integrating directly with Notion, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/notion.svg",
                            },
                            {
                                title: "Slack integration",
                                subtitle: "Work faster and smarter by integrating directly with Slack, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/slack.svg",
                            },
                            {
                                title: "Google Drive integration",
                                subtitle: "Work faster and smarter by integrating directly with Google Drive, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/google_drive.svg",
                            },
                            {
                                title: "Intercom integration",
                                subtitle: "Work faster and smarter by integrating directly with Intercom, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/intercom.svg",
                            },
                            {
                                title: "Jira integration",
                                subtitle: "Work faster and smarter by integrating directly with Jira, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/jira.svg",
                            },
                            {
                                title: "Dropbox integration",
                                subtitle: "Work faster and smarter by integrating directly with Dropbox, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/dropbox.svg",
                            },
                        ].map((item) => (
                            <li key={item.title}>
                                <FeatureTextIntegrationIconBox imgUrl={item.logo} title={item.title} subtitle={item.subtitle} />
                            </li>
                        ))}
                    </ul>
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

                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Cutting-edge features for advanced analytics</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000
                            startups.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto -mt-17 w-full max-w-container px-4 pt-1 md:-mt-26 md:overflow-hidden md:px-8 md:pt-2">
                <div className="flex flex-col md:items-start">
                    <div className="flex h-full w-full items-center justify-center md:max-h-105 md:w-full md:items-start lg:max-h-140">
                        {/* Light mode image (hidden in dark mode) */}
                        <img
                            alt="Dashboard mockup showing application interface"
                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                            className="size-full rounded object-cover ring-4 ring-screen-mockup-border md:rounded-xl md:ring-8 dark:hidden"
                        />
                        {/* Dark mode image (hidden in light mode) */}
                        <img
                            alt="Dashboard mockup showing application interface"
                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                            className="size-full rounded object-cover ring-4 ring-screen-mockup-border not-dark:hidden md:rounded-xl md:ring-8"
                        />
                    </div>
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

const TestimonialSimpleCentered02 = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
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
                        Love the simplicity of the service and the prompt customer support. We can't imagine working without it.
                    </blockquote>
                    <figcaption className="flex justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar src="https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80" alt="Amelie Laurent" size="2xl" />
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-semibold text-primary">Amélie Laurent</p>
                                <cite className="text-md text-tertiary not-italic">CX Manager, Sisyphus</cite>
                            </div>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </section>
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

const FooterLarge01 = () => {
    return (
        <footer className="bg-secondary_alt py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <nav>
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

const LandingPage19 = () => {
    return (
        <div className="bg-primary">
            <HeroSplitImage05 />

            <SocialProofFullWidth />

            <SectionDivider />

            <FeaturesIntegrationsIcons04 />

            <FeaturesLargeScreenMockup02 />

            <MetricsSimpleCenteredText />

            <CTACardHorizontal />

            <TestimonialSimpleCentered02 />

            <CTAScreenMockup01 />

            <NewsletterSimpleLeft />

            <FooterLarge01 />
        </div>
    );
};

export default LandingPage19;
