"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { classService } from "@/lib/services/class-service";
import type { ClassComment } from "@/lib/types/dashboard-api";
import { cn } from "@/lib/utils";

interface ClassCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  className: string;
  canPost?: boolean;
}

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

export function ClassCommentsDialog({
  open,
  onOpenChange,
  classId,
  className,
  canPost = true,
}: ClassCommentsDialogProps) {
  const [comments, setComments] = useState<ClassComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    if (open) {
      void loadComments();
    } else {
      setBody("");
      setError(null);
    }
  }, [open, loadComments]);

  const handlePost = async () => {
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    try {
      const created = await classService.createClassComment(classId, text);
      setComments((prev) => [created, ...prev]);
      setBody("");
    } catch {
      setError("Could not post your comment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Class discussion
          </DialogTitle>
          <DialogDescription>{className}</DialogDescription>
        </DialogHeader>

        {canPost && (
          <div className="space-y-2 shrink-0">
            <textarea
              placeholder="Ask a question or leave a comment for this class..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className={cn(
                "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-2xs",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              )}
            />
            <Button
              size="sm"
              className="w-full sm:w-auto"
              disabled={posting || !body.trim()}
              onClick={() => void handlePost()}
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Post comment
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No comments yet. Be the first to start the discussion.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 p-3"
              >
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
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
