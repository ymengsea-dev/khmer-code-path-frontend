"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, BookmarkPlus, Check, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { lessonAiService } from "@/lib/services/lesson-ai-service";
import { noteService } from "@/lib/services/note-service";
import type { LessonCitationDto } from "@/lib/types/lesson-ai-api";

function SaveNoteButton({ content, lessonId, lessonTitle }: { content: string; lessonId: number; lessonTitle: string }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await noteService.create({
        title: `AI note from "${lessonTitle}"`,
        bodyHtml: `<blockquote>${content.replace(/\n/g, "<br/>")}</blockquote>`,
        sourceLabel: lessonTitle,
        lessonId,
        tags: ["AI-Generated"],
      });
      setSaved(true);
    } catch {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleSave()}
      disabled={saving || saved}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all hover:scale-105 active:scale-95"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(12px) saturate(1.4)",
        WebkitBackdropFilter: "blur(12px) saturate(1.4)",
        border: "1px solid var(--glass-border-color)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        color: saved ? "#22c55e" : "#71717a",
      }}
    >
      {saving ? (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      ) : saved ? (
        <><Check className="w-2.5 h-2.5" />Saved</>
      ) : (
        <><BookmarkPlus className="w-2.5 h-2.5" />Save to note</>
      )}
    </button>
  );
}

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
  /** When provided, shows a "Summarize" chip that injects summary as a chat message */
  onSummarize?: () => Promise<string>;
}

export function LessonAskPanel({
  lessonId,
  lessonTitle,
  aiReady,
  hasLessonContent,
  materialId,
  onSummarize,
}: LessonAskPanelProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canAsk = aiReady || hasLessonContent;

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [lessonId, lessonTitle]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSummarize = async () => {
    if (!onSummarize || sending) return;
    setSending(true);
    setError(null);
    try {
      const summary = await onSummarize();
      setMessages((prev) => [
        ...prev,
        { id: `summary-${Date.now()}`, role: "assistant", content: summary },
      ]);
    } catch {
      setError("Could not generate a summary. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !canAsk) return;
    setSending(true);
    setError(null);
    setInput("");
    const tmpId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tmpId, role: "user", content: text }]);
    try {
      const reply = await lessonAiService.askLesson(lessonId, { question: text, materialId });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tmpId),
        { id: `u-${Date.now()}`, role: "user", content: text },
        { id: `a-${Date.now()}`, role: "assistant", content: reply.answer, citations: reply.citations },
      ]);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      setError("Could not get an answer. Make sure lesson files are uploaded and try again.");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div
        id="ai-panel-messages"
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-3 py-3 space-y-3"
      >
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color)" }}>
              <Sparkles className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[180px] leading-relaxed">
              {canAsk
                ? "Ask anything about this lesson."
                : "Upload files or add lesson notes first so the AI can answer your questions."}
            </p>
            {onSummarize && canAsk && (
              <button
                type="button"
                onClick={() => void handleSummarize()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "none",
                  color: "#52525b",
                }}
              >
                <Sparkles className="w-3 h-3" />
                Summarize this lesson
              </button>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-xl shrink-0 mt-0.5 flex items-center justify-center"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color)" }}>
                <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
              </div>
            )}
            <div className={cn("flex flex-col gap-1 max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-xs leading-relaxed w-full",
                  msg.role === "user"
                    ? "bg-[#305FC9] text-white rounded-tr-sm"
                    : "text-foreground rounded-tl-sm"
                )}
                style={msg.role === "assistant" ? {
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-color)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                } : undefined}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-xs max-w-none wrap-break-word
                      prose-p:my-1 prose-p:leading-relaxed
                      prose-headings:font-bold prose-headings:my-1.5 prose-h1:text-sm prose-h2:text-xs prose-h3:text-xs
                      prose-strong:font-bold
                      prose-ul:my-1 prose-ul:pl-4 prose-ol:my-1 prose-ol:pl-4
                      prose-li:my-0.5
                      prose-code:text-[10px] prose-code:bg-black/6 prose-code:px-1 prose-code:rounded
                      prose-blockquote:border-l-2 prose-blockquote:border-zinc-300 prose-blockquote:pl-2 prose-blockquote:italic"
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                )}
                {msg.role === "assistant" && msg.citations?.length ? (
                  <div className="mt-2 pt-2 border-t border-black/8 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Sources</p>
                    {msg.citations.map((c, i) => (
                      <div key={`${c.sourceName}-${i}`} className="rounded-lg px-2 py-1.5 text-[10px]"
                        style={{ background: "rgba(0,0,0,0.04)" }}>
                        <p className="font-semibold text-foreground truncate">{c.sourceName}</p>
                        {c.excerpt && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{c.excerpt}</p>}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {/* Save-to-note — always visible under assistant messages */}
              {msg.role === "assistant" && (
                <SaveNoteButton content={msg.content} lessonId={lessonId} lessonTitle={lessonTitle} />
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color)" }}>
              <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="flex gap-1 py-2 px-3 rounded-2xl rounded-tl-sm"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color)" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-[10px] text-red-500 px-2">{error}</p>
        )}
      </div>

      {/* Compose bar */}
      <div className="shrink-0 px-3 pb-3">
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border-color)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={canAsk ? "Ask… (Enter to send)" : "Upload files first…"}
            rows={1}
            disabled={!canAsk || sending}
            className="flex-1 bg-transparent text-xs resize-none focus:outline-none placeholder:text-muted-foreground/50 min-h-[24px] max-h-24 scrollbar-hide py-0.5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => void handleSend()}
            className="shrink-0 w-7 h-7 rounded-2xl flex items-center justify-center transition-all duration-150 border bg-[#305FC9] text-white border-[#305FC9]/20 shadow-sm shadow-slate-900/4 hover:bg-[#2854b8] hover:shadow-md hover:shadow-slate-900/6 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
