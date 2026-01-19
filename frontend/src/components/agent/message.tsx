"use client";

import { cn } from "@/lib/utils";
import { Message, ToolInvocation } from "@/types/agent";
import { Bot, User, Database, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface MessageComponentProps {
  message: Message;
}

export function MessageComponent({ message }: MessageComponentProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-blue-500 to-teal-400 text-white"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : null}
        </div>

        {message.toolInvocations?.map((tool) => (
          <ToolInvocationComponent key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

interface ToolInvocationComponentProps {
  tool: ToolInvocation;
}

function ToolInvocationComponent({ tool }: ToolInvocationComponentProps) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <Database className="h-4 w-4 text-blue-500" />
        <span>query_db</span>
        {tool.status === "pending" && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
        {tool.status === "running" && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
        )}
        {tool.status === "completed" && (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        )}
        {tool.status === "error" && (
          <XCircle className="h-3 w-3 text-red-500" />
        )}
      </div>

      {tool.arguments && (
        <div className="mt-2 text-xs text-muted-foreground">
          <details>
            <summary className="cursor-pointer hover:text-foreground">
              Query parameters
            </summary>
            <pre className="mt-1 overflow-x-auto rounded bg-muted p-2">
              {JSON.stringify(tool.arguments, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {tool.result?.data !== undefined && tool.result.data !== null ? (
        <div className="mt-2 text-xs">
          <details>
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Results ({Array.isArray(tool.result.data) ? (tool.result.data as unknown[]).length : 1} items)
            </summary>
            <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2">
              {JSON.stringify(tool.result.data, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      {tool.result?.error && (
        <div className="mt-2 text-xs text-red-500">
          Error: {tool.result.error}
        </div>
      )}
    </div>
  );
}
