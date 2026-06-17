"use client";

import { UserAvatar } from "@/components/profile/UserAvatar";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

type CurrentUserAvatarProps = {
  className?: string;
  textClassName?: string;
  cacheBust?: string | number;
};

/** Avatar for the signed-in user; reads profile from the shared auth/me query. */
export function CurrentUserAvatar({
  className,
  textClassName,
  cacheBust,
}: CurrentUserAvatarProps) {
  const { avatarName, avatarUrl } = useUserProfile();

  return (
    <UserAvatar
      name={avatarName}
      avatarUrl={avatarUrl}
      cacheBust={cacheBust}
      className={className}
      textClassName={textClassName}
    />
  );
}
