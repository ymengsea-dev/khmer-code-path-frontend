import {
  STUDENT_MANAGEMENT_UI,
  studentManagementUi,
} from "@/lib/lms-ui/student-management";
import type {
  UserManagementBootstrap,
  UserManagementConfig,
} from "@/lib/services/user-service";

export function mergeStudentManagementConfig(
  isAdmin: boolean,
  bootstrap: UserManagementBootstrap | null,
): UserManagementConfig | null {
  if (!bootstrap) return null;
  const ui = studentManagementUi(isAdmin);
  return {
    pageTitle: ui.pageTitle,
    pageDescription: ui.pageDescription,
    tabs: [...ui.tabs],
    statusFilters: [...STUDENT_MANAGEMENT_UI.statusFilters],
    classFilters: bootstrap.classFilters,
    cardGradients: [...STUDENT_MANAGEMENT_UI.cardGradients],
    actions: bootstrap.actions,
  };
}
