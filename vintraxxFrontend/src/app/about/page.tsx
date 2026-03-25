"use client";

import { type ComponentProps } from "react";
import { LinkedIn } from "@/components/foundations/social-icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import Link from "next/link";

import johnImage from "@/assets/images/team/john.jpg";
import paulImage from "@/assets/images/team/paul.jpg";
import billImage from "@/assets/images/team/bill.jpg";
import travisImage from "@/assets/images/team/travis.jpg";
import sheilaImage from "@/assets/images/team/shiela.jpg";
import dyannaImage from "@/assets/images/team/dyanna.jpg";

const HeaderPrimary = (props: ComponentProps<typeof Header>) => {
    return (
        <Header
            {...props}
            className="bg-utility-brand-50_alt [&_nav>ul>li>a]:text-brand-primary [&_nav>ul>li>a]:hover:text-brand-primary [&_nav>ul>li>button]:text-brand-primary [&_nav>ul>li>button]:hover:text-brand-primary [&_nav>ul>li>button>svg]:text-fg-brand-secondary_alt"
        />
    );
};

const teamMembers = [
    {
        name: "John Canales",
        title: "Founder & CEO",
        avatarUrl: johnImage.src,
        linkedIn: "https://www.linkedin.com/in/john-canales-162329ab/",
    },
    {
        name: "Paul Machin",
        title: "Chief Revenue Officer",
        avatarUrl: paulImage.src,
        linkedIn: "https://www.linkedin.com/in/pmachin1/",
    },
    {
        name: "Bill Randolph",
        title: "Chief Commercial Officer",
        avatarUrl: billImage.src,
        linkedIn: "https://www.linkedin.com/in/warandolph/",
    },
    {
        name: "Travis Wisenbarger",
        title: "Chief Sales Officer",
        avatarUrl: travisImage.src,
        linkedIn: "https://www.linkedin.com/in/travis-wisenbarger-9580351b/",
    },
    {
        name: "Dyanna Rossini",
        title: "Chief Innovation Officer & Board President",
        avatarUrl: dyannaImage.src,
        linkedIn: "https://www.linkedin.com/in/sheila-hartwell-b557212/",
    },
];

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

const HeaderCentered = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">About VinTraxx Automotive LLC</span>
                    <h1 className="mt-3 text-display-md font-semibold text-primary md:text-display-lg">Redefining How Dealerships Operate</h1>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">
                        We're redefining the way dealerships, buyers, and technology come together. Founded with a vision to bring transparency, innovation, and efficiency to the automotive industry, VinTraxx delivers powerful tools that help dealers source, market, and sell vehicles faster and smarter.
                    </p>
                    <p className="mt-4 text-lg text-tertiary md:text-xl">
                        We don't just sell solutions—we create ecosystems from VinTraxx Acquisition.iO to SmartScan Diagnostics, Car Check King, VinLane Inventory Management, VTXCoin, VinTraxx Capital, VinTraxx Live and VinClips Video Marketing, our platforms are built to simplify operations, reduce costs, and drive sales growth.
                    </p>
                    <p className="mt-4 text-lg text-tertiary md:text-xl">
                        Our mission is simple: empower dealerships with technology that works for them, not against them. By blending real-world automotive expertise with cutting-edge digital tools, we help dealers capture more opportunities, maximize profitability, and build lasting trust with their customers.
                    </p>
                    <p className="mt-4 text-lg text-tertiary md:text-xl">
                        At VinTraxx, we believe the future of automotive is about more than selling cars—it's about creating experiences, driving innovation, and building partnerships that last.
                    </p>
                </div>
            </div>
        </section>
    );
};

const TeamSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Meet Our Leadership Team</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        A team of automotive industry veterans and technology experts united by a mission to transform dealership operations.
                    </p>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="grid w-full grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
                        {teamMembers.map((item) => (
                            <li key={item.name} className="relative flex h-96 w-full flex-col justify-end md:h-108">
                                <img src={item.avatarUrl} alt={item.name} className="absolute top-0 left-0 z-0 size-full object-cover object-top" />

                                <div className="z-10 bg-linear-to-t from-black/40 to-black/0 p-3 pt-16 md:p-5 md:pt-20">
                                    <div className="rounded-xl bg-primary/30 px-4 pt-4 pb-5 text-white ring-1 ring-alpha-white/30 backdrop-blur-[10px] ring-inset md:px-5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold md:text-xl">{item.name}</h3>
                                            <a
                                                href={item.linkedIn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex rounded-xs text-white hover:text-white/80 transition-colors"
                                            >
                                                <LinkedIn className="size-5 md:size-6" />
                                            </a>
                                        </div>
                                        <p className="mt-1 text-sm md:text-md">{item.title}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

const MetricsSection = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-12 md:gap-16">
                    <div className="flex w-full flex-col items-center text-center md:max-w-3xl md:self-center">
                        <Badge size="lg" type="pill-color" color="brand" className="max-md:hidden">
                            Our Impact
                        </Badge>
                        <Badge size="md" type="pill-color" color="brand" className="inline-block md:hidden">
                            Our Impact
                        </Badge>
                        <h2 className="mt-4 text-display-sm font-semibold text-primary md:text-display-md">Driving Results for Dealerships Nationwide</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                            We're committed to helping dealerships thrive in a competitive market with innovative technology solutions.
                        </p>
                    </div>

                    <dl className="relative grid grid-cols-1 gap-8 px-6 py-8 md:grid-cols-2 md:p-16 lg:grid-cols-3 rounded-2xl overflow-hidden" style={{ backgroundColor: '#254268' }}>

                        {[
                            { title: "500+", subtitle: "Dealerships Served", description: "Trusted by dealerships across the country to power their operations." },
                            { title: "30%", subtitle: "Efficiency Increase", description: "Average improvement in operational efficiency for our partners." },
                            { title: "$2M+", subtitle: "Revenue Generated", description: "Additional revenue generated for dealers through our platform." },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="rounded-2xl p-6 text-center ring-1 ring-white/20 ring-inset" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                            >
                                <dd className="text-display-lg font-semibold text-white md:text-display-xl">{item.title}</dd>
                                <dt className="mt-3 text-lg font-semibold text-white">{item.subtitle}</dt>
                                <p className="mt-1 text-md text-white/90">{item.description}</p>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
};

const FooterLarge = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Ready to Transform Your Dealership?</h2>
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

export default function AboutPage() {
    return (
        <div className="bg-primary">
            <Header />

            <HeaderCentered />

            <SectionDivider />

            <TeamSection />

            <FooterLarge />
        </div>
    );
}
