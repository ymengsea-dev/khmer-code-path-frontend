"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GlassSelect } from "@/components/ui/glass-field";
import { classService } from "@/lib/services/class-service";
import { gradeService } from "@/lib/services/grade-service";
import type { ClassSummary } from "@/lib/types/class-api";
import type { GradebookDto } from "@/lib/types/grades-api";

function averageGrade(gradebook: GradebookDto | null): number | null {
  const grades =
    gradebook?.rows
      .map((row) => row.numericGrade)
      .filter((grade): grade is number => typeof grade === "number") ?? [];
  if (grades.length === 0) return null;
  return grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
}

export function TeacherGradebookView() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [gradebook, setGradebook] = useState<GradebookDto | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    classService
      .listClasses({ size: 100 })
      .then((page) => {
        if (cancelled) return;
        const items = page.items ?? [];
        setClasses(items);
        setSelectedClassId((current) => current ?? items[0]?.id ?? null);
      })
      .catch(() => setError("Could not load classes."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    setError(null);
    gradeService
      .getGradebook(selectedClassId)
      .then((data) => {
        setGradebook(data);
        setDrafts(
          Object.fromEntries(
            data.rows.map((row) => [
              row.studentId,
              row.numericGrade == null ? "" : String(row.numericGrade),
            ]),
          ),
        );
      })
      .catch(() => {
        setGradebook(null);
        setError("Could not load gradebook for this class.");
      })
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  const avg = useMemo(() => averageGrade(gradebook), [gradebook]);
  const gradedCount =
    gradebook?.rows.filter((row) => row.numericGrade != null).length ?? 0;

  const saveGrade = async (studentId: string, gradeId: number | null) => {
    if (!selectedClassId) return;
    const numericGrade = Number(drafts[studentId]);
    if (
      !Number.isFinite(numericGrade) ||
      numericGrade < 0 ||
      numericGrade > 100
    ) {
      setError("Grade must be a number from 0 to 100.");
      return;
    }
    setSavingStudentId(studentId);
    setError(null);
    try {
      if (gradeId) {
        await gradeService.updateGrade(gradeId, { numericGrade });
      } else {
        await gradeService.createGrade({
          classId: selectedClassId,
          studentId,
          numericGrade,
        });
      }
      const refreshed = await gradeService.getGradebook(selectedClassId);
      setGradebook(refreshed);
    } catch {
      setError("Could not save this grade.");
    } finally {
      setSavingStudentId(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-violet-500" />
            <h2 className="text-xl font-extrabold">Teacher Gradebook</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage class grades from one dedicated page.
          </p>
        </div>
        <GlassSelect
          value={selectedClassId ?? ""}
          onChange={(event) => setSelectedClassId(Number(event.target.value))}
          className="h-10 min-w-[12rem]"
        >
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </GlassSelect>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground">
            Students
          </p>
          <p className="text-2xl font-extrabold">
            {gradebook?.rows.length ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground">Graded</p>
          <p className="text-2xl font-extrabold">{gradedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground">
            Class Average
          </p>
          <p className="text-2xl font-extrabold">
            {avg == null ? "--" : avg.toFixed(1)}
          </p>
        </Card>
      </div>

      <Card className="overflow-clip">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Letter</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {gradebook?.rows.map((row) => (
                  <tr key={row.studentId} className="border-t border-border/70">
                    <td className="px-4 py-3 font-semibold">
                      {row.studentName}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={drafts[row.studentId] ?? ""}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.studentId]: event.target.value,
                          }))
                        }
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {row.letterGrade ?? "Not graded"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={savingStudentId === row.studentId}
                        onClick={() =>
                          void saveGrade(row.studentId, row.gradeId)
                        }
                      >
                        {savingStudentId === row.studentId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
