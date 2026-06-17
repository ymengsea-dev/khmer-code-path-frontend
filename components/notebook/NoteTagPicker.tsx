"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import {
  glassBtnSubtleClass,
  glassInputClass,
} from "@/components/ui/glass-field";
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
        className="liquid-glass-btn inline-flex items-center justify-center h-7 w-7 rounded-xl outline-none disabled:opacity-40"
        aria-label={tag ? `Tag: ${tag.label}` : "Note tag"}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="relative flex items-center justify-center">
          <Tag className="h-3.5 w-3.5" style={tag ? { color: tag.color } : undefined} />
          {tag && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: tag.color }}
              aria-hidden
            />
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="glass-modal w-60 p-4 rounded-2xl min-w-60"
      >
        <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Tag
        </p>
        <input
          placeholder="Tag name"
          value={draftLabel}
          disabled={disabled}
          onChange={(e) => setDraftLabel(e.target.value)}
          className={cn(glassInputClass, "h-9 text-[13px] mb-4")}
        />
        <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Color
        </p>
        <div
          className="grid grid-cols-4 gap-2 mb-4 p-2.5 rounded-xl"
          style={{
            background: "var(--glass-bg-subtle)",
            border: "1px solid var(--glass-border-color-subtle)",
          }}
        >
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
          <button
            type="button"
            className={cn(glassBtnSubtleClass, "w-full h-9 text-xs")}
            disabled={disabled}
            onClick={clearTag}
          >
            Remove tag
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
