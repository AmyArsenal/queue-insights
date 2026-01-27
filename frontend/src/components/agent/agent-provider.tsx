"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  duration_ms?: number;
  status: "running" | "success" | "error";
}

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
  thinking?: string | null;  // Agent's reasoning trace (collapsible)
  tool_calls?: ToolCall[];   // Tool invocations for this message
  timestamp?: number;        // Message timestamp
}

interface AgentContextType {
  isOpen: boolean;
  messages: AgentMessage[];
  isLoading: boolean;
  selectedMessageId: string | null;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  addMessage: (message: AgentMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  selectMessage: (id: string | null) => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const addMessage = useCallback((message: AgentMessage) => {
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || Date.now(),
    };
    setMessages((prev) => [...prev, messageWithTimestamp]);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSelectedMessageId(null);
  }, []);

  const selectMessage = useCallback((id: string | null) => {
    setSelectedMessageId(id);
  }, []);

  return (
    <AgentContext.Provider
      value={{
        isOpen,
        messages,
        isLoading,
        selectedMessageId,
        openChat,
        closeChat,
        toggleChat,
        addMessage,
        setLoading,
        clearMessages,
        selectMessage,
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
