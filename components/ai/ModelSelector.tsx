"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Bot, Sparkles } from "lucide-react";
import { aiChatService, type AiModelDto } from "@/lib/services/ai-chat-service";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "ai.selectedModel";
let cache: Promise<AiModelDto[]> | null = null;

function loadModels() {
  if (!cache) cache = aiChatService.getModels();
  return cache;
}

// Provider is derived from the id prefix ("ollama:..." / "google:..."), which is
// always lowercase — do NOT use `m.provider`, the backend serializes that enum
// UPPERCASE ("OLLAMA"/"GOOGLE") and it won't match here.
function providerOf(m: AiModelDto) {
  return m.id.split(":")[0];
}

const PROVIDER_META: Record<string, { label: string; dot: string }> = {
  ollama: { label: "Local · Ollama", dot: "#6B7280" },
  google: { label: "Gemini API", dot: "#305FC9" },
};

interface Props {
  value: string | null;
  onChange: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({ value, onChange, className }: Props) {
  const [models, setModels] = useState<AiModelDto[]>([]);

  useEffect(() => {
    let active = true;
    loadModels().then((list) => {
      if (!active) return;
      setModels(list);
      if (!value) {
        const stored = localStorage.getItem(STORAGE_KEY);
        const initial =
          (stored && list.find((m) => m.id === stored && m.available)?.id) ||
          list.find((m) => m.available)?.id ||
          list[0]?.id;
        if (initial) onChange(initial);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const providers = Array.from(new Set(models.map(providerOf)));
  const active = models.find((m) => m.id === value);
  const activeMeta = active ? PROVIDER_META[providerOf(active)] : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-colors outline-none",
          "hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50",
          className,
        )}
        style={{
          background: "var(--glass-bg-subtle)",
          border: "1px solid var(--glass-border-color)",
        }}
      >
        <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          <Bot className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
          <span
            className="absolute -right-0.5 -bottom-0.5 h-1.5 w-1.5 rounded-full"
            style={{
              background: active ? (active.available ? "#22c55e" : "#f59e0b") : "#9ca3af",
              boxShadow: "0 0 0 2px var(--glass-bg-subtle)",
            }}
          />
        </span>
        <span className="max-w-35 truncate">
          {active?.displayName ?? "Select model"}
        </span>
        <ChevronDown
          className="h-3 w-3 text-muted-foreground transition-transform duration-150 group-data-popup-open:rotate-180"
          strokeWidth={2}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        className="w-64 rounded-2xl p-1.5"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border-color)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <DropdownMenuRadioGroup
          value={value ?? undefined}
          onValueChange={(next) => {
            const id = String(next);
            localStorage.setItem(STORAGE_KEY, id);
            onChange(id);
          }}
        >
          {providers.map((provider, i) => {
            const meta = PROVIDER_META[provider] ?? { label: provider, dot: "#9ca3af" };
            return (
              <div key={provider}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: meta.dot }}
                    />
                    {meta.label}
                  </DropdownMenuLabel>
                  {models
                    .filter((m) => providerOf(m) === provider)
                    .map((m) => (
                      <DropdownMenuRadioItem
                        key={m.id}
                        value={m.id}
                        disabled={!m.available}
                        className="pl-2.5 text-[13px]"
                      >
                        <Sparkles
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          strokeWidth={2}
                        />
                        <span className="flex-1 truncate">{m.displayName}</span>
                        {!m.available && (
                          <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                            offline
                          </span>
                        )}
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuGroup>
              </div>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
