"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Loader2, Pencil, Plus, Sparkles, SquarePen, Trash2, User, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  aiChatService,
  type ChatMessageDto,
  type ConversationSummary,
} from "@/lib/services/ai-chat-service";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { QueryKey } from "@/lib/navigation/app-query";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const COMPOSER_MIN_HEIGHT = 24;
const STREAM_MSG_ID = "streaming-assistant";

function toUiMessage(dto: ChatMessageDto): ChatMessage {
  return {
    id: String(dto.id),
    role: dto.role === "USER" ? "user" : "assistant",
    content: dto.content,
  };
}

function ConversationRow({
  thread,
  selected,
  onSelect,
  onDelete,
  onRename,
  deleting,
}: {
  thread: ConversationSummary;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  deleting: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(thread.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(thread.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== thread.title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDraft(thread.title);
    setEditing(false);
  };

  return (
    <div className="px-2 py-0.5 group relative">
      {editing ? (
        <div
          className={cn(
            "flex items-center gap-1 rounded-xl px-3 py-2 ring-1 ring-indigo-400/60",
            "bg-white dark:bg-zinc-800"
          )}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
              if (e.key === "Escape") cancelEdit();
            }}
            className="flex-1 min-w-0 bg-transparent text-[13px] font-medium text-foreground focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); commitEdit(); }}
            className="shrink-0 h-5 w-5 rounded flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
            aria-label="Save"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="shrink-0 h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            className={cn(
              "w-full text-left rounded-xl px-3 py-2.5 transition-all duration-150 pr-16",
              selected
                ? "bg-white dark:bg-zinc-800/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "hover:bg-black/4 dark:hover:bg-white/4"
            )}
          >
            <p className="text-[13px] font-medium text-foreground truncate">{thread.title}</p>
          </button>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={startEdit}
              className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
              aria-label={`Rename ${thread.title}`}
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={deleting}
              className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-40"
              aria-label={`Delete ${thread.title}`}
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({ msg, streaming = false }: { msg: ChatMessage; streaming?: boolean }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex w-full gap-2.5 items-end", isUser ? "justify-end" : "justify-start")}>
      {/* AI avatar — left side */}
      {!isUser && (
        <div className="shrink-0 h-7 w-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm mb-0.5">
          <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2} />
        </div>
      )}

      <div
        className={cn(
          "min-w-0 max-w-[90%] rounded-2xl text-[14px] leading-relaxed px-4 py-2.5 overflow-hidden",
          isUser
            ? "rounded-br-md bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20"
            : "rounded-bl-md bg-white dark:bg-zinc-800 ring-1 ring-black/5 dark:ring-white/10 text-foreground shadow-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
        ) : (
          <div className="min-w-0 text-[14px] leading-relaxed wrap-break-word [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                h1: ({ children }) => <h1 className="text-[17px] font-semibold mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[15px] font-semibold mt-3 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[14px] font-semibold mt-2 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="my-1.5 pl-5 list-disc space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="my-1.5 pl-5 list-decimal space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                  inline ? (
                    <code className="text-[13px] font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-1 py-0.5 rounded">{children}</code>
                  ) : (
                    <code>{children}</code>
                  ),
                pre: ({ children }) => (
                  <pre className="my-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[13px] font-mono rounded-lg p-3 overflow-x-auto border border-zinc-200 dark:border-zinc-700">{children}</pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-2 border-indigo-400 pl-3 italic text-muted-foreground">{children}</blockquote>
                ),
                hr: () => <hr className="my-3 border-black/10 dark:border-white/10" />,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline underline-offset-2 hover:text-indigo-600">{children}</a>
                ),
                table: ({ children }) => (
                  <div className="my-2 overflow-x-auto">
                    <table className="w-full text-[13px] border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">{children}</th>,
                td: ({ children }) => <td className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700">{children}</td>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
            {streaming && (
              <span
                className="inline-block w-[2px] h-[14px] bg-current ml-0.5 align-middle"
                style={{ animation: "cursor-blink 1s step-end infinite" }}
              />
            )}
          </div>
        )}
      </div>

      {/* User avatar — right side */}
      {isUser && (
        <div className="shrink-0 h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shadow-sm mb-0.5">
          <User className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export function AiChatView() {
  const { get, setParams } = useQueryParams();
  const { confirm } = useConfirm();
  const conversationIdFromUrl = get(QueryKey.thread);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(
    conversationIdFromUrl
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // True after the first load snaps to bottom; resets on unmount (tab switch).
  const didInitialScrollRef = useRef(false);

  const setActiveConversationId = useCallback(
    (id: string | null) => {
      setActiveConversationIdState(id);
      setParams({ [QueryKey.thread]: id });
    },
    [setParams]
  );

  const loadConversations = useCallback(async () => {
    const list = await aiChatService.listConversations();
    setConversations(list);
    return list;
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const rows = await aiChatService.listMessages(conversationId);
    setMessages(rows.map(toUiMessage));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsBootstrapping(true);
        const list = await loadConversations();
        if (cancelled) return;

        let activeId = conversationIdFromUrl;
        if (activeId && list.some((c) => c.id === activeId)) {
          setActiveConversationIdState(activeId);
          await loadMessages(activeId);
        } else if (list.length > 0) {
          activeId = list[0].id;
          setActiveConversationId(activeId);
          await loadMessages(activeId);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("AI chat bootstrap failed:", err);
          setError("Could not load conversations. Refresh and try again.");
          setActiveConversationIdState(null);
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationIdFromUrl, loadConversations, loadMessages, setActiveConversationId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // First load after mount: snap to bottom instantly so the latest messages are
    // visible without a visible scroll animation (avoids the jarring tab-switch jump).
    if (!didInitialScrollRef.current && !isBootstrapping) {
      didInitialScrollRef.current = true;
      el.scrollTop = el.scrollHeight;
      return;
    }

    // While actively messaging / streaming: only smooth-scroll if the user is
    // already near the bottom — never hijack when they've scrolled up to read.
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom > 150) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, isBootstrapping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(COMPOSER_MIN_HEIGHT, Math.min(el.scrollHeight, 160))}px`;
  }, [input]);

  useEffect(() => {
    if (!isBootstrapping && activeConversationId && !isLoading) {
      textareaRef.current?.focus();
    }
  }, [activeConversationId, isBootstrapping, isLoading]);

  // Accumulate stream chunks in a ref so React batching never discards them.
  const streamBufferRef = useRef("");
  const rafRef = useRef<number | null>(null);

  const flushStreamBuffer = useCallback(() => {
    rafRef.current = null;
    const text = streamBufferRef.current;
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === STREAM_MSG_ID);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], content: text };
      return updated;
    });
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || !activeConversationId) return;

    setError(null);
    setInput("");
    setIsLoading(true);
    streamBufferRef.current = "";

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: trimmed },
      { id: STREAM_MSG_ID, role: "assistant", content: "" },
    ]);

    try {
      await aiChatService.streamMessage(
        activeConversationId,
        trimmed,
        (chunk) => {
          // Accumulate in a ref — immune to React batching.
          streamBufferRef.current += chunk;
          // Schedule a single rAF flush so the DOM updates each frame.
          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(flushStreamBuffer);
          }
        }
      );

      // Cancel any pending frame, then do a final synchronous flush.
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      flushStreamBuffer();

      // Finalise: give the message a stable id and refresh the sidebar.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === STREAM_MSG_ID ? { ...m, id: `assistant-${Date.now()}` } : m
        )
      );
      await loadConversations();
    } catch (err) {
      console.error("AI chat stream failed:", err);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setMessages((prev) => prev.filter((m) => m.id !== STREAM_MSG_ID));
      setError("Unable to reach the AI service. Check your connection and try again.");
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleNewConversation = async () => {
    try {
      setIsBootstrapping(true);
      setError(null);
      const created = await aiChatService.createConversation({ sectionType: "GENERAL" });
      await loadConversations();
      setActiveConversationId(created.id);
      setMessages([]);
    } catch {
      setError("Could not start a new conversation.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSelectConversation = async (id: string) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    setError(null);
    try {
      setIsBootstrapping(true);
      await loadMessages(id);
    } catch {
      setError("Could not load this conversation.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const ok = await confirm(`Delete "${target.title}"? This cannot be undone.`, {
      title: "Delete Conversation",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;

    setDeletingConversationId(id);
    setError(null);
    try {
      await aiChatService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          const nextId = remaining[0].id;
          setActiveConversationId(nextId);
          await loadMessages(nextId);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch {
      setError("Could not delete this conversation.");
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    setRenamingConversationId(id);
    setError(null);
    try {
      const updated = await aiChatService.renameConversation(id, newTitle);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
    } catch {
      setError("Could not rename this conversation.");
    } finally {
      setRenamingConversationId(null);
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

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex flex-1 min-h-0 h-full overflow-hidden bg-neutral-50 dark:bg-zinc-950">
      <div className="flex flex-1 min-h-0 h-full w-full flex-col lg:flex-row">

        {/* Sidebar */}
        <aside className="w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col min-h-0 bg-white/80 dark:bg-zinc-900/80 border-r border-black/6 dark:border-white/6">
          <div className="shrink-0 px-4 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[17px] font-semibold tracking-tight text-foreground">AI Chat</h1>
                <p className="text-[12px] text-muted-foreground mt-0.5">Your private workspace</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                disabled={isBootstrapping}
                onClick={() => void handleNewConversation()}
                aria-label="New chat"
              >
                <SquarePen className="h-[17px] w-[17px]" strokeWidth={2} />
              </Button>
            </div>
          </div>

          <div className="mx-4 h-px bg-black/6 dark:bg-white/6 mb-2" />

          <div className="flex-1 overflow-y-auto min-h-0 px-1.5 pb-3">
            {isBootstrapping && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
                <p className="text-[12px] text-muted-foreground">No conversation history</p>
                <Button
                  size="sm"
                  className="rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 border-0 shadow-none"
                  disabled={isBootstrapping}
                  onClick={() => void handleNewConversation()}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Chat
                </Button>
              </div>
            ) : (
              conversations.map((thread) => (
                <ConversationRow
                  key={thread.id}
                  thread={thread}
                  selected={activeConversationId === thread.id}
                  onSelect={() => void handleSelectConversation(thread.id)}
                  onDelete={() => void handleDeleteConversation(thread.id)}
                  onRename={(newTitle) => void handleRenameConversation(thread.id, newTitle)}
                  deleting={deletingConversationId === thread.id}
                />
              ))
            )}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden bg-neutral-50 dark:bg-zinc-950">

          {/* Top bar */}
          <div className="shrink-0 h-[52px] px-5 flex items-center justify-center border-b border-black/6 dark:border-white/6 bg-white/80 dark:bg-zinc-900/80">
            <p className="text-[14px] font-semibold text-foreground truncate max-w-[60%] text-center tracking-tight">
              {activeConversation?.title ?? "New Chat"}
            </p>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 sm:px-6 py-6">
            {isBootstrapping ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="mx-auto max-w-3xl flex flex-col gap-3">
                {messages.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center text-center mt-24 mb-10 select-none">
                    <div className="relative mb-5">
                      <div className="relative h-14 w-14 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="h-6 w-6 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    {activeConversationId ? (
                      <>
                        <h2 className="text-[20px] font-semibold text-foreground mb-1.5 tracking-tight">AI Assistant</h2>
                        <p className="text-muted-foreground text-[14px] max-w-xs leading-relaxed">
                          Ask anything about your class content, get explanations, or explore ideas.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-[20px] font-semibold text-foreground mb-1.5 tracking-tight">No conversation selected</h2>
                        <p className="text-muted-foreground text-[14px] max-w-xs leading-relaxed mb-4">
                          Start a new chat to begin talking with your AI assistant.
                        </p>
                        <Button
                          size="sm"
                          className="rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 shadow-sm shadow-indigo-500/30 border-0"
                          disabled={isBootstrapping}
                          onClick={() => void handleNewConversation()}
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          New Chat
                        </Button>
                      </>
                    )}
                  </div>
                ) : null}

                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    streaming={msg.id === STREAM_MSG_ID}
                  />
                ))}

                {/* Show typing dots only before the streaming placeholder is added */}
                {isLoading && !messages.some((m) => m.id === STREAM_MSG_ID) ? (
                  <div className="flex justify-start items-end gap-2.5 mt-1">
                    <div className="shrink-0 h-7 w-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-white dark:bg-zinc-800 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 inline-flex items-center gap-1.5 shadow-sm">
                      <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce" />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {error ? (
            <p className="px-6 py-1.5 text-[12px] text-center text-red-500">{error}</p>
          ) : null}

          {/* Composer */}
          <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2 bg-neutral-50 dark:bg-zinc-950">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-3xl flex items-end gap-2 rounded-2xl ring-1 ring-black/8 dark:ring-white/8 bg-white dark:bg-zinc-900 px-4 py-2.5 shadow-md shadow-black/4 focus-within:ring-indigo-400/60 dark:focus-within:ring-indigo-500/40 focus-within:shadow-lg transition-all duration-200"
            >
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything…"
                  rows={1}
                  aria-label="Message"
                  disabled={isLoading || isBootstrapping || !activeConversationId}
                  className={cn(
                    "w-full min-h-[24px] max-h-[140px] resize-none bg-transparent py-0.5",
                    "text-[14px] leading-6 text-foreground placeholder:text-muted-foreground",
                    "focus-visible:outline-none disabled:opacity-50"
                  )}
                />
              </div>

              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading || isBootstrapping || !activeConversationId}
                className={cn(
                  "h-8 w-8 shrink-0 rounded-xl p-0 mb-0.5 inline-flex items-center justify-center",
                  "bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30",
                  "hover:from-indigo-600 hover:to-violet-700",
                  "disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none",
                  "dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500",
                  "transition-all duration-150"
                )}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-[15px] h-[15px] animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                )}
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground/60">
              Enter to send · Shift+Enter for new line
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}

