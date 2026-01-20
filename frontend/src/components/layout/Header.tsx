"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: "AI Agent", href: "/agent" },
  { name: "Queue", href: "/queue" },
  { name: "Cluster", href: "/cluster" },
  { name: "About", href: "/about" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 glass">
      {/* Subtle glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.75_0.18_195/0.5)] to-transparent" />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)] transition-all duration-300 group-hover:shadow-[0_0_20px_oklch(0.75_0.18_195/0.5)]">
            <span className="text-lg font-bold text-white font-heading">GA</span>
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/40 transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight text-white font-heading">
              GridAgent<span className="text-[oklch(0.75_0.18_195)]">.io</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className="relative text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 font-medium"
              >
                {item.name}
                {/* Hover glow effect */}
                <span className="absolute inset-0 rounded-md opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-[oklch(0.75_0.18_195/0.1)] to-transparent pointer-events-none" />
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)] text-white border-0 hover:shadow-[0_0_20px_oklch(0.75_0.18_195/0.4)] transition-all duration-300 btn-glow font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Join Waitlist
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10 border border-transparent hover:border-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] glass border-white/10">
              <nav className="flex flex-col gap-4 pt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium text-white/70 transition-all duration-300 hover:text-white hover:translate-x-1 font-heading"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="h-px bg-gradient-to-r from-[oklch(0.75_0.18_195/0.3)] via-[oklch(0.7_0.25_330/0.3)] to-transparent my-2" />
                <Button className="w-full bg-gradient-to-r from-[oklch(0.75_0.18_195)] to-[oklch(0.7_0.25_330)] text-white border-0 hover:shadow-[0_0_20px_oklch(0.75_0.18_195/0.4)] transition-all duration-300">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Join Waitlist
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
