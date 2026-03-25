"use client";

import { useMemo, useState } from "react";
import { DownloadCloud02, FilterLines, SearchLg, Settings03 } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Label,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { Table, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useBreakpoint } from "@/hooks/use-breakpoint";

// Helper functions for formatting
const formatCurrency = (value: number): string => {
    return `$${new Intl.NumberFormat("en-US").format(value)}`;
};

// Ranking colors
const RANKING_COLORS: Record<string, string> = {
    green: "#17B26A",
    yellow: "#F79009",
    red: "#F04438",
    underRed: "#912018",
    unranked: "#98A2B3",
};

// Ranking by Age Group - stacked bar chart data
const agingChartData = [
    { age: "0-20", green: 850, yellow: 280, red: 100, underRed: 40, unranked: 41 },
    { age: "21-30", green: 200, yellow: 130, red: 80, underRed: 30, unranked: 46 },
    { age: "31-40", green: 120, yellow: 80, red: 60, underRed: 20, unranked: 27 },
    { age: "41-50", green: 90, yellow: 70, red: 65, underRed: 25, unranked: 33 },
    { age: "51-60", green: 40, yellow: 45, red: 50, underRed: 15, unranked: 20 },
    { age: "61+", green: 180, yellow: 350, red: 620, underRed: 210, unranked: 800 },
];

// Ranking Totals - bar chart data
const rankingTotalsData = [
    { ranking: "Under Red", count: 340, color: RANKING_COLORS.underRed },
    { ranking: "Yellow", count: 955, color: RANKING_COLORS.yellow },
    { ranking: "Green", count: 1480, color: RANKING_COLORS.green },
    { ranking: "Red", count: 975, color: RANKING_COLORS.red },
    { ranking: "Unranked", count: 967, color: RANKING_COLORS.unranked },
];

// Aging detail table data
const agingTableData = [
    { id: "age-0-20", age: "0-20", count: 1311, investTotal: 24296920, invPct: 19, investAvg: 21909, adjCtm: 83, markupTotal: 1333179, markupAvg: 2976, adjPctMkt: 101, mds: 60 },
    { id: "age-21-30", age: "21-30", count: 486, investTotal: 12349746, invPct: 10, investAvg: 25945, adjCtm: 89, markupTotal: 417887, markupAvg: 1833, adjPctMkt: 99, mds: 67 },
    { id: "age-31-40", age: "31-40", count: 307, investTotal: 7871712, invPct: 6, investAvg: 26327, adjCtm: 90, markupTotal: 139451, markupAvg: 1048, adjPctMkt: 99, mds: 61 },
    { id: "age-41-50", age: "41-50", count: 283, investTotal: 7390036, invPct: 6, investAvg: 26393, adjCtm: 91, markupTotal: 112729, markupAvg: 964, adjPctMkt: 98, mds: 70 },
    { id: "age-51-60", age: "51-60", count: 170, investTotal: 4893193, invPct: 4, investAvg: 29477, adjCtm: 94, markupTotal: 27331, markupAvg: 350, adjPctMkt: 97, mds: 65 },
    { id: "age-61+", age: "61+", count: 2160, investTotal: 72008933, invPct: 56, investAvg: 35933, adjCtm: 206, markupTotal: 1067956, markupAvg: 1301, adjPctMkt: 118, mds: 57 },
];

const agingTotalRow = {
    id: "age-total", age: "Total", count: 4717, investTotal: 128810540, invPct: 100, investAvg: 29721,
    adjCtm: 140, markupTotal: 3098533, markupAvg: 1698, adjPctMkt: 109, mds: 60,
};

export const Dashboard08 = () => {
    const isDesktop = useBreakpoint("lg");

    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>();

    const sortedRows = useMemo(() => {
        if (!sortDescriptor) return agingTableData;

        return agingTableData.toSorted((a, b) => {
            const column = sortDescriptor.column as keyof typeof a;
            const first = a[column];
            const second = b[column];

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
            {/* Page header */}
            <div className="mx-auto flex w-full max-w-container flex-col justify-between gap-4 px-4 lg:flex-row lg:px-8">
                <p className="text-xl font-semibold text-primary lg:text-display-xs">VinLane IMS</p>
                <div className="flex gap-3">
                    <Button size="md" color="tertiary" iconLeading={SearchLg} className="hidden lg:inline-flex" />
                    <Button size="md" color="secondary" iconLeading={FilterLines} className="hidden lg:inline-flex">
                        Filters
                    </Button>
                    <Button size="md" color="secondary" iconLeading={Settings03}>
                        Customize
                    </Button>
                    <Button size="md" color="secondary" iconLeading={DownloadCloud02}>
                        Export
                    </Button>
                </div>
            </div>

            {/* Charts Row */}
            <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-4 lg:flex-row lg:px-8">
                {/* Ranking by Age Group - Stacked Bar Chart */}
                <div className="flex flex-1 flex-col gap-1 rounded-xl px-4 py-5 shadow-xs ring-1 ring-secondary ring-inset lg:p-6">
                    <div className="flex items-start justify-between pb-5">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-md font-semibold text-primary lg:text-lg">Ranking by Age Group</p>
                            <p className="text-sm text-tertiary">Vehicle count by aging bucket and price ranking.</p>
                        </div>
                        <TableRowActionsDropdown />
                    </div>
                    <ResponsiveContainer className="min-h-70.5">
                        <BarChart
                            data={agingChartData}
                            margin={{ left: 4, right: 0, bottom: isDesktop ? 16 : 0 }}
                            className="text-tertiary [&_.recharts-text]:text-xs"
                        >
                            <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />
                            <XAxis fill="currentColor" axisLine={false} tickLine={false} tickMargin={2} dataKey="age">
                                {isDesktop && <Label value="Age (Days)" fill="currentColor" className="!text-xs font-medium" position="bottom" />}
                            </XAxis>
                            <YAxis hide={!isDesktop} fill="currentColor" axisLine={false} tickLine={false} allowDecimals={false}>
                                <Label value="Vehicles" fill="currentColor" className="!text-xs font-medium" style={{ textAnchor: "middle" }} angle={-90} position="insideLeft" />
                            </YAxis>
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ className: "fill-utility-gray-200/20" }} />
                            <Bar dataKey="green" name="Green" stackId="ranking" fill={RANKING_COLORS.green} isAnimationActive={false} maxBarSize={isDesktop ? 40 : 20} />
                            <Bar dataKey="yellow" name="Yellow" stackId="ranking" fill={RANKING_COLORS.yellow} isAnimationActive={false} maxBarSize={isDesktop ? 40 : 20} />
                            <Bar dataKey="red" name="Red" stackId="ranking" fill={RANKING_COLORS.red} isAnimationActive={false} maxBarSize={isDesktop ? 40 : 20} />
                            <Bar dataKey="underRed" name="Under Red" stackId="ranking" fill={RANKING_COLORS.underRed} isAnimationActive={false} maxBarSize={isDesktop ? 40 : 20} />
                            <Bar dataKey="unranked" name="Unranked" stackId="ranking" fill={RANKING_COLORS.unranked} isAnimationActive={false} maxBarSize={isDesktop ? 40 : 20} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                        {Object.entries(RANKING_COLORS).map(([key, color]) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-tertiary">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                                {key === "underRed" ? "Under Red" : key.charAt(0).toUpperCase() + key.slice(1)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ranking Totals - Bar Chart */}
                <div className="flex flex-col gap-1 rounded-xl px-4 py-5 shadow-xs ring-1 ring-secondary ring-inset lg:w-110 lg:p-6">
                    <div className="flex items-start justify-between pb-5">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-md font-semibold text-primary lg:text-lg">Ranking Totals</p>
                            <p className="text-sm text-tertiary">Total vehicles by price ranking.</p>
                        </div>
                        <TableRowActionsDropdown />
                    </div>
                    <ResponsiveContainer className="min-h-70.5">
                        <BarChart
                            data={rankingTotalsData}
                            margin={{ left: 4, right: 0, bottom: isDesktop ? 16 : 0 }}
                            className="text-tertiary [&_.recharts-text]:text-xs"
                        >
                            <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />
                            <XAxis fill="currentColor" axisLine={false} tickLine={false} tickMargin={2} dataKey="ranking">
                                {isDesktop && <Label value="Ranking" fill="currentColor" className="!text-xs font-medium" position="bottom" />}
                            </XAxis>
                            <YAxis hide={!isDesktop} fill="currentColor" axisLine={false} tickLine={false} allowDecimals={false}>
                                <Label value="Vehicles" fill="currentColor" className="!text-xs font-medium" style={{ textAnchor: "middle" }} angle={-90} position="insideLeft" />
                            </YAxis>
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ className: "fill-utility-gray-200/20" }} />
                            <Bar dataKey="count" name="Vehicles" isAnimationActive={false} maxBarSize={isDesktop ? 40 : 20} radius={[4, 4, 0, 0]}>
                                {rankingTotalsData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Aging Detail Table */}
            <div className="mx-auto flex w-full max-w-container flex-col gap-4 px-4 lg:gap-6 lg:px-8">
                <div className="flex justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-lg font-semibold text-primary">Inventory Aging Details</p>
                        <p className="text-sm text-tertiary">Investment, markup, and market data by age group.</p>
                    </div>
                    <Input icon={SearchLg} shortcut aria-label="Search" placeholder="Search" size="sm" className="hidden w-80 lg:inline-flex" />
                </div>
                <div className="flex flex-col gap-3 lg:hidden">
                    <Input icon={SearchLg} shortcut aria-label="Search" placeholder="Search" size="sm" />
                    <Button iconLeading={FilterLines} size="md" color="secondary">
                        Filters
                    </Button>
                </div>

                <TableCard.Root className="-mx-4 mt-2 rounded-none lg:mx-0 lg:mt-0 lg:rounded-xl">
                    <Table
                        aria-label="Inventory Aging Details"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <Table.Header className="bg-primary">
                            <Table.Head id="age" isRowHeader label="Age" />
                            <Table.Head id="count" allowsSorting label="Count" />
                            <Table.Head id="investTotal" allowsSorting label="Inv. Total" />
                            <Table.Head id="invPct" allowsSorting label="Inv %" />
                            <Table.Head id="investAvg" allowsSorting label="Inv. Avg" />
                            <Table.Head id="adjCtm" allowsSorting label="Adj. CTM" />
                            <Table.Head id="markupTotal" allowsSorting label="Mkp. Total" />
                            <Table.Head id="markupAvg" allowsSorting label="Mkp. Avg" />
                            <Table.Head id="adjPctMkt" allowsSorting label="Adj. % Mkt" />
                            <Table.Head id="mds" allowsSorting label="MDS" />
                        </Table.Header>
                        <Table.Body items={[...sortedRows, agingTotalRow]}>
                            {(row) => (
                                <Table.Row id={row.id} className={row.id === "age-total" ? "bg-secondary/50" : ""}>
                                    <Table.Cell>
                                        <span className={row.id === "age-total" ? "text-sm font-semibold text-utility-brand-600" : "text-sm font-medium text-utility-brand-600"}>
                                            {row.age}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-primary text-nowrap">{new Intl.NumberFormat("en-US").format(row.count)}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-primary text-nowrap">{formatCurrency(row.investTotal)}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-primary text-nowrap">{row.invPct}%</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-primary text-nowrap">{formatCurrency(row.investAvg)}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className={`text-sm text-nowrap ${row.adjCtm > 100 ? "font-medium text-utility-error-600" : "text-primary"}`}>
                                            {row.adjCtm}%
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-primary text-nowrap">{formatCurrency(row.markupTotal)}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-primary text-nowrap">{formatCurrency(row.markupAvg)}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className={`text-sm text-nowrap ${row.adjPctMkt > 105 ? "font-medium text-utility-error-600" : row.adjPctMkt < 98 ? "font-medium text-utility-warning-600" : "text-primary"}`}>
                                            {row.adjPctMkt}%
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-primary">{row.mds}</span>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root>
            </div>
        </div>
    );
};
