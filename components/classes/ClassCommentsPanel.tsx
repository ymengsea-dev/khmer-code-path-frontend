"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, CornerDownRight, Loader2, X } from "lucide-react";
import { classService } from "@/lib/services/class-service";
import type { ClassComment } from "@/lib/types/dashboard-api";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ClassCommentsPanelProps {
  classId: number;
  canPost?: boolean;
  className?: string;
}

export function ClassCommentsPanel({
  classId,
  canPost = true,
}: ClassCommentsPanelProps) {
  const [comments, setComments] = useState<ClassComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ClassComment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await classService.listClassComments(classId);
      setComments(list);
    } catch {
      setError("Could not load comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleReply = (comment: ClassComment) => {
    setReplyingTo(comment);
    setBody(`@${comment.authorName} `);
    textareaRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setBody("");
  };

  const handlePost = async () => {
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    try {
      const created = await classService.createClassComment(classId, text);
      setComments((prev) => [created, ...prev]);
      setBody("");
      setReplyingTo(null);
    } catch {
      setError("Could not post your comment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Comment list */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-3 pt-1 pb-2 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-xs text-destructive px-1">{error}</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No comments yet. Start the discussion!
          </p>
        ) : (
          comments.map((comment) => {
            const isReply = comment.body.startsWith("@");
            return (
              <div
                key={comment.id}
                className={cn("flex gap-2 group", isReply && "ml-5")}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold",
                    isReply
                      ? "bg-violet-100 text-violet-600"
                      : "bg-zinc-200 text-zinc-600",
                  )}
                >
                  {initials(comment.authorName)}
                </div>

                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div
                    className="rounded-2xl rounded-tl-sm px-3 py-2 text-xs"
                    style={{
                      background: isReply
                        ? "rgba(237,233,254,0.7)"
                        : "rgba(255,255,255,0.75)",
                      border: isReply
                        ? "1px solid rgba(196,181,253,0.5)"
                        : "1px solid rgba(255,255,255,0.9)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    {isReply && (
                      <div className="flex items-center gap-1 mb-1 text-[9px] text-violet-500 font-semibold">
                        <CornerDownRight className="h-2.5 w-2.5" />
                        Reply
                      </div>
                    )}
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-foreground truncate">
                        {comment.authorName}
                      </span>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {formatWhen(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-foreground/85 whitespace-pre-wrap leading-relaxed">
                      {comment.body}
                    </p>
                  </div>

                  {canPost && (
                    <button
                      type="button"
                      onClick={() => handleReply(comment)}
                      className="mt-1 ml-1 text-[10px] text-muted-foreground hover:text-violet-500 font-semibold flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <CornerDownRight className="h-2.5 w-2.5" />
                      Reply
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose bar */}
      {canPost && (
        <div className="shrink-0 px-3 pb-3 space-y-1.5">
          {replyingTo && (
            <div
              className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl"
              style={{
                background: "rgba(237,233,254,0.6)",
                border: "1px solid rgba(196,181,253,0.4)",
              }}
            >
              <span className="text-[10px] text-violet-600 flex items-center gap-1">
                <CornerDownRight className="h-2.5 w-2.5" />
                Replying to <strong>{replyingTo.authorName}</strong>
              </span>
              <button
                type="button"
                onClick={cancelReply}
                className="text-violet-400 hover:text-violet-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
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
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.authorName}… (Enter to post)`
                  : "Add a comment… (Enter to post)"
              }
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handlePost();
                }
              }}
              rows={1}
              className="flex-1 bg-transparent text-xs resize-none focus:outline-none placeholder:text-muted-foreground/50 min-h-[24px] max-h-20 scrollbar-hide py-0.5"
            />
            <button
              type="button"
              disabled={posting}
              onClick={() => void handlePost()}
              className="shrink-0 w-7 h-7 rounded-2xl flex items-center justify-center transition-all duration-150 border bg-[#305FC9] text-white border-[#305FC9]/20 shadow-sm shadow-slate-900/4 hover:bg-[#2854b8] hover:shadow-md hover:shadow-slate-900/6 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
            >
              {posting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
