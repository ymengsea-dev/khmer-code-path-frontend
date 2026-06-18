"use client";

import {
  FileText,
  Link2,
  MoreVertical,
  Pencil,
  Presentation,
  Trash2,
  Video,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MaterialLibraryItemDto } from "@/lib/types/lesson-api";
import { cn } from "@/lib/utils";
import { toPlainTextPreview } from "@/lib/editor/html-content";
import { glassBtnSubtleClass } from "@/components/ui/glass-field";

interface TemplateLibraryCardProps {
  template: MaterialLibraryItemDto;
  deleting?: boolean;
  onAssign: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TemplateLibraryCard({
  template,
  deleting,
  onAssign,
  onEdit,
  onDelete,
}: TemplateLibraryCardProps) {
  const fileCount = template.materials?.length ?? template.assetCount;
  const gradient = template.gradient?.startsWith("from-")
    ? template.gradient
    : "from-indigo-500 to-purple-600";

  return (
    <Card
      bouncy={false}
      className="border border-slate-200/80 dark:border-zinc-800/80 hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:shadow-md flex flex-col overflow-hidden h-full p-0 gap-0"
    >
      <button
        type="button"
        className={cn(
          "h-24 bg-linear-to-br relative overflow-hidden flex items-end w-full text-left pb-3 px-3",
          gradient,
        )}
        onClick={onEdit}
      >
        <div className="absolute inset-0 bg-black/10" />
        {template.iconType === "VIDEO" ? (
          <Video className="w-12 h-12 text-white/30 absolute right-4 bottom-[-10px] rotate-12 scale-150" />
        ) : (
          <Presentation className="w-12 h-12 text-white/30 absolute right-4 bottom-[-10px] rotate-12 scale-150" />
        )}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <Badge className="bg-violet-600/90 text-white font-bold border-0">
            {template.moduleTag?.trim() || "Template"}
          </Badge>
          <span className="text-[10px] font-black text-white/90 bg-black/35 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
            <FileText className="w-3 h-3" />
            {fileCount}
          </span>
        </div>
        <h3 className="relative font-extrabold text-sm text-white leading-tight drop-shadow-md line-clamp-2">
          {template.title}
        </h3>
      </button>

      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        <div
          className="flex-1 flex flex-col gap-3 cursor-pointer text-left"
          onClick={onEdit}
        >
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold flex-wrap">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-violet-500" />
              {fileCount} attached file{fileCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-3">
            {toPlainTextPreview(template.description) ||
              "No lesson notes yet — open the editor to write content."}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Button size="sm" variant="default" className="flex-1 text-xs" onClick={onEdit}>
            Open editor
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                glassBtnSubtleClass,
                "h-8 w-8 shrink-0 rounded-xl px-0 text-muted-foreground hover:text-foreground",
              )}
              aria-label={`Options for ${template.title}`}
            >
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onAssign}>
                <Link2 className="w-4 h-4 mr-2" />
                Assign to class
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit template
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={deleting}
                onClick={onDelete}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
