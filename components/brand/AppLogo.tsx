import Image from "next/image";
import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  className?: string;
  iconClassName?: string;
};

/** School crest mark — sidebar and branding. */
export function AppLogoMark({ className, iconClassName }: AppLogoMarkProps) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="AI-LMS"
        width={64}
        height={64}
        className={cn("size-full object-contain p-0.5", iconClassName)}
        priority
      />
    </span>
  );
}
