"use client";

import { type ComponentProps, type FC, type ReactNode, useState } from "react";
import { MessageChatCircle, PlayCircle, Zap } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { NativeSelect } from "@/components/base/select/select-native";
import { TextArea } from "@/components/base/textarea/textarea";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { StarIcon } from "@/components/foundations/rating-stars";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import countries, { phoneCodeOptions } from "@/utils/countries";
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

const HeroSimpleText02 = () => {
    return (
        <div className="relative overflow-hidden bg-brand-section">
            {/* Background pattern */}
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-dot-sm-desktop.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 opacity-20 md:block"
            />
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-dot-sm-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 opacity-20 md:hidden"
            />

            <HeaderPrimaryDark />

            <section className="relative py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="flex max-w-5xl flex-col">
                        <h1 className="text-display-md font-medium text-primary_on-brand md:text-display-lg lg:text-display-xl">
                            We design physical{" "}
                            <span className="relative underline decoration-[3px] underline-offset-[0.218em] md:decoration-4">experiences</span> that create more
                            happy in the world
                        </h1>
                        <p className="mt-4 max-w-(--breakpoint-sm) text-lg text-tertiary_on-brand md:mt-6 md:text-xl">
                            — We're a full-service interior design agency who specialize in simple, useful and beautiful solutions for any space.
                        </p>
                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                            <Button iconLeading={PlayCircle} color="secondary" size="xl" className="shadow-xs! ring-0">
                                Showreel
                            </Button>
                            <Button size="xl">Get in touch</Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 w-full max-w-container px-4 md:px-8">
                    <img
                        alt="Two Working People"
                        src="https://www.untitledui.com/marketing/two-working-people.webp"
                        className="md:[360px] h-60 w-full object-cover lg:h-129"
                    />
                </div>
            </section>
        </div>
    );
};

const SocialProofFullWidthBrand = () => {
    return (
        <section className="bg-brand-section pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md font-medium text-tertiary_on-brand">We've worked with some great startups</p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 xl:gap-x-6">
                        <img src="https://www.untitledui.com/logos/logotype/white/odeaolabs.svg" alt="Odeaolabs Logo" className="h-9 opacity-85 md:h-12" />
                        <img src="https://www.untitledui.com/logos/logotype/white/kintsugi.svg" alt="Kintsugi Logo" className="h-9 opacity-85 md:h-12" />
                        <img src="https://www.untitledui.com/logos/logotype/white/stackedlab.svg" alt="Stackedlab Logo" className="h-9 opacity-85 md:h-12" />
                        <img src="https://www.untitledui.com/logos/logotype/white/magnolia.svg" alt="Magnolia Logo" className="h-9 opacity-85 md:h-12" />
                        <img src="https://www.untitledui.com/logos/logotype/white/warpspeed.svg" alt="Warpseep Logo" className="h-9 opacity-85 md:h-12" />
                        <img src="https://www.untitledui.com/logos/logotype/white/sisyphus.svg" alt="Sisyphus Logo" className="h-9 opacity-85 md:h-12" />
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

const FeatureTextFeaturedIconLeft = ({ icon, title, subtitle, footer }: FeatureTextIcon) => (
    <div className="flex max-w-140 gap-4">
        <FeaturedIcon icon={icon} size="lg" color="gray" theme="modern" className="hidden md:inline-flex" />
        <FeaturedIcon icon={icon} size="md" color="gray" theme="modern" className="inline-flex md:hidden" />

        <div className="flex flex-col items-start gap-4">
            <div>
                <h3 className="mt-1.5 text-lg font-semibold text-primary md:mt-2.5">{title}</h3>
                <p className="mt-1 text-md text-tertiary">{subtitle}</p>
            </div>

            {footer}
        </div>
    </div>
);

const FeaturesIconsAndImage04 = () => {
    return (
        <section className="bg-primary">
            <div className="bg-secondary pt-16 pb-[112px] md:pt-24 md:pb-40">
                <div className="mx-auto grid w-full max-w-container grid-cols-1 gap-12 px-4 md:gap-16 md:px-8 lg:grid-cols-2 lg:gap-24">
                    <div className="flex w-full flex-col">
                        <span className="text-sm font-semibold text-brand-secondary md:text-md">Who we are</span>

                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Commercial interior designers</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            Untitled are a commercial interior design studio. We specialize in customised office design, restaurant design, shop design, and
                            studio design.
                        </p>
                    </div>

                    <ul className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-1">
                        {[
                            {
                                title: "Share team inboxes",
                                subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
                                icon: MessageChatCircle,
                                cta: "Learn more",
                                href: "#",
                            },
                            {
                                title: "Deliver instant answers",
                                subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
                                icon: Zap,
                                cta: "Learn more",
                                href: "#",
                            },
                        ].map((item) => (
                            <li key={item.title}>
                                <FeatureTextFeaturedIconLeft icon={item.icon} title={item.title} subtitle={item.subtitle} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mx-auto -mt-16 flex w-full max-w-container justify-center px-4 pb-16 md:-mt-24 md:px-8 md:pb-24">
                <img src="https://www.untitledui.com/marketing/workspace.webp" alt="Workspace" className="h-60 w-full object-cover md:h-100 lg:h-129" />
            </div>
        </section>
    );
};

const TestimonialSimpleLeftAligned = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <figure className="flex flex-col gap-10 lg:flex-row lg:gap-32">
                    <img
                        alt="Mathilde Lewis"
                        src="https://www.untitledui.com/images/avatars/mathilde-lewis?fm=webp&q=80"
                        className="size-[200px] rounded-2xl object-cover md:size-[328px]"
                        aria-hidden="true"
                    />
                    <div className="flex flex-col gap-8 md:-ml-2">
                        <div className="flex flex-col gap-4 md:gap-6">
                            <div aria-hidden="true" className="flex gap-1">
                                <StarIcon />
                                <StarIcon />
                                <StarIcon />
                                <StarIcon />
                                <StarIcon />
                            </div>
                            <blockquote className="text-display-xs font-medium text-primary md:text-display-md">
                                Untitled really understood the paired-back aesthetic that we were looking for. We couldn't be happier with our new offices.{" "}
                            </blockquote>
                        </div>
                        <figcaption className="flex flex-col gap-1">
                            <p className="text-lg font-semibold text-primary">— Candice Wu</p>
                            <cite className="text-md text-tertiary not-italic">Head of Design, Layers</cite>
                        </figcaption>
                    </div>
                </figure>
            </div>
        </section>
    );
};

const MetricsMinimalCenteredText = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <dl className="grid gap-x-4 gap-y-8 border-secondary md:grid-cols-2 md:border-y md:py-16 lg:grid-cols-4">
                    {[
                        { title: "400+", subtitle: "Projects completed" },
                        { title: "600%", subtitle: "Return on investment" },
                        { title: "10k", subtitle: "Global downloads" },
                        { title: "200+", subtitle: "5-star reviews" },
                    ].map((item) => (
                        <div key={item.title} className="flex flex-1 flex-col-reverse gap-3 text-center">
                            <dt className="text-lg font-semibold text-primary">{item.subtitle}</dt>
                            <dd className="text-display-lg font-semibold text-primary md:text-display-xl">{item.title}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
};

const ContactSectionSimpleForm02 = () => {
    const [selectedCountryPhone, setSelectedCountryPhone] = useState("US");

    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
                    <div className="max-lg:hidden lg:h-192">
                        <img src="https://www.untitledui.com/images/portraits/lana-steiner" alt="Lana Steiner" className="size-full object-cover" />
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="w-full md:max-w-120">
                            <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Let's start your project</h2>
                            <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Our friendly team would love to hear from you.</p>
                            <Form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const data = Object.fromEntries(new FormData(e.currentTarget));
                                    console.log("Form data:", data);
                                }}
                                className="mt-12 flex flex-col gap-8"
                            >
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-x-8 gap-y-6 sm:flex-row">
                                        <Input isRequired size="md" name="firstName" label="First name" placeholder="First name" wrapperClassName="flex-1" />
                                        <Input isRequired size="md" name="lastName" label="Last name" placeholder="Last name" wrapperClassName="flex-1" />
                                    </div>

                                    <Input isRequired size="md" name="email" label="Email" type="email" placeholder="you@company.com" />
                                    <InputGroup
                                        size="md"
                                        name="phone"
                                        label="Phone number"
                                        leadingAddon={
                                            <NativeSelect
                                                aria-label="Country code"
                                                value={selectedCountryPhone}
                                                onChange={(value) => setSelectedCountryPhone(value.currentTarget.value)}
                                                options={phoneCodeOptions.map((item) => ({
                                                    label: item.label as string,
                                                    value: item.id as string,
                                                }))}
                                            />
                                        }
                                    >
                                        <InputBase
                                            type="tel"
                                            placeholder={countries.find((country) => country.code === selectedCountryPhone)?.phoneMask?.replaceAll("#", "0")}
                                        />
                                    </InputGroup>
                                    <TextArea isRequired name="message" label="Message" placeholder="Leave us a message..." rows={5} />
                                    <Checkbox
                                        name="privacy"
                                        size="md"
                                        hint={
                                            <>
                                                You agree to our friendly{" "}
                                                <a
                                                    href="#"
                                                    className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                                >
                                                    privacy policy.
                                                </a>
                                            </>
                                        }
                                    />
                                </div>

                                <Button type="submit" size="xl">
                                    Send message
                                </Button>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FooterLarge08 = () => {
    return (
        <footer className="bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-between gap-x-8 gap-y-12 lg:flex-row">
                    <div className="flex flex-col gap-8 md:items-start">
                        <UntitledLogo className="h-8 w-min shrink-0" />
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
                                        <Button color="link-gray" size="lg" href={item.href}>
                                            {item.label}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(new FormData(e.currentTarget));
                            console.log("Form data:", data);
                        }}
                        className="flex w-full flex-col gap-4 sm:max-w-90"
                    >
                        <label htmlFor="newsletters-email" className="text-sm font-semibold text-primary">
                            Stay up to date
                        </label>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Input
                                isRequired
                                id="newsletters-email"
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
                <div className="mt-12 flex flex-col-reverse justify-between gap-4 border-t border-secondary pt-8 md:mt-16 md:flex-row md:gap-6">
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>

                    <ul className="flex gap-4">
                        {[
                            { label: "Terms", href: "#" },
                            { label: "Privacy", href: "#" },
                            { label: "Cookies", href: "#" },
                        ].map(({ label, href }) => (
                            <li key={label}>
                                <a
                                    href={href}
                                    className="rounded-xs text-md text-quaternary outline-focus-ring transition duration-100 ease-linear hover:text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
};

const LandingPage15 = () => {
    return (
        <div className="bg-primary">
            <HeroSimpleText02 />

            <SocialProofFullWidthBrand />

            <FeaturesIconsAndImage04 />

            <TestimonialSimpleLeftAligned />

            <MetricsMinimalCenteredText />

            <ContactSectionSimpleForm02 />

            <SectionDivider />

            <FooterLarge08 />
        </div>
    );
};

export default LandingPage15;
