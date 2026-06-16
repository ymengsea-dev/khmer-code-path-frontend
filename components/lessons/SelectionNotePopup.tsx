"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { noteService } from "@/lib/services/note-service";

interface SelectionNotePopupProps {
  /** Refs of containers where text selection should trigger the popup */
  containerIds: string[];
  lessonTitle?: string;
  lessonId?: number;
}

interface PopupPos {
  x: number;
  y: number;
  text: string;
}

export function SelectionNotePopup({ containerIds, lessonTitle, lessonId }: SelectionNotePopupProps) {
  const [popup, setPopup] = useState<PopupPos | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small delay so the selection is fully committed
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() ?? "";

        if (!text || !selection?.rangeCount) {
          setPopup(null);
          return;
        }

        const range = selection.getRangeAt(0);
        const ancestor = range.commonAncestorContainer as Node;

        // Check if selection is inside one of the registered containers
        const insideContainer = containerIds.some((id) => {
          const el = document.getElementById(id);
          return el?.contains(ancestor);
        });

        if (!insideContainer) {
          setPopup(null);
          return;
        }

        // Place popup just below the mouse cursor
        setPopup({ x: e.clientX, y: e.clientY + 14, text });
        setSaved(false);
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const popupEl = document.getElementById("selection-note-popup");
      if (popupEl && popupEl.contains(e.target as Node)) return;
      setPopup(null);
    };

    const handleKeyDown = () => setPopup(null);

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerIds]);

  const handleSave = async () => {
    if (!popup || saving) return;
    setSaving(true);
    try {
      await noteService.create({
        title: lessonTitle ? `Note from "${lessonTitle}"` : "Saved note",
        bodyHtml: `<blockquote>${popup.text}</blockquote>`,
        sourceLabel: lessonTitle,
        lessonId,
        tags: ["Highlighted"],
      });
      setSaved(true);
      setTimeout(() => {
        setPopup(null);
        setSaved(false);
      }, 1000);
    } catch {
      setSaving(false);
    }
  };

  if (!popup) return null;

  return (
    <div
      id="selection-note-popup"
      style={{
        position: "fixed",
        left: popup.x,
        top: popup.y,
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => void handleSave()}
        disabled={saving || saved}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 duration-100"
        style={{
          background: "rgba(24,24,27,0.88)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          color: "white",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {saving ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : saved ? (
          <><Check className="w-3 h-3 text-green-400" />Saved</>
        ) : (
          <><BookmarkPlus className="w-3 h-3" />Add to note</>
        )}
      </button>
    </div>
  );
}
