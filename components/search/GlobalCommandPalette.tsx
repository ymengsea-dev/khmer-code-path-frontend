"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  FileQuestion,
  FolderOpen,
  GraduationCap,
  Loader2,
  NotebookPen,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchService } from "@/lib/services/search-service";
import type { GlobalSearchResultDto, GlobalSearchScopeDto } from "@/lib/types/search-api";
import { cn } from "@/lib/utils";

interface GlobalCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (result: GlobalSearchResultDto) => void;
}

export function GlobalCommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: GlobalCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResultDto[]>([]);
  const [scopes, setScopes] = useState<GlobalSearchScopeDto[]>([]);
  const [selectedScopeId, setSelectedScopeId] = useState<string | undefined>();
  const [isCompact, setIsCompact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [resultsVisible, setResultsVisible] = useState(false);

  const visibleResults = query.trim().length < 2 ? [] : results;
  const shouldShowResults = loading || visibleResults.length > 0;

  // Delay unmount of results panel so exit animation can play
  useEffect(() => {
    if (shouldShowResults) {
      setResultsVisible(true);
    } else {
      const timer = window.setTimeout(() => setResultsVisible(false), 280);
      return () => window.clearTimeout(timer);
    }
  }, [shouldShowResults]);
  const selectedScope = scopes.find((s) => s.id === selectedScopeId) ?? scopes[0];
  const placeholder = selectedScope?.placeholder ?? "Spotlight Search";
  const defaultScopeId = scopes[0]?.id;

  // Search debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchService
        .search(trimmed, selectedScope?.id)
        .then((items) => { if (!cancelled) setResults(items); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [query, selectedScope?.id]);

  // Reset focus when results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [visibleResults.length]);

  // Reset state when opening
  useEffect(() => {
    if (!open) return;
    setIsCompact(false);
    setQuery("");
    setResults([]);
    setLoading(false);
    setFocusedIndex(-1);
    setSelectedScopeId((current) => defaultScopeId ?? current);
    const timer = window.setTimeout(() => setIsCompact(true), 1000);
    return () => window.clearTimeout(timer);
  }, [open, defaultScopeId]);

  // Re-show buttons 1s after query is cleared
  useEffect(() => {
    if (!open || query.trim().length > 0) return;
    const timer = window.setTimeout(() => setIsCompact(true), 1000);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  // Load scopes once
  useEffect(() => {
    if (!open || scopes.length > 0) return;
    let cancelled = false;
    searchService
      .getScopes()
      .then((items) => {
        if (cancelled) return;
        setScopes(items);
        setSelectedScopeId((current) => current ?? items[0]?.id);
      })
      .catch(() => { if (!cancelled) setScopes([]); });
    return () => { cancelled = true; };
  }, [open, scopes.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-compact={isCompact ? "true" : "false"}
        className={cn(
          "search-spotlight-shell top-26 translate-y-0 gap-3 border-0 bg-transparent p-0 shadow-none",
          isCompact ? "search-spotlight-compact sm:max-w-4xl" : "search-spotlight-wide sm:max-w-2xl"
        )}
      >
        <div className="search-spotlight-bar flex flex-col gap-3 sm:flex-row sm:items-start">

          {/* unified pill */}
          <div className="search-input-wrap min-w-0 flex-1">
            <div className="search-pill overflow-hidden rounded-[2rem]">

              {/* input row */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-[#74747e]" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    const nextQuery = event.target.value;
                    setQuery(nextQuery);
                    setResults([]);
                    if (nextQuery.trim().length < 2) setLoading(false);
                    if (nextQuery.trim().length > 0) setIsCompact(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      if (visibleResults.length === 0) return;
                      event.preventDefault();
                      setFocusedIndex((i) => Math.min(i + 1, visibleResults.length - 1));
                    } else if (event.key === "ArrowUp") {
                      if (visibleResults.length === 0) return;
                      event.preventDefault();
                      setFocusedIndex((i) => Math.max(i - 1, 0));
                    } else if (event.key === "ArrowRight" && isCompact && scopes.length > 0) {
                      event.preventDefault();
                      setSelectedScopeId((cur) => {
                        const idx = scopes.findIndex((s) => s.id === cur);
                        return scopes[(idx + 1) % scopes.length]?.id ?? cur;
                      });
                      setResults([]);
                    } else if (event.key === "ArrowLeft" && isCompact && scopes.length > 0) {
                      event.preventDefault();
                      setSelectedScopeId((cur) => {
                        const idx = scopes.findIndex((s) => s.id === cur);
                        return scopes[(idx - 1 + scopes.length) % scopes.length]?.id ?? cur;
                      });
                      setResults([]);
                    } else if (event.key === "Enter" && focusedIndex >= 0) {
                      event.preventDefault();
                      const result = visibleResults[focusedIndex];
                      if (result) { onNavigate(result); onOpenChange(false); }
                    }
                  }}
                  placeholder={placeholder}
                  className="search-input-flat h-16 rounded-none border-0 bg-transparent pl-14 pr-10 text-xl font-semibold text-zinc-700 shadow-none placeholder:text-[#74747e] dark:text-zinc-100 dark:placeholder:text-zinc-300 sm:text-2xl"
                />
              </div>

              {/* expanding results */}
              {resultsVisible && (
                <div
                  data-active={shouldShowResults ? "true" : "false"}
                  className="search-pill-results border-t border-zinc-200/70 dark:border-white/10"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching…
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto py-2">
                      {visibleResults.map((result, index) => (
                        <ResultRow
                          key={result.id}
                          result={result}
                          index={index}
                          focused={index === focusedIndex}
                          onNavigate={onNavigate}
                          onClose={() => onOpenChange(false)}
                          onHover={() => setFocusedIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* scope buttons */}
          {scopes.length > 0 && (
            <div
              aria-hidden={!isCompact}
              className={cn(
                "search-scope-row flex items-center gap-3 overflow-visible pb-1 sm:pb-0",
                isCompact ? "search-scope-row-visible" : "search-scope-row-hidden"
              )}
            >
              {scopes.map((scope, index) => {
                const ScopeIcon = getScopeIcon(scope.icon);
                const selected = scope.id === selectedScope?.id;
                return (
                  <button
                    key={scope.id}
                    type="button"
                    aria-label={scope.label}
                    title={scope.label}
                    tabIndex={isCompact ? 0 : -1}
                    className={cn(
                      "search-scope-button grid h-16 w-16 shrink-0 place-items-center rounded-full border text-[#74747e] dark:text-zinc-300",
                      selected && "search-scope-button-selected text-[#305FC9]"
                    )}
                    style={{ transitionDelay: `${index * 35}ms` }}
                    onClick={() => {
                      setSelectedScopeId(scope.id);
                      setResults([]);
                      setLoading(false);
                    }}
                  >
                    <ScopeIcon className="h-7 w-7" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  result,
  index,
  focused,
  onNavigate,
  onClose,
  onHover,
}: {
  result: GlobalSearchResultDto;
  index: number;
  focused: boolean;
  onNavigate: (r: GlobalSearchResultDto) => void;
  onClose: () => void;
  onHover: () => void;
}) {
  const Icon = getScopeIcon(result.type.toLowerCase());
  const ref = (el: HTMLButtonElement | null) => {
    if (focused && el) el.scrollIntoView({ block: "nearest" });
  };
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center gap-4 px-5 py-3 text-left transition-colors",
        focused
          ? "bg-[#305FC9]/12 dark:bg-[#305FC9]/22"
          : "hover:bg-zinc-100/70 dark:hover:bg-white/6"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
      onMouseEnter={onHover}
      onClick={() => { onNavigate(result); onClose(); }}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/8 dark:text-zinc-400">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{result.title}</span>
        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
          {result.subtitle || result.type}
        </span>
      </span>
      <span className="search-type-chip shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-300">
        {result.type}
      </span>
    </button>
  );
}

function getScopeIcon(icon: string): LucideIcon {
  switch (icon) {
    case "graduation-cap":
    case "class":      return GraduationCap;
    case "book-open":
    case "lesson":     return BookOpen;
    case "file-question":
    case "quiz":       return FileQuestion;
    case "notebook-pen":
    case "notebook":   return NotebookPen;
    case "search":
    default:           return Search;
  }
}
