"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import type { Transition, Variants } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { StarIcon } from "@/components/foundations/rating-stars";

const reviews = [
    {
        quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects and features faster.",
        name: "Alisa Hester",
        title: "PM, Hourglass",
        company: "Web Design Agency",
        rating: 5,
        image: "https://www.untitledui.com/marketing/girl.webp",
    },
    {
        quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
        name: "Felicity Pierre",
        title: "Head of Design, Layers",
        company: "UX Agency",
        rating: 5,
        image: "https://www.untitledui.com/marketing/podcast-girl.webp",
    },
    {
        quote: "We've really sped up our workflow using Untitled and haven't looked back. We're so happy!",
        name: "Fleur Cook",
        title: "PM, Hourglass",
        company: "Web Design Agency",
        rating: 5,
        image: "https://www.untitledui.com/marketing/girl.webp",
    },
];

const variants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 500 : -500,
        opacity: 0,
    }),
    center: {
        x: 0,
        zIndex: 1,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 500 : -500,
        zIndex: 0,
        opacity: 0,
    }),
};

const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min;

    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const transition: Transition = {
    type: "tween",
    duration: 0.8,
    ease: [0.8, 0, 0.2, 1],
};

export const CTASplitImageQuote01 = () => {
    const [{ page, direction, count }, setPage] = useState({
        page: 0,
        direction: 0,
        count: 0,
    });

    const currentReview = wrap(0, reviews.length, page);

    const navigate = (direction: number) => {
        setPage({
            page: page + direction,
            direction,
            count: count + 1,
        });
    };

    return (
        <section className="grid grid-cols-1 gap-y-12 bg-primary py-16 lg:grid-cols-2 lg:items-center lg:py-0">
            <div className="flex w-full lg:justify-end lg:py-24">
                <div className="flex max-w-3xl flex-col items-start px-4 md:px-8 lg:max-w-(--breakpoint-sm)">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md lg:text-display-lg">
                        Join 4,000+ startups growing with Untitled
                    </h2>

                    <ul className="mt-8 flex flex-col gap-4 md:gap-5 md:pl-4">
                        {["30-day free trial", "Personalized onboarding", "Access to all features"].map((feat) => (
                            <li key={feat} className="flex gap-3">
                                <svg className="size-7 text-fg-brand-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                <span className="pt-0.5 text-md text-tertiary md:pt-0 md:text-lg">{feat}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start md:mt-12">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>
            </div>

            <div className="relative h-170 w-full overflow-hidden px-4 md:px-8 lg:h-180 lg:px-0">
                <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                    <motion.img
                        key={count}
                        custom={direction}
                        src={reviews[currentReview].image}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={transition}
                        className="size-full object-cover"
                    />
                </AnimatePresence>
                <div className="relative">
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/40 to-black/0 p-4 pt-16 md:p-8 md:pt-20 lg:pt-24">
                        <div className="flex flex-col overflow-hidden rounded-xl bg-primary/30 px-4 py-6 ring-1 ring-alpha-white/30 backdrop-blur-[10px] ring-inset md:px-5">
                            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                                <motion.q
                                    key={count}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        ...transition,
                                        delay: 0.02,
                                    }}
                                    className="text-xl font-semibold text-balance text-white md:text-display-sm"
                                >
                                    {reviews[currentReview].quote}
                                </motion.q>
                            </AnimatePresence>
                            <div className="mt-5 flex flex-col-reverse justify-between gap-4 md:mt-8 md:flex-row">
                                <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                                    <motion.p
                                        key={count}
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            ...transition,
                                            delay: 0.03,
                                        }}
                                        className="text-xl font-semibold whitespace-nowrap text-white md:text-display-xs"
                                    >
                                        {reviews[currentReview].name}
                                    </motion.p>
                                </AnimatePresence>
                                <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                                    <motion.div
                                        key={count}
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            ...transition,
                                            delay: 0.03,
                                        }}
                                        aria-hidden="true"
                                        className="hidden gap-1 md:flex"
                                    >
                                        <StarIcon className="text-fg-white" />
                                        <StarIcon className="text-fg-white" />
                                        <StarIcon className="text-fg-white" />
                                        <StarIcon className="text-fg-white" />
                                        <StarIcon className="text-fg-white" />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="mt-2 flex flex-col justify-between gap-5 md:mt-3 md:flex-row md:gap-3">
                                <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                                    <motion.div
                                        key={count}
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            ...transition,
                                            delay: 0.04,
                                        }}
                                        className="flex flex-col gap-0.5 md:gap-1"
                                    >
                                        <p className="text-lg font-semibold whitespace-nowrap text-white md:text-md">{reviews[currentReview].company}</p>
                                        <p className="text-md whitespace-nowrap text-white md:text-sm">{reviews[currentReview].title}</p>
                                    </motion.div>
                                </AnimatePresence>
                                <div className="flex gap-4 md:gap-8">
                                    <button
                                        aria-label="Previous review"
                                        onClick={() => navigate(-1)}
                                        className="group flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/50 outline-focus-ring transition duration-100 ease-linear hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 md:size-14"
                                    >
                                        <ArrowLeft className="transition-inherit size-5 text-white group-hover:opacity-70 md:size-6" />
                                    </button>
                                    <button
                                        aria-label="Next review"
                                        onClick={() => navigate(1)}
                                        className="group flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/50 outline-focus-ring transition duration-100 ease-linear hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 md:size-14"
                                    >
                                        <ArrowRight className="transition-inherit size-5 text-white group-hover:opacity-70 md:size-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
