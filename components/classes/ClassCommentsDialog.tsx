"use client";

import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClassCommentsPanel } from "@/components/classes/ClassCommentsPanel";

interface ClassCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  className: string;
  canPost?: boolean;
  highlightCommentId?: number;
  initialReplyToId?: number;
}

export function ClassCommentsDialog({
  open,
  onOpenChange,
  classId,
  className,
  canPost = true,
  highlightCommentId,
  initialReplyToId,
}: ClassCommentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-modal-solid sm:max-w-lg h-[min(85vh,40rem)] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Class discussion
          </DialogTitle>
          <DialogDescription>{className}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {open ? (
            <ClassCommentsPanel
              classId={classId}
              canPost={canPost}
              highlightCommentId={highlightCommentId}
              initialReplyToId={initialReplyToId}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
