export type NotificationIconType = "maintenance" | "payment" | "reminder";

export type NotificationPart =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "success"; value: string }
  | { kind: "danger"; value: string };

export interface NotificationItem {
  id: string;
  icon: NotificationIconType;
  title: string;
  timeAgo: string;
  parts: NotificationPart[];
  read: boolean;
  /** Highlight row (e.g. payment confirmation) */
  highlighted?: boolean;
  section: string;
}

export const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    icon: "maintenance",
    title: "Assignment submission update",
    timeAgo: "5h ago",
    section: "Today",
    read: false,
    parts: [
      { kind: "text", value: "Student " },
      { kind: "bold", value: "John Doe" },
      { kind: "text", value: " submitted work for " },
      { kind: "bold", value: "Assignment 3" },
      { kind: "text", value: ". Status: " },
      { kind: "success", value: "Graded" },
    ],
  },
  {
    id: "2",
    icon: "payment",
    title: "Tuition Payment Confirmation",
    timeAgo: "1d ago",
    section: "Today",
    read: false,
    highlighted: true,
    parts: [
      { kind: "text", value: "Your payment of " },
      { kind: "bold", value: "$1,200" },
      { kind: "text", value: " for " },
      { kind: "bold", value: "Semester 1, 2026" },
      { kind: "text", value: " was processed " },
      { kind: "success", value: "successfully" },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "3",
    icon: "reminder",
    title: "Reminder: Quiz deadline",
    timeAgo: "2d ago",
    section: "Today",
    read: false,
    parts: [
      { kind: "text", value: "Quiz " },
      { kind: "bold", value: "Binary Search Efficiency" },
      { kind: "text", value: " for " },
      { kind: "bold", value: "CS101" },
      { kind: "text", value: " will " },
      { kind: "danger", value: "close on October 15, 2026" },
      { kind: "text", value: "." },
    ],
  },
];
