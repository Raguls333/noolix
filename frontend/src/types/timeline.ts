export type TimelineEventType =
  | "created"
  | "sent"
  | "approved"
  | "delivered"
  | "accepted"
  | "updated";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  description: string;
  user: string;
  timestamp: string;   // "2 hours ago • Jan 7, 2026 2:02 AM"
  timeMs: number;      // for sorting
};
