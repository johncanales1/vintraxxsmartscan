"use client";

import { useState } from "react";
import { AnimatePresence, type Transition, motion } from "motion/react";
import { PaginationDot } from "@/components/application/pagination/pagination-dot";
import { PlayButtonIcon } from "@/components/foundations/play-button-icon";
import { StarIcon } from "@/components/foundations/rating-stars";

const reviews = [
    {
        quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
        author: {
            name: "Renee Wells",
            title: "Product Designer, Quotient",
            avatarUrl: "https://www.untitledui.com/images/avatars/renee-wells?fm=webp&q=80",
        },
    },
    {
        quote: "We've really sped up our workflow using Untitled and haven't looked back. We're so happy!",
        author: {
            name: "Sienna Hewitt",
            title: "Project Manager, Warpspeed",
            avatarUrl: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80",
        },
    },
    {
        quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects and features faster.",
        author: {
            name: "Lulu Meyers",
            title: "PM, Hourglass",
            avatarUrl: "https://www.untitledui.com/images/avatars/lulu-meyers?fm=webp&q=80",
        },
    },
];

const transition: Transition = {
    type: "spring",
    duration: 0.8,
};

export const TestimonialCardSplitImage = () => {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 items-center overflow-hidden rounded-2xl bg-secondary md:rounded-3xl lg:grid-cols-[auto_auto]">
                    <div className="flex flex-1 flex-col gap-8 px-6 py-10 md:gap-8 md:px-8 md:py-12 lg:p-16">
                        <figure className="flex flex-col gap-8">
                            <div className="flex flex-col gap-4 md:gap-6">
                                <AnimatePresence initial={false} mode="popLayout">
                                    <motion.div key={currentReviewIndex + "-rating"} aria-hidden="true" className="flex gap-1">
                                        {Array.from({
                                            length: 5,
                                        }).map((_, index) => (
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
                                        className="origin-bottom-left text-display-xs font-medium text-balance text-primary will-change-transform sm:text-display-sm md:text-display-md"
                                    >
                                        {reviews[currentReviewIndex].quote}
                                    </motion.blockquote>
                                </AnimatePresence>
                            </div>
                            <AnimatePresence initial={false} mode="popLayout">
                                <motion.figcaption
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
                                    className="flex origin-bottom-left flex-col gap-1 will-change-transform"
                                >
                                    <p className="text-lg font-semibold text-primary">— {reviews[currentReviewIndex].author.name}</p>
                                    <cite className="text-md text-tertiary not-italic">{reviews[currentReviewIndex].author.title}</cite>
                                </motion.figcaption>
                            </AnimatePresence>
                        </figure>
                        <PaginationDot page={currentReviewIndex + 1} total={3} size="lg" onPageChange={(page) => setCurrentReviewIndex(page - 1)} />
                    </div>
                    <div className="relative flex h-70 w-full items-center justify-center overflow-hidden sm:h-full sm:min-h-90 lg:min-h-112 lg:w-120">
                        <img
                            alt="Mathilde Lewis"
                            src="https://www.untitledui.com/images/portraits/annie-stanley"
                            className="absolute inset-0 size-full object-cover"
                        />
                        <span className="absolute flex size-full items-center justify-center">
                            <PlayButtonIcon className="size-16" />
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};
