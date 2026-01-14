import { formatWhen, toMillis } from "./time";
import type { TimelineEvent, TimelineEventType } from "../../types/timeline";

type CommitmentLike = {
  _id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  approvalSentAt?: string;
  approvedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  createdByUserId?: string;
  clientSnapshot?: { name?: string; email?: string };
};

function pushIf(
  arr: TimelineEvent[],
  opts: {
    id: string;
    type: TimelineEventType;
    at?: string;
    description: string;
    user: string;
  }
) {
  if (!opts.at) return;
  arr.push({
    id: opts.id,
    type: opts.type,
    description: opts.description,
    user: opts.user,
    timestamp: formatWhen(opts.at),
    timeMs: toMillis(opts.at),
  });
}

export function buildTimeline(c: CommitmentLike): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const clientName = c.clientSnapshot?.name || c.clientSnapshot?.email || "Client";
  const teamName = "Team"; // if you have org/user info, replace this

  pushIf(events, {
    id: `${c._id}-created`,
    type: "created",
    at: c.createdAt,
    description: `Commitment created: ${c.title || "Untitled"}`,
    user: teamName,
  });

  pushIf(events, {
    id: `${c._id}-sent`,
    type: "sent",
    at: c.approvalSentAt,
    description: "Approval link sent to client",
    user: teamName,
  });

  pushIf(events, {
    id: `${c._id}-approved`,
    type: "approved",
    at: c.approvedAt,
    description: "Scope approved by client",
    user: clientName,
  });

  pushIf(events, {
    id: `${c._id}-delivered`,
    type: "delivered",
    at: c.deliveredAt,
    description: "Deliverables marked as delivered",
    user: teamName,
  });

  pushIf(events, {
    id: `${c._id}-accepted`,
    type: "accepted",
    at: c.acceptedAt,
    description: "Deliverables accepted by client",
    user: clientName,
  });

  // Optional: show last update (but avoid duplicating createdAt)
  if (c.updatedAt && c.updatedAt !== c.createdAt) {
    pushIf(events, {
      id: `${c._id}-updated`,
      type: "updated",
      at: c.updatedAt,
      description: "Commitment updated",
      user: teamName,
    });
  }

  // Sort oldest -> newest for vertical timeline
  events.sort((a, b) => a.timeMs - b.timeMs);

  return events;
}
