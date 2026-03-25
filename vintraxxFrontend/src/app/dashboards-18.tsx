"use client";

import { FilterLines, SearchLg } from "@untitledui/icons";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis } from "recharts";
import { NavItemButton } from "@/components/application/app-navigation/base-components/nav-item-button";
import { HeaderNavigationBase } from "@/components/application/app-navigation/header-navigation";
import { ChartLegendContent, ChartTooltipContent } from "@/components/application/charts/charts-base";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { MetricsChart01 } from "@/components/application/metrics/metrics";
import { TableRowActionsDropdown } from "@/components/application/table/table";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cx } from "@/utils/cx";

const pins = [
    {
        location: "Seattle, USA",
        address: "911 E Pike Street, Capitol Hill, Seattle, WA 98122",
        flag: "https://www.untitledui.com/images/flags/US.svg",
        position: {
            x: 130,
            y: 157,
        },
    },
    {
        location: "San Francisco, USA",
        address: "2201 Valencia Street, Mission District, San Francisco, CA 94110",
        flag: "https://www.untitledui.com/images/flags/US.svg",
        position: {
            x: 158,
            y: 204,
        },
    },
    {
        location: "London, GB",
        address: "85 Redchurch Street, Shoreditch, London E2 7DJ",
        flag: "https://www.untitledui.com/images/flags/GB.svg",
        position: {
            x: 521,
            y: 97,
        },
    },
    {
        location: "Berlin, DE",
        address: "17 Weserstraße, Neukölln, 12045 Berlin",
        flag: "https://www.untitledui.com/images/flags/DE.svg",
        position: {
            x: 581,
            y: 73,
        },
    },
    {
        location: "Rome, IT",
        address: "12 Via del Pigneto, Pigneto, 00176 Roma RM",
        flag: "https://www.untitledui.com/images/flags/IT.svg",
        position: {
            x: 513,
            y: 176,
        },
    },
    {
        location: "Mumbai, IN",
        address: "21 Pali Hill Road, Bandra West, Mumbai, Maharashtra 400050",
        flag: "https://www.untitledui.com/images/flags/IN.svg",
        position: {
            x: 678,
            y: 224,
        },
    },
    {
        location: "Tokyo, JP",
        address: "3-15-7 Jingumae, Shibuya-ku, Tokyo 150-0001",
        flag: "https://www.untitledui.com/images/flags/JP.svg",
        position: {
            x: 843,
            y: 199,
        },
    },
    {
        location: "Melbourne, AUS",
        address: "100 Smith Street Collingwood VIC 3066 AU",
        flag: "https://www.untitledui.com/images/flags/AU.svg",
        position: {
            x: 885,
            y: 406,
        },
    },
    {
        location: "Auckland, NZ",
        address: "42 Ponsonby Road, Ponsonby, Auckland 1011",
        flag: "https://www.untitledui.com/images/flags/NZ.svg",
        position: {
            x: 958,
            y: 424,
        },
    },
];

const barData = [
    {
        date: "2025-01-01",
        A: 300,
        B: 200,
        C: 350,
    },
    {
        date: "2025-02-01",
        A: 320,
        B: 300,
        C: 300,
    },
    {
        date: "2025-03-01",
        A: 300,
        B: 200,
        C: 240,
    },
    {
        date: "2025-04-01",
        A: 240,
        B: 300,
        C: 280,
    },
    {
        date: "2025-05-01",
        A: 320,
        B: 280,
        C: 100,
    },
    {
        date: "2025-06-01",
        A: 330,
        B: 300,
        C: 130,
    },
    {
        date: "2025-07-01",
        A: 300,
        B: 200,
        C: 100,
    },
    {
        date: "2025-08-01",
        A: 350,
        B: 300,
        C: 200,
    },
    {
        date: "2025-09-01",
        A: 300,
        B: 200,
        C: 100,
    },
    {
        date: "2025-10-01",
        A: 200,
        B: 300,
        C: 280,
    },
    {
        date: "2025-11-01",
        A: 240,
        B: 300,
        C: 300,
    },
    {
        date: "2025-12-01",
        A: 200,
        B: 400,
        C: 350,
    },
];

const pieChartData = [
    {
        name: "Organic",
        value: 200,
        className: "text-utility-brand-600",
    },
    {
        name: "Direct",
        value: 350,
        className: "text-utility-brand-500",
    },
    {
        name: "Referral",
        value: 100,
        className: "text-utility-brand-400",
    },
    {
        name: "Social",
        value: 120,
        className: "text-utility-brand-300",
    },
    {
        name: "Other",
        value: 230,
        className: "text-utility-gray-200",
    },
];

export const Dashboard18 = () => {
    const isDesktop = useBreakpoint("lg");

    return (
        <div className="bg-primary">
            <HeaderNavigationBase
                items={[
                    { label: "Home", href: "/" },
                    { label: "Dashboard", href: "/dashboard", current: true },
                    { label: "Projects", href: "/projects" },
                    { label: "Tasks", href: "/tasks" },
                    { label: "Reporting", href: "/reporting" },
                    { label: "Users", href: "/users" },
                ]}
                trailingContent={<NavItemButton size="md" icon={SearchLg} label="Search" href="#" className="-mr-3" tooltipPlacement="bottom" />}
            />

            <main className="mx-auto flex max-w-container gap-16 bg-secondary_subtle px-4 pt-8 pb-12 lg:px-8 lg:pt-12 lg:pb-24">
                <div className="max-lg:hidden">
                    <Tabs selectedKey="overview" orientation="vertical">
                        <TabList
                            type="button-gray"
                            items={[
                                { id: "overview", label: "Overview" },
                                { id: "reports", label: "Reports" },
                                { id: "saved-reports", label: "Saved reports" },
                                { id: "settings", label: "Settings" },
                            ]}
                        />
                    </Tabs>
                </div>
                <div className="flex w-full flex-col gap-8 lg:gap-6">
                    {/* Page header */}
                    <div className="flex w-full flex-col gap-5 lg:gap-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row">
                            <div className="flex flex-col gap-0.5 lg:gap-1">
                                <p className="text-xl font-semibold text-primary lg:text-display-xs">Welcome back, Olivia</p>
                                <p className="text-md text-tertiary">Measure your advertising ROI and track and report website traffic.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button size="md" color="secondary">
                                    Export
                                </Button>
                                <Button size="md">Insights</Button>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-5">
                            <div className="flex gap-3">
                                <ButtonGroup defaultSelectedKeys={["30-days"]}>
                                    <ButtonGroupItem id="12-months">
                                        <span className="max-lg:hidden">12 months</span>
                                        <span className="lg:hidden">12m</span>
                                    </ButtonGroupItem>
                                    <ButtonGroupItem id="30-days">
                                        <span className="max-lg:hidden">30 days</span>
                                        <span className="lg:hidden">30d</span>
                                    </ButtonGroupItem>
                                    <ButtonGroupItem id="7-days">
                                        <span className="max-lg:hidden">7 days</span>
                                        <span className="lg:hidden">7d</span>
                                    </ButtonGroupItem>
                                    <ButtonGroupItem id="24-hours">
                                        <span className="max-lg:hidden">24 hours</span>
                                        <span className="lg:hidden">24h</span>
                                    </ButtonGroupItem>
                                </ButtonGroup>
                                <Button size="md" color="secondary" iconLeading={FilterLines} className="lg:hidden" />
                            </div>

                            <div className="hidden gap-3 lg:flex">
                                <DateRangePicker />
                                <Button size="md" color="secondary" iconLeading={FilterLines}>
                                    Filters
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-5 md:flex-row md:flex-wrap lg:gap-6">
                        <MetricsChart01
                            title="20.8k"
                            subtitle="Users"
                            className="flex-1 md:min-w-[320px]"
                            change="12%"
                            actions={false}
                            changeDescription={isDesktop ? "vs last mth" : "vs last month"}
                            chartData={[
                                { value: 10 },
                                { value: 15 },
                                { value: 12 },
                                { value: 20 },
                                { value: 18 },
                                { value: 25 },
                                { value: 30 },
                                { value: 28 },
                                { value: 32 },
                                { value: 35 },
                                { value: 40 },
                                { value: 32 },
                                { value: 40 },
                                { value: 50 },
                                { value: 55 },
                            ]}
                        />
                        <MetricsChart01
                            title="26.4k"
                            subtitle="Sessions"
                            className="flex-1 md:min-w-[320px]"
                            trend="negative"
                            change="2%"
                            actions={false}
                            changeDescription={isDesktop ? "vs last mth" : "vs last month"}
                            chartData={[
                                { value: 55 },
                                { value: 50 },
                                { value: 40 },
                                { value: 32 },
                                { value: 40 },
                                { value: 35 },
                                { value: 32 },
                                { value: 28 },
                                { value: 30 },
                                { value: 25 },
                                { value: 18 },
                                { value: 20 },
                                { value: 12 },
                                { value: 15 },
                                { value: 10 },
                            ]}
                        />
                        <MetricsChart01
                            title="3m 52s"
                            subtitle="Session duration"
                            className="flex-1 md:min-w-[320px]"
                            change="2%"
                            actions={false}
                            changeDescription={isDesktop ? "vs last mth" : "vs last month"}
                            chartData={[
                                { value: 10 },
                                { value: 15 },
                                { value: 12 },
                                { value: 20 },
                                { value: 18 },
                                { value: 25 },
                                { value: 30 },
                                { value: 28 },
                                { value: 32 },
                                { value: 35 },
                                { value: 40 },
                                { value: 32 },
                                { value: 40 },
                                { value: 50 },
                                { value: 55 },
                            ]}
                        />
                    </div>

                    <div className="w-full">
                        <div className="flex flex-col gap-5 rounded-xl bg-primary px-4 py-5 shadow-xs ring-1 ring-secondary ring-inset lg:p-6">
                            <div className="flex items-center justify-between border-b border-secondary pb-5">
                                <p className="text-lg font-semibold text-primary">Active users right now</p>
                                <Button size="md" color="secondary" className="hidden lg:inline-flex">
                                    Real-time report
                                </Button>
                                <div className="lg:hidden">
                                    <TableRowActionsDropdown />
                                </div>
                            </div>
                            <div className="flex flex-col-reverse gap-16 xl:flex-row">
                                <div className="hidden flex-1 lg:flex">
                                    <svg
                                        className="mx-auto hidden w-full max-w-5xl overflow-visible lg:block"
                                        height="344"
                                        viewBox="0 0 1025 483"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <image
                                            width="100%"
                                            x="0"
                                            y="0"
                                            href="https://www.untitledui.com/marketing/world-map-light-mode.svg"
                                            className="dark:hidden"
                                        />
                                        <image
                                            width="100%"
                                            x="0"
                                            y="0"
                                            href="https://www.untitledui.com/marketing/world-map-dark-mode.svg"
                                            className="not-dark:hidden"
                                        />

                                        <foreignObject width="100%" height="100%" x="0" y="0" className="overflow-visible">
                                            {pins.map((pin, index) => (
                                                <div key={pin.location} className="fixed" style={{ left: pin.position.x, top: pin.position.y }}>
                                                    <div className="group relative">
                                                        <div
                                                            className={cx(
                                                                "pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 -translate-y-[calc(100%-4px)] scale-125 opacity-0 transition duration-150 ease-in will-change-transform",
                                                                "group-hover:pointer-events-auto group-hover:-translate-y-full group-hover:scale-130 group-hover:opacity-100 group-hover:ease-out",
                                                                "group-focus-within:pointer-events-auto group-focus-within:-translate-y-full group-focus-within:scale-130 group-focus-within:opacity-100 group-focus-within:ease-out",
                                                            )}
                                                        >
                                                            <div
                                                                id={`vector-map-pin-${index}`}
                                                                className="relative flex w-max max-w-45 flex-col items-center rounded-lg bg-primary px-4 py-3 text-center shadow-lg ring-1 ring-secondary_alt"
                                                            >
                                                                <img
                                                                    aria-hidden="true"
                                                                    src={pin.flag}
                                                                    className="size-5 max-w-none rounded-full"
                                                                    alt="Country flag"
                                                                />
                                                                <p className="mt-2 text-xs font-semibold text-primary">{pin.location}</p>
                                                                <p className="mt-1 text-xs text-tertiary">{pin.address}</p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            aria-label={`View ${pin.location}`}
                                                            aria-describedby={`vector-map-pin-${index}`}
                                                            className="flex size-10 cursor-pointer items-center justify-center overflow-visible outline-hidden"
                                                        >
                                                            <span className="absolute size-10 rounded-full bg-fg-brand-secondary/10 transition duration-150 ease-linear group-focus-within:scale-[1.15] group-hover:scale-[1.15]" />
                                                            <span className="absolute size-6 rounded-full bg-fg-brand-secondary/20 transition duration-150 ease-linear group-focus-within:scale-[1.15] group-hover:scale-[1.15]" />
                                                            <span className="absolute size-2 rounded-full bg-fg-brand-secondary" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </foreignObject>
                                    </svg>
                                </div>
                                <div className="flex w-full flex-col gap-5 xl:w-50">
                                    <p className="text-display-md font-semibold text-primary">10.8k</p>
                                    <div className="flex flex-col gap-3">
                                        {[
                                            { name: "United States", flag: "https://www.untitledui.com/images/flags/US.svg", progress: 50 },
                                            { name: "India", flag: "https://www.untitledui.com/images/flags/IN.svg", progress: 30 },
                                            { name: "United Kingdom", flag: "https://www.untitledui.com/images/flags/GB.svg", progress: 20 },
                                            { name: "Australia", flag: "https://www.untitledui.com/images/flags/AU.svg", progress: 10 },
                                            { name: "Canada", flag: "https://www.untitledui.com/images/flags/CA.svg", progress: 10 },
                                        ].map((item) => (
                                            <div key={item.name} className="flex gap-4">
                                                <img src={item.flag} alt={item.name} className="size-6" />
                                                <div className="flex flex-1 flex-col gap-0.5">
                                                    <p className="text-sm font-medium text-secondary">{item.name}</p>
                                                    <ProgressBar labelPosition="right" value={item.progress} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="flex flex-col gap-5 rounded-xl bg-primary px-4 py-5 shadow-xs ring-1 ring-secondary ring-inset lg:p-6">
                            <div className="flex items-center justify-between border-b border-secondary pb-5">
                                <p className="text-lg font-semibold text-primary">How do you acquire users?</p>
                                <Button size="md" color="secondary" className="hidden lg:inline-flex">
                                    Location report
                                </Button>
                                <div className="lg:hidden">
                                    <TableRowActionsDropdown />
                                </div>
                            </div>

                            <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
                                <ResponsiveContainer className="h-50! lg:h-60!">
                                    <BarChart
                                        data={barData}
                                        margin={{
                                            left: 8,
                                            right: 8,
                                        }}
                                        className="text-tertiary [&_.recharts-text]:text-xs"
                                    >
                                        <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />

                                        <XAxis
                                            fill="currentColor"
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={10}
                                            interval="preserveStartEnd"
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short" })}
                                        />

                                        <RechartsTooltip
                                            content={<ChartTooltipContent />}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                                            cursor={{
                                                className: "fill-utility-gray-200/20",
                                            }}
                                        />

                                        <Bar
                                            isAnimationActive={false}
                                            className="text-utility-brand-700"
                                            dataKey="A"
                                            name="Organic"
                                            type="monotone"
                                            stackId="a"
                                            fill="currentColor"
                                            maxBarSize={isDesktop ? 32 : 16}
                                        />
                                        <Bar
                                            isAnimationActive={false}
                                            className="text-utility-brand-500"
                                            dataKey="B"
                                            name="Direct"
                                            type="monotone"
                                            stackId="a"
                                            fill="currentColor"
                                            maxBarSize={isDesktop ? 32 : 16}
                                        />
                                        <Bar
                                            isAnimationActive={false}
                                            className="text-utility-gray-200"
                                            dataKey="C"
                                            name="Other"
                                            type="monotone"
                                            stackId="a"
                                            fill="currentColor"
                                            maxBarSize={isDesktop ? 32 : 16}
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>

                                <div className="h-px w-full bg-border-secondary lg:hidden"></div>

                                <div className="h-50 w-full max-w-71">
                                    <ResponsiveContainer>
                                        <PieChart
                                            margin={{
                                                left: 0,
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            <Legend itemSorter="dataKey" verticalAlign="top" align="right" layout="vertical" content={<ChartLegendContent />} />
                                            <RechartsTooltip content={<ChartTooltipContent isPieChart />} />

                                            <Pie
                                                isAnimationActive={false}
                                                startAngle={-270}
                                                endAngle={-630}
                                                stroke="none"
                                                data={pieChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                fill="currentColor"
                                                innerRadius={75}
                                                outerRadius={99}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
