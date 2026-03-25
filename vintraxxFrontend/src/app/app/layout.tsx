"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Zap } from "@untitledui/icons";
import { HeaderNavigationBase } from "@/components/application/app-navigation/header-navigation";
import { Button } from "@/components/base/buttons/button";

const productItems = [
    { label: "VinLane IMS", href: "/app/products/vinlane" },
    { label: "SmartScan", href: "/app/products/smartscan" },
    { label: "VinTraxx Recon", href: "/app/products/recon" },
    { label: "VinClips", href: "/app/products/vinclips" },
    { label: "Acquisition.io", href: "/app/products/acquisition" },
    { label: "Auto Mall", href: "/app/products/automall" },
    { label: "Websites", href: "/app/products/websites" },
    { label: "CRM", href: "/app/products/crm" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isProductPage = pathname.startsWith("/app/products");

    return (
        <div className="bg-primary">
            <HeaderNavigationBase
                logoHref="/app"
                activeUrl={pathname}
                items={[
                    { label: "Home", href: "/app", current: pathname === "/app" },
                    {
                        label: "Products",
                        href: "/app/products",
                        current: isProductPage,
                        items: productItems.map((item) => ({
                            ...item,
                            current: pathname === item.href,
                        })),
                    },
                    { label: "Tasks", href: "/app/tasks", current: pathname.startsWith("/app/tasks") },
                    { label: "Users", href: "/app/users", current: pathname.startsWith("/app/users") },
                ]}
                trailingContent={
                    <Button iconLeading={Zap} color="secondary" size="sm">
                        Upgrade now
                    </Button>
                }
            />

            <main className="bg-primary pt-24 pb-12 lg:pt-46 lg:pb-24">
                {children}
            </main>
        </div>
    );
}
