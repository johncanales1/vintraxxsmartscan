"use client";

import { SearchLg } from "@untitledui/icons";
import { NavItemButton } from "@/components/application/app-navigation/base-components/nav-item-button";
import { HeaderNavigationBase } from "@/components/application/app-navigation/header-navigation";
import { Calendar } from "@/components/application/calendar/calendar";
import { events } from "@/components/application/calendar/config";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Input } from "@/components/base/input/input";

const tabs = [
    { id: "all", label: "All events" },
    { id: "shared", label: "Shared" },
    { id: "public", label: "Public" },
    { id: "archived", label: "Archived" },
];

export const Informational08 = () => {
    return (
        <div className="flex flex-col bg-primary">
            <HeaderNavigationBase
                items={[
                    { label: "Home", href: "/" },
                    {
                        label: "Dashboard",
                        href: "/dashboard",
                        current: true,
                    },
                    { label: "Projects", href: "/projects" },
                    { label: "Tasks", href: "/tasks" },
                    { label: "Reporting", href: "/reporting" },
                    { label: "Users", href: "/users" },
                ]}
                trailingContent={<NavItemButton size="md" icon={SearchLg} label="Search" href="#" className="-mr-3" tooltipPlacement="bottom" />}
            />
            <main className="mx-auto flex w-full max-w-container flex-col gap-8 bg-primary pt-8 pb-12 lg:pt-12 lg:pb-24">
                <div className="flex flex-col gap-5 px-4 lg:px-8">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <h1 className="flex-1 text-xl font-semibold text-primary lg:text-display-xs">My calendar</h1>
                        <Input shortcut className="w-full md:max-w-80" size="sm" aria-label="Search" placeholder="Search" icon={SearchLg} />
                    </div>
                    <Tabs orientation="horizontal" selectedKey="all" className="-mx-4 inline-flex pl-4">
                        <TabList size="sm" type="underline" items={tabs} />
                    </Tabs>
                </div>

                <div className="lg:px-8">
                    <Calendar events={events} view="month" className="max-lg:rounded-none max-lg:shadow-none" />
                </div>
            </main>
        </div>
    );
};
