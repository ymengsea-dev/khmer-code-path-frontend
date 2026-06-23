"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Eye,
  EyeOff,
  Loader2,
  Moon,
  Save,
  Shield,
  Sun,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { EditableProfileAvatar } from "@/components/profile/EditableProfileAvatar";
import { authService } from "@/lib/services/auth-service";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
} from "@/lib/notification-preferences";
import { BouncyEnter, BouncyPress, BouncyStagger, BouncyStaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";
import { SchoolProfileSection } from "@/components/school/SchoolProfileSection";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type ThemeMode = "light" | "dark" | "system";

const GLASS: React.CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--glass-border-color)",
  boxShadow: "var(--glass-shadow)",
};

const GLASS_SUBTLE: React.CSSProperties = {
  background: "var(--glass-bg-subtle)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--glass-border-color-subtle)",
  boxShadow: "var(--glass-shadow-subtle)",
};

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", mode === "dark" || (mode === "system" && prefersDark));
}

/** Password input with individual show/hide toggle */
function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="pr-10"
          style={GLASS_SUBTLE}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/** Section card with liquid-glass */
function GlassCard({
  icon,
  iconColor,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={GLASS_SUBTLE}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** Toggle switch styled for glass panels */
function GlassToggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50",
        checked ? "bg-[#305FC9]" : "bg-muted-foreground/25"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

/** Solid blue action button */
function BlueBtn({
  loading,
  disabled,
  onClick,
  children,
}: {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <BouncyPress
      disabled={disabled || loading}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-40"
      style={{
        background: "#305FC9",
        boxShadow: disabled || loading ? "none" : "rgba(48,95,201,0.30) 0px 4px 14px",
      }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </BouncyPress>
  );
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const { alert } = useConfirm();
  const { user, roleLabel, displayName, email } = useUserProfile();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = (currentUser?.role ?? "").toLowerCase() === "admin";
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const stored = (localStorage.getItem("lms-theme") as ThemeMode | null) ?? "system";
    setTheme(stored);
    applyTheme(stored);
    setNotificationsEnabledState(getNotificationsEnabled());
  }, []);

  useEffect(() => {
    setUserName(user?.userName ?? "");
    setBio(user?.bio ?? "");
  }, [user]);

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("lms-theme", mode);
    applyTheme(mode);
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    setNotificationsEnabled(enabled);
    if (enabled && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      await authService.updateProfile({ userName: userName.trim(), bio: bio.trim() || undefined });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void alert("Your profile information has been updated.", {
        title: "Profile updated",
        variant: "success",
      });
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Could not update your profile."));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await authService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      void alert("Your password has been changed.", {
        title: "Password changed",
        variant: "success",
      });
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, "Could not change your password."));
    } finally {
      setPasswordSaving(false);
    }
  };

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: "light",  label: "Light",  icon: <Sun  className="h-4 w-4" /> },
    { id: "dark",   label: "Dark",   icon: <Moon className="h-4 w-4" /> },
    { id: "system", label: "System", icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-y-auto scrollbar-hide lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:items-stretch">

        {/* ── Left ~30%: Profile ── */}
        <div className="shrink-0 lg:min-h-0 lg:overflow-y-auto lg:scrollbar-hide">
        <BouncyEnter>
        <GlassCard icon={<UserRound className="h-4 w-4" />} iconColor="#305FC9" title="Profile">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <EditableProfileAvatar />
              <div
                className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 mt-1"
                style={{ background: "rgba(217,119,6,0.10)", color: "#d97706" }}
              >
                {roleLabel}
              </div>
            </div>

            {(displayName || email) && (
              <div className="space-y-0.5 min-w-0">
                {displayName ? (
                  <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                ) : null}
                {email ? (
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                ) : null}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name" className="text-xs font-semibold text-muted-foreground">
                  Display name
                </Label>
                <Input
                  id="settings-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your display name"
                  style={GLASS_SUBTLE}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-bio" className="text-xs font-semibold text-muted-foreground">
                  Bio
                </Label>
                <textarea
                  id="settings-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others a little about yourself…"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none"
                  style={{ ...GLASS_SUBTLE, padding: "0.5rem 0.75rem" }}
                />
                <p className="text-[11px] text-muted-foreground text-right">{bio.length}/500</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                <Input value={user?.email ?? ""} disabled style={GLASS_SUBTLE} />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
              <BlueBtn
                loading={profileSaving}
                disabled={profileSaving || !userName.trim()}
                onClick={() => void handleProfileSave()}
              >
                <Save className="h-4 w-4" />
                Save Profile
              </BlueBtn>
            </div>
          </div>
        </GlassCard>
        </BouncyEnter>
        </div>

        {/* ── Right ~70%: Preferences (scrollable) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide lg:max-h-full">
        <BouncyStagger className="flex flex-col gap-5 pb-6 min-w-0">
          <BouncyStaggerItem>
          <GlassCard icon={<Sun className="h-4 w-4" />} iconColor="#d97706" title="Appearance">
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleThemeChange(item.id)}
                  className={cn(
                    "liquid-glass-btn-subtle flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold",
                    theme === item.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    theme === item.id
                      ? { ...GLASS_SUBTLE, border: "1px solid #305FC9", color: "#305FC9" }
                      : GLASS_SUBTLE
                  }
                >
                  <span style={{ color: theme === item.id ? "#305FC9" : undefined }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </GlassCard>
          </BouncyStaggerItem>

          <BouncyStaggerItem>
          <GlassCard icon={<Bell className="h-4 w-4" />} iconColor="#305FC9" title="Notifications">
            <div
              className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
              style={GLASS_SUBTLE}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Push notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Show browser alerts when you receive new activity while the tab is in the background.
                </p>
              </div>
              <GlassToggle
                id="settings-notifications"
                checked={notificationsEnabled}
                onChange={handleNotificationsChange}
              />
            </div>
          </GlassCard>
          </BouncyStaggerItem>

          <BouncyStaggerItem>
          <GlassCard icon={<Shield className="h-4 w-4" />} iconColor="#16a34a" title="Change Password">
            <div className="space-y-4">
              <PasswordField
                id="current-password"
                label="Current password"
                value={passwordForm.currentPassword}
                onChange={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))}
              />
              <PasswordField
                id="new-password"
                label="New password"
                value={passwordForm.newPassword}
                onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))}
              />
              {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
              <BlueBtn
                loading={passwordSaving}
                disabled={
                  passwordSaving ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                onClick={() => void handlePasswordSave()}
              >
                <Shield className="h-4 w-4" />
                Change Password
              </BlueBtn>
            </div>
          </GlassCard>
          </BouncyStaggerItem>
        </BouncyStagger>

        {isAdmin && (
          <BouncyEnter className="mt-6">
            <GlassCard icon={<Shield className="h-4 w-4" />} iconColor="#305FC9" title="School registration">
              <SchoolProfileSection />
            </GlassCard>
          </BouncyEnter>
        )}
        </div>
    </div>
  );
}
