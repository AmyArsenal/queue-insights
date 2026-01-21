"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Zap,
  Users,
  Github,
  Linkedin,
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
    title: "Cluster Results",
    description: "Complete interconnection cluster study data from major US ISOs",
  },
  {
    icon: Zap,
    title: "Cost Allocations",
    description: "Detailed cost breakdowns, $/kW metrics, and upgrade allocations",
  },
  {
    icon: Map,
    title: "Multi-ISO Coverage",
    description: "PJM, MISO, NYISO, ISO-NE, SPP and more ISOs coming soon",
  },
  {
    icon: BarChart3,
    title: "Risk Analytics",
    description: "Risk scoring, peer benchmarking, and withdrawal analysis",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="stars-container absolute inset-0" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
              About GridAgent
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl text-white">
              Making Grid Data{" "}
              <span className="text-[#4FFFB0]">
                Accessible
              </span>
            </h1>
            <p className="text-lg text-white/60 md:text-xl">
              GridAgent transforms complex interconnection cluster data into
              actionable insights for energy professionals, developers, and
              investors.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 relative">
        <div className="stars-container absolute inset-0 opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold text-white">Our Mission</h2>
            <div className="space-y-4 text-white/60">
              <p>
                The US electricity grid is undergoing a massive transformation.
                Thousands of generation projects are navigating complex interconnection
                processes, with critical decisions hinging on cluster study results,
                cost allocations, and upgrade dependencies.
              </p>
              <p>
                GridAgent brings all this data together with AI-powered analysis.
                Whether you&apos;re evaluating project risk, benchmarking costs
                against peers, or understanding upgrade dependencies, we help you
                make faster, better-informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Features */}
      <section className="py-16 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            What We Cover
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dataFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full p-6 bg-zinc-900 border-white/10 hover:border-white/20 transition-colors">
                  <feature.icon className="mb-4 h-8 w-8 text-[#4FFFB0]" />
                  <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/50">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built By Section */}
      <section className="py-16 relative">
        <div className="stars-container absolute inset-0 opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold text-white">Built By Experts</h2>
            <Card className="p-6 bg-zinc-900 border-white/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#4FFFB0]/10">
                  <Users className="h-6 w-6 text-[#4FFFB0]" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    10+ Years of Experience
                  </h3>
                  <p className="text-white/60">
                    GridAgent is built by consultants with over a decade of hands-on
                    experience in generation interconnection studies. We&apos;ve lived
                    through the pain of manual analysis—scouring PDFs, cross-referencing
                    spreadsheets, and piecing together insights from scattered data.
                    We built GridAgent to be the tool we always wished we had.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold flex items-center gap-2 text-white">
              <Code className="h-6 w-6" />
              Built With
            </h2>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <Badge
                  key={tech.name}
                  variant="secondary"
                  className="px-3 py-1 text-sm bg-white/5 text-white/70 border-white/10"
                >
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 relative">
        <div className="stars-container absolute inset-0 opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold flex items-center gap-2 text-white">
              <Users className="h-6 w-6" />
              Get in Touch
            </h2>
            <Card className="p-6 bg-zinc-900 border-white/10">
              <p className="mb-6 text-white/60">
                We&apos;re always looking to connect with energy professionals,
                developers, and anyone passionate about accelerating the clean
                energy transition.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10" asChild>
                  <a
                    href="https://github.com/AmyArsenal/queue-insights"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10" asChild>
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
      <section className="py-16 bg-zinc-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Explore?</h2>
          <p className="mb-8 text-lg text-white/60">
            See GridAgent in action with our cluster analyzer
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-white/90" asChild>
            <Link href="/cluster">Open Cluster Analyzer</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
