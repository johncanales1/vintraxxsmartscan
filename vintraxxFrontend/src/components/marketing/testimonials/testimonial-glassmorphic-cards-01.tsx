"use client";

import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { Button } from "@/components/base/buttons/button";
import { StarIcon } from "@/components/foundations/rating-stars";
import { RoundButton } from "@/components/marketing/testimonials/round-button";

const reviews = [
    {
        author: "Alisa Hester",
        imageUrl: "https://www.untitledui.com/images/portraits/alisa-hester",
        cite: "PM, Hourglass",
        industry: "Web Design Agency",
    },
    {
        quote: "We've really sped up our workflow using Untitled.",
        author: "Rich Wilson",
        imageUrl: "https://www.untitledui.com/images/portraits/rich-wilson",
        cite: "COO, Command+R",
        industry: "Web Development Agency",
    },
    {
        author: "Annie Stanley",
        imageUrl: "https://www.untitledui.com/images/portraits/annie-stanley",
        cite: "Designer, Catalog",
        industry: "UX Agency",
    },
    {
        author: "Johnny Bell",
        imageUrl: "https://www.untitledui.com/images/portraits/johnny-bell",
        cite: "PM, Sisyphus ",
        industry: "Machine Learning",
    },
];

export const TestimonialGlassmorphicCards01 = () => {
    return (
        <section className="overflow-hidden bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:gap-0">
                    <div className="flex max-w-3xl flex-col gap-4 md:gap-5">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Don't just take our word for it</h2>
                        <p className="text-lg text-tertiary md:text-xl">Hear from some of our amazing customers who are building faster.</p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 self-stretch sm:flex-row sm:self-start">
                        <Button color="secondary" size="xl">
                            Our customers
                        </Button>
                        <Button size="xl">Create account</Button>
                    </div>
                </div>

                <Carousel.Root
                    className="mt-12 md:mt-16"
                    opts={{
                        align: "start",
                    }}
                >
                    <Carousel.Content overflowHidden={false} className="gap-6 pr-4 md:gap-8 md:pr-8">
                        {reviews.map((review) => (
                            <Carousel.Item key={review.author} className="h-96 max-w-72 shrink-0 cursor-grab md:h-120 md:max-w-90">
                                <img src={review.imageUrl} className="size-full object-cover" alt="Olivia Rhye" />

                                <div className="relative">
                                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/40 to-black/0 p-3 pt-16 md:p-4 md:pt-20 lg:pt-24">
                                        <div className="flex cursor-auto flex-col gap-6 rounded-xl bg-primary/30 px-4 py-6 ring-1 ring-alpha-white/30 backdrop-blur-md ring-inset md:rounded-2xl md:p-5">
                                            {review.quote && <q className="text-xl font-semibold text-balance text-white">{review.quote}</q>}

                                            <div className="flex flex-col gap-1.5 md:gap-2">
                                                <div className="flex flex-col gap-4">
                                                    <div aria-hidden="true" className="flex gap-1">
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                        <StarIcon className="text-fg-white" />
                                                    </div>

                                                    <p className="text-xl font-semibold text-white md:text-display-xs">{review.author}</p>
                                                </div>

                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-md font-semibold text-white">{review.cite}</p>
                                                    <p className="text-sm font-medium text-white">{review.industry}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Carousel.Item>
                        ))}
                    </Carousel.Content>
                    <div className="mt-8 flex gap-4 md:gap-8">
                        <Carousel.PrevTrigger asChild>
                            <RoundButton icon={ArrowLeft} />
                        </Carousel.PrevTrigger>
                        <Carousel.NextTrigger asChild>
                            <RoundButton icon={ArrowRight} />
                        </Carousel.NextTrigger>
                    </div>
                </Carousel.Root>
            </div>
        </section>
    );
};
