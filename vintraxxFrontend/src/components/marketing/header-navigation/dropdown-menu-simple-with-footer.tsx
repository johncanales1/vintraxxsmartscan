"use client";

import { Bank, Car01, Scan, VideoRecorder, BarChart03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { NavMenuItemLink } from "./base-components/nav-menu-item";

const items = [
    {
        title: "VinTraxx Capital",
        subtitle: "Short-term consumer financing that helps your customers pay for accessories, repairs, and more.",
        href: "/products/capital",
        Icon: Bank,
    },
    {
        title: "SmartScan",
        subtitle: "Advanced OBD diagnostics and AI-powered vehicle appraisals.",
        href: "/products/smartscan",
        Icon: Scan,
    },
    {
        title: "VinLane IMS",
        subtitle: "Intelligent inventory management with real-time tracking and analytics.",
        href: "/products/vinlane",
        Icon: Car01,
    },
    {
        title: "VinClips",
        subtitle: "Daily automated video marketing for TikTok, Facebook, and Instagram.",
        href: "/products/vinclips",
        Icon: VideoRecorder,
    },
    {
        title: "Acquisition.io",
        subtitle: "AI-powered vehicle consignment and sourcing platform.",
        href: "/products/acquisition",
        Icon: BarChart03,
    },
];

export const DropdownMenuSimpleWithFooter = () => {
    return (
        <div className="px-3 pb-2 md:max-w-84 md:p-0">
            <nav className="overflow-hidden rounded-xl bg-secondary shadow-xs ring-1 ring-secondary_alt md:rounded-2xl md:shadow-lg">
                <ul className="flex flex-col gap-0.5 rounded-xl bg-primary py-2 ring-1 ring-secondary md:rounded-t-2xl md:p-2">
                    {items.map(({ title, subtitle, href, Icon }) => (
                        <li key={title}>
                            <NavMenuItemLink icon={Icon} title={title} subtitle={subtitle} href={href} />
                        </li>
                    ))}
                </ul>
                <div className="px-4 py-5 text-center sm:px-5">
                    <Button href="/products" color="link-color" size="lg">
                        View all products
                    </Button>
                </div>
            </nav>
        </div>
    );
};
