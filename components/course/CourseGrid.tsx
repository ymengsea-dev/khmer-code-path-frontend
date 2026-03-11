import { ScrollArea } from "@/components/ui/scroll-area";
import { Course } from "@/types/course";
import { CourseCard } from "./CourseCard";

interface CourseGridProps {
  courses: Course[];
  selectedId?: number;
  onSelect: (course: Course) => void;
}

export function CourseGrid({ courses, selectedId, onSelect }: CourseGridProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-6 py-5 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-bold text-foreground">Course View</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              selected={selectedId === course.id}
              onClick={() => onSelect(course)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
