"use client";

import { Headphones01, Settings02, Users01, MessageChatCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { NavMenuItemLink } from "./base-components/nav-menu-item";
import { FeatureCardVertical } from "./base-components/nav-menu-item-card";
import serviceImage from "@/assets/images/writings/image1.png";

const items = [
    { title: "Implementation", subtitle: "Expert onboarding and setup to get your dealership running smoothly.", href: "/services/implementation", Icon: Settings02 },
    { title: "Training", subtitle: "Comprehensive training for your team on all VinTraxx products.", href: "/services/training", Icon: Users01 },
    { title: "Support", subtitle: "24/7 dedicated support from our expert team.", href: "/services/support", Icon: Headphones01 },
    { title: "Consulting", subtitle: "Strategic guidance to maximize your dealership's performance.", href: "/services/consulting", Icon: MessageChatCircle },
];

export const DropdownMenuFeatureCard = () => {
    return (
        <div className="px-3 pb-2 md:max-w-160 md:p-0">
            <nav className="flex flex-col overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary_alt md:w-max md:flex-row md:rounded-2xl md:shadow-lg">
                <ul className="flex flex-1 flex-col gap-0.5 pt-2 pb-3 md:p-2">
                    {items.map(({ title, subtitle, href, Icon }) => (
                        <li key={title + href}>
                            <NavMenuItemLink icon={Icon} title={title} subtitle={subtitle} href={href} />
                        </li>
                    ))}
                </ul>
                <div className="bg-secondary px-1 pt-2 pb-3 md:max-w-76 md:px-2">
                    <FeatureCardVertical
                        href="/services"
                        imgSrc={serviceImage.src}
                        title="Meet us at NADA 2026!"
                        description="Visit booth #7061N to see VinTraxx products in action."
                        actionsContent={
                            <div className="inline-flex gap-3">
                                <Button color="link-color" size="sm">
                                    Schedule Meeting
                                </Button>
                            </div>
                        }
                    />
                </div>
            </nav>
        </div>
    );
};
