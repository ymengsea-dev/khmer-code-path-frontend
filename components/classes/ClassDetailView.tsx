"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  FlaskConical,
  HelpCircle,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  GlassInput,
  GlassSelect,
  glassInputClass,
  glassBtnPrimaryClass,
  glassBtnSubtleClass,
} from "@/components/ui/glass-field";
import { GlassButton } from "@/components/ui/glass-button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { classService } from "@/lib/services/class-service";
import { lessonService } from "@/lib/services/lesson-service";
import { quizService } from "@/lib/services/quiz-service";
import type {
  ClassDetail,
  ClassSettingsConfigDto,
  ClassStatus,
  ClassVisibility,
  GradingWeightKey,
  GradingWeightsDto,
} from "@/lib/types/class-api";
import type { LessonSummaryDto, MaterialLibraryItemDto } from "@/lib/types/lesson-api";
import type { QuizDto } from "@/lib/types/quiz-api";
import { cn } from "@/lib/utils";
import { ScoreBreakdownPanel, gradingWeightsTotal } from "@/components/classes/ScoreBreakdownPanel";
import { ClassStudentsPanel } from "@/components/classes/ClassStudentsPanel";
import { CLASSES_UPDATED_EVENT } from "@/components/notifications/notification-context";

type SectionId = string;

interface ClassDetailViewProps {
  classId: string | null;
  onBack: () => void;
  onEnterClass?: (payload: { classId: string; title: string; module: string }) => void;
  onClassNameLoaded?: (name: string) => void;
}

function glassSectionStyle() {
  return {
    background: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    border: "1px solid var(--glass-border-color)",
  } as const;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function SectionCard({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  saveDisabled,
  saveLabel = "Save",
  children,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  saveLabel?: string;
  children: ReactNode;
}) {
  return (
    <Card bouncy={false} className="rounded-2xl p-5 space-y-4" style={glassSectionStyle()}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
        {editing ? (
          <div className="flex items-center gap-2">
            <GlassButton
              subtle
              className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5"
              onClick={onCancel}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </GlassButton>
            <button
              type="button"
              disabled={saving || saveDisabled}
              onClick={onSave}
              className={cn(glassBtnPrimaryClass, "h-8 px-3 text-xs gap-1.5")}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saveLabel}
            </button>
          </div>
        ) : (
          <GlassButton
            subtle
            className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </GlassButton>
        )}
      </div>
      {children}
    </Card>
  );
}

function formatSemesterLabel(semester: string | null, academicYear: number | null) {
  if (!semester?.trim()) {
    return academicYear != null ? String(academicYear) : "—";
  }
  if (academicYear != null) return `${semester.trim()}, ${academicYear}`;
  return semester.trim();
}

export function ClassDetailView({ classId, onBack, onEnterClass, onClassNameLoaded }: ClassDetailViewProps) {
  const { confirm } = useConfirm();
  const parsedId = classId ? Number(classId) : NaN;

  const [config, setConfig] = useState<ClassSettingsConfigDto | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingSection, setEditingSection] = useState<SectionId | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [schedule, setSchedule] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [status, setStatus] = useState<ClassStatus>("ACTIVE");
  const [visibility, setVisibility] = useState<ClassVisibility>("PRIVATE");
  const [departmentId, setDepartmentId] = useState("");
  const [weights, setWeights] = useState<GradingWeightsDto>({
    attendance: 10,
    assignment: 10,
    quiz: 5,
    midterm: 25,
    finalExam: 50,
  });

  const [savingSection, setSavingSection] = useState<SectionId | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);

  const [lessons, setLessons] = useState<LessonSummaryDto[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [libraryItems, setLibraryItems] = useState<MaterialLibraryItemDto[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assigningTemplate, setAssigningTemplate] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);

  const [classQuizzes, setClassQuizzes] = useState<QuizDto[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);
  const [quizCatalog, setQuizCatalog] = useState<QuizDto[]>([]);
  const [quizCatalogLoading, setQuizCatalogLoading] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [assigningQuiz, setAssigningQuiz] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState<number | null>(null);

  const applyDetail = useCallback((data: ClassDetail) => {
    setDetail(data);
    setName(data.name);
    setCode(data.code);
    setDescription(data.description ?? "");
    setSemester(data.semester ?? "");
    setAcademicYear(data.academicYear != null ? String(data.academicYear) : "");
    setSchedule(data.schedule ?? "");
    setRoomNumber(data.roomNumber ?? "");
    setStatus(data.status);
    setVisibility(data.visibility ?? "PRIVATE");
    setDepartmentId(data.departmentId != null ? String(data.departmentId) : "");
    if (data.gradingWeights) setWeights(data.gradingWeights);
  }, []);

  const resetDraftsFromDetail = useCallback(() => {
    if (!detail) return;
    applyDetail(detail);
    setSelectedTemplateId("");
    setSelectedQuizId("");
  }, [applyDetail, detail]);

  useEffect(() => {
    if (detail?.name) onClassNameLoaded?.(detail.name);
  }, [detail?.name, onClassNameLoaded]);

  const loadClass = useCallback(async () => {
    if (!Number.isFinite(parsedId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setConfigError(null);
    try {
      const [settingsConfig, classDetail] = await Promise.all([
        classService.getClassSettingsConfig(parsedId),
        classService.getClass(parsedId),
      ]);
      setConfig(settingsConfig);
      applyDetail(classDetail);
    } catch {
      setConfig(null);
      setDetail(null);
      setConfigError("Could not load class details.");
    } finally {
      setLoading(false);
    }
  }, [applyDetail, parsedId]);

  const loadLessons = useCallback(async () => {
    if (!Number.isFinite(parsedId)) return;
    setLessonsLoading(true);
    setLessonsError(null);
    try {
      const rows = await lessonService.listLessons(parsedId);
      setLessons(rows);
    } catch {
      setLessons([]);
      setLessonsError("Could not load lessons.");
    } finally {
      setLessonsLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  useEffect(() => {
    if (Number.isFinite(parsedId)) void loadLessons();
  }, [loadLessons, parsedId]);

  const loadClassQuizzes = useCallback(async () => {
    if (!Number.isFinite(parsedId)) return;
    setQuizzesLoading(true);
    setQuizzesError(null);
    try {
      const rows = await quizService.listForClass(parsedId);
      setClassQuizzes(rows);
    } catch {
      setClassQuizzes([]);
      setQuizzesError("Could not load quizzes.");
    } finally {
      setQuizzesLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    if (Number.isFinite(parsedId)) void loadClassQuizzes();
  }, [loadClassQuizzes, parsedId]);

  const refreshEnrollmentSummary = useCallback(async () => {
    if (!Number.isFinite(parsedId)) return;
    try {
      const updated = await classService.getClass(parsedId);
      applyDetail(updated);
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
    } catch {
      /* roster panel already shows errors */
    }
  }, [applyDetail, parsedId]);

  const loadQuizCatalog = useCallback(async () => {
    if (!Number.isFinite(parsedId)) return;
    setQuizCatalogLoading(true);
    try {
      const rows = await quizService.listForClass();
      setQuizCatalog(rows.filter((q) => q.classId !== parsedId));
    } catch {
      setQuizCatalog([]);
    } finally {
      setQuizCatalogLoading(false);
    }
  }, [parsedId]);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const items = await lessonService.listLibrary();
      setLibraryItems(items);
    } catch {
      setLibraryItems([]);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (editingSection === "lessons") void loadLibrary();
  }, [editingSection, loadLibrary]);

  useEffect(() => {
    if (editingSection === "quizzes") void loadQuizCatalog();
  }, [editingSection, loadQuizCatalog]);

  const startEdit = (sectionId: SectionId) => {
    setSectionError(null);
    setEditingSection(sectionId);
  };

  const cancelEdit = () => {
    resetDraftsFromDetail();
    setSectionError(null);
    setEditingSection(null);
  };

  const statusLabel =
    config?.statusOptions.find((o) => o.value === detail?.status)?.label ?? detail?.status ?? "—";
  const visibilityLabel =
    config?.visibilityOptions.find((o) => o.value === detail?.visibility)?.label ??
    detail?.visibilityLabel ??
    "—";

  const selectedDepartment = config?.departmentOptions?.find(
    (o) => String(o.id) === departmentId,
  );

  const facultyLabel = selectedDepartment?.facultyName ?? detail?.facultyName ?? "—";
  const departmentLabel = selectedDepartment?.name ?? detail?.departmentName ?? "—";

  const handleSaveGeneral = async () => {
    if (!Number.isFinite(parsedId) || !name.trim() || !code.trim()) return;
    setSavingSection("general");
    setSectionError(null);
    try {
      const updated = await classService.updateClass(parsedId, {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        semester: semester.trim() || undefined,
        academicYear: academicYear ? Number(academicYear) : undefined,
        schedule: schedule.trim() || undefined,
        roomNumber: roomNumber.trim() || undefined,
        status,
        visibility,
        departmentId: departmentId ? Number(departmentId) : undefined,
      });
      applyDetail(updated);
      setEditingSection(null);
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
    } catch {
      setSectionError("Could not save class information.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveGrading = async () => {
    if (!Number.isFinite(parsedId)) return;
    if (gradingWeightsTotal(weights) !== 100) {
      setSectionError("Score components must add up to 100%.");
      return;
    }
    setSavingSection("grading");
    setSectionError(null);
    try {
      const updated = await classService.updateClass(parsedId, { gradingWeights: weights });
      applyDetail(updated);
      setEditingSection(null);
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
    } catch {
      setSectionError("Could not save score breakdown.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleAssignFromCourseContent = async () => {
    const templateId = Number(selectedTemplateId);
    if (!Number.isFinite(parsedId) || !Number.isFinite(templateId)) return;
    setAssigningTemplate(true);
    setLessonsError(null);
    try {
      await lessonService.assignLibraryToClass(templateId, parsedId);
      setSelectedTemplateId("");
      await loadLessons();
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
    } catch {
      setLessonsError("Could not assign lesson from content management.");
    } finally {
      setAssigningTemplate(false);
    }
  };

  const handleAssignQuizToClass = async () => {
    const sourceId = Number(selectedQuizId);
    if (!Number.isFinite(parsedId) || !Number.isFinite(sourceId)) return;
    setAssigningQuiz(true);
    setQuizzesError(null);
    try {
      const source = await quizService.getQuiz(sourceId);
      const content = source.generatedContent?.trim();
      if (!content) {
        setQuizzesError("This quiz has no content to copy. Open it on the Quizzes page and save first.");
        return;
      }
      await quizService.publish({
        title: source.title,
        description: source.description ?? undefined,
        classId: parsedId,
        generatedContent: content,
        questionCount: source.questionCount,
        durationMinutes: source.durationMinutes ?? 30,
      });
      setSelectedQuizId("");
      await loadClassQuizzes();
    } catch {
      setQuizzesError("Could not assign quiz to this class.");
    } finally {
      setAssigningQuiz(false);
    }
  };

  const handleRemoveQuiz = async (quiz: QuizDto) => {
    const ok = await confirm(`Remove "${quiz.title}" from this class?`, {
      title: "Remove quiz",
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) return;
    setDeletingQuizId(quiz.id);
    try {
      await quizService.delete(quiz.id);
      await loadClassQuizzes();
    } catch {
      setQuizzesError("Could not remove quiz from this class.");
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleRemoveLesson = async (lesson: LessonSummaryDto) => {
    const ok = await confirm(`Remove "${lesson.title}" from this class?`, {
      title: "Remove lesson",
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (!ok) return;
    setDeletingLessonId(lesson.id);
    try {
      await lessonService.deleteLesson(lesson.id);
      await loadLessons();
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
    } catch {
      setLessonsError("Could not remove lesson from this class.");
    } finally {
      setDeletingLessonId(null);
    }
  };

  const handleDeleteClass = async () => {
    if (!detail) return;
    const ok = await confirm(
      `"${detail.name}" and all its lessons will be permanently deleted. This cannot be undone.`,
      { title: "Delete class", confirmLabel: "Delete", variant: "destructive" },
    );
    if (!ok) return;
    setDeletingClass(true);
    try {
      await classService.deleteClass(detail.id);
      window.dispatchEvent(new Event(CLASSES_UPDATED_EVENT));
      onBack();
    } catch {
      setSectionError("Could not delete this class. Remove students and lessons first.");
    } finally {
      setDeletingClass(false);
    }
  };

  const sectionById = (id: string) => config?.tabs.find((t) => t.id === id);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (configError || !config || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <p className="text-sm font-semibold">{configError ?? "Class not found."}</p>
        <GlassButton subtle className="h-9 px-4 rounded-xl text-xs font-semibold" onClick={onBack}>
          Back to classes
        </GlassButton>
      </div>
    );
  }

  const semesterLabel = formatSemesterLabel(detail.semester, detail.academicYear);
  const scoreComponents = config.scoreComponents;

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-3 pb-5">
        <GlassButton
          subtle
          className="h-9 w-9 rounded-xl shrink-0"
          aria-label="Back to classes"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </GlassButton>
        <button
          type="button"
          onClick={() =>
            onEnterClass?.({
              classId: String(detail.id),
              title: detail.name,
              module: semesterLabel,
            })
          }
          className={cn(glassBtnPrimaryClass, "gap-2 h-10 px-5 shrink-0")}
        >
          View class
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-4 pb-6">
        {sectionById("general") && (
          <SectionCard
            title={sectionById("general")!.label}
            editing={editingSection === "general"}
            onEdit={() => startEdit("general")}
            onCancel={cancelEdit}
            onSave={() => void handleSaveGeneral()}
            saving={savingSection === "general"}
            saveDisabled={!name.trim() || !code.trim()}
          >
            {editingSection === "general" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Class name</Label>
                  <GlassInput value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Class code</Label>
                  <GlassInput value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Status</Label>
                  <GlassSelect
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClassStatus)}
                  >
                    {config.statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </GlassSelect>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Visibility</Label>
                  {config?.publicCoursesEnabled ? (
                    <>
                      <GlassSelect
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as ClassVisibility)}
                      >
                        {(config?.visibilityOptions ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </GlassSelect>
                      {(config?.visibilityOptions ?? []).find((o) => o.value === visibility)?.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {(config?.visibilityOptions ?? []).find((o) => o.value === visibility)?.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-foreground">{visibilityLabel}</p>
                      {visibility === "PUBLIC" && (config?.visibilityOptions ?? []).length > 0 && (
                        <GlassSelect
                          value="PRIVATE"
                          onChange={() => setVisibility("PRIVATE")}
                        >
                          {(config?.visibilityOptions ?? []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </GlassSelect>
                      )}
                      {config?.publicCoursesDisabledHint && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {config.publicCoursesDisabledHint}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Department</Label>
                  <GlassSelect
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    {(config?.departmentOptions ?? []).map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.facultyName} · {opt.name}
                      </option>
                    ))}
                  </GlassSelect>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Semester</Label>
                  <GlassInput value={semester} onChange={(e) => setSemester(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Academic year</Label>
                  <GlassInput
                    type="number"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Schedule</Label>
                  <GlassInput value={schedule} onChange={(e) => setSchedule(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Room</Label>
                  <GlassInput value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Description</Label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(glassInputClass, "min-h-[96px] py-2.5 resize-y")}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Class name" value={detail.name} />
                <DetailRow label="Class code" value={detail.code} />
                <DetailRow label="Status" value={statusLabel} />
                <DetailRow label="Visibility" value={visibilityLabel} />
                <DetailRow label="Faculty" value={facultyLabel} />
                <DetailRow label="Department" value={departmentLabel} />
                <DetailRow label="Teacher" value={detail.teacher?.name} />
                <DetailRow
                  label="Students enrolled"
                  value={detail.enrollment?.enrolled ?? 0}
                />
                <DetailRow label="Semester" value={semesterLabel} />
                <DetailRow label="Schedule" value={detail.schedule} />
                <DetailRow label="Room" value={detail.roomNumber} />
                <div className="sm:col-span-2 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {detail.description?.trim() || "No description yet."}
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {sectionById("students") && (
          <SectionCard
            title={sectionById("students")!.label}
            editing={editingSection === "students"}
            onEdit={() => startEdit("students")}
            onCancel={cancelEdit}
            onSave={() => setEditingSection(null)}
            saveLabel="Done"
          >
            <ClassStudentsPanel
              classId={parsedId}
              editing={editingSection === "students"}
              onRosterChanged={() => void refreshEnrollmentSummary()}
            />
          </SectionCard>
        )}

        {sectionById("grading") && detail.gradingWeights && scoreComponents.length > 0 && (
          <SectionCard
            title={sectionById("grading")!.label}
            editing={editingSection === "grading"}
            onEdit={() => startEdit("grading")}
            onCancel={cancelEdit}
            onSave={() => void handleSaveGrading()}
            saving={savingSection === "grading"}
            saveDisabled={gradingWeightsTotal(weights) !== 100}
          >
            {editingSection === "grading" ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Weights must total 100%. Students see this breakdown on the class detail view.
                </p>
                <ScoreBreakdownPanel
                  scoreComponents={scoreComponents}
                  weights={weights}
                  editable
                  onWeightChange={(key: GradingWeightKey, value: number) => {
                    setWeights((prev) => ({ ...prev, [key]: value }));
                  }}
                />
              </>
            ) : (
              <ScoreBreakdownPanel
                scoreComponents={scoreComponents}
                weights={detail.gradingWeights}
              />
            )}
          </SectionCard>
        )}

        {sectionById("lessons") && (
          <SectionCard
            title={sectionById("lessons")!.label}
            editing={editingSection === "lessons"}
            onEdit={() => startEdit("lessons")}
            onCancel={cancelEdit}
            onSave={() => setEditingSection(null)}
            saveLabel="Done"
          >
            {editingSection === "lessons" && (
              <div className="space-y-2 pb-2">
                <p className="text-xs text-muted-foreground">
                  Pick a template from Content Management to add it as a lesson in this class.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <GlassSelect
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    disabled={libraryLoading || libraryItems.length === 0}
                    className="flex-1 min-w-0"
                  >
                    <option value="">
                      {libraryLoading
                        ? "Loading templates…"
                      : libraryItems.length === 0
                          ? "No content templates"
                          : "Select a template…"}
                    </option>
                    {libraryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                        {item.assetCount > 0 ? ` (${item.assetCount} files)` : ""}
                      </option>
                    ))}
                  </GlassSelect>
                  <button
                    type="button"
                    disabled={
                      assigningTemplate ||
                      libraryLoading ||
                      !selectedTemplateId
                    }
                    onClick={() => void handleAssignFromCourseContent()}
                    className={cn(glassBtnPrimaryClass, "gap-2 h-11 px-4 shrink-0")}
                  >
                    {assigningTemplate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Assign to class
                  </button>
                </div>
              </div>
            )}

            {lessonsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No lessons yet.
                {editingSection === "lessons"
                  ? " Assign a template above to add lessons."
                  : " Click Edit to manage lessons."}
              </p>
            ) : editingSection === "lessons" ? (
              <ul className="space-y-2">
                {lessons.map((lesson, index) => (
                  <li
                    key={lesson.id}
                    className="rounded-xl px-3 py-2.5 flex items-center gap-3 border border-black/5"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{lesson.title}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                      <FileText className="h-3 w-3" />
                      {lesson.materialCount}
                    </span>
                    <GlassButton
                      subtle
                      className="h-9 w-9 rounded-xl text-destructive shrink-0"
                      disabled={deletingLessonId === lesson.id}
                      aria-label={`Remove ${lesson.title}`}
                      onClick={() => void handleRemoveLesson(lesson)}
                    >
                      {deletingLessonId === lesson.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </GlassButton>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {lessons.map((lesson, index) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-black/5"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{lesson.title}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                      <FileText className="h-3 w-3" />
                      {lesson.materialCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {lessonsError && <p className="text-xs text-rose-600">{lessonsError}</p>}
          </SectionCard>
        )}

        {sectionById("quizzes") && (
          <SectionCard
            title={sectionById("quizzes")!.label}
            editing={editingSection === "quizzes"}
            onEdit={() => startEdit("quizzes")}
            onCancel={cancelEdit}
            onSave={() => setEditingSection(null)}
            saveLabel="Done"
          >
            {editingSection === "quizzes" && (
              <div className="space-y-2 pb-2">
                <p className="text-xs text-muted-foreground">
                  Pick a quiz from your library to assign it to this class.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <GlassSelect
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    disabled={quizCatalogLoading || quizCatalog.length === 0}
                    className="flex-1 min-w-0"
                  >
                    <option value="">
                      {quizCatalogLoading
                        ? "Loading quizzes…"
                        : quizCatalog.length === 0
                          ? "No quizzes available to assign"
                          : "Select a quiz…"}
                    </option>
                    {quizCatalog.map((quiz) => (
                      <option key={quiz.id} value={String(quiz.id)}>
                        {quiz.title}
                        {quiz.className ? ` (${quiz.className})` : ""}
                      </option>
                    ))}
                  </GlassSelect>
                  <button
                    type="button"
                    disabled={!selectedQuizId || assigningQuiz || quizCatalogLoading}
                    onClick={() => void handleAssignQuizToClass()}
                    className={cn(glassBtnPrimaryClass, "gap-2 h-11 px-4 shrink-0")}
                  >
                    {assigningQuiz ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Assign to class
                  </button>
                </div>
              </div>
            )}

            {quizzesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : classQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No quizzes yet.
                {editingSection === "quizzes"
                  ? " Assign a quiz above to add one to this class."
                  : " Click Edit to manage quizzes."}
              </p>
            ) : editingSection === "quizzes" ? (
              <ul className="space-y-2">
                {classQuizzes.map((quiz, index) => (
                  <li
                    key={quiz.id}
                    className="rounded-xl px-3 py-2.5 flex items-center gap-3 border border-black/5"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <FlaskConical className="h-4 w-4 text-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{quiz.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {quiz.questionCount} questions
                        {quiz.durationMinutes != null ? ` · ${quiz.durationMinutes} min` : ""}
                      </p>
                    </div>
                    <GlassButton
                      subtle
                      className="h-8 w-8 p-0 rounded-lg shrink-0"
                      disabled={deletingQuizId === quiz.id}
                      onClick={() => void handleRemoveQuiz(quiz)}
                    >
                      {deletingQuizId === quiz.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </GlassButton>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {classQuizzes.map((quiz, index) => (
                  <li
                    key={quiz.id}
                    className="rounded-xl px-3 py-2.5 flex items-center gap-3 border border-black/5"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <FlaskConical className="h-4 w-4 text-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{quiz.title}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                      <HelpCircle className="h-3 w-3" />
                      {quiz.questionCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {quizzesError && <p className="text-xs text-rose-600">{quizzesError}</p>}
          </SectionCard>
        )}

        {sectionError && <p className="text-xs text-rose-600 font-medium">{sectionError}</p>}

        <Card
          bouncy={false}
          className="rounded-2xl p-5 border border-rose-500/20"
          style={{
            background: "var(--glass-bg-subtle)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
          }}
        >
          <h3 className="text-sm font-extrabold text-destructive mb-1">Danger zone</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this class. Only possible when there are no enrolled students or
            lessons.
          </p>
          <button
            type="button"
            disabled={deletingClass}
            onClick={() => void handleDeleteClass()}
            className={cn(
              glassBtnSubtleClass,
              "h-9 px-4 text-xs gap-1.5 text-destructive border border-destructive/30",
            )}
          >
            {deletingClass ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete class
          </button>
        </Card>
      </div>
    </div>
  );
}
