"use client";

export default function CapitalDealerPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // DealerNav is rendered by each page under /CapitalDealerPortal so we don't
    // render it here to avoid duplicate nav bars and broken profile fetches.
    return <div className="min-h-screen bg-white">{children}</div>;
}
