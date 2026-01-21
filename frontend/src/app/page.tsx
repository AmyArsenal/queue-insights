"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ArrowUp,
  Paperclip,
} from "lucide-react";
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
  },
  {
    name: "MISO Agent",
    status: "Coming Soon",
    description: "DPP/DISIS studies, BPM rules, queue analysis",
  },
  {
    name: "NYISO/ISO-NE Agent",
    status: "Coming Soon",
    description: "NYISO & ISO-NE cluster studies, queue data",
  },
  {
    name: "SPP Agent",
    status: "Coming Soon",
    description: "SPP cluster studies, DISIS, queue data",
  },
];

const stats = [
  { label: "ISO Related Questions", value: "Ask" },
  { label: "Cost, Overloads, Peer Projects", value: "Compare" },
  { label: "Risk Visibility", value: "Decide" },
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
    <div className="flex flex-col bg-black">
      {/* Hero Section with Starry Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Starry background */}
        <div className="stars-container absolute inset-0" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-5xl text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-emerald-400">PJM Agent Now Live</span>
            </motion.div>

            {/* Main headline */}
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
              <span className="text-white">Track Cluster Results Across ISOs</span>
            </h1>

            {/* Subheadline - single line */}
            <p className="text-lg md:text-xl lg:text-2xl text-[#4FFFB0] mb-6 max-w-4xl mx-auto font-medium">
              ISO-Specific Intelligence. Generation Interconnection Cluster Results. Tariff Knowledge.
            </p>

            {/* Secondary text */}
            <p className="text-base md:text-lg text-white/60 mb-10 max-w-2xl mx-auto">
              Ask Questions In Natural Language and Get Instant Results and Analysis.
            </p>

            {/* Interactive search box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <form onSubmit={handleQuerySubmit} className="relative">
                <div className="relative flex items-center bg-white/5 border border-white/20 rounded-2xl p-1 hover:border-white/30 transition-colors">
                  <Paperclip className="absolute left-5 h-5 w-5 text-white/40" />
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
                    className="absolute right-2 rounded-xl bg-white text-black hover:bg-white/90 transition-all duration-300 border-0"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Example queries */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2 mb-10"
            >
              <span className="text-sm text-white/40">Try:</span>
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-sm px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </motion.div>

            {/* CTA Buttons - Bigger */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
            >
              <Button
                size="lg"
                className="rounded-full px-14 h-14 text-lg bg-white text-black hover:bg-white/90 transition-all duration-300 border-0 font-semibold"
                onClick={() => setShowWaitlist(true)}
              >
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-14 h-14 text-lg bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                onClick={() => setShowWaitlist(true)}
              >
                Explore Data
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-center gap-8 md:gap-16 pt-8 border-t border-white/10"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white font-heading">{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-14 text-center"
            >
              <p className="text-white/60 text-xl md:text-2xl mb-4">
                We Handle The Cluster Results Data Mess. <span className="text-white font-semibold">You Handle The Decisions.</span>
              </p>
              <p className="text-[#4FFFB0] text-lg md:text-xl">
                Built by Consultants with 10+ Years of Experience in Generation Interconnection Studies.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Waitlist Modal */}
        {showWaitlist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowWaitlist(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black font-heading">GA</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-heading">Get Early Access</h3>
                <p className="text-white/60">
                  Be first to use GridAgent. We&apos;re launching soon.
                </p>
              </div>

              {query && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-sm">
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
                  className="py-6 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 transition-colors"
                />
                <Button
                  type="submit"
                  className="w-full py-6 bg-white text-black hover:bg-white/90 transition-all duration-300 border-0 text-lg font-semibold"
                  size="lg"
                >
                  Join Waitlist
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Agents Section */}
      <section className="py-20 relative bg-black">
        <div className="stars-container absolute inset-0 opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
              Specialized AI Agents
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Our Agents have access to tariffs, interconnection rules, cluster results, cost allocation and timelines.
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
                <Card className="bg-zinc-900/50 border-white/10 p-6 h-full relative overflow-hidden group hover:bg-zinc-900 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 relative">
                    <h3 className="text-lg font-semibold text-white font-heading">{agent.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      agent.status === "Live"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-white/50 border border-white/10"
                    }`}>
                      {agent.status === "Live" && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                        </span>
                      )}
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

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden bg-zinc-900">
        <div className="stars-container absolute inset-0 opacity-30" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to accelerate your due diligence?
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Join the waitlist and be first to access GridAgent when we launch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-6 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 transition-colors"
            />
            <Button
              size="lg"
              className="whitespace-nowrap bg-white text-black hover:bg-white/90 font-semibold px-8"
              onClick={() => {
                if (email) setShowWaitlist(true);
              }}
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
