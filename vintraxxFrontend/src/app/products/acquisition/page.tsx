"use client";

import { type FC, type ReactNode, useState } from "react";
import { ArrowRight, BarChartSquare02, ChartBreakoutSquare, CurrencyDollar, Dataflow03, MarkerPin02, MessageChatCircle, MessageSmileCircle, Phone, PlayCircle, Shield01, TrendUp01, Truck01, Users01, Zap } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import Link from "next/link";
import acquisitionLogo from "@/assets/logo/brands/acquisition.png";
import webLandingImage from "@/assets/images/web-landing.png";
import sgOwnerImage from "@/assets/images/sg-owner.jpg";

interface FeatureTabProps {
    title: string;
    subtitle: string;
    footer?: ReactNode;
    isCurrent?: boolean;
}

const FeatureTabHorizontal = ({ title, subtitle, footer, isCurrent }: FeatureTabProps) => (
    <div className={cx("relative flex cursor-pointer flex-col items-start gap-4 border-l-4 border-tertiary py-4 pl-5 transition duration-100 ease-linear hover:border-brand", isCurrent && "border-brand")}>
        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>
        {footer}
    </div>
);

interface FeatureTextIcon {
    title: string;
    subtitle: string;
    icon: FC<{ className?: string }>;
}

const FeatureTextFeaturedIconTopCentered = ({ icon, title, subtitle }: FeatureTextIcon) => (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <FeaturedIcon icon={icon} size="lg" color="gray" theme="modern" className="hidden md:inline-flex" />
        <FeaturedIcon icon={icon} size="md" color="gray" theme="modern" className="inline-flex md:hidden" />
        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>
    </div>
);

const HeroSection = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            <img alt="Grid background pattern" aria-hidden="true" loading="lazy" src="https://www.untitledui.com/patterns/light/grid-md-desktop.svg" className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]" />
            <img alt="Grid background pattern" aria-hidden="true" loading="lazy" src="https://www.untitledui.com/patterns/light/grid-sm-mobile.svg" className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]" />

            <Header />

            <section className="relative py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="flex max-w-5xl flex-col">
                        <img src={acquisitionLogo.src} alt="Acquisition.io" className="mb-6 h-16 w-max object-contain" />
                        <h1 className="text-display-md font-medium text-primary md:text-display-lg lg:text-display-xl">
                            Stock Your Lot{" "}
                            <span className="relative underline decoration-[3px] underline-offset-[0.218em] md:decoration-4 lg:decoration-4">Without Buying</span>{" "}
                            Inventory
                        </h1>
                        <p className="mt-4 max-w-(--breakpoint-sm) text-lg text-tertiary md:mt-6 md:text-xl">
                            — The AI-powered consignment platform that eliminates capital risk and floorplan costs. Access thousands of quality vehicles from private sellers nationwide.
                        </p>
                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                            <Button iconLeading={PlayCircle} color="secondary" size="xl">Watch Demo</Button>
                            <Button size="xl">Schedule Demo</Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 w-full max-w-container px-4 md:px-8">
                    <img alt="Acquisition.io Dashboard" src={webLandingImage.src} className="h-60 w-full rounded-lg object-cover lg:h-129" />
                </div>
            </section>
        </div>
    );
};

const SocialProofSection = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8">
                    <p className="text-center text-md font-medium text-tertiary">Trusted by dealerships nationwide</p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-y-6">
                        <div className="flex h-9 items-center gap-2 text-lg font-semibold text-tertiary md:h-12 md:text-xl">🚗 South Houston Auto</div>
                        <div className="flex h-9 items-center gap-2 text-lg font-semibold text-tertiary md:h-12 md:text-xl">🏎️ Capital City Auto</div>
                        <div className="flex h-9 items-center gap-2 text-lg font-semibold text-tertiary md:h-12 md:text-xl">🚙 Premier Motors</div>
                        <div className="flex h-9 items-center gap-2 text-lg font-semibold text-tertiary md:h-12 md:text-xl">🛻 Valley Auto Group</div>
                        <div className="flex h-9 items-center gap-2 text-lg font-semibold text-tertiary md:h-12 md:text-xl">🚘 Elite Dealers</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeaturesTabsSection = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <section className="overflow-hidden bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="flex w-full flex-col lg:max-w-3xl">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">
                        Acquisition.io is an AI-powered consignment platform revolutionizing how dealers stock inventory.
                    </h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">We've helped dealers free up millions in capital while increasing their inventory selection.</p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:gap-16 lg:grid-cols-2 lg:items-center">
                    <ul className="flex flex-col">
                        {[
                            { title: "Zero Capital Investment", subtitle: "No upfront costs, no floorplan fees. Stock your lot with quality inventory without tying up capital." },
                            { title: "AI-Powered Vehicle Matching", subtitle: "Smart algorithms match vehicles from private sellers to your specific needs and market demand." },
                            { title: "Full Service Support", subtitle: "We handle transportation, inspections, documentation, and all logistics. You focus on selling." },
                        ].map((item, index) => (
                            <li key={item.title} onClick={() => setCurrentTab(index)}>
                                <FeatureTabHorizontal
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    isCurrent={index === currentTab}
                                    footer={<Button color="link-color" size="lg" href="#" iconTrailing={ArrowRight}>Learn more</Button>}
                                />
                            </li>
                        ))}
                    </ul>

                    <div className="relative -ml-4 flex h-90 w-screen items-start justify-center sm:w-auto lg:h-128">
                        <div className="w-max max-w-70 lg:absolute lg:top-26 lg:left-0">
                            <div className="size-full rounded-[23.89px] bg-primary p-[3px] shadow-lg ring-[1.49px] ring-utility-gray-300 ring-inset">
                                <div className="size-full rounded-[20.91px] bg-primary p-1 shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[17.92px] bg-utility-gray-50 ring-[1.49px] ring-utility-gray-200">
                                        <img src={webLandingImage.src} alt="Mobile app" className="size-full object-cover object-left-top" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 left-16 hidden w-max lg:block lg:h-168.5 lg:max-h-168.5">
                            <div className="size-full rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px]">
                                <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[23.58px] md:p-1 md:shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[20.21px] md:ring-[1.68px]">
                                        <img src={webLandingImage.src} alt="Desktop dashboard" className="size-full object-cover object-left-top" />
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

const TestimonialSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <figure className="flex w-full shrink-0 snap-start flex-col gap-8 text-center">
                    <img src={sgOwnerImage.src} alt="Salvador Guerra" className="mx-auto size-16 rounded-full object-cover" />
                    <blockquote className="text-display-sm font-medium text-primary md:text-display-lg">
                        Acquisition.io completely changed our inventory strategy. We freed up $800K in capital and eliminated $12,000 monthly in floorplan fees. Our net to sales increased 77% in the first 6 months.
                    </blockquote>
                    <figcaption className="flex justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-semibold text-primary">Salvador Guerra</p>
                                <cite className="text-md text-tertiary not-italic">Owner, South Houston Auto Group</cite>
                            </div>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </section>
    );
};

const FeaturesGridSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Why Acquisition.io</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Benefits That Transform Your Business</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        We eliminate capital risk and floorplan costs while giving you access to quality inventory from private sellers nationwide.
                    </p>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 md:gap-y-16 lg:grid-cols-3">
                        {[
                            { title: "Zero Capital Investment", subtitle: "No upfront costs, no floorplan fees. Stock your lot without tying up capital.", icon: Truck01 },
                            { title: "AI-Powered Matching", subtitle: "Smart algorithms match vehicles from private sellers to your needs.", icon: Dataflow03 },
                            { title: "Full Service Support", subtitle: "We handle transportation, inspections, and documentation.", icon: Shield01 },
                            { title: "Maximize Profits", subtitle: "Earn on every sale without inventory risk. Pay only when vehicles sell.", icon: BarChartSquare02 },
                            { title: "Instant Access", subtitle: "Browse and select from our extensive network with real-time updates.", icon: TrendUp01 },
                            { title: "Fast & Seamless", subtitle: "From selection to delivery in days. Streamlined logistics.", icon: Zap },
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

const ContactCardsSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex w-full max-w-3xl flex-col">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Contact us</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Ready to transform your inventory?</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Our friendly team is always here to help you get started.</p>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { title: "Chat to sales", subtitle: "Speak to our friendly team.", href: "mailto:sales@vintraxx.com", cta: "sales@vintraxx.com", icon: MessageSmileCircle },
                            { title: "Chat to support", subtitle: "We're here to help.", href: "mailto:support@vintraxx.com", cta: "support@vintraxx.com", icon: MessageChatCircle },
                            { title: "Visit us", subtitle: "Visit our office HQ.", href: "#", cta: "Houston, TX", icon: MarkerPin02 },
                            { title: "Call us", subtitle: "Mon-Fri from 8am to 5pm.", href: "tel:+1 (555) 000-0000", cta: "+1 (555) 000-0000", icon: Phone },
                        ].map((item) => (
                            <li key={item.title} className="flex h-full flex-col items-start bg-secondary p-6">
                                <FeaturedIcon size="lg" icon={item.icon} color="brand" theme="dark" />
                                <h3 className="mt-12 text-lg font-semibold text-primary md:mt-16">{item.title}</h3>
                                <p className="mt-1 text-md text-tertiary">{item.subtitle}</p>
                                <Button color="link-color" size="lg" href={item.href} className="mt-4 whitespace-pre md:mt-5">{item.cta}</Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

const NewsletterSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h1 className="text-display-sm font-semibold text-primary md:text-display-md">Stay updated on inventory opportunities</h1>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Get notified about new vehicles, market trends, and exclusive consignment opportunities.
                    </p>

                    <Form onSubmit={(e) => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); console.log("Form data:", data); }} className="mt-8 flex w-full flex-col gap-4 md:max-w-120 md:flex-row">
                        <Input isRequired size="md" name="email" type="email" placeholder="Enter your email" wrapperClassName="py-0.5 md:max-w-[345px]" hint={<span>We care about your data in our <a href="#" className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">privacy policy</a>.</span>} />
                        <Button type="submit" size="xl">Subscribe</Button>
                    </Form>
                </div>
            </div>
        </section>
    );
};

const footerNavList = [
    { label: "Products", items: [{ label: "VinTraxx Capital", href: "/products/capital" }, { label: "SmartScan", href: "/products/smartscan" }, { label: "VinLane IMS", href: "/products/vinlane" }, { label: "VinClips", href: "/products/vinclips" }, { label: "Acquisition.io", href: "/products/acquisition" }] },
    { label: "Company", items: [{ label: "About us", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Press", href: "/press" }, { label: "News", href: "/news" }, { label: "Contact", href: "/contact" }] },
    { label: "Resources", items: [{ label: "Blog", href: "/blog" }, { label: "Help Center", href: "/help" }, { label: "Documentation", href: "/docs" }, { label: "Training", href: "/training" }, { label: "Support", href: "/support" }] },
    { label: "For Dealers", items: [{ label: "Independent Dealers", href: "/dealers/independent" }, { label: "Franchise Dealers", href: "/dealers/franchise" }, { label: "Dealer Groups", href: "/dealers/groups" }, { label: "Success Stories", href: "/success-stories" }] },
    { label: "Social", items: [{ label: "Twitter", href: "#" }, { label: "LinkedIn", href: "#" }, { label: "Facebook", href: "#" }, { label: "TikTok", href: "#" }, { label: "YouTube", href: "#" }] },
    { label: "Legal", items: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }, { label: "Cookies", href: "/cookies" }, { label: "Settings", href: "/settings" }] },
];

const FooterLarge = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Let's Revolutionize Your Dealership Together</h2>
                    <p className="mt-2 text-md text-tertiary md:mt-4 md:text-xl">Get in touch to see how VinTraxx can boost your operations and profits.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-12 md:flex-row md:self-center">
                        <Button color="secondary" size="xl">Contact Us</Button>
                        <Button size="xl">Request a Demo</Button>
                    </div>
                </div>
                <nav className="mt-12 md:mt-16">
                    <ul className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
                        {footerNavList.map((category) => (
                            <li key={category.label}>
                                <h4 className="text-sm font-semibold text-quaternary">{category.label}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (<li key={item.label}><Button color="link-gray" size="lg" href={item.href}>{item.label}</Button></li>))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row md:items-center">
                    <Link href="/"><UntitledLogo className="h-10" /></Link>
                    <p className="text-md text-quaternary">© 2025 Vintraxx. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default function AcquisitionPage() {
    return (
        <div className="bg-primary">
            <HeroSection />
            <SocialProofSection />
            <SectionDivider />
            <FeaturesTabsSection />
            <TestimonialSection />
            <SectionDivider />
            <FeaturesGridSection />
            <SectionDivider />
            <ContactCardsSection />
            <NewsletterSection />
            <FooterLarge />
        </div>
    );
}
