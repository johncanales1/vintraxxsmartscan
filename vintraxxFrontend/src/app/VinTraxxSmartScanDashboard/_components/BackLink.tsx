"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Convenience back-link shown on detail pages (e.g. /devices/[id]). Visually
 * pairs with the GPS tab bar.
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
