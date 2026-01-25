"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  chart?: {
    type: "bar" | "pie";
    data: Record<string, unknown>[];
    dataKey?: string;
    nameKey?: string;
  };
  sources?: string[];
}

interface AgentContextType {
  isOpen: boolean;
  messages: AgentMessage[];
  isLoading: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  addMessage: (message: AgentMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const addMessage = useCallback((message: AgentMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <AgentContext.Provider
      value={{
        isOpen,
        messages,
        isLoading,
        openChat,
        closeChat,
        toggleChat,
        addMessage,
        setLoading,
        clearMessages,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
