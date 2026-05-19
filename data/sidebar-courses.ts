export interface SidebarCourse {
  id: string;
  name: string;
  colorClass: string;
  module: string;
}

export const sidebarCourses: SidebarCourse[] = [
  {
    id: "python",
    name: "Python Programming™",
    colorClass: "bg-orange-500 shadow-orange-500/20",
    module: "Module 4: Advanced Binary Search Trees",
  },
  {
    id: "ai",
    name: "AI Certification™",
    colorClass: "bg-fuchsia-500 shadow-fuchsia-500/20",
    module: "Module 2: Neural Networks Fundamentals",
  },
  {
    id: "fullstack",
    name: "Full Stack Web™",
    colorClass: "bg-emerald-500 shadow-emerald-500/20",
    module: "Module 3: Next.js Core Patterns",
  },
  {
    id: "basicweb",
    name: "Web Development™",
    colorClass: "bg-blue-500 shadow-blue-500/20",
    module: "Module 1: HTML & CSS Core",
  },
];

export function getSidebarCourse(id: string | null | undefined) {
  return sidebarCourses.find((c) => c.id === id) ?? sidebarCourses[0];
}
