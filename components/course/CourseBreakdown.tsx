"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { progressService } from "@/lib/services/progress-service";
import type { GradeBreakdownDto } from "@/lib/types/progress-api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

function gradeBadgeClass(grade: string) {
  if (grade === "—" || !grade) {
    return "bg-slate-500/10 border-slate-500/20 text-muted-foreground";
  }
  if (grade.startsWith("A")) {
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
  }
  if (grade.startsWith("B")) {
    return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
  }
  return "bg-slate-500/10 border-slate-500/20 text-muted-foreground";
}

export function CourseBreakdown() {
  const { data: currentUser } = useCurrentUser();
  const studentId = currentUser?.userId;
  const [rows, setRows] = useState<GradeBreakdownDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!studentId) {
          setRows([]);
          return;
        }
        const data = await progressService.getGradeBreakdown(studentId);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) {
          setError("Could not load grade breakdown.");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return (
    <section className="flex flex-col gap-4 shrink-0">
      <h2 className="text-md font-extrabold text-foreground tracking-tight uppercase dark:text-zinc-300">
        Course Breakdown
      </h2>

      <div className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border-color)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400 p-6">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">
            No enrolled classes with grades yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-black/5"
                  style={{ background: "var(--glass-bg-subtle)" }}>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Quizzes</th>
                  <th className="px-5 py-3">Midterm</th>
                  <th className="px-5 py-3">Final</th>
                  <th className="px-5 py-3">Att.</th>
                  <th className="px-5 py-3 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-[12px] font-medium text-foreground/90">
                {rows.map((row) => (
                  <tr
                    key={row.classId}
                    className="hover:bg-black/2 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {row.course}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.quizzes}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.midterm}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.finalExam}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {row.attendance}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={cn(
                          "inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs",
                          gradeBadgeClass(row.grade)
                        )}
                      >
                        {row.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
