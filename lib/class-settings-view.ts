import type {
  ClassSettingsConfigDto,
  ClassVisibility,
} from "@/lib/types/class-api";
import {
  CLASSES_UI,
  visibilityOptionsForClass,
} from "@/lib/lms-ui/classes";

/** Merge API settings bootstrap with frontend UI labels/tabs. */
export function mergeClassSettingsConfig(
  api: ClassSettingsConfigDto,
): ClassSettingsConfigDto & {
  tabs: typeof CLASSES_UI.settingsTabs;
  scoreComponents: typeof CLASSES_UI.scoreComponents;
  statusOptions: typeof CLASSES_UI.statusOptions;
  visibilityOptions: ReturnType<typeof visibilityOptionsForClass>;
  publicCoursesDisabledHint?: string | null;
} {
  const allowed = api.allowedVisibilityValues as ClassVisibility[] | undefined;
  return {
    ...api,
    tabs: [...CLASSES_UI.settingsTabs],
    scoreComponents: [...CLASSES_UI.scoreComponents],
    statusOptions: [...CLASSES_UI.statusOptions],
    visibilityOptions: visibilityOptionsForClass(
      allowed,
      api.publicCoursesEnabled,
    ),
    publicCoursesDisabledHint: api.publicCoursesEnabled
      ? null
      : CLASSES_UI.publicCoursesDisabledHint,
  };
}
