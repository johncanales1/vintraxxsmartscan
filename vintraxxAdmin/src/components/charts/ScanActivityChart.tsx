'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ScanDetail } from '@/lib/api';

interface Props {
  scans: ScanDetail[];
}

type Period = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';

const PERIODS: { value: Period; label: string }[] = [
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
];

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '1w': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1m': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3m': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6m': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
}

function formatBucket(date: Date, period: Period): string {
  if (period === '1d') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (period === '1w') {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  if (period === '1m') {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function bucketKey(date: Date, period: Period): string {
  if (period === '1d') {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
  }
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ScanActivityChart({ scans }: Props) {
  const [period, setPeriod] = useState<Period>('1m');

  const data = useMemo(() => {
    const start = getPeriodStart(period);
    const now = new Date();
    const filtered = scans.filter(s => new Date(s.receivedAt) >= start);

    const buckets: Record<string, { date: Date; count: number }> = {};

    // Create empty buckets
    if (period === '1d') {
      for (let t = new Date(start); t <= now; t = new Date(t.getTime() + 60 * 60 * 1000)) {
        const key = bucketKey(t, period);
        if (!buckets[key]) buckets[key] = { date: new Date(t), count: 0 };
      }
    } else {
      for (let t = new Date(start); t <= now; t = new Date(t.getTime() + 24 * 60 * 60 * 1000)) {
        const key = bucketKey(t, period);
        if (!buckets[key]) buckets[key] = { date: new Date(t), count: 0 };
      }
    }

    // Fill with scan data
    filtered.forEach(s => {
      const d = new Date(s.receivedAt);
      const key = bucketKey(d, period);
      if (buckets[key]) {
        buckets[key].count++;
      } else {
        buckets[key] = { date: d, count: 1 };
      }
    });

    return Object.values(buckets)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(b => ({ label: formatBucket(b.date, period), scans: b.count }));
  }, [scans, period]);

  const totalInPeriod = data.reduce((sum, d) => sum + d.scans, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={16} />
          Scan Activity
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({totalInPeriod} scans)</span>
        </h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PERIODS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="w-full h-48 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 p-3">
        {totalInPeriod === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
            No scan activity in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31,41,55,0.95)',
                  border: '1px solid rgba(75,85,99,0.5)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F9FAFB',
                  padding: '8px 12px',
                }}
                cursor={{ fill: 'rgba(59,130,246,0.08)' }}
              />
              <Bar dataKey="scans" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
