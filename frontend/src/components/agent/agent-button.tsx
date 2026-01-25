"use client";

import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgent } from "./agent-provider";
import { motion, AnimatePresence } from "framer-motion";

export function AgentButton() {
  const { isOpen, toggleChat, messages } = useAgent();

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
    >
      <Button
        onClick={toggleChat}
        size="lg"
        className={`
          relative h-14 w-14 rounded-full shadow-lg transition-all duration-300
          ${isOpen
            ? "bg-zinc-800 hover:bg-zinc-700 text-white"
            : "bg-[#4FFFB0] hover:bg-[#3de09d] text-black"
          }
        `}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Zap className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification badge for unread messages */}
        {!isOpen && messages.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">
              {messages.filter((m) => m.role === "assistant").length}
            </span>
          </motion.div>
        )}
      </Button>

      {/* Floating label when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: 0.3 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white shadow-lg">
              Ask GridAgent
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation when no messages */}
      {!isOpen && messages.length === 0 && (
        <>
          <span className="absolute inset-0 rounded-full bg-[#4FFFB0] animate-ping opacity-30" />
          <span className="absolute inset-0 rounded-full bg-[#4FFFB0] animate-pulse opacity-20" />
        </>
      )}
    </motion.div>
  );
}
