"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchService } from "@/lib/services/search-service";
import type { GlobalSearchResultDto } from "@/lib/types/search-api";

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
  const [loading, setLoading] = useState(false);
  const visibleResults = query.trim().length < 2 ? [] : results;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchService
        .search(trimmed)
        .then((items) => {
          if (!cancelled) setResults(items);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search or jump to...</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search classes, lessons, quizzes, and notebook notes"
            className="pl-9"
          />
        </div>
        <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border/70">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : visibleResults.length > 0 ? (
            visibleResults.map((result) => (
              <button
                key={result.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-left last:border-b-0 hover:bg-muted/60"
                onClick={() => {
                  onNavigate(result);
                  onOpenChange(false);
                }}
              >
                <span>
                  <span className="block text-sm font-semibold">{result.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {result.subtitle || "Open item"}
                  </span>
                </span>
                <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-bold uppercase text-violet-600">
                  {result.type}
                </span>
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {query.trim().length < 2 ? "Type at least 2 characters." : "No results found."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
