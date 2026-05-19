"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  User,
  BookOpen,
  Code2,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { aiChatService } from "@/lib/services/ai-chat-service";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatThread {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

const threads: ChatThread[] = [
  {
    id: "1",
    title: "Binary Search Help",
    preview: "What's the time complexity of...",
    updatedAt: "2h ago",
  },
  {
    id: "2",
    title: "React useEffect",
    preview: "When should I use the dependency...",
    updatedAt: "Yesterday",
  },
];

const suggestedPrompts = [
  { label: "Explain Big O notation", icon: BookOpen },
  { label: "Debug my Python loop", icon: Code2 },
  { label: "Quiz me on data structures", icon: Lightbulb },
];

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your Khmer Code Path learning assistant. Ask me about lessons, code, algorithms, or anything from your courses — I'm here to help you learn.",
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AiChatView() {
  const { get, setParams } = useQueryParams();
  const activeThreadId = get(QueryKey.thread) ?? threads[0].id;

  const setActiveThreadId = (id: string) => {
    setParams({
      [QueryKey.thread]: id === threads[0].id ? null : id,
    });
  };
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reply = await aiChatService.chat(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: reply || "I couldn't generate a response. Please try again.",
        },
      ]);
    } catch {
      setError("Unable to reach the AI service. Check your connection and try again.");
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content:
            "Sorry, I ran into a problem answering that. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shrink-0">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          AI Chat
          <Bot className="w-5 h-5 text-violet-500" />
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask questions about your courses, code, and study materials.
        </p>
      </header>

      <div className="flex-1 min-h-0 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_1fr] gap-6 h-full min-h-0">
          {/* Conversation history */}
          <Card className="hidden lg:flex flex-col overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs min-h-0">
            <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-bold text-foreground">Recent chats</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 transition-all",
                    activeThreadId === thread.id
                      ? "bg-violet-500/10 border border-violet-500/20"
                      : "hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 border border-transparent"
                  )}
                >
                  <p className="text-sm font-semibold text-foreground truncate">
                    {thread.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {thread.preview}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {thread.updatedAt}
                  </p>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-slate-200/80 dark:border-zinc-800 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold h-8"
                onClick={() => {
                  setMessages([welcomeMessage]);
                  setError(null);
                }}
              >
                New conversation
              </Button>
            </div>
          </Card>

          {/* Chat panel */}
          <Card className="flex flex-col overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xs min-h-[480px] lg:min-h-0">
            <div className="px-4 py-3 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-violet-500/5 via-transparent to-indigo-500/5">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Bot className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Learning Assistant</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Ready to help
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0"
              >
                AI Powered
              </Badge>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-full shrink-0 flex items-center justify-center",
                      msg.role === "user"
                        ? "bg-slate-200 dark:bg-zinc-800"
                        : "bg-gradient-to-br from-violet-500 to-indigo-600"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-foreground text-background rounded-tr-md"
                        : "bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-foreground rounded-tl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  </div>
                </div>
              )}

              {showSuggestions && (
                <div className="pt-2 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => void sendMessage(label)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-violet-500/5 hover:border-violet-500/30 transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5 text-violet-500" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="px-4 pb-1 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-slate-200/80 dark:border-zinc-800 shrink-0 bg-slate-50/50 dark:bg-zinc-950/30"
            >
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about lessons, code, or study topics..."
                  rows={1}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border border-slate-200/80 dark:border-zinc-800",
                    "bg-white dark:bg-zinc-950 px-4 py-3 text-sm shadow-2xs",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30",
                    "disabled:opacity-50"
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="size-11 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 hover:opacity-90 text-white border-0 shadow-sm disabled:opacity-40"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Press Enter to send · Shift+Enter for a new line
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
