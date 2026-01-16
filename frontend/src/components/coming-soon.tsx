"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

export function ComingSoon({
  title,
  description,
  icon: Icon,
  features,
}: ComingSoonProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-teal-400/20">
              <Icon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <Badge variant="secondary" className="mb-4">
            <Construction className="mr-1 h-3 w-3" />
            Coming Soon
          </Badge>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mb-8 text-lg text-muted-foreground">{description}</p>

          {features && features.length > 0 && (
            <Card className="mb-8 p-6 text-left">
              <h3 className="mb-4 font-semibold">What to expect:</h3>
              <ul className="space-y-2 text-muted-foreground">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Button asChild>
            <Link href="/explorer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explorer
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
