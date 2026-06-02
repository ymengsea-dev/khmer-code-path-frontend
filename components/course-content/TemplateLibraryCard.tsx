"use client";

import { Link2, Pencil, Presentation, Trash2, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LibraryIconTypeDto, MaterialLibraryItemDto } from "@/lib/types/lesson-api";
import { cn } from "@/lib/utils";
import { toPlainTextPreview } from "@/lib/editor/html-content";

function TemplateIcon({ icon }: { icon: LibraryIconTypeDto }) {
  const Icon = icon === "VIDEO" ? Video : Presentation;
  return <Icon className="h-10 w-10 text-white/90" />;
}

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

  return (
    <Card className="overflow-hidden border-slate-200/80 dark:border-zinc-800 shadow-2xs p-0 gap-0">
      <div
        className={cn(
          "h-28 flex items-center justify-center bg-gradient-to-br text-white",
          template.gradient
        )}
      >
        <TemplateIcon icon={template.iconType} />
      </div>
      <CardContent className="p-5">
        <h3 className="font-bold text-foreground">{template.title}</h3>
        <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-medium text-muted-foreground">
          {template.moduleTag ? <span>{template.moduleTag}</span> : null}
          {template.moduleTag ? <span>•</span> : null}
          <span>
            {fileCount} attached file{fileCount === 1 ? "" : "s"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3">
          {toPlainTextPreview(template.description) ||
            "No lesson notes yet — open the editor to write content."}
        </p>
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-[2]" onClick={onAssign}>
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Assign to Class
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 px-2"
            aria-label={`Edit ${template.title}`}
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 px-2 text-destructive hover:text-destructive"
            aria-label={`Delete ${template.title}`}
            disabled={deleting}
            onClick={onDelete}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
