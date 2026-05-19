"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import type { Course, Level } from "@/types/course";
import { courseService } from "@/lib/services/course-service";
import type { CreateCoursePayload } from "@/lib/types/course-api";

const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSaved: () => void;
}

export function CourseFormDialog({
  open,
  onOpenChange,
  course,
  onSaved,
}: CourseFormDialogProps) {
  const isEdit = Boolean(course);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [institutionLogo, setInstitutionLogo] = useState("");
  const [institutionColor, setInstitutionColor] = useState("#8b5cf6");
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [pts, setPts] = useState("150");
  const [bgColor, setBgColor] = useState("from-slate-900 to-slate-700");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [prerequisite, setPrerequisite] = useState("");
  const [achievement, setAchievement] = useState("");
  const [techNames, setTechNames] = useState("");
  const [published, setPublished] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (course) {
      setTitle(course.title);
      setInstitution(course.institution);
      setInstitutionLogo(course.institutionLogo);
      setInstitutionColor(course.institutionColor);
      setLevel(course.level);
      setPts(String(course.pts));
      setBgColor(course.bgColor);
      setImageUrl(course.image ?? "");
      setDescription(course.description);
      setPrerequisite(course.prerequisite ?? "");
      setAchievement(course.achievement);
      setTechNames(course.technologies.map((t) => t.name).join(", "));
      setPublished(true);
      setLocked(course.locked ?? false);
    } else {
      setTitle("");
      setInstitution("");
      setInstitutionLogo("");
      setInstitutionColor("#8b5cf6");
      setLevel("BEGINNER");
      setPts("150");
      setBgColor("from-slate-900 to-slate-700");
      setImageUrl("");
      setDescription("");
      setPrerequisite("");
      setAchievement("");
      setTechNames("");
      setPublished(true);
      setLocked(false);
    }
  }, [open, course]);

  const buildPayload = (): CreateCoursePayload => {
    const defaultColors = ["#3776AB", "#61DAFB", "#EE4C2C", "#339933", "#FF9900"];
    const names = techNames
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const technologies = names.map((name, i) => ({
      name,
      color: defaultColors[i % defaultColors.length],
    }));

    return {
      title: title.trim(),
      institution: institution.trim(),
      institutionLogo: institutionLogo.trim() || undefined,
      institutionColor: institutionColor.trim() || undefined,
      level,
      pts: Number(pts) || 150,
      bgColor: bgColor.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      description: description.trim() || undefined,
      technologies,
      prerequisite: prerequisite.trim() || undefined,
      achievement: achievement.trim() || undefined,
      locked,
      published,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit && course) {
        await courseService.updateCourse(course.id, payload);
      } else {
        await courseService.createCourse(payload);
      }
      onSaved();
      onOpenChange(false);
    } catch {
      setError("Could not save course. Check your permissions and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "Create course"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update catalog details visible to learners."
              : "Add a new course to the institution catalog."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="course-title">Title</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="course-institution">Institution</Label>
              <Input
                id="course-institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-logo">Logo text</Label>
              <Input
                id="course-logo"
                value={institutionLogo}
                onChange={(e) => setInstitutionLogo(e.target.value)}
                placeholder="MIT"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="course-level">Level</Label>
              <select
                id="course-level"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-pts">Points</Label>
              <Input
                id="course-pts"
                type="number"
                value={pts}
                onChange={(e) => setPts(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="course-desc">Description</Label>
            <textarea
              id="course-desc"
              className="min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="course-achievement">Achievement badge</Label>
            <Input
              id="course-achievement"
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="course-tech">Technologies (comma-separated)</Label>
            <Input
              id="course-tech"
              value={techNames}
              onChange={(e) => setTechNames(e.target.value)}
              placeholder="Python, React, AWS"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="course-image">Cover image URL</Label>
            <Input
              id="course-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="course-bg">Card gradient classes</Label>
              <Input
                id="course-bg"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-color">Brand color</Label>
              <Input
                id="course-color"
                value={institutionColor}
                onChange={(e) => setInstitutionColor(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Published
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setLocked(e.target.checked)}
              />
              Locked
            </label>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
