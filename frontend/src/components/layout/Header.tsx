"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: "GridAgent", href: "/agent" },
  { name: "Queue", href: "/queue" },
  { name: "Cluster", href: "/cluster" },
  { name: "About", href: "/about" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white transition-all duration-300 group-hover:bg-white/90">
            <span className="text-lg font-bold text-black font-heading">GA</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight text-white font-heading">
              GridAgent<span className="text-white/50">.io</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 font-medium"
              >
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="hidden md:flex items-center gap-2 bg-white text-black border-0 hover:bg-white/90 transition-all duration-300 font-medium"
          >
            Join Waitlist
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10 border border-transparent hover:border-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-black border-white/10">
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
                <div className="h-px bg-white/10 my-2" />
                <Button className="w-full bg-white text-black border-0 hover:bg-white/90 transition-all duration-300">
                  Join Waitlist
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
