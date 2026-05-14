/**
 * GpsTabBar — sticky top tabs that pin under the dealer nav on every GPS Fleet
 * route. Mounted from the shared dashboard layout when `pathname` matches a
 * GPS route. Tabs:
 *   • Overview   → /VinTraxxSmartScanDashboard/gps
 *   • Fleet      → /VinTraxxSmartScanDashboard/devices
 *   • Live Map   → /VinTraxxSmartScanDashboard/map
 *   • Alerts     → /VinTraxxSmartScanDashboard/alerts
 *   • Trips      → /VinTraxxSmartScanDashboard/trips
 *   • DTCs       → /VinTraxxSmartScanDashboard/dtcs
 *   • Reports    → /VinTraxxSmartScanDashboard/reports
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Cpu,
  FileText,
  Map as MapIcon,
  RouteIcon,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

interface TabDef {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
  exact?: boolean;
}

const ROOT = "/VinTraxxSmartScanDashboard";

const TABS: TabDef[] = [
  {
    href: `${ROOT}/gps`,
    label: "Overview",
    icon: <Activity className="w-4 h-4" />,
    exact: true,
  },
  {
    href: `${ROOT}/devices`,
    label: "Fleet",
    icon: <Cpu className="w-4 h-4" />,
    matchPrefix: `${ROOT}/devices`,
  },
  {
    href: `${ROOT}/map`,
    label: "Live Map",
    icon: <MapIcon className="w-4 h-4" />,
  },
  {
    href: `${ROOT}/alerts`,
    label: "Alerts",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    href: `${ROOT}/trips`,
    label: "Trips",
    icon: <RouteIcon className="w-4 h-4" />,
  },
  {
    href: `${ROOT}/dtcs`,
    label: "DTCs",
    icon: <Wrench className="w-4 h-4" />,
  },
  {
    href: `${ROOT}/reports`,
    label: "Reports",
    icon: <FileText className="w-4 h-4" />,
    matchPrefix: `${ROOT}/reports`,
  },
];

/** Routes where the GPS Fleet tab bar should be visible. */
export const GPS_ROUTES = [
  `${ROOT}/gps`,
  `${ROOT}/devices`,
  `${ROOT}/map`,
  `${ROOT}/alerts`,
  `${ROOT}/trips`,
  `${ROOT}/dtcs`,
  `${ROOT}/reports`,
];

export function isGpsRoute(pathname: string): boolean {
  return GPS_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}

interface Props {
  rightSlot?: ReactNode;
}

export function GpsTabBar({ rightSlot }: Props) {
  const pathname = usePathname();

  return (
    <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-2 px-2 py-2">
            {TABS.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : tab.matchPrefix
                  ? pathname.startsWith(tab.matchPrefix)
                  : pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cx(
                    "flex items-center gap-2 px-3 sm:px-4 h-9 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-[#1B3A5F] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#1B3A5F] hover:bg-slate-100",
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
          {rightSlot && (
            <div className="flex-shrink-0 pl-2 pr-1">{rightSlot}</div>
          )}
        </div>
      </div>
    </div>
  );
}
