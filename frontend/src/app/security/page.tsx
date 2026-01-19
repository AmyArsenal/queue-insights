"use client";

import { Card } from "@/components/ui/card";
import {
  Shield,
  Lock,
  Database,
  Eye,
  Server,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

const securityFeatures = [
  {
    icon: Lock,
    title: "Encryption in Transit",
    description:
      "All data transmitted between your browser and our servers is encrypted using TLS 1.3 with 256-bit encryption.",
    status: "active",
  },
  {
    icon: Database,
    title: "Encryption at Rest",
    description:
      "All stored data is encrypted using AES-256 encryption. Database backups are also encrypted.",
    status: "active",
  },
  {
    icon: Server,
    title: "SOC 2 Certified Infrastructure",
    description:
      "Our infrastructure providers (Vercel, Supabase, Railway) maintain SOC 2 Type II certification.",
    status: "active",
  },
  {
    icon: Shield,
    title: "SOC 2 Type II",
    description:
      "GridAgent is pursuing SOC 2 Type II certification. Audit in progress with expected completion Q2 2026.",
    status: "in-progress",
  },
  {
    icon: Eye,
    title: "GDPR Compliant",
    description:
      "We comply with GDPR requirements including data minimization, right to erasure, and transparent data processing.",
    status: "active",
  },
  {
    icon: FileCheck,
    title: "Data Processing Agreement",
    description:
      "Enterprise customers can request a Data Processing Agreement (DPA) for regulatory compliance.",
    status: "active",
  },
];

const dataHandling = [
  {
    title: "Your Data Never Trains Our Models",
    description:
      "We do not use your queries, uploaded documents, or any interaction data to train AI models. Your data remains yours.",
  },
  {
    title: "Minimal Data Retention",
    description:
      "We only retain data necessary for service operation. Query history can be deleted at any time from your account settings.",
  },
  {
    title: "No Third-Party Data Sharing",
    description:
      "We never sell or share your data with third parties for marketing or advertising purposes.",
  },
  {
    title: "Right to Deletion",
    description:
      "You can request complete deletion of your account and all associated data at any time.",
  },
];

export default function SecurityPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
              Security & Compliance
            </h1>
            <p className="text-lg text-muted-foreground">
              GridAgent is built with security at its core. We protect your data
              with industry-leading practices and maintain compliance with major
              regulatory frameworks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-semibold mb-8 text-center">
            Security & Certifications
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-blue-500" />
                    </div>
                    {feature.status === "active" ? (
                      <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        In Progress
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Handling */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">
              How We Handle Your Data
            </h2>
            <div className="space-y-6">
              {dataHandling.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-semibold mb-8">
              Trusted Infrastructure
            </h2>
            <p className="text-muted-foreground mb-8">
              GridAgent is built on enterprise-grade infrastructure providers
              that maintain the highest security standards.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Vercel</div>
                <div className="text-sm">Frontend Hosting</div>
                <div className="text-xs text-green-500">SOC 2 Type II</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Supabase</div>
                <div className="text-sm">Database</div>
                <div className="text-xs text-green-500">SOC 2 Type II</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Railway</div>
                <div className="text-sm">Backend Hosting</div>
                <div className="text-xs text-green-500">SOC 2 Type II</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Anthropic</div>
                <div className="text-sm">AI Provider</div>
                <div className="text-xs text-green-500">SOC 2 Type II</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-semibold mb-4">
            Security Questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            For security inquiries, vulnerability reports, or compliance
            documentation requests, please contact our security team.
          </p>
          <a
            href="mailto:security@gridagent.io"
            className="text-blue-500 hover:underline font-medium"
          >
            security@gridagent.io
          </a>
        </div>
      </section>
    </div>
  );
}
