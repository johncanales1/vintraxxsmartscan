/**
 * /VinTraxxSmartScanDashboard/appraisals — dedicated Appraisals page.
 *
 * Renders the shared <DealerDashboardContent /> in `mode="appraisals"` so it
 * shows the appraisal summary (totals + activity line chart) AND the detailed
 * appraisal search + table. OBD scan analytics and the schedule list are
 * hidden in this mode.
 */

"use client";

import { DealerDashboardContent } from "../_components/DealerDashboardContent";

export default function AppraisalsPage() {
    return <DealerDashboardContent mode="appraisals" />;
}
