"use client";

import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/lib/services/course-service";

export function useCoursesQuery() {
  return useQuery({
    queryKey: ["courses", { size: 100 }],
    queryFn: () => courseService.listCourses({ size: 100 }),
    staleTime: 2 * 60_000,
  });
}
