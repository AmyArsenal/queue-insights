"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Zap, Menu, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const agents = [
  { name: "PJM Agent", href: "/cluster", status: "Live" },
  { name: "MISO Agent", href: "#", status: "Coming Q2" },
  { name: "ERCOT Agent", href: "#", status: "Coming Q3" },
  { name: "CAISO Agent", href: "#", status: "Coming Q3" },
];

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            GridAgent
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {/* Agents Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Agents
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {agents.map((agent) => (
                <DropdownMenuItem key={agent.name} asChild disabled={agent.status !== "Live"}>
                  <Link href={agent.href} className="flex items-center justify-between w-full">
                    <span>{agent.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      agent.status === "Live"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {agent.status}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/explorer" className="w-full">
                  Data Explorer
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/explorer"
            prefetch={true}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Explorer
          </Link>

          <Link
            href="/about"
            prefetch={true}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button size="sm" className="hidden md:flex">
            Join Waitlist
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 pt-8">
                <div className="text-sm font-medium text-muted-foreground mb-2">Agents</div>
                {agents.map((agent) => (
                  <Link
                    key={agent.name}
                    href={agent.href}
                    prefetch={true}
                    className="flex items-center justify-between text-base font-medium text-muted-foreground transition-colors hover:text-foreground pl-4"
                  >
                    <span>{agent.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      agent.status === "Live"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {agent.status}
                    </span>
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                <Link
                  href="/explorer"
                  prefetch={true}
                  className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Explorer
                </Link>
                <Link
                  href="/about"
                  prefetch={true}
                  className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
                <div className="h-px bg-border my-2" />
                <Button className="w-full">
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
