"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { CurrentUserAvatar } from "@/components/profile/CurrentUserAvatar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { getApiErrorMessage } from "@/lib/api-error";
import { authService } from "@/lib/services/auth-service";

type EditableProfileAvatarProps = {
  className?: string;
  textClassName?: string;
  badgeClassName?: string;
};

/** Profile avatar with camera overlay; uploads via POST /profile/avatar. */
export function EditableProfileAvatar({
  className = "h-20 w-20",
  textClassName = "text-xl",
  badgeClassName = "h-7 w-7",
}: EditableProfileAvatarProps) {
  const queryClient = useQueryClient();
  const { alert } = useConfirm();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState<number | null>(null);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await authService.uploadAvatar(file);
      setCacheBust(Date.now());
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void alert("Your profile photo has been updated.", {
        title: "Photo updated",
        variant: "success",
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload your photo."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={uploading}
        onClick={() => avatarInputRef.current?.click()}
        aria-label="Change profile photo"
        className="relative shrink-0 rounded-full disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#305FC9] focus-visible:ring-offset-2"
      >
        <CurrentUserAvatar
          className={className}
          textClassName={textClassName}
          cacheBust={cacheBust ?? undefined}
        />
        {uploading ? (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        ) : (
          <span
            className={`absolute bottom-0 right-0 flex items-center justify-center rounded-full text-white shadow-sm ${badgeClassName}`}
            style={{ background: "#305FC9" }}
          >
            <Camera className="h-4 w-4" />
          </span>
        )}
      </button>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => void handleAvatarChange(e)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
