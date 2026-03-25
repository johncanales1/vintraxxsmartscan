"use client";

import { type ComponentPropsWithRef, type FC, useState } from "react";
import { ArrowLeft, ArrowRight, MarkerPin02, PlayCircle } from "@untitledui/icons";
import { AnimatePresence, type Transition, motion } from "motion/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { StarIcon } from "@/components/foundations/rating-stars";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

const HeroGeometricShapes04 = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            {/* Background pattern */}
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-dot-sm-desktop.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.2]"
            />
            <img
                alt="Grid of dots"
                aria-hidden="true"
                loading="lazy"
                src="https://www.untitledui.com/patterns/light/grid-dot-sm-mobile.svg"
                className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.2]"
            />

            <Header />

            <section className="relative py-16 md:py-24">
                <div className="mx-auto w-full max-w-container px-4 md:px-8">
                    <div className="mx-auto flex max-w-5xl flex-col md:items-center md:text-center">
                        <a href="#" className="rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                            <BadgeGroup className="hidden md:flex" size="lg" addonText="We're hiring!" iconTrailing={ArrowRight} theme="light" color="brand">
                                Join our design team
                            </BadgeGroup>
                            <BadgeGroup className="md:hidden" size="md" addonText="We're hiring!" iconTrailing={ArrowRight} theme="light" color="brand">
                                Join our design team
                            </BadgeGroup>
                        </a>

                        <h1 className="mt-4 text-display-md font-medium text-primary md:text-display-lg lg:text-display-xl">
                            Creating stylish, functional and memorable spaces
                        </h1>
                        <p className="mt-4 max-w-120 text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            — We're a full-service interior design studio who specialize in simple and timeless spaces.
                        </p>
                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
                            <Button iconLeading={PlayCircle} color="secondary" size="xl">
                                Showreel
                            </Button>
                            <Button size="xl">Chat to us</Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 w-full max-w-container px-4 md:px-8">
                    <img
                        alt="Geo Shapes Desktop 04"
                        src="https://www.untitledui.com/marketing/geo-shapes/geo-shapes-desktop-04.svg"
                        className="hidden w-full object-cover sm:block"
                    />
                    <img
                        alt="Geo Shapes Mobile 04"
                        src="https://www.untitledui.com/marketing/geo-shapes/geo-shapes-mobile-04.svg"
                        className="w-full object-cover sm:hidden"
                    />
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

const ContentSectionSplitImage03 = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto grid w-full max-w-container grid-cols-1 items-center gap-12 px-4 md:gap-16 md:px-8 lg:grid-cols-2">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Our studio</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">
                        Design that influences how people work, learn, live and experience the world.
                    </h2>
                    <div className="prose mt-8 md:prose-lg md:mt-12">
                        <p>
                            Mi tincidunt elit, id quisque ligula ac diam, amet. Vel etiam suspendisse morbi eleifend faucibus eget vestibulum felis. Dictum quis
                            montes, sit sit. Tellus aliquam enim urna, etiam.
                        </p>
                        <p>
                            Dolor enim eu tortor urna sed duis nulla. Aliquam vestibulum, nulla odio nisl vitae. In aliquet pellentesque aenean hac vestibulum
                            turpis mi bibendum diam. Tempor integer aliquam in vitae malesuada.
                        </p>

                        <p>
                            Elit nisi in eleifend sed nisi. Pulvinar at orci, proin imperdiet commodo consectetur convallis risus. Sed condimentum enim
                            dignissim adipiscing faucibus consequat, urna. Viverra purus et erat auctor aliquam. Risus, volutpat vulputate posuere purus sit
                            congue convallis aliquet.
                        </p>
                        <p>
                            Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris id. Non pellentesque congue eget consectetur turpis. Sapien,
                            dictum molestie sem tempor. Diam elit, orci, tincidunt aenean.{" "}
                        </p>
                    </div>
                    <div className="mt-8 flex flex-col-reverse gap-3 md:mt-12 md:flex-row">
                        <Button color="secondary" size="xl">
                            Get in touch
                        </Button>
                        <Button size="xl">Our process</Button>
                    </div>
                </div>

                <div className="h-60 lg:h-163.5">
                    <img
                        src="https://www.untitledui.com/marketing/content-section-03.webp"
                        className="size-full object-cover"
                        alt="Abstract 3D holographic rectangles"
                    />
                </div>
            </div>
        </section>
    );
};

const reviews = [
    {
        quote: "We've really sped up our workflow using Untitled and haven't looked back.",
        author: {
            name: "Sienna Hewitt",
            title: "Project Manager, Warpspeed",
            avatarUrl: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80",
        },
    },
    {
        quote: "Love the simplicity of the service and the prompt customer support.",
        author: {
            name: "Caitlyn King",
            title: "Data Engineer, Sisyphus",
            avatarUrl: "https://www.untitledui.com/images/avatars/caitlyn-king?fm=webp&q=80",
        },
    },
    {
        quote: "Untitled has saved us thousands of hours of work.",
        author: {
            name: "Lulu Meyers",
            title: "PM, Hourglass",
            avatarUrl: "https://www.untitledui.com/images/avatars/lulu-meyers?fm=webp&q=80",
        },
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

const TestimonialAbstractImage = () => {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    const transition: Transition = {
        type: "spring",
        duration: 0.8,
    };

    return (
        <section className="bg-primary py-16 lg:py-24">
            <div className="mx-auto flex max-w-container flex-col gap-12 overflow-hidden px-4 md:gap-16 md:px-8 lg:flex-row lg:items-center">
                <figure className="flex flex-col gap-8 md:gap-12 lg:flex-1">
                    <div className="flex flex-1 flex-col gap-6 md:gap-12">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.div key={currentReviewIndex + "-rating"} aria-hidden="true" className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <motion.div
                                        key={`${currentReviewIndex}-${index}`}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.9,
                                            y: 6,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                            transition: {
                                                ...transition,
                                                delay: 0.5 + index * 0.1,
                                            },
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.9,
                                            y: 6,
                                            transition: {
                                                ...transition,
                                                delay: 0.12,
                                            },
                                        }}
                                        className="will-change-transform"
                                    >
                                        <StarIcon />
                                    </motion.div>
                                ))}
                            </motion.div>
                            <motion.blockquote
                                key={currentReviewIndex + "-quote"}
                                initial={{
                                    opacity: 0,
                                    scale: 0.99,
                                    y: 12,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    transition: {
                                        ...transition,
                                        delay: 0.4,
                                    },
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.99,
                                    y: 12,
                                    transition: {
                                        ...transition,
                                        delay: 0.06,
                                    },
                                }}
                                className="origin-bottom-left text-display-sm font-medium text-balance text-primary will-change-transform sm:text-display-md md:text-display-lg"
                            >
                                {reviews[currentReviewIndex].quote}
                            </motion.blockquote>
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col justify-between gap-6 md:flex-row">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.div
                                key={currentReviewIndex}
                                initial={{
                                    opacity: 0,
                                    scale: 0.99,
                                    y: 12,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    transition: {
                                        ...transition,
                                        delay: 0.3,
                                    },
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.99,
                                    y: 12,
                                    transition,
                                }}
                                className="flex origin-bottom-left gap-4 will-change-transform"
                            >
                                <Avatar src={reviews[currentReviewIndex].author.avatarUrl} alt={reviews[currentReviewIndex].author.name} size="xl" />
                                <figcaption className="flex flex-col gap-0.5">
                                    <p className="text-lg font-semibold whitespace-nowrap text-primary">{reviews[currentReviewIndex].author.name}</p>
                                    <cite className="text-md whitespace-nowrap text-tertiary not-italic">{reviews[currentReviewIndex].author.title}</cite>
                                </figcaption>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex gap-4 md:gap-8">
                            <RoundButton
                                icon={ArrowLeft}
                                onClick={() => setCurrentReviewIndex(currentReviewIndex === 0 ? reviews.length - 1 : currentReviewIndex - 1)}
                            />
                            <RoundButton
                                icon={ArrowRight}
                                onClick={() => setCurrentReviewIndex(currentReviewIndex === reviews.length - 1 ? 0 : currentReviewIndex + 1)}
                            />
                        </div>
                    </div>
                </figure>

                <div className="grid h-122 w-[150%] grid-cols-[repeat(12,1fr)] grid-rows-[repeat(12,1fr)] gap-2 self-center sm:h-124 sm:w-[120%] md:w-auto md:gap-4 lg:flex-1">
                    <img
                        src="https://www.untitledui.com/marketing/testimonial-abstract-image-01.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "3 / 3 / 7 / 7" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/smiling-girl-3.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "1 / 7 / 7 / 11" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/ai-woman-03.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "7 / 1 / 10 / 5" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/two-standing-women.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "7 / 5 / 13 / 9" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/smiling-girl-8.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "7 / 9 / 10 / 13" }}
                    />
                </div>
            </div>
        </section>
    );
};

const MetricsSplitImage01 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-12 md:gap-16">
                    <div className="flex w-full flex-col md:max-w-3xl">
                        <p className="text-sm font-semibold text-brand-secondary md:text-md">Launch faster</p>
                        <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Creating memorable spaces</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">We design physical experiences that create more happy in the world.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-12 md:gap-8 lg:grid-cols-2">
                        <dl className="grid grid-cols-1 gap-8 self-center md:grid-cols-2 md:gap-y-16 md:pr-8">
                            {[
                                { title: "400+", subtitle: "Projects completed", description: "We've helped build over 400 amazing projects." },
                                { title: "600%", subtitle: "Return on investment", description: "Our customers have reported an average of ~600% ROI." },
                                { title: "10k", subtitle: "Global downloads", description: "Our free UI kit has been downloaded over 10k times." },
                                { title: "200+", subtitle: "5-star reviews", description: "We're proud of our 5-star rating with over 200 reviews." },
                            ].map((item) => (
                                <div key={item.title} className="flex flex-1 flex-col-reverse gap-3 text-center">
                                    <div className="flex flex-col gap-1">
                                        <dt className="text-lg font-semibold text-primary">{item.subtitle}</dt>
                                        <p className="text-md text-tertiary">{item.description}</p>
                                    </div>
                                    <dd className="text-display-lg font-semibold text-brand-tertiary_alt md:text-display-xl">{item.title}</dd>
                                </div>
                            ))}
                        </dl>

                        <img
                            src="https://www.untitledui.com/marketing/photographer-girl.webp"
                            alt="Professional female photographer holding a camera in natural lighting"
                            className="h-70 w-full object-cover md:h-140"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const ContactSectionIconsAndImage = () => {
    return (
        <div className="bg-primary">
            <section className="bg-secondary pt-16 pb-28 md:pt-24 md:pb-40">
                <div className="mx-auto max-w-container px-4 md:px-8">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24">
                        <div className="flex w-full max-w-3xl flex-col">
                            <span className="text-sm font-semibold text-brand-secondary md:text-md">Contact us</span>
                            <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Chat to our friendly team</h2>
                            <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">We'd love to hear from you! Please get in touch.</p>
                        </div>

                        <ul className="grid grid-cols-1 gap-10 md:gap-8">
                            {[
                                {
                                    title: "Melbourne",
                                    subtitle: "100 Flinders Street, \nMelbourne VIC 3000 AU",
                                    icon: MarkerPin02,
                                },
                                { title: "Sydney", subtitle: "100 George Street, \nSydney NSW 2000 AU", icon: MarkerPin02 },
                            ].map((item) => (
                                <li key={item.title} className="flex items-start gap-4">
                                    <item.icon className="size-6 pt-0.5 text-icon-fg-brand" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                                        <p className="mt-1 text-md whitespace-pre text-tertiary md:whitespace-normal">{item.subtitle}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
            <section className="-mt-16 pb-16 md:-mt-24 md:pb-24">
                <div className="mx-auto max-w-container px-4 md:px-8">
                    <img
                        src="https://www.untitledui.com/marketing/smiling-girl-3.webp"
                        className="h-60 w-full object-cover shadow-3xl md:h-120 lg:h-140"
                        alt="Team discussing a topic"
                    />
                </div>
            </section>
        </div>
    );
};

const NewsletterCardVertical = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col items-center rounded-2xl bg-secondary px-6 py-10 text-center lg:p-16">
                    <h2 className="text-display-sm font-semibold text-primary xl:text-display-md">
                        Still thinking <br className="md:hidden" /> about it?
                    </h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 lg:text-xl">Sign up for our newsletter and get 10% off your next purchase.</p>
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(new FormData(e.currentTarget));
                            console.log("Form data:", data);
                        }}
                        className="mt-8 flex w-full flex-col gap-4 md:max-w-120 md:flex-row"
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
                                    Read about our{" "}
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
            </div>
        </section>
    );
};

const FooterLarge15 = () => {
    return (
        <footer className="dark-mode bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8 md:items-center">
                    <UntitledLogo className="h-8 w-min shrink-0" />
                    <nav>
                        <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-[repeat(6,max-content)]">
                            {[
                                { title: "Overview", href: "#" },
                                { title: "Features", href: "#" },
                                { title: "Pricing", href: "#" },
                                { title: "Careers", href: "#" },
                                { title: "Help", href: "#" },
                                { title: "Privacy", href: "#" },
                            ].map((item) => (
                                <li key={item.title}>
                                    <Button color="link-gray" size="lg" href={item.href}>
                                        {item.title}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                <div className="mt-12 flex flex-col-reverse justify-between gap-4 border-t border-secondary pt-8 md:mt-16 md:flex-row md:gap-6">
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>

                    <ul className="flex gap-4">
                        {[
                            { title: "Terms", href: "#" },
                            { title: "Privacy", href: "#" },
                            { title: "Cookies", href: "#" },
                        ].map(({ title, href }) => (
                            <li key={title}>
                                <a href={href} className="text-md text-quaternary transition duration-100 ease-linear hover:text-tertiary">
                                    {title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
};

const LandingPage14 = () => {
    return (
        <div className="bg-primary">
            <HeroGeometricShapes04 />

            <SocialProofFullWidth />

            <ContentSectionSplitImage03 />

            <SectionDivider />

            <TestimonialAbstractImage />

            <SectionDivider />

            <MetricsSplitImage01 />

            <ContactSectionIconsAndImage />

            <NewsletterCardVertical />

            <FooterLarge15 />
        </div>
    );
};

export default LandingPage14;
