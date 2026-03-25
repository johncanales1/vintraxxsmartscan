"use client";

import { ArrowRight, BookClosed, FileCode01, PlayCircle, Stars02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { NavMenuItemLink } from "./base-components/nav-menu-item";
import { ImageCardHorizontal } from "./base-components/nav-menu-item-card";

const items = [
    { title: "Blog", subtitle: "The latest industry new and guides curated by our expert team.", href: "/", Icon: BookClosed },
    { title: "Customer stories", subtitle: "Learn how our customers are using Untitled UI to 10x their growth.", href: "/", Icon: Stars02 },
    { title: "Video tutorials", subtitle: "Get up and running on our newest features and in-depth guides.", href: "/", Icon: PlayCircle },
    { title: "Documentation", subtitle: "In-depth articles on our tools and technologies to empower teams.", href: "/", Icon: FileCode01 },
];

const articles = [
    {
        title: "Auto Layout explained",
        subtitle: "Jump right in—get an overview of the basics and fundamentals of auto-layout so you can start right away.",
        imgSrc: "https://www.untitledui.com/marketing/auto-layout.webp",
    },

    {
        title: "Top techniques to level up your product design",
        subtitle:
            "The latest best practices and tips from the best in the industry. Learn how to level up your product design skills with our best practices guide.",
        imgSrc: "https://www.untitledui.com/marketing/conversation.webp",
    },
    {
        title: "Sythesize data like a pro through affinity diagramming",
        subtitle: "Synthesis is the mysterious rabbit hole that all data scientists have to learn eventually. What makes affinity diagramming so valuable?",
        imgSrc: "https://www.untitledui.com/marketing/sythesize.webp",
    },
];

export const DropdownMenuFeaturedPosts = () => {
    return (
        <div className="px-3 pb-2 md:max-w-192 md:p-0">
            <nav className="md:w-max-full flex flex-col overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary_alt md:flex-row md:rounded-2xl md:shadow-lg">
                <div className="flex flex-1 flex-col pt-4 pb-5 md:p-5">
                    <h3 className="mb-2 px-4 text-sm font-semibold text-brand-tertiary md:px-0">Company</h3>
                    <ul className="flex flex-col gap-0.5">
                        {items.map(({ title, subtitle, href, Icon }) => (
                            <li key={title}>
                                <NavMenuItemLink icon={Icon} title={title} subtitle={subtitle} href={href} />
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="shrink-0 bg-secondary py-5 leading-none md:max-w-112 md:p-5 md:pb-6">
                    <h3 className="mb-2 px-4 text-sm font-semibold text-brand-tertiary md:px-0">Latest blog posts</h3>

                    <ul className="flex flex-col gap-1 md:gap-0.5">
                        {articles.map((article) => (
                            <li key={article.title}>
                                <ImageCardHorizontal imgSrc={article.imgSrc} title={article.title} subtitle={article.subtitle} />
                            </li>
                        ))}
                    </ul>

                    <div className="mt-3 px-4 md:mt-4 md:px-0">
                        <Button color="link-color" size="md" href="#" iconTrailing={ArrowRight}>
                            All blog posts
                        </Button>
                    </div>
                </div>
            </nav>
        </div>
    );
};
