import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ExplorerLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded bg-muted" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </div>

      {/* Map Placeholder Skeleton */}
      <Card className="mb-8 flex h-64 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </Card>

      {/* Main Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Skeleton */}
        <Card className="h-fit p-4">
          <div className="mb-4 h-6 w-20 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </Card>

        {/* Table Skeleton */}
        <Card className="overflow-hidden">
          <div className="p-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
