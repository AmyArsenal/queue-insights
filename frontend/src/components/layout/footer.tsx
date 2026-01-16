import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-400">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold">Queue Insights</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The best interconnection queue tracker for the US grid.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/explorer" className="hover:text-foreground">Explorer</Link></li>
              <li><Link href="/analytics" className="hover:text-foreground">Analytics</Link></li>
              <li><Link href="/agent" className="hover:text-foreground">AI Agent</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Data</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://emp.lbl.gov/queues" target="_blank" rel="noopener" className="hover:text-foreground">LBNL Queued Up</a></li>
              <li><Link href="/methodology" className="hover:text-foreground">Methodology</Link></li>
              <li><Link href="/api-docs" className="hover:text-foreground">API Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Data: Lawrence Berkeley National Laboratory &quot;Queued Up&quot; dataset
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Queue Insights. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
