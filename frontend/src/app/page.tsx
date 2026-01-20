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
  Bot,
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
    color: "from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)]",
    glow: "oklch(0.75 0.18 195 / 0.3)",
  },
  {
    name: "MISO Agent",
    status: "Coming Q2",
    description: "DPP/DISIS studies, BPM rules, queue analysis",
    color: "from-emerald-500 to-emerald-600",
    glow: "oklch(0.7 0.2 145 / 0.3)",
  },
  {
    name: "ERCOT Agent",
    status: "Coming Q3",
    description: "ERCOT protocols, queue data, screening studies",
    color: "from-amber-500 to-amber-600",
    glow: "oklch(0.8 0.15 85 / 0.3)",
  },
  {
    name: "CAISO Agent",
    status: "Coming Q3",
    description: "CAISO cluster studies, TPD allocation, queue data",
    color: "from-blue-500 to-blue-600",
    glow: "oklch(0.6 0.22 250 / 0.3)",
  },
];

const stats = [
  { label: "Instant Comparisons", value: "Ask", color: "text-[oklch(0.75_0.18_195)]" },
  { label: "Peer Benchmarking", value: "Compare", color: "text-[oklch(0.7_0.25_330)]" },
  { label: "Risk Visibility", value: "Decide", color: "text-[oklch(0.65_0.25_280)]" },
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

        {/* Floating gradient orbs - Neon colors */}
        <div className="gradient-orb gradient-orb-cyan w-[600px] h-[600px] top-[-150px] left-[-150px]" style={{ animationDelay: "0s" }} />
        <div className="gradient-orb gradient-orb-magenta w-[500px] h-[500px] bottom-[-100px] right-[-100px]" style={{ animationDelay: "2s" }} />
        <div className="gradient-orb gradient-orb-purple w-[400px] h-[400px] top-[30%] right-[15%]" style={{ animationDelay: "4s" }} />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.75_0.18_195)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.75_0.18_195)]"></span>
              </span>
              <span className="text-sm text-white/80">PJM Agent Now Live</span>
            </motion.div>

            {/* Main headline */}
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">Track cluster results across</span>
              <br />
              <span className="gradient-text">
                7 ISOs. Instantly.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 mb-4 max-w-2xl mx-auto">
              PJM, MISO, CAISO, ERCOT, SPP, NYISO, and ISO-NE. Our agents are trained on tariffs, interconnection rules, timelines, and cost allocations.
            </p>

            <p className="text-base md:text-lg text-white/50 mb-8 max-w-xl mx-auto">
              No hallucinations—just sourced answers from actual study data.
            </p>

            {/* Interactive search box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <form onSubmit={handleQuerySubmit} className="relative">
                <div className="relative flex items-center glass-card rounded-2xl p-1 border-glow">
                  <Bot className="absolute left-5 h-5 w-5 text-[oklch(0.75_0.18_195)]" />
                  <Input
                    type="text"
                    placeholder="Ask GridAgent anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-14 pr-32 py-6 text-lg rounded-xl border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-white/40"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-2 rounded-xl bg-gradient-to-r from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)] hover:shadow-[0_0_30px_oklch(0.75_0.18_195/0.5)] transition-all duration-300 border-0"
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
              <span className="text-sm text-white/40">Try:</span>
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-sm px-3 py-1.5 rounded-full glass hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/20"
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
              <Button
                size="lg"
                className="rounded-full px-8 bg-gradient-to-r from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)] hover:shadow-[0_0_30px_oklch(0.75_0.18_195/0.5)] transition-all duration-300 border-0 btn-glow"
                onClick={() => setShowWaitlist(true)}
              >
                Join Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 glass border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                asChild
              >
                <Link href="/queue">
                  Explore Data
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-white/10"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold ${stat.color} font-heading`}>{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10 text-center"
            >
              <p className="text-white/40 text-sm">
                We handle the data mess. <span className="text-white/70 font-medium">You handle the decisions—before the window closes.</span>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Waitlist Modal */}
        {showWaitlist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={() => setShowWaitlist(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card rounded-3xl p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_oklch(0.75_0.18_195/0.4)]">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-heading">Get Early Access</h3>
                <p className="text-white/60">
                  Be first to use GridAgent. We&apos;re launching soon.
                </p>
              </div>

              {query && (
                <div className="glass rounded-xl p-4 mb-4 text-sm">
                  <span className="text-white/50">Your query: </span>
                  <span className="font-medium text-white">&ldquo;{query}&rdquo;</span>
                </div>
              )}

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Waitlist signup:", email, query);
                }}
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-6 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[oklch(0.75_0.18_195)] transition-colors"
                />
                <Button
                  type="submit"
                  className="w-full py-6 bg-gradient-to-r from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)] hover:shadow-[0_0_30px_oklch(0.75_0.18_195/0.5)] transition-all duration-300 border-0 text-lg font-semibold"
                  size="lg"
                >
                  Join Waitlist
                </Button>
              </form>

              <p className="text-xs text-white/40 text-center mt-4">
                First 100 users get 3 months free
              </p>
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Trust Strip */}
      <section className="border-y border-white/5 glass py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/50">
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <Shield className="h-4 w-4 text-[oklch(0.7_0.2_145)]" />
              <span>SOC 2 Type II (In Progress)</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <Lock className="h-4 w-4 text-[oklch(0.75_0.18_195)]" />
              <span>256-bit TLS Encryption</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <CheckCircle2 className="h-4 w-4 text-[oklch(0.7_0.25_330)]" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors">
              <Database className="h-4 w-4 text-[oklch(0.8_0.15_85)]" />
              <span>Your data never trains our models</span>
            </div>
          </div>
        </div>
      </section>

      {/* Built by Consultants Strip */}
      <section className="py-8 text-center">
        <p className="text-white/50">
          Built by energy consultants who spent years doing this manually.{" "}
          <span className="text-white font-medium">We know the pain. We built the fix.</span>
        </p>
      </section>

      {/* Problem Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
              The clean energy transition has a <span className="gradient-text">chokepoint</span>
            </h2>
            <p className="text-lg text-white/60">
              Interconnection queues are clogged. Due diligence takes months. Consultants charge $100K+.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="glass-card p-6 text-center hover-lift border-glow">
              <div className="text-4xl font-bold text-[oklch(0.65_0.22_25)] mb-2 font-heading">2,600 GW</div>
              <div className="text-white/50">Stuck in queue</div>
            </Card>
            <Card className="glass-card p-6 text-center hover-lift border-glow">
              <div className="text-4xl font-bold text-[oklch(0.8_0.15_85)] mb-2 font-heading">5+ years</div>
              <div className="text-white/50">Average wait time</div>
            </Card>
            <Card className="glass-card p-6 text-center hover-lift border-glow">
              <div className="text-4xl font-bold text-[oklch(0.7_0.25_330)] mb-2 font-heading">$400B</div>
              <div className="text-white/50">In projects bottlenecked</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
              Specialized <span className="gradient-text">AI Agents</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
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
                <Card
                  className="glass-card p-6 h-full relative overflow-hidden group hover-lift border-glow"
                  style={{ '--glow-color': agent.glow } as React.CSSProperties}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className="flex items-center justify-between mb-4 relative">
                    <h3 className="text-lg font-semibold text-white font-heading">{agent.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      agent.status === "Live"
                        ? "bg-[oklch(0.7_0.2_145/0.2)] text-[oklch(0.7_0.2_145)] border border-[oklch(0.7_0.2_145/0.3)]"
                        : "bg-white/5 text-white/50 border border-white/10"
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 relative">{agent.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="gradient-orb gradient-orb-purple w-[400px] h-[400px] top-[20%] left-[-100px]" style={{ animationDelay: "1s" }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
              How <span className="gradient-text">GridAgent</span> Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_30px_oklch(0.75_0.18_195/0.3)] transition-all duration-300 border border-white/10 group-hover:border-[oklch(0.75_0.18_195/0.3)]">
                <Search className="h-10 w-10 text-[oklch(0.75_0.18_195)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white font-heading">1. Ask Any Question</h3>
              <p className="text-white/50">
                Type naturally. &ldquo;What&apos;s my project&apos;s risk?&rdquo; or &ldquo;Explain Section 38.2&rdquo;
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_30px_oklch(0.7_0.25_330/0.3)] transition-all duration-300 border border-white/10 group-hover:border-[oklch(0.7_0.25_330/0.3)]">
                <FileText className="h-10 w-10 text-[oklch(0.7_0.25_330)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white font-heading">2. Agent Searches</h3>
              <p className="text-white/50">
                Queries tariffs, cluster studies, queue data, and cost allocations
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto mb-4 group-hover:shadow-[0_0_30px_oklch(0.65_0.25_280/0.3)] transition-all duration-300 border border-white/10 group-hover:border-[oklch(0.65_0.25_280/0.3)]">
                <Sparkles className="h-10 w-10 text-[oklch(0.65_0.25_280)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white font-heading">3. Get Sourced Answers</h3>
              <p className="text-white/50">
                Receive answers with citations. Verify instantly. Save weeks of work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Explorer Preview */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
              Explore the Data <span className="gradient-text">Yourself</span>
            </h2>
            <p className="text-lg text-white/60">
              Interactive tools to analyze interconnection queues across all ISOs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="glass-card group p-6 transition-all hover-lift border-glow">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl glass group-hover:shadow-[0_0_20px_oklch(0.75_0.18_195/0.3)] transition-all duration-300">
                <Map className="h-7 w-7 text-[oklch(0.75_0.18_195)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white font-heading">Interactive Map</h3>
              <p className="text-white/50 text-sm">
                Visualize queue capacity across all 9 ISO regions with county-level detail
              </p>
            </Card>
            <Card className="glass-card group p-6 transition-all hover-lift border-glow">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl glass group-hover:shadow-[0_0_20px_oklch(0.7_0.2_145/0.3)] transition-all duration-300">
                <BarChart3 className="h-7 w-7 text-[oklch(0.7_0.2_145)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white font-heading">Analytics Charts</h3>
              <p className="text-white/50 text-sm">
                Track trends, compare regions, and analyze withdrawal patterns over time
              </p>
            </Card>
            <Card className="glass-card group p-6 transition-all hover-lift border-glow">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl glass group-hover:shadow-[0_0_20px_oklch(0.7_0.25_330/0.3)] transition-all duration-300">
                <Table2 className="h-7 w-7 text-[oklch(0.7_0.25_330)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white font-heading">Data Explorer</h3>
              <p className="text-white/50 text-sm">
                Filter, sort, and browse all 36,000+ projects with advanced search
              </p>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <Button
              size="lg"
              variant="outline"
              className="glass border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              asChild
            >
              <Link href="/queue">
                Open Explorer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.75_0.18_195)] via-[oklch(0.7_0.25_330)] to-[oklch(0.65_0.25_280)]" />
        <div className="absolute inset-0 grid-overlay opacity-20" />

        {/* Animated orbs */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-white/10 blur-[100px] top-[-50px] left-[-50px] animate-pulse" />
        <div className="absolute w-[200px] h-[200px] rounded-full bg-white/10 blur-[80px] bottom-[-30px] right-[10%] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to accelerate your due diligence?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Join the waitlist and be first to access GridAgent when we launch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-6 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 transition-colors"
            />
            <Button
              size="lg"
              className="whitespace-nowrap bg-white text-[oklch(0.3_0.1_280)] hover:bg-white/90 font-semibold px-8"
              onClick={() => {
                if (email) setShowWaitlist(true);
              }}
            >
              Join Waitlist
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-6">
            First 100 users get 3 months free
          </p>
        </div>
      </section>
    </div>
  );
}
