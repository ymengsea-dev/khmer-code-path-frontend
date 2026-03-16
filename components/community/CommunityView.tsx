import { useState } from "react";
import { MessageCircle, Trophy, Vote, Wallet, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const TABS = ["Info Share", "Q & A", "Bounty Board", "Career Center"] as const;

const INFO_POSTS = [
  {
    id: 1,
    icon: "🔥",
    badge: "Top Post",
    title: "New React 19 State Management Techniques",
    subtitle: "React 19: New React 19 State Management Techniques",
    likes: "1.6K",
    comments: 131,
    date: "Jul 6 2022",
  },
  {
    id: 2,
    icon: "💡",
    badge: "Tech News",
    title: "Quantum Computing Course from MIT",
    subtitle: "Tech News: Quantum Course from MIT Announced",
    likes: "1.6K",
    comments: 66,
    date: "Jul 6 2022",
  },
  {
    id: 3,
    icon: "🌟",
    badge: "Community Showcase",
    title: "Built a Personal Finance App Python",
    subtitle: "Community Showcase: Built a Personal Finance App with Python.",
    likes: "1.7K",
    comments: 23,
    date: "Jul 6 2022",
  },
];

const QA_POSTS = [
  {
    id: 1,
    icon: "❓",
    badge: "Question",
    title: "How to optimise React 19 server components for large lists?",
    subtitle:
      "Looking for best practices on pagination and streaming in React 19 server components.",
    likes: "320",
    comments: 18,
    date: "Jul 2 2022",
  },
  {
    id: 2,
    icon: "✅",
    badge: "Solved",
    title: "Best pattern for organising Next.js API routes?",
    subtitle:
      "Accepted answer explains folder structure, versioning, and shared middleware.",
    likes: "540",
    comments: 32,
    date: "Jun 29 2022",
  },
];

const BOUNTIES = [
  {
    id: 1,
    icon: "🎯",
    badge: "New Bounty",
    title: "Build a Café Landing Page in Next.js",
    subtitle:
      "Freelance project to design and build a responsive one‑page site for a local café.",
    reward: "800 XP + Project Badge",
    applicants: 5,
    date: "Open now",
  },
  {
    id: 2,
    icon: "📊",
    badge: "In Progress",
    title: "Data Visualisation Dashboard for University Research Lab",
    subtitle:
      "Create interactive charts for student research outputs using React and D3.",
    reward: "1,200 XP + Portfolio Highlight",
    applicants: 3,
    date: "Closes in 5 days",
  },
];

const CAREER_ROLES = [
  {
    id: 1,
    icon: "🏢",
    badge: "Internship",
    title: "Junior Frontend Engineer (Remote)",
    subtitle:
      "Help build learning dashboards with React, TypeScript, and Tailwind at an EdTech startup.",
    location: "Remote • Part‑time",
    date: "Posted 2 days ago",
  },
  {
    id: 2,
    icon: "💼",
    badge: "Full‑time",
    title: "AI Engineer – Education Platform",
    subtitle:
      "Work with LLMs to build personalised course recommendations and coding assistants.",
    location: "San Francisco • Hybrid",
    date: "Posted 1 week ago",
  },
];

const MILESTONES = [
  {
    title: "Community Top Contributor",
    subtitle: "Alex Johnson",
    accent: "from-sky-600 to-indigo-600",
    countLabel: "3x",
  },
  {
    title: "Bounty Completed",
    subtitle: "Data Visualization for Stanford",
    accent: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Top Question Asker",
    subtitle: "",
    accent: "from-slate-600 to-slate-700",
  },
  {
    title: "Expert Answerer",
    subtitle: "",
    accent: "from-slate-600 to-slate-700",
  },
];

export function CommunityView() {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]>("Info Share");

  const posts =
    activeTab === "Info Share"
      ? INFO_POSTS
      : activeTab === "Q & A"
      ? QA_POSTS
      : activeTab === "Bounty Board"
      ? BOUNTIES
      : CAREER_ROLES;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-6 py-5 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-bold text-foreground">Community</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)] gap-5">
          {/* Left: Tabs + posts */}
          <div className="space-y-4">
            {/* Tabs */}
            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-2.5 sm:p-3 flex flex-wrap gap-2">
                {TABS.map((tab) => {
                  const selected = tab === activeTab;
                  return (
                    <Button
                      key={tab}
                      variant={selected ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "flex-1 min-w-[120px] justify-center text-xs font-medium rounded-full",
                        selected &&
                          "bg-background text-foreground shadow-sm border border-border/70",
                      )}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === "Info Share" && (
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {tab === "Q & A" && (
                        <Vote className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {tab === "Bounty Board" && (
                        <Wallet className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {tab === "Career Center" && (
                        <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {tab}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Tab content list */}
            <div className="space-y-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="border-border/80 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="text-xl sm:text-2xl leading-none">
                        {post.icon}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 text-[11px] font-semibold"
                          >
                            {post.badge}
                          </Badge>
                          <span className="text-sm sm:text-[15px] font-semibold text-foreground leading-snug">
                            {post.title}
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-muted-foreground line-clamp-2">
                          {post.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      {activeTab === "Info Share" || activeTab === "Q & A" ? (
                        <div className="flex items-center gap-4">
                          {"likes" in post && (
                            <button className="inline-flex items-center gap-1 hover:text-foreground">
                              <span role="img" aria-label="like">
                                👍
                              </span>
                              <span>{post.likes}</span>
                            </button>
                          )}
                          {"comments" in post && (
                            <button className="inline-flex items-center gap-1 hover:text-foreground">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{post.comments}</span>
                            </button>
                          )}
                        </div>
                      ) : activeTab === "Bounty Board" ? (
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] font-medium text-foreground">
                            {"reward" in post ? post.reward : ""}
                          </span>
                          <span className="text-[11px]">
                            {"applicants" in post ? post.applicants : 0}{" "}
                            applicants
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] font-medium text-foreground">
                            {"location" in post ? post.location : ""}
                          </span>
                        </div>
                      )}
                      <span>{post.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right: Community milestones */}
          <div className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Community Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {MILESTONES.map((item, index) => (
                  <div
                    key={item.title}
                    className={cn(
                      "rounded-xl p-3 flex items-center justify-between gap-3 bg-card border border-border/70",
                      index <= 1 &&
                        "bg-linear-to-r text-white from-slate-900 to-slate-800",
                    )}
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    {item.countLabel && (
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-semibold"
                      >
                        {item.countLabel}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

