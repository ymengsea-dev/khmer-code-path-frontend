"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Moon, Save, Shield, Sun, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { authService } from "@/lib/services/auth-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { getRoleLabel } from "@/lib/auth/user-display";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", mode === "dark" || (mode === "system" && prefersDark));
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const { alert } = useConfirm();
  const { data: currentUser } = useCurrentUser();
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [userName, setUserName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const stored = (localStorage.getItem("lms-theme") as ThemeMode | null) ?? "system";
    setTheme(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    setUserName(currentUser?.userName ?? "");
  }, [currentUser?.userName]);

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("lms-theme", mode);
    applyTheme(mode);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      await authService.updateProfile({ userName: userName.trim() });
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

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="px-6 py-5 border-b border-border/60 bg-white/40 dark:bg-zinc-950/40 shrink-0">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Account and application preferences
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-4 w-4 text-amber-500" />
                Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: "light" as const, label: "Light", icon: Sun },
                  { id: "dark" as const, label: "Dark", icon: Moon },
                  { id: "system" as const, label: "System", icon: Shield },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleThemeChange(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      theme === item.id
                        ? "border-violet-500 bg-violet-500/10 text-foreground"
                        : "border-border hover:bg-muted/60"
                    )}
                  >
                    <item.icon className="h-4 w-4 text-violet-500" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-4 w-4 text-violet-500" />
                  Update Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-name">Display name</Label>
                  <Input
                    id="settings-name"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={currentUser?.email ?? ""} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email is used for login and cannot be changed here.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <div>
                    <Badge variant="secondary">{getRoleLabel(currentUser?.role)}</Badge>
                  </div>
                </div>
                {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
                <Button
                  className="gap-2"
                  disabled={profileSaving || !userName.trim()}
                  onClick={() => void handleProfileSave()}
                >
                  {profileSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type={showPasswords ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords((value) => !value)}
                >
                  {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPasswords ? "Hide passwords" : "Show passwords"}
                </button>
                {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
                <Button
                  className="gap-2"
                  disabled={
                    passwordSaving ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  onClick={() => void handlePasswordSave()}
                >
                  {passwordSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
