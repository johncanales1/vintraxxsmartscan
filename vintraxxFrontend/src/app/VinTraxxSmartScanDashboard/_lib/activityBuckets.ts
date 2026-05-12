/**
 * Shared period-bucketing helper used by the dashboard activity charts
 * (OBD scans, appraisals, schedule service, fleet alerts). Bucketing
 * boundaries are identical across charts so all series line up on the
 * same x-axis when shown side-by-side.
 */

export type ActivityPeriod = "1w" | "1m" | "3m" | "6m" | "12m";

export const PERIOD_OPTIONS: ReadonlyArray<{ value: ActivityPeriod; label: string }> = [
    { value: "1w", label: "Last Week" },
    { value: "1m", label: "Last Month" },
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "12m", label: "Last 12 Months" },
];

interface Bucket {
    label: string;
    start: Date;
    end: Date;
}

/**
 * Compute bucket boundaries for the given period. Same boundaries are
 * used by every activity chart so series with different inputs share
 * an x-axis grid.
 */
export function getBuckets(period: ActivityPeriod): Bucket[] {
    const now = new Date();
    const buckets: Bucket[] = [];
    if (period === "1w") {
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            buckets.push({ label: date.toLocaleString("en-US", { weekday: "short" }), start, end });
        }
    } else if (period === "1m") {
        for (let i = 3; i >= 0; i--) {
            const end = new Date(now);
            end.setDate(end.getDate() - i * 7);
            const start = new Date(end);
            start.setDate(start.getDate() - 7);
            buckets.push({ label: `Week ${4 - i}`, start, end });
        }
    } else {
        const monthCount = period === "3m" ? 3 : period === "6m" ? 6 : 12;
        for (let i = monthCount - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
            buckets.push({ label: date.toLocaleString("en-US", { month: "short" }), start, end });
        }
    }
    return buckets;
}

/**
 * Bucket a list of items keyed by an ISO date field into chart-friendly
 * {label, count} tuples for a given period.
 */
export function bucketByPeriod<T>(
    items: T[],
    getDate: (item: T) => string | null | undefined,
    period: ActivityPeriod,
): Array<{ label: string; count: number }> {
    const buckets = getBuckets(period);
    return buckets.map((b) => ({
        label: b.label,
        count: items.filter((it) => {
            const raw = getDate(it);
            if (!raw) return false;
            const ts = new Date(raw);
            if (Number.isNaN(ts.getTime())) return false;
            return ts >= b.start && ts <= b.end;
        }).length,
    }));
}
