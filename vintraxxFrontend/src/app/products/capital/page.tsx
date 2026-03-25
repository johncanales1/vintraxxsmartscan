"use client";

import { Fragment, useState } from "react";
import { Bank, Building07, Car01, CheckCircle, Clock, CreditCard02, CurrencyDollar, Heart, Home05, Lock01, Phone01, PlayCircle, ShieldTick, Tool01, Truck01, Users01, ZapFast } from "@untitledui/icons";
import { motion } from "motion/react";
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
import capitalLogo from "@/assets/logo/brands/capital.png";
import johnImage from "@/assets/images/team/john.jpg";
import dyannaImage from "@/assets/images/team/dyanna.jpg";
import travisImage from "@/assets/images/team/travis.jpg";

// ─── Footer nav ───
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

// ─── Hero ───
const HeroSplitImage = () => {
    return (
        <div className="relative overflow-hidden bg-secondary">
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

            <section className="py-16 md:py-24">
                <div className="relative mx-auto max-w-container px-4 md:px-8">
                    <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                        <img src={capitalLogo.src} alt="VinTraxx Capital" className="mb-6 h-14 object-contain md:h-16" />
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">
                            Help Your Customers Pay. Close More Deals.
                        </h1>
                        <p className="mt-4 max-w-2xl text-lg text-tertiary md:mt-6 md:text-xl">
                            Offer your customers short-term financing for accessories, tires, wheels, service repairs, and more. VinTraxx Capital helps you close more sales by giving customers flexible payment options right at checkout.
                        </p>

                        <div className="mt-8 flex w-full flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-start md:mt-12">
                            <Button color="secondary" size="xl" iconLeading={PlayCircle}>
                                Learn More
                            </Button>
                            <Button size="xl">Get Started</Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// ─── Stats bar ───
const MetricsBar = () => {
    return (
        <section className="bg-[#1e3a5f] py-6 md:py-8">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <dl className="flex w-full flex-col justify-center gap-8 md:flex-row md:gap-4">
                    {[
                        { title: "$1K–$25K", subtitle: "Financing Available" },
                        { title: "24–72 hr", subtitle: "Approval Time" },
                        { title: "High", subtitle: "Approval Rate" },
                        { title: "Same-Day", subtitle: "Funding Available" },
                    ].map((item, index) => (
                        <Fragment key={item.title}>
                            {index !== 0 && <div className="hidden border-l border-white/20 md:block" />}
                            <div className="flex flex-1 flex-col-reverse gap-1 text-center">
                                <dt className="text-sm font-medium text-white/70">{item.subtitle}</dt>
                                <dd className="text-display-xs font-semibold text-white md:text-display-sm">{item.title}</dd>
                            </div>
                        </Fragment>
                    ))}
                </dl>
            </div>
        </section>
    );
};

// ─── How It Works ───
const HowItWorks = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">How It Works</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Financing That Works for Everyone</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Your customers get the payment flexibility they need. You get paid upfront. It&apos;s a win-win.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8 md:mt-16 md:grid-cols-3">
                    {[
                        { icon: Phone01, title: "Customer Applies at Checkout", desc: "Your customer fills out a quick application on their phone or your terminal — takes less than 2 minutes." },
                        { icon: CheckCircle, title: "Instant Decision", desc: "Get a real-time approval decision. Most customers are approved within seconds for financing up to $25,000." },
                        { icon: CurrencyDollar, title: "You Get Paid, They Pay Over Time", desc: "You receive the full payment upfront. Your customer pays in affordable installments over time." },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.title} className="flex flex-col items-center text-center">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#1e3a5f]">
                                    <Icon className="size-8 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                                <p className="mt-2 text-md text-tertiary">{item.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// ─── Feature icon box ───
interface FeatureIconBoxProps {
    icon: React.FC<{ className?: string }>;
    title: string;
    subtitle: string;
}

const FeatureIconBox = ({ icon: Icon, title, subtitle }: FeatureIconBoxProps) => (
    <div className="mt-6 flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-secondary px-6 pb-8 text-center">
        <span className="-mt-[26px] flex size-13 shrink-0 items-center justify-center rounded-lg bg-primary shadow-xs ring-1 ring-secondary ring-inset md:-mt-8 md:size-16 md:rounded-xl">
            <Icon className="size-7 text-[#c41e3a] md:size-8" />
        </span>
        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>
    </div>
);

// ─── Why Offer VinTraxx Capital ───
const WhyOfferCapital = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">For Your Business</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Why Offer VinTraxx Capital?</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Turn &ldquo;I can&apos;t afford it right now&rdquo; into &ldquo;Yes, let&apos;s do it.&rdquo; Boost your average ticket size and close more customers.
                    </p>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
                        <li><FeatureIconBox icon={CurrencyDollar} title="$1,000 to $25,000 Financing" subtitle="Offer customers flexible financing for accessories, service repairs, tires, wheels, and more." /></li>
                        <li><FeatureIconBox icon={CreditCard02} title="Easy Checkout Integration" subtitle="Add financing as a payment option right at your counter or service desk — seamless for staff and customers." /></li>
                        <li><FeatureIconBox icon={Clock} title="Same-Day Funding" subtitle="Get paid the same day your customer is approved. No waiting, no delays." /></li>
                        <li><FeatureIconBox icon={ShieldTick} title="High Approval Rates" subtitle="Our technology approves more customers so you close more deals — even those with less-than-perfect credit." /></li>
                        <li><FeatureIconBox icon={ZapFast} title="Quick 2-Minute Application" subtitle="Customers apply from their phone or your terminal. Decisions in seconds, not days." /></li>
                        <li><FeatureIconBox icon={Lock01} title="Secure & Compliant" subtitle="Bank-grade security with full regulatory compliance across all 50 states." /></li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

// ─── Built for Every Business ───
const industries = [
    { icon: Car01, title: "Car Dealerships" },
    { icon: Heart, title: "MedSpa" },
    { icon: Home05, title: "Roofing & Construction" },
    { icon: Building07, title: "Furniture Stores" },
    { icon: Heart, title: "Vet Clinics" },
    { icon: Heart, title: "Dentist Offices" },
    { icon: Tool01, title: "Tire & Wheel Centers" },
    { icon: Heart, title: "Jewelry Stores" },
    { icon: Truck01, title: "Golf Cart Dealers" },
    { icon: ZapFast, title: "HVAC Companies" },
];

const BuiltForEveryBusiness = () => {
    return (
        <section className="bg-primary pb-16 md:pb-0">
            <div className="bg-secondary pt-16 pb-28 md:pt-24 md:pb-40">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                        <span className="text-sm font-semibold text-brand-secondary md:text-md">Industries We Serve</span>
                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Built for Every Business</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            If you sell a product or service, VinTraxx Capital can help you offer financing to your customers.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto -mt-17 w-full max-w-container px-4 pt-1 md:-mt-26 md:px-8 md:pt-2">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {industries.map((item) => (
                        <div key={item.title} className="flex flex-col items-center gap-3 rounded-xl bg-primary px-4 py-6 text-center shadow-xs ring-1 ring-secondary">
                            <item.icon className="size-6 text-[#c41e3a]" />
                            <span className="text-sm font-medium text-primary">{item.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── The Smarter Financing Partner ───
const SmarterFinancingPartner = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-12 md:gap-16">
                    <div className="flex w-full flex-col items-center self-center text-center md:max-w-3xl">
                        <FeaturedIcon icon={ZapFast} color="brand" theme="light" size="xl" />
                        <h2 className="mt-4 text-display-sm font-semibold text-primary md:mt-6 md:text-display-md">The Smarter Financing Partner</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            We do things differently. See why businesses choose VinTraxx Capital over traditional consumer financing options.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: "Fast Digital Application", desc: "Customers apply in under 2 minutes — no paper forms, no hassle." },
                            { title: "Transparent Pricing", desc: "What you see is what you get. No hidden fees, no surprise charges for you or your customer." },
                            { title: "Increase Average Ticket Size", desc: "Customers spend more when they can pay over time. Watch your revenue grow." },
                            { title: "Dedicated Account Manager", desc: "A real person who knows your business and answers your calls." },
                            { title: "Works Across Departments", desc: "Parts counter, service department, accessories — offer financing everywhere you sell." },
                            { title: "Same-Day Funding Available", desc: "Get paid the same day so your cash flow never skips a beat." },
                        ].map((item) => (
                            <div key={item.title} className="flex flex-col rounded-2xl bg-secondary p-6 ring-1 ring-secondary">
                                <h3 className="text-md font-semibold text-primary">{item.title}</h3>
                                <p className="mt-2 text-sm text-tertiary">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// ─── Simple Onboarding ───
const SimpleOnboarding = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col items-center text-center md:mb-16">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Getting Started</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Simple Onboarding. Fast Results.</h2>
                </div>

                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 md:grid-cols-2">
                    {[
                        { step: "1", title: "Sign Up Your Business", desc: "Complete our simple digital application in under 10 minutes." },
                        { step: "2", title: "Start Offering Financing", desc: "Once approved, start offering financing to your customers immediately." },
                    ].map((item) => (
                        <div key={item.step} className="flex flex-col items-center text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#1e3a5f] text-xl font-bold text-white">{item.step}</div>
                            <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                            <p className="mt-2 text-sm text-tertiary">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── FAQ ───
const faqsCapital = [
    {
        question: "What types of businesses do you work with?",
        answer: "We work with a wide range of industries including car dealerships, MedSpas, roofing & construction, furniture stores, vet clinics, dentist offices, HVAC companies, and more. If you sell a product or service, we can help you offer financing to your customers.",
    },
    {
        question: "How quickly can I get approved?",
        answer: "Most business applications are reviewed and approved within 24–72 hours. Once approved, your customers can start applying for financing immediately.",
    },
    {
        question: "How much can my customers finance?",
        answer: "Customers can finance between $1,000 and $25,000 for purchases at your business — whether it's accessories, service repairs, tires, wheels, or other products and services.",
    },
    {
        question: "How does my business get paid?",
        answer: "You receive the full amount upfront — typically same-day. Your customer then repays VinTraxx Capital directly in affordable installments. You never have to chase payments.",
    },
];

const CommonQuestions = () => {
    const [openQuestions, setOpenQuestions] = useState(new Set([0]));

    const handleToggle = (index: number) => {
        openQuestions.has(index) ? openQuestions.delete(index) : openQuestions.add(index);
        setOpenQuestions(new Set(openQuestions));
    };

    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Common Questions</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to know about offering VinTraxx Capital financing.</p>
                </div>

                <div className="mx-auto mt-12 max-w-3xl md:mt-16">
                    <div className="flex flex-col gap-8">
                        {faqsCapital.map((faq, index) => (
                            <div key={faq.question} className="not-first:-mt-px not-first:border-t not-first:border-secondary not-first:pt-6">
                                <h3>
                                    <button
                                        onClick={() => handleToggle(index)}
                                        className="flex w-full cursor-pointer items-start justify-between gap-2 rounded-md text-left outline-focus-ring select-none focus-visible:outline-2 focus-visible:outline-offset-2 md:gap-6"
                                    >
                                        <span className="text-lg font-medium text-primary">{faq.question}</span>

                                        <span aria-hidden="true" className="mt-0.5 flex size-6 items-center text-fg-quaternary">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line
                                                    className={cx(
                                                        "origin-center rotate-0 transition duration-150 ease-out",
                                                        openQuestions.has(index) && "-rotate-90",
                                                    )}
                                                    x1="12"
                                                    y1="8"
                                                    x2="12"
                                                    y2="16"
                                                ></line>
                                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                            </svg>
                                        </span>
                                    </button>
                                </h3>

                                <motion.div
                                    className="overflow-hidden"
                                    initial={false}
                                    animate={{ height: openQuestions.has(index) ? "auto" : 0, opacity: openQuestions.has(index) ? 1 : 0 }}
                                    transition={{ type: "spring", damping: 24, stiffness: 240, bounce: 0.4 }}
                                >
                                    <div className="pt-2 pr-8 md:pr-12">
                                        <p className="text-md text-tertiary">{faq.answer}</p>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl bg-secondary px-6 py-8 text-center md:mt-16 md:gap-8 md:pt-8 md:pb-10">
                    <div className="flex items-end -space-x-4">
                        <Avatar
                            src={travisImage.src}
                            alt="Travis"
                            size="lg"
                            className="ring-[1.5px] ring-fg-white"
                        />
                        <Avatar
                            src={johnImage.src}
                            alt="John Canales"
                            size="xl"
                            className="z-10 ring-[1.5px] ring-fg-white"
                        />
                        <Avatar
                            src={dyannaImage.src}
                            alt="Dyanna"
                            size="lg"
                            className="ring-[1.5px] ring-fg-white"
                        />
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-primary">Still have questions?</h4>
                        <p className="mt-2 text-md text-tertiary md:text-lg">Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.</p>
                    </div>
                    <Button size="xl">Get in touch</Button>
                </div>
            </div>
        </section>
    );
};

// ─── CTA ───
const CTASection = () => {
    return (
        <section className="bg-[#1e3a5f] py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 text-center md:px-8">
                <img src={capitalLogo.src} alt="VinTraxx Capital" className="mx-auto mb-6 h-14 brightness-0 invert" />
                <h2 className="text-display-sm font-semibold text-white md:text-display-md">Ready to Close More Deals?</h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70 md:mt-6 md:text-xl">
                    Start offering financing to your customers today. Help them say yes to bigger purchases while you get paid upfront.
                </p>
                <div className="mt-8 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-start md:mt-12">
                    <Button color="secondary" size="xl">
                        Schedule a Call
                    </Button>
                    <Button size="xl">Get Started</Button>
                </div>
            </div>
        </section>
    );
};

// ─── Newsletter ───
const NewsletterSection = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto flex w-full max-w-container flex-col items-start justify-between gap-8 px-4 md:px-8 lg:flex-row">
                <div>
                    <h1 className="text-display-sm font-semibold text-primary md:text-display-md">Stay in the loop</h1>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Get the latest on programs, features, and business financing tips.</p>
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
                                <a href="#" className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
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

// ─── Footer ───
const FooterLarge = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Let&apos;s Revolutionize Your Business Together</h2>
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
                    <p className="text-md text-quaternary">&copy; 2025 Vintraxx. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// ─── Page ───
export default function VinTraxxCapitalPage() {
    return (
        <div className="bg-primary">
            <HeroSplitImage />

            <MetricsBar />

            <SectionDivider />

            <HowItWorks />

            <WhyOfferCapital />

            <BuiltForEveryBusiness />

            <SmarterFinancingPartner />

            <SimpleOnboarding />

            <CommonQuestions />

            <CTASection />

            <NewsletterSection />

            <FooterLarge />
        </div>
    );
}
