"use client";

import { ComingSoon } from "@/components/coming-soon";
import { Code } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <ComingSoon
      title="API Access"
      description="Programmatic access to interconnection queue data"
      icon={Code}
      features={[
        "RESTful API with JSON responses",
        "Filter by region, fuel type, status, and more",
        "Pagination and sorting options",
        "Rate limiting and authentication",
        "OpenAPI/Swagger documentation",
      ]}
    />
  );
}
