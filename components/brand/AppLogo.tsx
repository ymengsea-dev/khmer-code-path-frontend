import Image from "next/image";
import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  className?: string;
  iconClassName?: string;
};

/** School crest — no frame, sized via `className`. */
export function AppLogoMark({ className, iconClassName }: AppLogoMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt="AI-LMS"
      width={256}
      height={140}
      className={cn("shrink-0 object-contain object-left", className, iconClassName)}
      priority
    />
  );
}
