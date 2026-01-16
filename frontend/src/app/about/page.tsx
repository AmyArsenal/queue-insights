"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Zap,
  Users,
  Github,
  Linkedin,
  ExternalLink,
  Code,
  BarChart3,
  Map,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const techStack = [
  { name: "Next.js 16", category: "Frontend" },
  { name: "React 19", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "FastAPI", category: "Backend" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Supabase", category: "Database" },
  { name: "Recharts", category: "Visualization" },
  { name: "react-simple-maps", category: "Visualization" },
];

const dataFeatures = [
  {
    icon: Database,
    title: "36,441 Projects",
    description: "Complete interconnection queue data from all major US ISOs",
  },
  {
    icon: Zap,
    title: "2,290 GW Capacity",
    description: "Total active capacity seeking grid connection",
  },
  {
    icon: Map,
    title: "9 ISO Regions",
    description: "CAISO, ERCOT, MISO, PJM, SPP, NYISO, ISO-NE, West, Southeast",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Interactive charts and filtering across all dimensions",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-4">
              About Queue Insights
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Making Grid Data{" "}
              <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                Accessible
              </span>
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Queue Insights transforms complex interconnection queue data into
              actionable insights for energy professionals, researchers, and
              policymakers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">Our Mission</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The US electricity grid is undergoing a massive transformation.
                Over 2,000 GW of new generation—mostly solar, wind, and
                storage—is waiting in interconnection queues across the country.
                But this critical data has been scattered across different ISOs,
                in different formats, making analysis difficult.
              </p>
              <p>
                Queue Insights brings all this data together in one place,
                with powerful visualization and filtering tools. Whether
                you&apos;re a developer siting a new project, an investor
                analyzing market trends, or a researcher studying grid
                evolution, we help you find the insights you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Features */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">
            What&apos;s in the Data
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dataFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full p-6">
                  <feature.icon className="mb-4 h-8 w-8 text-blue-500" />
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Source */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold">Data Source</h2>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Database className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">
                    LBNL &quot;Queued Up&quot; Dataset
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Our data comes from Lawrence Berkeley National Laboratory&apos;s
                    comprehensive &quot;Queued Up&quot; dataset, which aggregates
                    interconnection queue data from all major US ISOs and
                    utilities.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://emp.lbl.gov/queues"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit LBNL
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold flex items-center gap-2">
              <Code className="h-6 w-6" />
              Built With
            </h2>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <Badge
                  key={tech.name}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team / Contact */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Get in Touch
            </h2>
            <Card className="p-6">
              <p className="mb-6 text-muted-foreground">
                Queue Insights is an open-source project. We welcome
                contributions, feedback, and collaboration from the energy
                community.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" asChild>
                  <a
                    href="https://github.com/AmyArsenal/queue-insights"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Explore?</h2>
          <p className="mb-8 text-lg text-white/80">
            Dive into the data and discover insights about the US grid
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/explorer">Open Explorer</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
