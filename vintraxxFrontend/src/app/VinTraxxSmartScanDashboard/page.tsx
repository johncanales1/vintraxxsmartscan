/**
 * /VinTraxxSmartScanDashboard — Smart Scan Overview (default dealer landing).
 * Renders the shared <DealerDashboardContent/> in overview mode (GPS Fleet KPI
 * strip + OBD Scan Analytics + Vehicle Appraisals + Service Appointments).
 */

"use client";

import { DealerDashboardContent } from "./_components/DealerDashboardContent";

export default function DealerPortalPage() {
    return <DealerDashboardContent mode="overview" />;
}
