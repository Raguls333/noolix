import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Send, FileText, Clock, Check, CircleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../design-system/StatusBadge";
import { Textarea } from "../ui/textarea";

import {
  getCommitment,
  getHistory,
  sendApprovalLink,
  resendApprovalLink,
  sendAcceptanceLink,
  resendAcceptanceLink,
  markDelivered,
  type Commitment as ApiCommitment,
} from "../../../api/commitments";
import { getClient } from "../../../api/clients";

interface CommitmentDetailProps {
  id: string;
  onBack: () => void;
}

type UiStatus =
  | "pending"
  | "active"
  | "awaiting-acceptance"
  | "at-risk"
  | "completed"
  | "disputed";

function formatMoney(amount?: number, currency?: string) {
  if (amount === undefined || amount === null) return "—";
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${cur}`;
  }
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (Number.isNaN(diff)) return "—";

  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(days) >= 1) return rtf.format(-days, "day");
  if (Math.abs(hours) >= 1) return rtf.format(-hours, "hour");
  if (Math.abs(minutes) >= 1) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

function mapApiStatusToUiStatus(status: ApiCommitment["status"]): UiStatus {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "INTERNAL_REVIEW":
      return "internal-review";
    case "AWAITING_CLIENT_APPROVAL":
    case "PENDING_APPROVAL":
      return "awaiting-client-approval";
    case "IN_PROGRESS":
      return "in-progress";
    case "CHANGE_REQUEST_CREATED":
    case "CHANGE_REQUESTED":
      return "change-requested";
    case "DELIVERED":
    case "PENDING_ACCEPTANCE":
      return "delivered";
    case "ACCEPTED":
    case "COMPLETED":
      return "accepted";
    case "CLOSED":
      return "closed";
    case "CANCELLED":
    default:
      return "disputed";
  }
}

function riskFromUiStatus(ui: UiStatus): { level: "none" | "low" | "high"; label: string; tone: "slate" | "amber" | "red" } {
  if (ui === "at-risk") return { level: "high", label: "High risk", tone: "red" };
  if (ui === "disputed") return { level: "high", label: "High risk", tone: "red" };
  if (ui === "awaiting-acceptance") return { level: "low", label: "Low risk", tone: "amber" };
  return { level: "none", label: "No risk", tone: "slate" };
}

type TimelineItem = {
  id: string;
  title: string;
  subtitle?: string;
  at?: string;
  kind: "done" | "pending" | "created";
};

function historyToTimelineItems(historyItems: any[]): TimelineItem[] {
  const safe = Array.isArray(historyItems) ? historyItems : [];
  const mapped = safe
    .map((h, idx) => {
      const type = String(h?.type || h?.event || h?.action || "").toLowerCase();
      const at = h?.createdAt || h?.at || h?.timestamp || h?.time;

      const actor = h?.actorName || h?.actor || h?.userName || h?.user || "";
      const message = h?.message || h?.note || h?.detail || "";

      let title = h?.title || h?.label || "";
      if (!title) {
        if (type.includes("approve")) title = "Approved by client";
        else if (type.includes("accept")) title = "Accepted by client";
        else if (type.includes("approval") && type.includes("send")) title = "Approval request sent";
        else if (type.includes("acceptance") && type.includes("send")) title = "Acceptance request sent";
        else if (type.includes("deliver")) title = "Marked delivered";
        else if (type.includes("create")) title = "Commitment created";
        else if (type.includes("change")) title = "Change requested";
        else title = "Activity";
      }

      let kind: TimelineItem["kind"] = "pending";
      if (type.includes("approve") || type.includes("accept") || type.includes("deliver")) kind = "done";
      if (type.includes("create")) kind = "created";

      const subtitleParts = [];
      if (actor) subtitleParts.push(String(actor));
      if (message) subtitleParts.push(String(message));
      const subtitle = subtitleParts.length ? subtitleParts.join(" • ") : undefined;

      return {
        id: String(h?._id || h?.id || `${idx}`),
        title,
        subtitle,
        at: typeof at === "string" ? at : undefined,
        kind,
      } as TimelineItem;
    })
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    });

  return mapped;
}

// ✅ helper: support both API response shapes
function unwrapCommitment(res: any): ApiCommitment | null {
  if (!res) return null;
  if (res.commitment) return res.commitment as ApiCommitment;
  return res as ApiCommitment;
}

function clientNameFromCommitment(c?: ApiCommitment | null) {
  if (!c) return "—";
  const anyC: any = c as any;

  // populated
  if (anyC.clientId && typeof anyC.clientId === "object") {
    return anyC.clientId.name || anyC.clientId.companyName || "—";
  }

  // snapshot fallback
  if (anyC.clientSnapshot?.name) return anyC.clientSnapshot.name;
  if (anyC.clientSnapshot?.companyName) return anyC.clientSnapshot.companyName;

  return "—";
}

function clientIdStringFromCommitment(c?: ApiCommitment | null) {
  if (!c) return null;
  const anyC: any = c as any;
  if (typeof anyC.clientId === "string") return anyC.clientId;
  if (anyC.clientId && typeof anyC.clientId === "object") return anyC.clientId._id || null;
  return null;
}

export function CommitmentDetail({ id, onBack }: CommitmentDetailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [commitment, setCommitment] = useState<ApiCommitment | null>(null);
  const [clientName, setClientName] = useState<string>("—");
  const [history, setHistory] = useState<any[]>([]);
  const [internalNote, setInternalNote] = useState("");
  const [actionLoading, setActionLoading] = useState<null | string>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const cRes = await getCommitment(id);
        if (cancelled) return;

        const c = unwrapCommitment(cRes);
        setCommitment(c);

        // ✅ Prefer populated client name (no extra API call)
        const name = clientNameFromCommitment(c);
        setClientName(name);

        // (Optional fallback): if backend didn't populate + no snapshot, then call getClient
        const cid = clientIdStringFromCommitment(c);
        if (name === "—" && cid) {
          try {
            const client = await getClient(cid);
            if (!cancelled) setClientName(client?.name ?? "—");
          } catch {
            if (!cancelled) setClientName("—");
          }
        }

        try {
          const h = await getHistory(id);
          if (!cancelled) setHistory(h?.items ?? []);
        } catch {
          if (!cancelled) setHistory([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const uiStatus: UiStatus = useMemo(() => {
    if (!commitment) return "active";
    return mapApiStatusToUiStatus(commitment.status);
  }, [commitment]);

  const risk = useMemo(() => riskFromUiStatus(uiStatus), [uiStatus]);

  const lastActivity = useMemo(() => {
    if (!commitment) return "—";
    return timeAgo(commitment.updatedAt ?? commitment.createdAt);
  }, [commitment]);

  const timeline = useMemo(() => historyToTimelineItems(history), [history]);

  const scopeText = useMemo(() => {
    if (!commitment) return "—";
    // ✅ new field first
    return (commitment as any).scopeDescription ?? (commitment as any).scopeText ?? "—";
  }, [commitment]);

  const paymentTerms = useMemo(() => {
    const pt = (commitment as any)?.paymentTerms;
    return Array.isArray(pt) ? pt : [];
  }, [commitment]);

  const attachments = useMemo(() => {
    const at = (commitment as any)?.attachments;
    return Array.isArray(at) ? at : [];
  }, [commitment]);

  const handleSendReminder = async () => {
    if (!commitment) return;
    setActionLoading("send");
    try {
      if (commitment.status === "PENDING_APPROVAL") {
        await resendApprovalLink(commitment._id);
      } else if (commitment.status === "PENDING_ACCEPTANCE") {
        await resendAcceptanceLink(commitment._id);
      } else if (commitment.status === "DRAFT") {
        await sendApprovalLink(commitment._id);
      }

      try {
        const h = await getHistory(commitment._id);
        setHistory(h?.items ?? []);
      } catch {}
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportProof = async () => {
    setActionLoading("export");
    try {
      // plug your export logic
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChange = async () => {
    // needs backend endpoint to request change
  };

  const handleSubmitForAcceptance = async () => {
    if (!commitment) return;
    setActionLoading("acceptance");
    try {
      await sendAcceptanceLink(commitment._id);

      try {
        const cRes = await getCommitment(commitment._id);
        const c = unwrapCommitment(cRes);
        setCommitment(c);
        setClientName(clientNameFromCommitment(c));
      } catch {}

      try {
        const h = await getHistory(commitment._id);
        setHistory(h?.items ?? []);
      } catch {}
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivered = async () => {
    if (!commitment) return;
    setActionLoading("delivered");
    try {
      await markDelivered(commitment._id);

      try {
        const cRes = await getCommitment(commitment._id);
        const c = unwrapCommitment(cRes);
        setCommitment(c);
        setClientName(clientNameFromCommitment(c));
      } catch {}

      try {
        const h = await getHistory(commitment._id);
        setHistory(h?.items ?? []);
      } catch {}
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to dashboard
      </button>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-slate-900">
                  {isLoading ? "Loading…" : (commitment?.title ?? "—")}
                </h1>
                <StatusBadge status={uiStatus} />
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div>
                  <span className="text-slate-500">Client:</span>{" "}
                  {isLoading ? "—" : clientName}
                </div>
                <div>
                  <span className="text-slate-500">Amount:</span>{" "}
                  {isLoading ? "—" : formatMoney(commitment?.amount, commitment?.currency)}
                </div>
                <div>
                  <span className="text-slate-500">Created:</span>{" "}
                  {isLoading ? "—" : formatDate(commitment?.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-slate-300"
                onClick={handleSendReminder}
                disabled={isLoading || !commitment || actionLoading === "send"}
              >
                <Send className="w-4 h-4 mr-2" />
                {actionLoading === "send" ? "Sending…" : "Send Reminder"}
              </Button>
              <Button
                className="bg-slate-900 text-white"
                onClick={handleExportProof}
                disabled={actionLoading === "export"}
              >
                <Download className="w-4 h-4 mr-2" />
                {actionLoading === "export" ? "Exporting…" : "Export Proof"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CircleAlert
              className={`w-4 h-4 ${
                risk.tone === "amber" ? "text-amber-600" : risk.tone === "red" ? "text-red-600" : "text-slate-500"
              }`}
            />
            <span
              className={`${
                risk.tone === "amber" ? "text-amber-900" : risk.tone === "red" ? "text-red-900" : "text-slate-700"
              }`}
            >
              {risk.label}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Last activity: {isLoading ? "—" : lastActivity}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Timeline */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-slate-900 mb-6">Timeline</h2>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-sm text-slate-600">Loading timeline…</div>
                ) : timeline.length === 0 ? (
                  <div className="text-sm text-slate-600">No activity yet.</div>
                ) : (
                  timeline.map((item, idx) => {
                    const isLast = idx === timeline.length - 1;
                    const Icon = item.kind === "done" ? Check : item.kind === "pending" ? Clock : FileText;
                    const iconBg =
                      item.kind === "done"
                        ? "bg-green-100"
                        : item.kind === "pending"
                        ? "bg-blue-100"
                        : "bg-slate-100";
                    const iconColor =
                      item.kind === "done"
                        ? "text-green-700"
                        : item.kind === "pending"
                        ? "text-blue-700"
                        : "text-slate-600";

                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          {!isLast && <div className="flex-1 w-0.5 bg-slate-200 mt-2"></div>}
                        </div>
                        <div className={`flex-1 ${!isLast ? "pb-6" : ""}`}>
                          <div className="text-slate-900 mb-1">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-sm text-slate-600 mb-2">
                              {item.subtitle}
                            </div>
                          )}
                          <div className="text-xs text-slate-500">
                            {formatDateTime(item.at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-slate-900 mb-4">Attachments</h2>

              {isLoading ? (
                <div className="text-sm text-slate-600">Loading…</div>
              ) : attachments.length === 0 ? (
                <div className="text-sm text-slate-600">No attachments uploaded.</div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((a: any, idx: number) => (
                    <a
                      key={a.publicId || idx}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-slate-900 text-sm font-medium truncate">
                          {a.fileName || a.originalName || "Attachment"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.mimeType || "file"}{a.bytes ? ` • ${(a.bytes / 1024).toFixed(0)} KB` : ""}
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-500" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Scope */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">Scope</h3>
              <p className="text-slate-700 text-sm mb-4">
                {isLoading ? "Loading…" : scopeText}
              </p>
            </div>

            {/* Payment */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">Payment</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-500 mb-1">Total Amount</div>
                  <div className="text-slate-900">
                    {isLoading ? "—" : formatMoney(commitment?.amount, commitment?.currency)}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Terms</div>
                  {isLoading ? (
                    <div className="text-slate-700">—</div>
                  ) : paymentTerms.length === 0 ? (
                    <div className="text-slate-700">—</div>
                  ) : (
                    <ul className="text-slate-700 space-y-1">
                      {paymentTerms.map((t: any, idx: number) => (
                        <li key={idx}>• {t.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 justify-start"
                  onClick={handleRequestChange}
                  disabled={isLoading}
                >
                  Request Change
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 justify-start"
                  onClick={handleSubmitForAcceptance}
                  disabled={isLoading || actionLoading === "acceptance"}
                >
                  {actionLoading === "acceptance" ? "Sending…" : "Submit for Acceptance"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 justify-start"
                  onClick={handleMarkDelivered}
                  disabled={isLoading || actionLoading === "delivered"}
                >
                  {actionLoading === "delivered" ? "Marking…" : "Mark Delivered"}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-slate-900 mb-4">Internal Notes</h3>
              <Textarea
                placeholder="Add notes (not visible to client)"
                rows={4}
                className="mb-3"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
              />
              <Button variant="outline" size="sm" className="w-full border-slate-300">
                Save Note
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
