"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/services/auth-service";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.confirmPasswordReset({ token, newPassword, confirmPassword });
      router.push("/login");
    } catch {
      setError("This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
      <Card className="border-none bg-card/60 shadow-2xl shadow-indigo-500/10">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Your reset link is valid for one hour.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {!token ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                Missing reset token.
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="newPassword" name="newPassword" type="password" required minLength={6} className="h-11 pl-10" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="h-11" />
            </div>
            <Button type="submit" disabled={loading || !token} className="h-11">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reset password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
