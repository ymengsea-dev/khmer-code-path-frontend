"use client";
import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Course } from "@/types/course";
import { courses } from "@/data/courses";
import { Sidebar } from "@/components/layout/Sidebar";
import { CourseGrid } from "@/components/course/CourseGrid";
import { CourseDetailPanel } from "@/components/course/CourseDetailPanel";
import { EmbeddedIDE } from "@/components/code/EmbeddedIDE";
import { MyLearning } from "@/components/learning/MyLearning";
import { ProfileView } from "@/components/profile/ProfileView";
import { CommunityView } from "@/components/community/CommunityView";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
};

export default function Home() {
  const [activeNav, setActiveNav] = useState("courses");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (activeNav !== "courses") {
      setSheetOpen(false);
      setSelectedCourse(null);
    }
  }, [activeNav]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setSheetOpen(true);
  };

  const handleCloseDetail = () => {
    setSheetOpen(false);
    setSelectedCourse(null);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} className="mt-2 mr-2 mb-2 shrink-0" />

        <SidebarInset>
          {activeNav === "code" && <EmbeddedIDE />}
          {activeNav === "learning" && <MyLearning />}
          {activeNav === "profile" && <ProfileView />}
          {activeNav === "community" && <CommunityView />}
          {activeNav === "courses" && (
            <CourseGrid
              courses={courses}
              selectedId={selectedCourse?.id}
              onSelect={handleCourseSelect}
            />
          )}
        </SidebarInset>
      </div>

      {/* Right panel: shadcn Sheet (floating) — same on desktop and mobile */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="p-3 pl-3 w-full sm:max-w-sm lg:max-w-md xl:max-w-[24rem] bg-transparent !border-0 border-l-0 data-[side=right]:!border-l-0 shadow-none rounded-l-2xl outline-none"
          showCloseButton={false}
        >
          {selectedCourse && (
            <CourseDetailPanel
              course={selectedCourse}
              onClose={handleCloseDetail}
            />
          )}
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
