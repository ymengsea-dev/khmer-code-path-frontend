"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getUserInitials, resolveAvatarUrl } from "@/lib/auth/user-display";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  cacheBust?: string | number;
  className?: string;
  textClassName?: string;
};

export function UserAvatar({
  name,
  avatarUrl,
  cacheBust,
  className,
  textClassName,
}: UserAvatarProps) {
  const initials = getUserInitials(name);
  const src = resolveAvatarUrl(avatarUrl, cacheBust);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (src && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("rounded-full object-cover shrink-0", className)}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0",
        className
      )}
      style={{
        background: "linear-gradient(135deg, #305FC9 0%, #7c3aed 100%)",
        boxShadow: "0 4px 16px rgba(48,95,201,0.35)",
      }}
      aria-hidden
    >
      <span className={textClassName}>{initials}</span>
    </div>
  );
}
