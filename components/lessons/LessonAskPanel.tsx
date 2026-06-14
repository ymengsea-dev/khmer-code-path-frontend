"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import type { LessonCitationDto } from "@/lib/types/lesson-ai-api";

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: LessonCitationDto[];
}

interface LessonAskPanelProps {
  lessonId: number;
  lessonTitle: string;
  aiReady: boolean;
  hasLessonContent: boolean;
  materialId?: number | null;
}

export function LessonAskPanel({
  lessonId,
  lessonTitle,
  aiReady,
  hasLessonContent,
  materialId,
}: LessonAskPanelProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [lessonId, lessonTitle]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setInput("");
    const optimistic: UiMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const reply = await lessonAiService.askLesson(lessonId, {
        question: text,
        materialId,
      });
      setMessages((prev) => {
        const withoutTmp = prev.filter((m) => m.id !== optimistic.id);
        return [
          ...withoutTmp,
          {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
          },
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: reply.answer,
            citations: reply.citations,
          },
        ];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError("Could not get an answer. Make sure lesson files are uploaded and try again.");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {!aiReady && !hasLessonContent ? (
        <p className="text-sm text-amber-700 dark:text-amber-400 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          This lesson needs written notes or uploaded files before the assistant can answer.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {messages.length > 0 || sending ? (
        <div
          ref={scrollRef}
          className="min-h-[200px] max-h-[360px] overflow-y-auto rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 p-4 space-y-3"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2 text-sm",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              ) : null}
              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-foreground"
                )}
              >
                <p>{msg.content}</p>
                {msg.role === "assistant" && msg.citations?.length ? (
                  <div className="mt-3 space-y-2 border-t border-border/70 pt-2">
                    <p className="text-[11px] font-bold uppercase text-muted-foreground">
                      Sources
                    </p>
                    {msg.citations.map((citation, index) => (
                      <div
                        key={`${citation.sourceName}-${citation.chunkIndex ?? index}`}
                        className="rounded-md bg-muted/60 px-2 py-1.5 text-xs"
                      >
                        <p className="font-semibold">
                          {citation.sourceName}
                          {citation.chunkIndex != null
                            ? ` · chunk ${citation.chunkIndex + 1}`
                            : ""}
                        </p>
                        <p className="mt-1 line-clamp-2 text-muted-foreground">
                          {citation.excerpt}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {msg.role === "user" ? (
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              ) : null}
            </div>
          ))}
          {sending ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question about this lesson…"
          rows={2}
          disabled={(!aiReady && !hasLessonContent) || sending}
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <Button
          variant="inverse"
          size="icon"
          className="h-auto w-10 shrink-0"
          disabled={(!aiReady && !hasLessonContent) || sending || !input.trim()}
          onClick={() => void handleSend()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
