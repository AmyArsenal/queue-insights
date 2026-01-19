"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Zap,
  Search,
  Shield,
  Lock,
  CheckCircle2,
  Sparkles,
  Database,
  FileText,
  BarChart3,
  Map,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const exampleQueries = [
  "What's the avg $/kW for solar in PJM?",
  "Which TC2 projects have highest withdrawal risk?",
  "Show me projects sharing Upgrade #4523",
  "Explain OATT Section 38.2 cost allocation",
];

const agents = [
  {
    name: "PJM Agent",
    status: "Live",
    description: "Cluster studies, OATT, queue data, cost allocations",
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "MISO Agent",
    status: "Coming Q2",
    description: "DPP/DISIS studies, BPM rules, queue analysis",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    name: "ERCOT Agent",
    status: "Coming Q3",
    description: "ERCOT protocols, queue data, screening studies",
    color: "from-amber-500 to-amber-600",
  },
  {
    name: "CAISO Agent",
    status: "Coming Q3",
    description: "CAISO cluster studies, TPD allocation, queue data",
    color: "from-blue-500 to-blue-600",
  },
];

const stats = [
  { label: "Projects Analyzed", value: "36,441" },
  { label: "ISO Regions", value: "9" },
  { label: "Active Capacity", value: "2,290 GW" },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowWaitlist(true);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowWaitlist(true);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden animated-gradient-bg">
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-overlay" />

        {/* Floating gradient orbs */}
        <div className="gradient-orb w-[500px] h-[500px] bg-blue-500/20 top-[-100px] left-[-100px]" style={{ animationDelay: "0s" }} />
        <div className="gradient-orb w-[400px] h-[400px] bg-purple-500/20 bottom-[-50px] right-[-50px]" style={{ animationDelay: "2s" }} />
        <div className="gradient-orb w-[300px] h-[300px] bg-teal-500/20 top-[40%] right-[20%]" style={{ animationDelay: "4s" }} />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* Main headline */}
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6">
              Energy is bottlenecked.
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-teal-400 bg-clip-text text-transparent">
                Intelligence is the fix.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The first AI layer for grid interconnection—queues, clusters, tariffs, cost allocations.
              Ask anything. Get answers in seconds.
            </p>

            {/* Interactive search box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <form onSubmit={handleQuerySubmit} className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ask GridAgent anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 pr-32 py-6 text-lg rounded-xl border-2 border-border/50 bg-background/80 backdrop-blur-sm focus:border-blue-500 transition-colors"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-2 rounded-lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ask
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Example queries */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2 mb-8"
            >
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-sm px-3 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" className="rounded-full px-8" onClick={() => setShowWaitlist(true)}>
                Join Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <Link href="/explorer">
                  Explore Data
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-center gap-8 mt-12 pt-8 border-t border-border/30"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Waitlist Modal */}
        {showWaitlist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWaitlist(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Get Early Access</h3>
                <p className="text-muted-foreground">
                  Be first to use GridAgent. We&apos;re launching soon.
                </p>
              </div>

              {query && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
                  <span className="text-muted-foreground">Your query: </span>
                  <span className="font-medium">&ldquo;{query}&rdquo;</span>
                </div>
              )}

              <form className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-5"
                />
                <Button type="submit" className="w-full py-5" size="lg">
                  Join Waitlist
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                First 100 users get 3 months free
              </p>
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Trust Strip */}
      <section className="border-y bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>SOC 2 Type II (In Progress)</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-500" />
              <span>256-bit TLS Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-500" />
              <span>Your data never trains our models</span>
            </div>
          </div>
        </div>
      </section>

      {/* Built by Consultants Strip */}
      <section className="py-8 text-center">
        <p className="text-muted-foreground">
          Built by energy consultants who spent years doing this manually.{" "}
          <span className="text-foreground font-medium">We know the pain. We built the fix.</span>
        </p>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              The clean energy transition has a chokepoint
            </h2>
            <p className="text-lg text-muted-foreground">
              Interconnection queues are clogged. Due diligence takes months. Consultants charge $100K+.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-center bg-background">
              <div className="text-4xl font-bold text-red-500 mb-2">2,600 GW</div>
              <div className="text-muted-foreground">Stuck in queue</div>
            </Card>
            <Card className="p-6 text-center bg-background">
              <div className="text-4xl font-bold text-amber-500 mb-2">5+ years</div>
              <div className="text-muted-foreground">Average wait time</div>
            </Card>
            <Card className="p-6 text-center bg-background">
              <div className="text-4xl font-bold text-purple-500 mb-2">$400B</div>
              <div className="text-muted-foreground">In projects bottlenecked</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Specialized AI Agents
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each agent is trained on ISO-specific tariffs, rules, and data.
              They read the documents so you don&apos;t have to.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full relative overflow-hidden group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agent.status === "Live"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              How GridAgent Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Ask Any Question</h3>
              <p className="text-muted-foreground">
                Type naturally. &ldquo;What&apos;s my project&apos;s risk?&rdquo; or &ldquo;Explain Section 38.2&rdquo;
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Agent Searches</h3>
              <p className="text-muted-foreground">
                Queries tariffs, cluster studies, queue data, and cost allocations
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Get Sourced Answers</h3>
              <p className="text-muted-foreground">
                Receive answers with citations. Verify instantly. Save weeks of work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Explorer Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Explore the Data Yourself
            </h2>
            <p className="text-lg text-muted-foreground">
              Interactive tools to analyze interconnection queues across all ISOs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
            <Button size="lg" variant="outline" asChild>
              <Link href="/explorer">
                Open Explorer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 opacity-90" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">
            Ready to accelerate your due diligence?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join the waitlist and be first to access GridAgent when we launch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Button size="lg" variant="secondary" className="whitespace-nowrap">
              Join Waitlist
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-4">
            First 100 users get 3 months free
          </p>
        </div>
      </section>
    </div>
  );
}
