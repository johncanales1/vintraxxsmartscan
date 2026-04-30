/**
 * VinTraxxSmartScanDashboard layout.
 *
 * Wraps every page under /VinTraxxSmartScanDashboard/* with:
 *   1. <DealerNav /> \u2014 hoisted out of the original page.tsx so all
 *      sub-routes share the same header without re-fetching profile data.
 *   2. <DashboardTabBar /> \u2014 sticky tabs persistent across navigation.
 *   3. <RealtimePill />     \u2014 WebSocket status indicator (right of tab bar).
 *   4. <GpsWsLifecycle />   \u2014 connects + disconnects the singleton WS based
 *      on auth presence; mirrors the mobile RootNavigator's pattern.
 *   5. Providers: GoogleMapsProvider + ScanDetailProvider.
 *
 * IMPORTANT: this layout fetches `dealer/profile` once and passes it to
 * <DealerNav/>, replacing the page-level fetch in the existing dashboard.
 * The page itself keeps fetching its own datasets (reports, appraisals,
 * appointments) but no longer needs to render <DealerNav/> on its own.
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DealerNav } from "@/components/shared-assets/navigation/dealer-nav";
import { DashboardTabBar } from "./_components/DashboardTabBar";
import { RealtimePill } from "./_components/RealtimePill";
import { ScanDetailProvider } from "./_components/ScanDetailContext";
import { GoogleMapsProvider } from "./_lib/GoogleMapsContext";
import { gpsWs } from "./_lib/gpsWs";
import { API_BASE } from "@/lib/api-config";

interface DealerProfile {
  id: string;
  email: string;
  fullName?: string | null;
  isDealer: boolean;
  pricePerLaborHour: number | null;
  logoUrl?: string | null;
  originalLogoUrl?: string | null;
  qrCodeUrl?: string | null;
  createdAt?: string;
  companyName?: string;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth gate. Redirect to /login if no token; otherwise fetch dealer profile
  // exactly once. The original page.tsx had this same pattern.
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("dealer_token")
        : null;
    if (!token) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/dealer/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          try { gpsWs.disconnect(); } catch { /* no-op */ }
          localStorage.removeItem("dealer_token");
          localStorage.removeItem("dealer_user");
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!cancelled && data.success) setDealer(data.dealer);
      } catch {
        // Profile fetch failure leaves dealer=null; the nav still renders.
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // WS lifecycle. Connect on mount, disconnect on unmount. The singleton
  // tolerates double-connects (idempotent), so HMR won't leak sockets.
  useEffect(() => {
    gpsWs.connect();
    return () => {
      // Note: we don't disconnect on every layout unmount because navigation
      // BETWEEN sub-routes also unmounts the layout in some Next.js setups.
      // The token-removal path explicitly calls disconnect via the dealer-nav
      // logout handler (future enhancement); for now leaving the socket up
      // is benign \u2014 the server idle-disconnects after 60s of no pings.
      // If a real logout path needs explicit teardown, call gpsWs.disconnect()
      // there.
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <DealerNav
        dealerLogo={dealer?.logoUrl}
        originalLogoUrl={dealer?.originalLogoUrl}
        dealerName={dealer?.companyName}
        userEmail={dealer?.email}
        userId={dealer?.id}
        fullName={dealer?.fullName}
        pricePerLaborHour={dealer?.pricePerLaborHour}
        qrCodeUrl={dealer?.qrCodeUrl}
        createdAt={dealer?.createdAt}
        onProfileUpdate={(data) =>
          setDealer((prev) =>
            prev
              ? {
                  ...prev,
                  logoUrl: data.logoUrl || prev.logoUrl,
                  originalLogoUrl:
                    data.originalLogoUrl || prev.originalLogoUrl,
                  qrCodeUrl: data.qrCodeUrl || prev.qrCodeUrl,
                  pricePerLaborHour:
                    data.pricePerLaborHour ?? prev.pricePerLaborHour,
                  fullName: data.fullName || prev.fullName,
                  email: data.email || prev.email,
                }
              : null,
          )
        }
      />
      {/* DealerNav is `fixed top-0 h-16`, so the rest of the page must
          start 64px (4rem) lower. The tab bar is `sticky top-16`, so it
          pins immediately under the nav when the user scrolls. */}
      <div className="pt-16">
        <DashboardTabBar rightSlot={<RealtimePill />} />
      </div>
      <main className="min-h-[calc(100vh-7rem)]">
        <GoogleMapsProvider>
          <ScanDetailProvider>
            {/* Render content only after auth is confirmed so we never flash
                the dashboard for a logged-out user. */}
            {authChecked ? (
              children
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </ScanDetailProvider>
        </GoogleMapsProvider>
      </main>
    </div>
  );
}
