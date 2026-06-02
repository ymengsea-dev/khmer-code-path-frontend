"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CornerDownRight, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-4">
      {canPost && (
        <div className="space-y-2">
          {replyingTo && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800/40">
              <span className="text-xs text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                <CornerDownRight className="h-3 w-3 shrink-0" />
                Replying to <strong>{replyingTo.authorName}</strong>
              </span>
              <button
                type="button"
                onClick={cancelReply}
                className="text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                aria-label="Cancel reply"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            placeholder={
              replyingTo
                ? `Reply to ${replyingTo.authorName}…`
                : "Ask a question or share a thought about this class..."
            }
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void handlePost();
              }
            }}
            rows={3}
            className={cn(
              "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-2xs",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            )}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Ctrl+Enter to post
            </span>
            <Button
              size="sm"
              disabled={posting || !body.trim()}
              onClick={() => void handlePost()}
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              {replyingTo ? "Post reply" : "Post comment"}
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to start the discussion.
          </p>
        ) : (
          comments.map((comment) => {
            const isReply = comment.body.startsWith("@");
            return (
              <div
                key={comment.id}
                className={cn(
                  "rounded-lg border bg-slate-50/50 dark:bg-zinc-900/40 p-3",
                  isReply
                    ? "ml-6 border-violet-200/60 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-950/20"
                    : "border-slate-200/80 dark:border-zinc-800"
                )}
              >
                {isReply && (
                  <div className="flex items-center gap-1 mb-1.5 text-[10px] text-violet-500 dark:text-violet-400 font-semibold">
                    <CornerDownRight className="h-3 w-3" />
                    Reply
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">
                    {comment.authorName}
                    <span className="text-muted-foreground font-normal text-xs ml-1.5">
                      {comment.authorRole?.toLowerCase()}
                    </span>
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatWhen(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {comment.body}
                </p>
                {canPost && (
                  <button
                    type="button"
                    onClick={() => handleReply(comment)}
                    className="mt-2 text-[11px] text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <CornerDownRight className="h-3 w-3" />
                    Reply
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
