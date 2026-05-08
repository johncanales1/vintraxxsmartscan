/**
 * /VinTraxxSmartScanDashboard/obd — OBD Scan page.
 * Reuses the shared <DealerDashboardContent /> in `mode="obd"` so it shows
 * OBD Scan Analytics, Vehicle Appraisals and Service Appointments without
 * the GPS Fleet KPI strip.
 */

"use client";

import { DealerDashboardContent } from "../_components/DealerDashboardContent";

export default function ObdScanPage() {
    return <DealerDashboardContent mode="obd" />;
}
