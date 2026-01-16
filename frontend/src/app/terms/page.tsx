"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-4">
              <Scale className="mr-1 h-3 w-3" />
              Legal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          </div>

          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Use of Service</h2>
              <p className="text-muted-foreground">
                Queue Insights provides interconnection queue data for
                informational purposes only. While we strive for accuracy, we
                make no guarantees about the completeness or timeliness of the
                data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Accuracy</h2>
              <p className="text-muted-foreground">
                The data displayed comes from third-party sources (primarily
                LBNL). Users should verify critical information directly with
                the relevant ISO or utility before making business decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Queue Insights is provided &quot;as is&quot; without warranty of any kind.
                We are not liable for any damages arising from the use of this
                service or reliance on the data provided.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms from time to time. Continued use of
                the service constitutes acceptance of any changes.
              </p>
            </section>

            <p className="text-sm text-muted-foreground pt-4 border-t">
              Last updated: January 2026
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
