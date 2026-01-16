import { ComingSoon } from "@/components/coming-soon";
import { FileText } from "lucide-react";

export default function MethodologyPage() {
  return (
    <ComingSoon
      title="Methodology"
      description="Detailed documentation of our data processing and analysis methods"
      icon={FileText}
      features={[
        "Data sourcing from LBNL Queued Up dataset",
        "ISO-specific column mappings and standardization",
        "Fuel type classification methodology",
        "Geographic matching and FIPS code assignment",
        "Data refresh frequency and update process",
      ]}
    />
  );
}
