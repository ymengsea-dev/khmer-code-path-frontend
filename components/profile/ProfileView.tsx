import { CheckCircle2, Github, Medal, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_BADGES = [
  "Python Mastery",
  "Data Science Certified",
  "Cloud Architect",
  "Algorithms Specialist",
  "Data Development",
  "Digital Learning",
];

const COMPLETED_REPOS = [
  {
    name: "Introduction to Python Programming",
    slug: "intro-python-johnson",
  },
  {
    name: "AI Engineer Certification",
    slug: "ai-certification-johnson",
  },
  {
    name: "Full Stack Web Development",
    slug: "fullstack-meta-johnson",
  },
];

const SKILL_PATH = [
  { name: "Data Structures", progress: 85 },
  { name: "Machine Learning", progress: 60 },
  { name: "Database Design", progress: 40 },
];

const DIGITAL_BADGES = [
  {
    issuer: "MIT",
    title: "Certified Python Programmer",
    color: "from-rose-50 to-rose-100",
    accent: "border-rose-500",
  },
  {
    issuer: "Stanford",
    title: "AI Engineer Certification",
    color: "from-amber-50 to-amber-100",
    accent: "border-amber-500",
  },
  {
    issuer: "Meta",
    title: "Certified Full Stack Developer",
    color: "from-sky-50 to-sky-100",
    accent: "border-sky-500",
  },
];

function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function ProfileView() {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-6 py-5 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-bold text-foreground">Profile View</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-5">
          {/* Left side: profile + achievements + repos + skills */}
          <div className="space-y-4">
            {/* Profile header card */}
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-semibold text-white shadow-md">
                      AJ
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        Alex Johnson
                      </h2>
                      <Badge
                        variant="secondary"
                        className="gap-1.5 text-xs font-medium px-2.5 py-1 bg-amber-500/10 text-amber-600 border-amber-500/40"
                      >
                        <Medal className="w-3.5 h-3.5 text-amber-500" />
                        Gold Level Achiever
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1.5 text-xs">
                    <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/40">
                      <Trophy className="w-3.5 h-3.5" />
                      +110 / +50 PTS
                    </Badge>
                    <Badge className="gap-1 bg-sky-500/10 text-sky-600 border-sky-500/40">
                      <Trophy className="w-3.5 h-3.5" />
                      +52 / +150 PTS
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement badges */}
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  My Achievement badges
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ACHIEVEMENT_BADGES.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-2.5 py-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-snug">
                      {name}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Course git repositories */}
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Course git repository (completed)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2.5 text-sm">
                {COMPLETED_REPOS.map((repo) => (
                  <div
                    key={repo.slug}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs sm:text-[13px] font-medium text-foreground">
                        {repo.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 px-2 text-[11px] gap-1"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>{repo.slug}</span>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills path */}
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  My Skills Path (In Progress)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {SKILL_PATH.map((skill) => (
                  <div
                    key={skill.name}
                    className="space-y-1.5 rounded-xl bg-muted/40 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{skill.name}</span>
                      <span>{skill.progress}%</span>
                    </div>
                    <ProgressBar
                      value={skill.progress}
                      color={
                        skill.name === "Data Structures"
                          ? "from-sky-500 to-cyan-400"
                          : skill.name === "Machine Learning"
                          ? "from-emerald-500 to-lime-400"
                          : "from-indigo-500 to-violet-400"
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right side: Digital badges + placeholders */}
          <div className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  My Digital Skill Badges
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {DIGITAL_BADGES.map((badge) => (
                  <div
                    key={badge.title}
                    className={cn(
                      "relative rounded-xl border bg-gradient-to-br p-3 flex flex-col gap-1.5 shadow-sm",
                      badge.accent,
                      badge.color,
                    )}
                  >
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {badge.issuer}
                    </span>
                    <span className="text-xs font-semibold text-foreground leading-snug">
                      {badge.title}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                      Official digital credential issued for successful
                      completion of the program.
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Micro-Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Coming soon: short-form, stackable credentials that recognise
                your focused skills.
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Other Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Track and manage additional certificates from external
                providers here.
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

