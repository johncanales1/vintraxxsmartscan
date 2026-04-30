/**
 * DashboardTabBar — sticky top tabs persistent across the dashboard. Lives
 * just under <DealerNav/>, mounted in layout.tsx so it survives navigation.
 *
 * The Appointments tab links to the Overview anchor (#appointments) so the
 * existing inline appointments UI is reused untouched. All other tabs are
 * dedicated sub-routes.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Cpu,
  CalendarDays,
  Map as MapIcon,
  RouteIcon,
  Wrench,
  ChevronLeft,
} from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

interface TabDef {
  href: string;
  label: string;
  icon: ReactNode;
  /** Optional path-prefix matcher \u2014 used so /devices/[id] still highlights the
   *  Fleet tab. */
  matchPrefix?: string;
}

const ROOT = "/VinTraxxSmartScanDashboard";

const TABS: TabDef[] = [
  {
    href: ROOT,
    label: "Overview",
    icon: <Activity className="w-4 h-4" />,
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
    // Hash-anchor reuses the existing inline appointments section on Overview.
    href: `${ROOT}#appointments`,
    label: "Appointments",
    icon: <CalendarDays className="w-4 h-4" />,
  },
];

interface Props {
  /** Right-side slot \u2014 typically the realtime pill. */
  rightSlot?: ReactNode;
}

export function DashboardTabBar({ rightSlot }: Props) {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-2 px-2 py-2">
            {TABS.map((tab) => {
              const isActive = tab.matchPrefix
                ? pathname.startsWith(tab.matchPrefix)
                : pathname === tab.href.split("#")[0];
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

/**
 * Convenience back-link shown on detail pages (e.g. /devices/[id]). Lives
 * here because it visually pairs with the tab bar.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#1B3A5F]"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}
