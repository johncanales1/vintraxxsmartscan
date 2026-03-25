"use client";

import { useMemo, useState } from "react";
import { CurrencyDollarCircle, Edit01, FilterLines, SearchLg, Trash01, SearchRefraction } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis } from "recharts";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { Table, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { InputBase } from "@/components/base/input/input";

// Helper functions for formatting
const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

// Scan Activity chart data
const scanActivityData = [
    { month: "Jan", scans: 42 },
    { month: "Feb", scans: 56 },
    { month: "Mar", scans: 48 },
    { month: "Apr", scans: 63 },
    { month: "May", scans: 71 },
    { month: "Jun", scans: 58 },
    { month: "Jul", scans: 65 },
    { month: "Aug", scans: 78 },
    { month: "Sep", scans: 82 },
    { month: "Oct", scans: 74 },
    { month: "Nov", scans: 89 },
    { month: "Dec", scans: 95 },
];

// Health Score Distribution pie chart data
const healthScoreData = [
    { name: "Excellent (90-100)", value: 35, color: "#17B26A" },
    { name: "Good (70-89)", value: 28, color: "#2E90FA" },
    { name: "Fair (50-69)", value: 22, color: "#F79009" },
    { name: "Poor (0-49)", value: 15, color: "#F04438" },
];

// Vehicle scan records
const vehicleScans = [
    {
        vin: "1HGCM82633A004352",
        scanType: "Full Inspection",
        healthScore: 94,
        issues: 0,
        date: new Date(2025, 0, 16).getTime(),
    },
    {
        vin: "2T1BURHE5JC034712",
        scanType: "Pre-Purchase",
        healthScore: 78,
        issues: 2,
        date: new Date(2025, 0, 16).getTime(),
    },
    {
        vin: "5YJSA1DN5DFP14555",
        scanType: "Trade-In Appraisal",
        healthScore: 62,
        issues: 4,
        date: new Date(2025, 0, 15).getTime(),
    },
    {
        vin: "WBAJB0C51JB084230",
        scanType: "Full Inspection",
        healthScore: 88,
        issues: 1,
        date: new Date(2025, 0, 14).getTime(),
    },
    {
        vin: "3FA6P0H77HR237041",
        scanType: "Pre-Purchase",
        healthScore: 45,
        issues: 6,
        date: new Date(2025, 0, 14).getTime(),
    },
    {
        vin: "1N4AL3AP8JC231508",
        scanType: "Trade-In Appraisal",
        healthScore: 91,
        issues: 0,
        date: new Date(2025, 0, 14).getTime(),
    },
    {
        vin: "JM1NDAL75L0400215",
        scanType: "Full Inspection",
        healthScore: 72,
        issues: 3,
        date: new Date(2025, 0, 13).getTime(),
    },
];

const getHealthScoreColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 70) return "blue";
    if (score >= 50) return "warning";
    return "error";
};

export const Dashboard04 = () => {
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>();
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    const sortedItems = useMemo(() => {
        if (!sortDescriptor) return vehicleScans;

        return vehicleScans.toSorted((a, b) => {
            const first = a[sortDescriptor.column as keyof typeof a];
            const second = b[sortDescriptor.column as keyof typeof b];

            if (typeof first === "number" && typeof second === "number") {
                return sortDescriptor.direction === "ascending" ? first - second : second - first;
            }

            if (typeof first === "string" && typeof second === "string") {
                const result = first.localeCompare(second);
                return sortDescriptor.direction === "ascending" ? result : -result;
            }

            return 0;
        });
    }, [sortDescriptor]);

    return (
        <div className="flex flex-col gap-8">
                    <div className="mx-auto flex w-full max-w-container flex-col gap-5 px-4 lg:px-8">
                        {/* Page header */}
                        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
                            <h1 className="text-xl font-semibold text-primary lg:text-display-xs">VinTraxx SmartScan</h1>
                        </div>
                    </div>

                    {/* Metric cards */}
                    <div className="-my-2 flex w-full max-w-full flex-col gap-4 overflow-x-auto px-4 py-2 md:mx-auto md:w-max md:flex-row md:flex-wrap md:items-start lg:w-full lg:max-w-container lg:gap-5 lg:px-8">
                        <MetricsIcon03
                            icon={CurrencyDollarCircle}
                            title="$124,850"
                            subtitle="Repair Costs Identified"
                            change="12.3%"
                            changeTrend="positive"
                            actions={false}
                            className="flex-1 ring-2 ring-brand max-lg:**:data-featured-icon:hidden md:min-w-[320px]"
                        />
                        <MetricsIcon03
                            icon={SearchRefraction}
                            title="821"
                            subtitle="Total Scans"
                            change="8.7%"
                            changeTrend="positive"
                            actions={false}
                            className="flex-1 max-lg:**:data-featured-icon:hidden md:min-w-[320px]"
                        />
                    </div>

                    {/* Two charts side by side */}
                    <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-4 lg:flex-row lg:px-8">
                        {/* Health Score Distribution */}
                        <div className="flex flex-1 flex-col gap-4 rounded-xl p-5 shadow-xs ring-1 ring-secondary ring-inset">
                            <p className="text-lg font-semibold text-primary">Health Score Distribution</p>
                            <div className="flex h-60 items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={healthScoreData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                            isAnimationActive={false}
                                        >
                                            {healthScoreData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            content={<ChartTooltipContent />}
                                            formatter={(value) => `${value}%`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="flex flex-wrap gap-x-4 gap-y-2">
                                {healthScoreData.map((entry) => (
                                    <li key={entry.name} className="flex items-center gap-2 text-xs text-tertiary">
                                        <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        {entry.name}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Scan Activity */}
                        <div className="flex flex-1 flex-col gap-4 rounded-xl p-5 shadow-xs ring-1 ring-secondary ring-inset">
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <p className="text-lg font-semibold text-primary">Scan Activity</p>
                                <div className="flex gap-3">
                                    <Tabs>
                                        <TabList
                                            type="button-minimal"
                                            items={[
                                                {
                                                    id: "12months",
                                                    label: (
                                                        <>
                                                            <span className="max-md:hidden">12 months</span>
                                                            <span className="md:hidden">12m</span>
                                                        </>
                                                    ),
                                                },
                                                {
                                                    id: "30days",
                                                    label: (
                                                        <>
                                                            <span className="max-md:hidden">30 days</span>
                                                            <span className="md:hidden">30d</span>
                                                        </>
                                                    ),
                                                },
                                                {
                                                    id: "7days",
                                                    label: (
                                                        <>
                                                            <span className="max-md:hidden">7 days</span>
                                                            <span className="md:hidden">7d</span>
                                                        </>
                                                    ),
                                                },
                                                {
                                                    id: "24hours",
                                                    label: (
                                                        <>
                                                            <span className="max-md:hidden">24 hours</span>
                                                            <span className="md:hidden">24h</span>
                                                        </>
                                                    ),
                                                },
                                            ]}
                                        />
                                    </Tabs>
                                    <Button size="sm" color="secondary" iconLeading={FilterLines}>
                                        Filters
                                    </Button>
                                </div>
                            </div>
                            <div className="flex h-60 flex-col gap-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={scanActivityData}
                                        className="text-tertiary [&_.recharts-text]:text-xs"
                                    >
                                        <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />
                                        <XAxis
                                            dataKey="month"
                                            fill="currentColor"
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={10}
                                        />
                                        <RechartsTooltip
                                            content={<ChartTooltipContent />}
                                            formatter={(value) => `${value} scans`}
                                        />
                                        <Bar
                                            isAnimationActive={false}
                                            className="text-utility-brand-600_alt"
                                            name="Scans"
                                            dataKey="scans"
                                            fill="currentColor"
                                            maxBarSize={24}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Scans Table */}
                    <div className="mx-auto flex w-full max-w-container flex-col gap-5 px-4 lg:px-8">
                        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                            <p className="text-lg font-semibold text-primary">Recent Vehicle Scans</p>
                            <div className="w-full lg:max-w-xs">
                                <InputBase size="sm" type="search" shortcut aria-label="Search" placeholder="Search by VIN" icon={SearchLg} />
                            </div>
                        </div>

                        <TableCard.Root className="-mx-4 mt-2 rounded-none lg:mx-0 lg:mt-0 lg:rounded-xl">
                            <Table
                                aria-label="Vehicle scans"
                                selectionMode="multiple"
                                sortDescriptor={sortDescriptor}
                                onSortChange={setSortDescriptor}
                            >
                                <Table.Header className="bg-primary">
                                    <Table.Head id="vin" label="Vehicle" isRowHeader allowsSorting className="w-full" />
                                    <Table.Head id="scanType" label="Scan Type" allowsSorting />
                                    <Table.Head id="healthScore" label="Health Score" allowsSorting />
                                    <Table.Head id="issues" label="Issues" allowsSorting />
                                    <Table.Head id="date" label="Date" allowsSorting />
                                    <Table.Head id="actions" />
                                </Table.Header>

                                <Table.Body items={sortedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage)}>
                                    {(scan) => (
                                        <Table.Row id={scan.vin}>
                                            <Table.Cell className="text-nowrap">
                                                <p className="text-sm font-medium font-mono text-primary">{scan.vin}</p>
                                            </Table.Cell>
                                            <Table.Cell className="text-nowrap">{scan.scanType}</Table.Cell>
                                            <Table.Cell>
                                                <BadgeWithDot
                                                    color={getHealthScoreColor(scan.healthScore) as "success" | "blue" | "warning" | "error"}
                                                    type="pill-color"
                                                    size="sm"
                                                >
                                                    {scan.healthScore}
                                                </BadgeWithDot>
                                            </Table.Cell>
                                            <Table.Cell className="text-nowrap">
                                                {scan.issues === 0 ? "0 found" : `${scan.issues} found`}
                                            </Table.Cell>
                                            <Table.Cell className="text-nowrap">{formatDate(scan.date)}</Table.Cell>

                                            <Table.Cell className="px-4">
                                                <div className="flex justify-end gap-0.5">
                                                    <ButtonUtility size="xs" color="tertiary" tooltip="Delete" icon={Trash01} />
                                                    <ButtonUtility size="xs" color="tertiary" tooltip="Edit" icon={Edit01} />
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    )}
                                </Table.Body>
                            </Table>
                            <PaginationCardMinimal page={page} total={Math.ceil(sortedItems.length / itemsPerPage)} align="center" onPageChange={setPage} />
                        </TableCard.Root>
                    </div>
                </div>
    );
};
