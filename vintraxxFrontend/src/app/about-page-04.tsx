"use client";

import { useState } from "react";
import { ArrowUpRight } from "@untitledui/icons";
import { AnimatePresence, type Transition, motion } from "motion/react";
import { PaginationDot } from "@/components/application/pagination/pagination-dot";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { AppStoreButton, GooglePlayButton } from "@/components/base/buttons/app-store-buttons";
import { Button } from "@/components/base/buttons/button";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { StarIcon } from "@/components/foundations/rating-stars";
import { Dribbble, LinkedIn, X } from "@/components/foundations/social-icons";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";

const teamMembers2 = [
    {
        name: "Alisa Hester",
        title: "Founder & CEO",
        summary: "Former co-founder of Opendoor. Early staff at Spotify and Clearbit.",
        avatarUrl: "https://www.untitledui.com/images/portraits/alisa-hester",
        socials: [
            { icon: X, href: "https://x.com/" },
            { icon: LinkedIn, href: "https://www.linkedin.com/" },
            { icon: Dribbble, href: "https://dribbble.com/" },
        ],
    },
    {
        name: "Rich Wilson",
        title: "Engineering Manager",
        summary: "Lead engineering teams at Figma, Pitch, and Protocol Labs.",
        avatarUrl: "https://www.untitledui.com/images/portraits/rich-wilson",
        socials: [
            { icon: X, href: "https://x.com/" },
            { icon: LinkedIn, href: "https://www.linkedin.com/" },
            { icon: Dribbble, href: "https://dribbble.com/" },
        ],
    },
    {
        name: "Annie Stanley",
        title: "Product Manager",
        summary: "Former PM for Airtable, Medium, Ghost, and Lumi.",
        avatarUrl: "https://www.untitledui.com/images/portraits/annie-stanley",
        socials: [
            { icon: X, href: "https://x.com/" },
            { icon: LinkedIn, href: "https://www.linkedin.com/" },
            { icon: Dribbble, href: "https://dribbble.com/" },
        ],
    },
    {
        name: "Johnny Bell",
        title: "Frontend Developer",
        summary: "Former frontend dev for Linear, Coinbase, and Postscript.",
        avatarUrl: "https://www.untitledui.com/images/portraits/johnny-bell",
        socials: [
            { icon: X, href: "https://x.com/" },
            { icon: LinkedIn, href: "https://www.linkedin.com/" },
            { icon: Dribbble, href: "https://dribbble.com/" },
        ],
    },
    {
        name: "Mia Ward",
        title: "Backend Developer",
        summary: "Lead backend dev at Clearbit. Former Clearbit and Loom.",
        avatarUrl: "https://www.untitledui.com/images/portraits/mia-ward",
        socials: [
            { icon: X, href: "https://x.com/" },
            { icon: LinkedIn, href: "https://www.linkedin.com/" },
            { icon: Dribbble, href: "https://dribbble.com/" },
        ],
    },
    {
        name: "Archie Young",
        title: "Product Designer",
        summary: "Founding design team at Figma. Former Pleo, Stripe, and Tile.",
        avatarUrl: "https://www.untitledui.com/images/portraits/archie-young",
        socials: [
            { icon: X, href: "https://x.com/" },
            { icon: LinkedIn, href: "https://www.linkedin.com/" },
            { icon: Dribbble, href: "https://dribbble.com/" },
        ],
    },
];

const footerNavListBrand = [
    {
        label: "Product",
        items: [
            { label: "Overview", href: "#" },
            { label: "Features", href: "#" },
            {
                label: "Solutions",
                href: "#",
                badge: (
                    <Badge type="modern" size="sm" className="ml-1">
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
            { label: "Twitter", href: "https://x.com/" },
            { label: "LinkedIn", href: "https://www.linkedin.com/" },
            { label: "Facebook", href: "https://www.facebook.com/" },
            { label: "GitHub", href: "https://github.com/" },
            { label: "AngelList", href: "https://angel.co/" },
            { label: "Dribbble", href: "https://dribbble.com/" },
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

const HeaderCentered = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">About us</span>
                    <h1 className="mt-3 text-display-md font-semibold text-primary md:text-display-lg">We're built for software teams</h1>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">
                        Our mission is to ensure teams can do their best work, no matter their size or budget. We focus on the details of everything we do.
                    </p>
                </div>
            </div>
        </section>
    );
};

const TeamSectionImageGlass01 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Meet our team</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Our philosophy is simple—hire a team of diverse, passionate people and foster a culture that empowers you to do your best work.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 self-stretch sm:flex-row-reverse sm:justify-center">
                        <Button size="xl">We're hiring!</Button>
                        <Button color="secondary" size="xl">
                            Read our principles
                        </Button>
                    </div>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="grid w-full grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
                        {teamMembers2.map((item) => (
                            <li key={item.title} className="relative flex h-108 w-full flex-col justify-end md:h-120">
                                <img src={item.avatarUrl} alt={item.name} className="absolute top-0 left-0 z-0 size-full object-cover" />

                                <div className="z-10 bg-linear-to-t from-black/40 to-black/0 p-3 pt-16 md:p-5 md:pt-20 lg:pt-24">
                                    <div className="rounded-xl bg-primary/30 px-4 pt-5 pb-6 text-white ring-1 ring-alpha-white/30 backdrop-blur-[10px] ring-inset md:px-5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-display-xs font-semibold md:text-display-sm">{item.name}</h3>
                                            <ArrowUpRight className="size-6" />
                                        </div>
                                        <p className="mt-2 text-md font-semibold md:mt-3 md:text-lg">{item.title}</p>
                                        <p className="mt-1 text-sm md:text-md">{item.summary}</p>
                                        <ul className="mt-5 flex gap-5 md:mt-6">
                                            {item.socials.map((social) => (
                                                <li key={social.href}>
                                                    <a
                                                        href={social.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex rounded-xs text-white outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                                    >
                                                        <social.icon className="size-5 md:size-6" />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
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

const MetricsImageWithCards01 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-12 md:gap-16">
                    <div className="flex w-full flex-col items-center text-center md:max-w-3xl md:self-center">
                        <Badge size="lg" type="pill-color" color="brand" className="max-md:hidden">
                            Launch faster
                        </Badge>
                        <Badge size="md" type="pill-color" color="brand" className="inline-block md:hidden">
                            Launch faster
                        </Badge>
                        <h2 className="mt-4 text-display-sm font-semibold text-primary md:text-display-md">We're only just getting started on our journey</h2>
                        <p className="mt-4 hidden text-lg text-tertiary md:mt-5 md:block md:text-xl">
                            Everything you need to build modern UI and great products.
                        </p>
                        <p className="mt-4 block text-lg text-tertiary md:mt-5 md:hidden md:text-xl">
                            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000
                            startups.
                        </p>
                    </div>

                    <dl className="relative grid grid-cols-1 gap-8 px-6 py-8 md:grid-cols-2 md:p-16 lg:grid-cols-3">
                        <img
                            src="https://www.untitledui.com/marketing/workspace-3.webp"
                            alt="Modern workspace background"
                            className="absolute inset-0 z-0 size-full object-cover"
                        />

                        {[
                            { title: "400+", subtitle: "Projects completed", description: "We've helped build over 400 projects with great companies." },
                            { title: "600%", subtitle: "Return on investment", description: "We've helped build over 400 projects with great companies." },
                            { title: "10k", subtitle: "Global downloads", description: "Our free UI kit has been downloaded over 10k times." },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="z-10 rounded-2xl bg-alpha-white/30 p-6 text-center ring-1 ring-alpha-white/30 backdrop-blur-xl ring-inset"
                            >
                                <dd className="text-display-lg font-semibold text-white md:text-display-xl">{item.title}</dd>
                                <dt className="mt-3 text-lg font-semibold text-white">{item.subtitle}</dt>
                                <p className="mt-1 text-md text-white">{item.description}</p>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
};

const reviews = [
    {
        id: "review-01",
        quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
        author: { name: "Caitlyn King", title: "Head of Design, Layers", avatarUrl: "https://www.untitledui.com/images/avatars/caitlyn-king?fm=webp&q=80" },
    },
    {
        id: "review-02",
        quote: "We've been using Untitled to kick start every new project and can't imagine working without it.",
        author: {
            name: "Amélie Laurent",
            title: "Product Manager, Wildcrafted",
            avatarUrl: "https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80",
        },
    },
    {
        id: "review-03",
        quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects and features faster.",
        author: {
            name: "Demi Wilkinson",
            title: "Head of Design, Layers",
            avatarUrl: "https://www.untitledui.com/images/avatars/demi-wilkinson?fm=webp&q=80",
        },
    },
];

const TestimonialSimpleCentered01 = () => {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    const transition: Transition = { type: "spring", duration: 0.8 };

    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col items-center gap-10">
                    <figure className="flex max-w-270 flex-col gap-8 text-center">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.blockquote
                                key={currentReviewIndex + "-quote"}
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0, transition: { ...transition, delay: 0.4 } }}
                                exit={{ opacity: 0, scale: 0.98, y: 20, transition: { ...transition, delay: 0.06 } }}
                                className="origin-bottom text-display-sm font-medium text-balance text-primary will-change-transform md:text-display-md"
                            >
                                {reviews[currentReviewIndex].quote}
                            </motion.blockquote>
                            <motion.figcaption
                                key={currentReviewIndex + "-author"}
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0, transition: { ...transition, delay: 0.5 } }}
                                exit={{ opacity: 0, scale: 0.98, y: 20, transition }}
                                className="flex origin-bottom flex-col items-center gap-4 will-change-transform"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar src={reviews[currentReviewIndex].author.avatarUrl} alt={reviews[currentReviewIndex].author.name} size="2xl" />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-lg font-semibold text-primary">{reviews[currentReviewIndex].author.name}</p>
                                        <cite className="text-md text-tertiary not-italic">{reviews[currentReviewIndex].author.title}</cite>
                                    </div>
                                </div>
                                <motion.div aria-hidden="true" className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <motion.div
                                            key={`${currentReviewIndex}-${index}`}
                                            initial={{ opacity: 0, scale: 0.9, y: 6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0, transition: { ...transition, delay: 0.5 + index * 0.1 } }}
                                            exit={{ opacity: 0, scale: 0.9, y: 6, transition: { ...transition, delay: 0 } }}
                                        >
                                            <StarIcon />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.figcaption>
                        </AnimatePresence>
                    </figure>

                    <PaginationDot page={currentReviewIndex + 1} total={3} size="lg" onPageChange={(page) => setCurrentReviewIndex(page - 1)} />
                </div>
            </div>
        </section>
    );
};

const SimpleCentered = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">We're hiring!</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Our team is growing fast and we're always looking for smart people.</p>
                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-8 md:flex-row md:self-center">
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

const FooterLarge03 = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <nav className="flex flex-col-reverse gap-12 md:flex-row md:gap-16">
                    <ul className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
                        {footerNavListBrand.map((category) => (
                            <li key={category.label}>
                                <h4 className="text-sm font-semibold text-primary">{category.label}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (
                                        <li key={item.label}>
                                            <Button color="link-color" size="lg" href={item.href} iconTrailing={item.badge} className="gap-1">
                                                {item.label}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                    <div className="w-full md:max-w-[135px]">
                        <h4 className="text-sm font-semibold text-primary">Get the app</h4>
                        <div className="mt-4 flex w-max flex-row gap-4 md:flex-col">
                            <AppStoreButton href="#" className="w-[135px]" />
                            <GooglePlayButton href="#" className="w-[135px]" />
                        </div>
                    </div>
                </nav>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row md:items-center">
                    <UntitledLogo className="h-8 w-min" />
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const AboutPage04 = () => {
    return (
        <div className="bg-primary">
            <Header isFloating />

            <HeaderCentered />

            <SectionDivider />

            <TeamSectionImageGlass01 />

            <SectionDivider />

            <MetricsImageWithCards01 />

            <SectionDivider />

            <TestimonialSimpleCentered01 />

            <SimpleCentered />

            <FooterLarge03 />
        </div>
    );
};

export default AboutPage04;
