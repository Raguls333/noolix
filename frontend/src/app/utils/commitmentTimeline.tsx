// src/utils/commitmentTimeline.ts

export type TimelineEventType =
  | "created"
  | "sent"
  | "approved"
  | "delivered"
  | "accepted"
  | "change"
  | "updated"
  | "reminder";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  iso: string;
  title: string;
  subTitle?: string;
};

export function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (Number.isNaN(diffMs)) return "—";

  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(days) >= 1) return rtf.format(-days, "day");
  if (Math.abs(hours) >= 1) return rtf.format(-hours, "hour");
  if (Math.abs(minutes) >= 1) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

function safeIso(v: any): string | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : v;
}

export function historyToTimeline(historyItems: any[]): TimelineEvent[] {
  const safe = Array.isArray(historyItems) ? historyItems : [];

  const mapped: TimelineEvent[] = safe.map((h: any, idx: number) => {
    const rawType = String(h?.type || "").toUpperCase();
    const iso =
      safeIso(h?.createdAt) ||
      safeIso(h?.at) ||
      safeIso(h?.timestamp) ||
      safeIso(h?.time) ||
      null;

    const actor =
      h?.actorName ||
      (h?.actorType === "CLIENT" ? "Client" : h?.actorType === "USER" ? "Team" : "System");

    let type: TimelineEventType = "updated";
    let title = h?.message || "Activity";

    if (rawType.includes("COMMITMENT_CREATED")) {
      type = "created";
      title = "Commitment created";
    } else if (rawType.includes("APPROVAL_LINK_SENT")) {
      type = "sent";
      title = "Approval link sent to client";
    } else if (rawType.includes("APPROVAL_LINK_RESENT")) {
      type = "reminder";
      title = "Approval reminder sent";
    } else if (rawType.includes("CLIENT_APPROVED")) {
      type = "approved";
      title = "Client approved scope";
    } else if (rawType.includes("MARKED_DELIVERED")) {
      type = "delivered";
      title = "Marked as delivered";
    } else if (rawType.includes("ACCEPTANCE_LINK_SENT")) {
      type = "sent";
      title = "Acceptance link sent to client";
    } else if (rawType.includes("ACCEPTANCE_LINK_RESENT")) {
      type = "reminder";
      title = "Acceptance reminder sent";
    } else if (rawType.includes("CLIENT_ACCEPTED")) {
      type = "accepted";
      title = "Client accepted deliverables";
    } else if (rawType.includes("CLIENT_REQUESTED_CHANGE")) {
      type = "change";
      title = "Client requested changes";
    } else if (rawType.includes("CHANGE_REQUEST_ACCEPTED")) {
      type = "change";
      title = "Change request accepted";
    } else if (rawType.includes("CHANGE_REQUEST_REJECTED")) {
      type = "change";
      title = "Change request rejected";
    }

    return {
      id: String(h?._id || h?.id || `h_${idx}`),
      type,
      iso: iso || new Date().toISOString(), // fallback to keep stable; ideally history has iso
      title,
      subTitle: actor ? `By ${actor}` : undefined,
    };
  });

  return mapped;
}

export function commitmentFieldsToTimeline(commitment: any): TimelineEvent[] {
  if (!commitment) return [];

  const out: TimelineEvent[] = [];

  const add = (iso: string | null, type: TimelineEventType, title: string) => {
    if (!iso) return;
    out.push({
      id: `c_${type}_${iso}`,
      type,
      iso,
      title,
    });
  };

  add(safeIso(commitment?.createdAt), "created", "Commitment created");
  add(safeIso(commitment?.approvalSentAt), "sent", "Approval link sent");
  add(safeIso(commitment?.approvedAt), "approved", "Client approved scope");
  add(safeIso(commitment?.deliveredAt), "delivered", "Work marked delivered");
  add(safeIso(commitment?.acceptedAt), "accepted", "Client accepted deliverables");

  if (commitment?.changeRequestId || commitment?.previousCommitmentId) {
    const versionLabel = commitment?.version ? ` (v${commitment.version})` : "";
    add(safeIso(commitment?.createdAt), "change", `New version created from change request${versionLabel}`);
  }

  // If updatedAt exists and it's not equal to createdAt, show it as "updated"
  const updatedAt = safeIso(commitment?.updatedAt);
  const createdAt = safeIso(commitment?.createdAt);
  if (updatedAt && updatedAt !== createdAt) {
    add(updatedAt, "updated", "Commitment updated");
  }

  return out;
}

/**
 * Merge: commitment fields + history
 * Deduplicate by (type + iso) and sort newest first / oldest first (choose one).
 */
export function buildTimeline(commitment: any, historyItems: any[], order: "newest" | "oldest" = "newest") {
  const a = commitmentFieldsToTimeline(commitment);
  const b = historyToTimeline(historyItems);

  const map = new Map<string, TimelineEvent>();
  for (const e of [...a, ...b]) {
    const key = `${e.type}_${e.iso}`;
    if (!map.has(key)) map.set(key, e);
  }

  const merged = Array.from(map.values()).sort((x, y) => {
    const tx = new Date(x.iso).getTime();
    const ty = new Date(y.iso).getTime();
    return order === "newest" ? ty - tx : tx - ty;
  });

  return merged;
}
