"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  userService,
  type CreateUserPayload,
} from "@/lib/services/user-service";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: CreateUserPayload["role"];
  onCreated: () => void;
}

export function AddUserDialog({
  open,
  onOpenChange,
  defaultRole = "STUDENT",
  onCreated,
}: AddUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CreateUserPayload["role"]>(defaultRole);
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole(defaultRole);
    setStudentId("");
    setTeacherId("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: CreateUserPayload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };
      if (role === "STUDENT" && studentId.trim()) {
        payload.studentId = studentId.trim();
      }
      if (role === "TEACHER" && teacherId.trim()) {
        payload.teacherId = teacherId.trim();
      }
      await userService.createUser(payload);
      reset();
      onOpenChange(false);
      onCreated();
    } catch {
      setError("Could not create user. Check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a new account with email and password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="user-name">Full name</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-2xs"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as CreateUserPayload["role"])
              }
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          {role === "STUDENT" && (
            <div className="grid gap-1.5">
              <Label htmlFor="user-student-id">Student ID (optional)</Label>
              <Input
                id="user-student-id"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="STU-2026-001"
              />
            </div>
          )}
          {role === "TEACHER" && (
            <div className="grid gap-1.5">
              <Label htmlFor="user-teacher-id">Teacher ID (optional)</Label>
              <Input
                id="user-teacher-id"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="TCH-001"
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
