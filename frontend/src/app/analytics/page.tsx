"use client";

import { ComingSoon } from "@/components/coming-soon";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Advanced Analytics"
      description="Deep-dive analytics and custom dashboards for power users"
      icon={BarChart3}
      features={[
        "Custom dashboard builder with drag-and-drop widgets",
        "Export charts and data to PDF/Excel",
        "Saved views and report templates",
        "Historical trend analysis with year-over-year comparisons",
        "Regional deep-dives with substation-level detail",
      ]}
    />
  );
}
