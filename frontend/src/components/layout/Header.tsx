"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: "AI Agent", href: "/agent" },
  { name: "Queue", href: "/queue" },
  { name: "Cluster", href: "/cluster" },
  { name: "About", href: "/about" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="text-lg font-bold text-white">GA</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            GridAgent.io
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20 transition-all duration-200"
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
            className="hidden md:flex bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          >
            Join Waitlist
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-black border-white/10">
              <nav className="flex flex-col gap-4 pt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium text-white/80 transition-colors hover:text-white"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <Button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20">
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
