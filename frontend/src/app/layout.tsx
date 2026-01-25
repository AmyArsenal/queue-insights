import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/footer";
import { AgentProvider } from "@/components/agent/agent-provider";
import { AgentButton } from "@/components/agent/agent-button";
import { AgentChat } from "@/components/agent/agent-chat";

// Headings - Modern geometric, futuristic
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Body text - Excellent readability
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Code/Data - Technical precision
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Keep Geist Mono as fallback
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GridAgent | AI Intelligence Layer for Grid Data",
  description:
    "The first AI layer for grid interconnection. Queues, clusters, tariffs, cost allocations. Ask anything, get answers in seconds.",
  keywords: [
    "interconnection queue",
    "grid intelligence",
    "AI agent",
    "PJM cluster study",
    "renewable energy",
    "solar",
    "wind",
    "battery storage",
    "CAISO",
    "ERCOT",
    "PJM",
    "MISO",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${inter.variable} ${jetbrainsMono.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AgentProvider>
            <div className="flex min-h-screen flex-col bg-black relative">
              {/* Global starry background */}
              <div className="stars-container fixed inset-0 pointer-events-none" />
              <Header />
              <main className="flex-1 relative z-10">{children}</main>
              <Footer />
            </div>
            {/* Global floating agent */}
            <AgentButton />
            <AgentChat />
          </AgentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
