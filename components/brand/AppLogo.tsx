import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  className?: string;
  iconClassName?: string;
};

/** Monochrome AI-LMS mark — black in light mode, white in dark mode. */
export function AppLogoMark({ className, iconClassName }: AppLogoMarkProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={cn("size-4 fill-zinc-900 dark:fill-white", iconClassName)}
      >
        <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
      </svg>
    </span>
  );
}
