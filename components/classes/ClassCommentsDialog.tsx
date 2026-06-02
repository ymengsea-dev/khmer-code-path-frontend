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
}

export function ClassCommentsDialog({
  open,
  onOpenChange,
  classId,
  className,
  canPost = true,
}: ClassCommentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Class discussion
          </DialogTitle>
          <DialogDescription>{className}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {open ? <ClassCommentsPanel classId={classId} canPost={canPost} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
