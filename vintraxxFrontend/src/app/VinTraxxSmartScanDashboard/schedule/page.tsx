/**
 * /VinTraxxSmartScanDashboard/schedule — dedicated Schedule Service page.
 *
 * Renders the shared <DealerDashboardContent /> in `mode="schedule"` so it
 * shows the full Schedule Service appointments list plus the stats row + bar
 * chart. OBD scan analytics and the appraisal blocks are hidden in this mode.
 */

"use client";

import { DealerDashboardContent } from "../_components/DealerDashboardContent";

export default function SchedulePage() {
    return <DealerDashboardContent mode="schedule" />;
}
