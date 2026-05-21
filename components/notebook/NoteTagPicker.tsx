"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NOTE_TAG_COLORS,
  type NoteTag,
  DEFAULT_TAG_COLOR,
} from "@/lib/notebook/note-tags";
import { cn } from "@/lib/utils";

interface NoteTagPickerProps {
  tag: NoteTag | null;
  onChange: (tag: NoteTag | null) => void;
  disabled?: boolean;
}

export function NoteTagPicker({ tag, onChange, disabled }: NoteTagPickerProps) {
  const [open, setOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState(tag?.label ?? "");
  const color = tag?.color ?? DEFAULT_TAG_COLOR;

  const openChange = (next: boolean) => {
    if (next) setDraftLabel(tag?.label ?? "");
    setOpen(next);
  };

  const applyTag = (hex: string) => {
    const label = draftLabel.trim();
    if (!label) return;
    onChange({ label, color: hex });
    setOpen(false);
  };

  const clearTag = () => {
    onChange(null);
    setDraftLabel("");
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={openChange}>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "h-8 w-8 shrink-0 rounded-md flex items-center justify-center outline-none",
          "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
          tag && "text-foreground"
        )}
        aria-label="Note tag"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="relative flex items-center justify-center">
          <Tag className="h-4 w-4" style={tag ? { color: tag.color } : undefined} />
          {tag && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white dark:border-zinc-900"
              style={{ backgroundColor: tag.color }}
              aria-hidden
            />
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-56 p-3 rounded-xl shadow-lg"
      >
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Tag</p>
        <Input
          placeholder="Tag name"
          value={draftLabel}
          disabled={disabled}
          onChange={(e) => setDraftLabel(e.target.value)}
          className="h-8 text-[13px] mb-3"
        />
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Color</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {NOTE_TAG_COLORS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              disabled={disabled || !draftLabel.trim()}
              onClick={() => applyTag(preset.hex)}
              className={cn(
                "h-7 w-7 rounded-full border-2 mx-auto transition-transform hover:scale-110",
                color === preset.hex && tag ? "border-foreground scale-110" : "border-transparent",
                !draftLabel.trim() && "opacity-40 cursor-not-allowed"
              )}
              style={{ backgroundColor: preset.hex }}
            />
          ))}
        </div>
        {tag && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            disabled={disabled}
            onClick={clearTag}
          >
            Remove tag
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
