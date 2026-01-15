"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Zap,
  TrendingUp,
  Map,
  MessageSquare,
  Sun,
  Wind,
  Battery,
  Flame,
  BarChart3,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const stats = [
  { label: "Total Projects", value: "36,441", icon: Zap },
  { label: "Active Capacity", value: "2,290 GW", icon: TrendingUp },
  { label: "ISO Regions", value: "9", icon: Map },
  { label: "States Covered", value: "50", icon: Map },
];

const fuelTypes = [
  { name: "Solar", icon: Sun, color: "bg-amber-500", capacity: "1,400 GW" },
  { name: "Wind", icon: Wind, color: "bg-teal-500", capacity: "450 GW" },
  { name: "Storage", icon: Battery, color: "bg-purple-500", capacity: "680 GW" },
  { name: "Gas", icon: Flame, color: "bg-gray-500", capacity: "120 GW" },
];

const features = [
  {
    title: "Interactive Heat Map",
    description:
      "Visualize queue capacity across all US regions with our dynamic heat map. Filter by fuel type, status, and more.",
    icon: Map,
  },
  {
    title: "Real-time Analytics",
    description:
      "Track queue trends, completion rates, and regional comparisons with comprehensive charts and dashboards.",
    icon: TrendingUp,
  },
  {
    title: "AI-Powered Insights",
    description:
      'Ask questions in natural language. "Show me all solar projects over 100 MW in Texas" and get instant results.',
    icon: MessageSquare,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge variant="secondary" className="mb-4">
              Powered by LBNL Queued Up Data
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              The US Grid&apos;s{" "}
              <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                Interconnection Queue
              </span>
              , Visualized
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Explore 36,000+ projects and 2,290 GW of capacity seeking grid
              connection. Built for developers, investors, consultants, and
              policy analysts.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/explorer">
                  Explore the Queue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/agent">Try AI Agent</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Explorer Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Explore the Data Your Way</h2>
            <p className="text-muted-foreground">
              Interactive tools to analyze the interconnection queue
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="group p-6 transition-all hover:shadow-lg hover:border-blue-500/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Map className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
              <p className="text-muted-foreground text-sm">
                Visualize queue capacity across all 9 ISO regions with county-level detail
              </p>
            </Card>
            <Card className="group p-6 transition-all hover:shadow-lg hover:border-teal-500/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics Charts</h3>
              <p className="text-muted-foreground text-sm">
                Track trends, compare regions, and analyze withdrawal patterns over time
              </p>
            </Card>
            <Card className="group p-6 transition-all hover:shadow-lg hover:border-purple-500/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Table2 className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Data Explorer</h3>
              <p className="text-muted-foreground text-sm">
                Filter, sort, and browse all 36,000+ projects with advanced search
              </p>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" asChild>
              <Link href="/explorer">
                Open Explorer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Fuel Types Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Queue by Technology</h2>
            <p className="text-muted-foreground">
              Breakdown of active capacity by fuel type
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {fuelTypes.map((fuel, index) => (
              <motion.div
                key={fuel.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-6 transition-shadow hover:shadow-lg">
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${fuel.color}`}
                  >
                    <fuel.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{fuel.name}</h3>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {fuel.capacity}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Everything You Need to Analyze the Queue
            </h2>
            <p className="text-muted-foreground">
              Powerful tools for energy professionals
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className="h-full p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <feature.icon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Explore?</h2>
          <p className="mb-8 text-lg text-white/80">
            Start analyzing the US interconnection queue today
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/explorer">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
