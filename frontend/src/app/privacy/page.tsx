"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
              <Shield className="mr-1 h-3 w-3" />
              Legal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          </div>

          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Data We Collect</h2>
              <p className="text-muted-foreground">
                Queue Insights collects minimal data. We use basic analytics to
                understand how users interact with our platform. We do not sell
                or share your personal information with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Cookies</h2>
              <p className="text-muted-foreground">
                We use essential cookies to remember your preferences (like dark
                mode). We do not use tracking cookies or third-party advertising
                cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Source</h2>
              <p className="text-muted-foreground">
                All interconnection queue data displayed on this site comes from
                publicly available sources, primarily the Lawrence Berkeley
                National Laboratory &quot;Queued Up&quot; dataset.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about our privacy practices, please reach
                out via our GitHub repository.
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
