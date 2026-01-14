import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  Send,
  FileText,
  Clock,
  Check,
  CircleAlert,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  Paperclip,
  ShieldCheck,
} from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { StatusBadge } from "../design-system/StatusBadge";
import { ConfirmModal } from "../shared/ConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

import {
  getCommitment,
  getHistory,
  sendApprovalLink,
  resendApprovalLink,
  sendAcceptanceLink,
  markDelivered,
  listCommitments,
  updateCommitment,
  type Commitment as ApiCommitment,
} from "../../../api/commitments";
import { getClient } from "../../../api/clients";
import {
  listCommitmentChangeRequests,
  acceptChangeRequest,
  rejectChangeRequest,
  type ChangeRequest as ApiChangeRequest,
} from "../../../api/changeRequests";

import { buildTimeline, formatDateTime, timeAgo, type TimelineEvent } from "../../utils/commitmentTimeline";
import { exportCommitmentToPDF } from "../../utils/pdfExport";

interface CommitmentDetailViewProps {
  onBack: () => void;
  userRole?: "founder" | "manager";
  commitmentId?: string;
}

type Tab = "overview" | "timeline" | "deliverables" | "changes" | "versions" | "proof";

type UiStatus =
  | "draft"
  | "internal-review"
  | "awaiting-client-approval"
  | "in-progress"
  | "change-requested"
  | "delivered"
  | "accepted"
  | "closed"
  | "disputed";

function mapApiStatusToUiStatus(status?: ApiCommitment["status"]): UiStatus {
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

function formatMoney(amount?: number, currency?: string) {
  if (amount === undefined || amount === null) return "N/A";
  const cur = currency || "INR";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${cur}`;
  }
}

function formatShortDate(iso?: string) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function riskFromUiStatus(ui: UiStatus) {
  if (ui === "disputed" || ui === "change-requested") return { label: "High", tone: "high" as const };
  if (ui === "awaiting-client-approval" || ui === "delivered") return { label: "Low", tone: "low" as const };
  return { label: "None", tone: "none" as const };
}

function getClientFromCommitment(c: any) {
  const populated = c?.clientId && typeof c.clientId === "object" ? c.clientId : null;
  const snapshot = c?.clientSnapshot && typeof c.clientSnapshot === "object" ? c.clientSnapshot : null;
  const clientId = typeof c?.clientId === "string" ? c.clientId : null;

  const name = populated?.name ?? snapshot?.name ?? (clientId ?? "N/A");
  const email = populated?.email ?? snapshot?.email ?? "N/A";
  const companyName = populated?.companyName ?? snapshot?.companyName ?? "N/A";

  return { populated, snapshot, clientId, name, email, companyName };
}

function getOwnerFromCommitment(c: any) {
  const assigned = c?.assignedToUserId;
  if (assigned && typeof assigned === "object") {
    return assigned.name || assigned.email || assigned._id || "N/A";
  }
  if (typeof assigned === "string") return assigned;
  return "N/A";
}

function approvalRulesLabel(rules: any) {
  const approver = String(rules?.approver || "");
  const reApprovalOnChanges = !!rules?.reApprovalOnChanges;
  const acceptanceRequired = !!rules?.acceptanceRequired;

  const approverLabel =
    approver === "CLIENT_ONLY" ? "Client only" : approver === "BOTH_PARTIES" ? "Both parties" : "N/A";

  return {
    approverLabel,
    reApprovalOnChangesLabel: reApprovalOnChanges ? "Yes" : "No",
    acceptanceRequiredLabel: acceptanceRequired ? "Yes" : "No",
  };
}

function getRootCommitmentId(it: any): string | null {
  const root = it?.rootCommitmentId;
  if (!root) return it?._id ? String(it._id) : null;
  if (typeof root === "string") return root;
  if (typeof root === "object" && root._id) return String(root._id);
  return it?._id ? String(it._id) : null;
}

function sortVersions(items: any[]) {
  return items.slice().sort((a, b) => {
    const av = Number(a?.version || 0);
    const bv = Number(b?.version || 0);
    if (av !== bv) return bv - av;
    const at = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const bt = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return bt - at;
  });
}

function TimelineIcon({ type }: { type: TimelineEvent["type"] }) {
  if (type === "approved" || type === "accepted") return <Check className="w-4 h-4 text-[#047857]" />;
  if (type === "created") return <FileText className="w-4 h-4 text-[#4338CA]" />;
  if (type === "sent" || type === "reminder") return <Send className="w-4 h-4 text-[#4B5563]" />;
  if (type === "change") return <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />;
  return <Clock className="w-4 h-4 text-[#4B5563]" />;
}

function TimelineDotClass(type: TimelineEvent["type"]) {
  if (type === "approved" || type === "accepted") return "bg-[#DCFCE8]";
  if (type === "created") return "bg-[#E0EAFF]";
  if (type === "change") return "bg-[#FEE2E2]";
  return "bg-[#F4F5F7]";
}

function changeRequestStatusClass(status?: string) {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "ACCEPTED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "REJECTED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export function CommitmentDetailView({ onBack, userRole = "founder", commitmentId }: CommitmentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [currentCommitmentId, setCurrentCommitmentId] = useState<string | undefined>(commitmentId);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);

  const [commitment, setCommitment] = useState<any | null>(null);
  const [client, setClient] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<ApiChangeRequest[]>([]);
  const [changeRequestsLoading, setChangeRequestsLoading] = useState(false);
  const [changeRequestsError, setChangeRequestsError] = useState<string | null>(null);
  const [changeRequestsAction, setChangeRequestsAction] = useState<null | { id: string; action: "accept" | "reject" }>(
    null
  );
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(false);
  const [versionHistoryError, setVersionHistoryError] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingActionKey, setPendingActionKey] = useState<null | string>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    scopeDescription: "",
    amount: "",
    paymentTerms: [] as Array<{ text: string; status: string }>,
    milestones: [] as Array<{ text: string; status: string }>,
    deliverables: [] as Array<{ text: string; status: string }>,
    approvalRules: {
      approver: "CLIENT_ONLY",
      reApprovalOnChanges: true,
      acceptanceRequired: true,
    },
  });
  const [deliverablesDraft, setDeliverablesDraft] = useState<Array<{ text: string; status: string }>>([]);
  const [inlineStatusSaving, setInlineStatusSaving] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<null | { type: "payment" | "milestone" | "deliverable"; index: number; value: string }>(null);

  const uiStatus = useMemo(() => mapApiStatusToUiStatus(commitment?.status), [commitment]);
  const risk = useMemo(() => riskFromUiStatus(uiStatus), [uiStatus]);
  const derivedClient = useMemo(() => getClientFromCommitment(commitment), [commitment]);

  const title = commitment?.title || "N/A";
  const amountLabel = formatMoney(commitment?.amount, commitment?.currency);
  const createdLabel = formatShortDate(commitment?.createdAt);
  const ownerLabel = getOwnerFromCommitment(commitment);
  const lastUpdated = formatDateTime(commitment?.updatedAt || commitment?.createdAt);
  const lastActivity = timeAgo(commitment?.updatedAt || commitment?.createdAt);
  const isFresh =
    !!commitment &&
    Number(commitment?.version || 1) <= 1 &&
    !commitment?.previousCommitmentId &&
    !commitment?.changeRequestId;
  const canEditAll =
    !!commitment &&
    (commitment.status === "DRAFT" ||
      commitment.status === "INTERNAL_REVIEW" ||
      (commitment.status === "AWAITING_CLIENT_APPROVAL" && !!commitment.changeRequestId)) &&
    !commitment.approvedAt;
  const canEditDeliverables =
    !!commitment &&
    commitment.status !== "DELIVERED" &&
    commitment.status !== "ACCEPTED" &&
    commitment.status !== "CLOSED" &&
    commitment.status !== "CANCELLED";
  const canEditTerms =
    !!commitment &&
    commitment.status !== "ACCEPTED" &&
    commitment.status !== "CLOSED" &&
    commitment.status !== "CANCELLED";

  // Note: Timeline derived from commitment timestamps + history
  const timelineEvents = useMemo(() => buildTimeline(commitment, history, "newest"), [commitment, history]);

  function pillClass(status?: string) {
    const s = String(status || "").toUpperCase();

    if (s === "PAID" || s === "COMPLETED" || s === "DONE") return "bg-[#DCFCE8] text-[#047857] border-[#86EFAC]";
    if (s === "PENDING") return "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
    if (s === "IN_PROGRESS") return "bg-[#E0EAFF] text-[#4338CA] border-[#C7D2FE]";
    if (s === "NOT_STARTED") return "bg-[#F4F5F7] text-[#4B5563] border-[#E5E7EB]";
    if (s === "FAILED" || s === "CANCELLED") return "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]";

    return "bg-[#F4F5F7] text-[#4B5563] border-[#E5E7EB]";
  }

function fmtMaybeDate(iso?: string) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}


  const progress = useMemo(() => {
    const items = Array.isArray(commitment?.deliverables) ? commitment.deliverables : [];
    const total = items.length;
    if (!total) return { pct: 0, done: 0, total: 0 };

    const done = items.filter((d: any) => {
      const status = String(d?.status || "").toUpperCase();
      return status === "DELIVERED" || status === "ACCEPTED";
    }).length;

    const pct = Math.round((done / total) * 100);
    return { pct, done, total };
  }, [commitment]);

  useEffect(() => {
    setCurrentCommitmentId(commitmentId);
  }, [commitmentId]);

  const refreshAll = async (id: string) => {
    const res: any = await getCommitment(id);
    const c = res?.commitment ?? res;
    setCommitment(c);

    const dc = getClientFromCommitment(c);
    if (dc.clientId) {
      try {
        const cl = await getClient(dc.clientId);
        setClient(cl);
      } catch {
        setClient(null);
      }
    } else {
      setClient(dc.populated ?? dc.snapshot ?? null);
    }

    try {
      const h = await getHistory(id);
      setHistory(h?.items ?? h ?? []);
    } catch {
      setHistory([]);
    }

    await loadVersionHistory(c);
  };

  const loadVersionHistory = async (c: any) => {
    const rootId = getRootCommitmentId(c);
    if (!rootId) {
      setVersionHistory([]);
      return;
    }

    setVersionHistoryLoading(true);
    setVersionHistoryError(null);
    try {
      const res = await listCommitments({ page: 1, limit: 2000 });
      const items = Array.isArray(res?.items) ? res.items : [];
      const versions = items.filter((it: any) => getRootCommitmentId(it) === rootId);
      setVersionHistory(sortVersions(versions));
    } catch (e: any) {
      setVersionHistoryError(
        typeof e?.message === "string" ? e.message : "Failed to load version history."
      );
      setVersionHistory([]);
    } finally {
      setVersionHistoryLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!currentCommitmentId) {
        setError("Missing commitmentId. Please navigate from the list.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await refreshAll(currentCommitmentId);
      } catch (e: any) {
        if (!cancelled) setError(typeof e?.message === "string" ? e.message : "Failed to load commitment.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentCommitmentId]);

  const updateChangeRequestStatus = (id: string, status: string) => {
    setChangeRequests((prev) =>
      prev.map((item) => (item._id === id ? { ...item, status } : item))
    );
  };

  const handleAcceptChangeRequest = async (req: ApiChangeRequest) => {
    if (!currentCommitmentId || !req?._id || changeRequestsAction) return;
    setChangeRequestsAction({ id: req._id, action: "accept" });
    setChangeRequestsError(null);
    try {
      const res: any = await acceptChangeRequest(currentCommitmentId, req._id);
      const nextCommitment = res?.commitment ?? res;
      const nextId = typeof nextCommitment?._id === "string" ? nextCommitment._id : null;
      updateChangeRequestStatus(req._id, "ACCEPTED");
      if (nextId) {
        setCommitment(nextCommitment);
        setCurrentCommitmentId(nextId);
        await refreshAll(nextId);
      } else {
        await refreshAll(currentCommitmentId);
      }
    } catch (e: any) {
      setChangeRequestsError(
        typeof e?.message === "string" ? e.message : "Failed to accept change request."
      );
    } finally {
      setChangeRequestsAction(null);
    }
  };

  const handleRejectChangeRequest = async (req: ApiChangeRequest) => {
    if (!currentCommitmentId || !req?._id || changeRequestsAction) return;
    setChangeRequestsAction({ id: req._id, action: "reject" });
    setChangeRequestsError(null);
    try {
      await rejectChangeRequest(currentCommitmentId, req._id);
      updateChangeRequestStatus(req._id, "REJECTED");
      await refreshAll(currentCommitmentId);
    } catch (e: any) {
      setChangeRequestsError(
        typeof e?.message === "string" ? e.message : "Failed to reject change request."
      );
    } finally {
      setChangeRequestsAction(null);
    }
  };

  useEffect(() => {
    if (!currentCommitmentId) return;
    let cancelled = false;
    (async () => {
      setChangeRequestsLoading(true);
      setChangeRequestsError(null);
      try {
        const res = await listCommitmentChangeRequests(currentCommitmentId);
        if (cancelled) return;
        const items = Array.isArray((res as any)?.items) ? (res as any).items : (res as any);
        setChangeRequests(Array.isArray(items) ? items : []);
      } catch (e: any) {
        if (cancelled) return;
        setChangeRequestsError(
          typeof e?.message === "string" ? e.message : "Failed to load change requests."
        );
        setChangeRequests([]);
      } finally {
        if (!cancelled) setChangeRequestsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentCommitmentId]);

  const handleExportPDF = async () => {
    if (!commitment) return;
    const exportPayload = {
      name: commitment.title || "Commitment",
      client: client?.name ?? derivedClient.name ?? "N/A",
      status: commitment.status || "N/A",
      amount: typeof commitment.amount === "number" ? commitment.amount : null,
      dueDate: formatShortDate(commitment.createdAt),
      owner: ownerLabel,
      description: commitment.scopeDescription ?? commitment.scopeText ?? "",
      deliverables: Array.isArray(commitment.deliverables)
        ? commitment.deliverables.map((d: any) => ({
            name: d?.text ?? "Deliverable",
            status: d?.status ?? "NOT_STARTED",
            dueDate: d?.dueAt ? formatShortDate(d.dueAt) : "N/A",
            completedDate: d?.completedAt ? formatShortDate(d.completedAt) : "N/A",
          }))
        : [],
    };
    await exportCommitmentToPDF(exportPayload, userRole);
  };

  const openEdit = () => {
    if (!commitment) return;
    setEditError(null);
    setEditDraft({
      title: commitment.title ?? "",
      scopeDescription: commitment.scopeDescription ?? commitment.scopeText ?? "",
      amount: typeof commitment.amount === "number" ? String(commitment.amount) : "",
      paymentTerms: Array.isArray(commitment.paymentTerms)
        ? commitment.paymentTerms.map((p: any) => ({
            text: p?.text ?? "",
            status: p?.status ?? "PENDING",
          }))
        : [],
      milestones: Array.isArray(commitment.milestones)
        ? commitment.milestones.map((m: any) => ({
            text: m?.text ?? "",
            status: m?.status ?? "NOT_STARTED",
          }))
        : [],
      deliverables: Array.isArray(commitment.deliverables)
        ? commitment.deliverables.map((d: any) => ({
            text: d?.text ?? "",
            status: d?.status ?? "NOT_STARTED",
          }))
        : [],
      approvalRules: {
        approver: commitment?.approvalRules?.approver || "CLIENT_ONLY",
        reApprovalOnChanges: commitment?.approvalRules?.reApprovalOnChanges !== false,
        acceptanceRequired: commitment?.approvalRules?.acceptanceRequired !== false,
      },
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!commitment?._id) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const amountNum = editDraft.amount.trim() ? Number(editDraft.amount) : undefined;
      await updateCommitment(commitment._id, {
        title: editDraft.title.trim(),
        scopeDescription: editDraft.scopeDescription,
        amount: Number.isFinite(amountNum) ? amountNum : undefined,
        currency: "INR",
        paymentTerms: editDraft.paymentTerms,
        milestones: editDraft.milestones,
        deliverables: editDraft.deliverables,
        approvalRules: editDraft.approvalRules,
      });
      setEditOpen(false);
      await refreshAll(commitment._id);
    } catch (e: any) {
      setEditError(typeof e?.message === "string" ? e.message : "Failed to update commitment.");
    } finally {
      setEditSaving(false);
    }
  };

  const openStatusConfirm = (type: "payment" | "milestone" | "deliverable", index: number, value: string) => {
    setPendingStatusChange({ type, index, value });
    setStatusConfirmOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!commitment?._id || !pendingStatusChange) return;
    setInlineStatusSaving(true);
    try {
      if (pendingStatusChange.type === "deliverable") {
        const next = deliverablesDraft.map((d, idx) =>
          idx === pendingStatusChange.index ? { ...d, status: pendingStatusChange.value } : d
        );
        setDeliverablesDraft(next);
        await updateCommitment(commitment._id, { deliverables: next } as any);
      } else if (pendingStatusChange.type === "payment") {
        const terms = Array.isArray(commitment.paymentTerms) ? commitment.paymentTerms : [];
        const next = terms.map((t: any, idx: number) =>
          idx === pendingStatusChange.index ? { ...t, status: pendingStatusChange.value } : t
        );
        await updateCommitment(commitment._id, { paymentTerms: next } as any);
      } else if (pendingStatusChange.type === "milestone") {
        const milestones = Array.isArray(commitment.milestones) ? commitment.milestones : [];
        const next = milestones.map((m: any, idx: number) =>
          idx === pendingStatusChange.index ? { ...m, status: pendingStatusChange.value } : m
        );
        await updateCommitment(commitment._id, { milestones: next } as any);
      }
      await refreshAll(commitment._id);
    } finally {
      setInlineStatusSaving(false);
      setStatusConfirmOpen(false);
      setPendingStatusChange(null);
    }
  };

  useEffect(() => {
    if (!commitment) return;
    setDeliverablesDraft(
      Array.isArray(commitment.deliverables)
        ? commitment.deliverables.map((d: any) => ({
            text: d?.text ?? "",
            status: d?.status ?? "NOT_STARTED",
          }))
        : []
    );
  }, [commitment]);

  const executePrimaryAction = async (key: string) => {
    if (!commitment?._id) return;
    setActionLoading(key);
    try {
      if (key === "send-approval") {
        await sendApprovalLink(commitment._id);
      } else if (key === "resend-approval") {
        await resendApprovalLink(commitment._id);
      } else if (key === "mark-delivered") {
        await markDelivered(commitment._id);
      } else if (key === "send-acceptance") {
        await sendAcceptanceLink(commitment._id);
      }
      await refreshAll(commitment._id);
    } finally {
      setActionLoading(null);
    }
  };

  const primaryAction = useMemo(() => {
    if (!commitment) return null;
    const status = commitment.status;
    if (status === "CHANGE_REQUEST_CREATED") {
      return {
        key: "review-changes",
        label: "Review Change Requests",
        confirm: false,
        onClick: () => setActiveTab("changes"),
      };
    }
    if (status === "DRAFT" || status === "INTERNAL_REVIEW") {
      return {
        key: "send-approval",
        label: "Send to Client",
        confirm: true,
        title: "Send to client?",
        description: "This will email the client an approval link for this commitment.",
        confirmLabel: "Send to client",
      };
    }
    if (status === "AWAITING_CLIENT_APPROVAL") {
      return {
        key: "resend-approval",
        label: "Resend Approval",
        confirm: true,
        title: "Resend approval?",
        description: "This will resend the approval email to the client.",
        confirmLabel: "Resend approval",
      };
    }
    if (status === "IN_PROGRESS") {
      return {
        key: "mark-delivered",
        label: "Mark Delivered",
        confirm: true,
        title: "Mark as delivered?",
        description: "This marks work as delivered and prepares acceptance.",
        confirmLabel: "Mark delivered",
      };
    }
    if (status === "DELIVERED" && commitment?.approvalRules?.acceptanceRequired !== false) {
      return {
        key: "send-acceptance",
        label: "Send Acceptance Link",
        confirm: true,
        title: "Send acceptance link?",
        description: "This will email the client an acceptance link.",
        confirmLabel: "Send link",
      };
    }
    return null;
  }, [commitment]);

  const handlePrimaryActionClick = () => {
    if (!primaryAction) return;
    if (!primaryAction.confirm) {
      primaryAction.onClick?.();
      return;
    }
    setPendingActionKey(primaryAction.key);
    setActionModalOpen(true);
  };

  const rules = useMemo(() => approvalRulesLabel(commitment?.approvalRules), [commitment]);

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-10 py-4 lg:py-6">
        <div className="max-w-[1400px] mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center text-[#6B7280] hover:text-[#0F172A] mb-4 lg:mb-6 transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] mr-2" />
            <span className="text-[14px] font-medium">Back to commitments</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold tracking-tight">
                  {isLoading ? "Loading..." : title}
                </h1>
                {commitment?.version && (
                  <span className="text-[12px] font-medium text-[#6B7280] bg-[#F4F5F7] border border-[#E5E7EB] px-2.5 py-1 rounded-full">
                    v{commitment.version}
                  </span>
                )}
                {isFresh && (
                  <span className="text-[12px] font-medium text-[#0F172A] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-1 rounded-full">
                    Fresh
                  </span>
                )}
                {commitment?.approvalSentAt && (
                  <span className="text-[12px] font-medium text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-full">
                    Approval sent
                  </span>
                )}
                <StatusBadge status={uiStatus} />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <User className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="text-[#6B7280]">Client:</span>
                  <span className="font-medium">{isLoading ? "N/A" : (client?.name ?? derivedClient.name ?? "N/A")}</span>
                </div>

                {userRole === "founder" && (
                  <div className="flex items-center gap-2 text-[#4B5563]">
                    <DollarSign className="w-4 h-4 text-[#9CA3AF]" />
                    <span className="text-[#6B7280]">Amount:</span>
                    <span className="font-semibold text-[#0F172A]">{isLoading ? "N/A" : amountLabel}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[#4B5563]">
                  <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="text-[#6B7280]">Created:</span>
                  <span className="font-medium">{isLoading ? "N/A" : createdLabel}</span>
                </div>

                <div className="flex items-center gap-2 text-[#4B5563]">
                  <User className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="text-[#6B7280]">Owner:</span>
                  <span className="font-medium">{isLoading ? "N/A" : ownerLabel}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[13px]">
                <CircleAlert className="w-4 h-4 text-[#9CA3AF]" />
                <span className="text-[#6B7280]">Risk:</span>
                <span
                  className={`font-medium ${
                    risk.tone === "high" ? "text-red-600" : risk.tone === "low" ? "text-amber-600" : "text-[#0F172A]"
                  }`}
                >
                  {risk.label}
                </span>
                <span className="text-[#E5E7EB]">|</span>
                <span className="text-[#6B7280]">Last activity: {isLoading ? "N/A" : lastActivity}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {canEditAll && (
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none h-11 border-[#E5E7EB] hover:bg-[#F4F5F7]"
                  onClick={openEdit}
                  disabled={isLoading}
                >
                  Edit Commitment
                </Button>
              )}
              <Button
                onClick={handleExportPDF}
                className="flex-1 sm:flex-none bg-[#4F46E5] hover:bg-[#4338CA] text-white h-11"
                disabled={isLoading}
              >
                <Download className="w-[18px] h-[18px] mr-2" />
                <span className="hidden sm:inline">Export Proof</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {[
              { id: "overview", label: "Overview" },
              { id: "timeline", label: "Timeline" },
              { id: "deliverables", label: "Deliverables" },
              { id: "changes", label: "Changes" },
              { id: "versions", label: "Versions" },
              { id: "proof", label: "Proof" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-4 lg:px-6 py-3 text-[14px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#4F46E5] text-[#4F46E5]"
                    : "border-transparent text-[#6B7280] hover:text-[#0F172A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1400px] mx-auto">
          {error && (
            <div className="bg-white border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <div className="font-medium">{error}</div>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Status</div>
                  <StatusBadge status={uiStatus} />
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Progress</div>
                  <div className="text-[24px] text-[#0F172A] font-semibold">{progress.pct}%</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">
                    {progress.done} of {progress.total} deliverables
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Last Updated</div>
                  <div className="text-[14px] text-[#0F172A] font-semibold">{isLoading ? "N/A" : lastUpdated}</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">{isLoading ? "N/A" : lastActivity}</div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Risk Level</div>
                  <div
                    className={`text-[24px] font-semibold ${
                      risk.tone === "high" ? "text-red-600" : risk.tone === "low" ? "text-amber-600" : "text-[#059669]"
                    }`}
                  >
                    {risk.label}
                  </div>
                  <div className="text-[13px] text-[#6B7280] mt-1">
                    {risk.tone === "high" ? "Needs attention" : risk.tone === "low" ? "Watch" : "On track"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-[16px] text-[#0F172A] font-semibold mb-4">Description</h3>
                <p className="text-[14px] text-[#4B5563] leading-relaxed whitespace-pre-wrap">
                  {isLoading ? "Loading..." : (commitment?.scopeDescription ?? "N/A")}
                </p>
              </div>

              {/* Approval Rules */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-[#4F46E5]" />
                  <h3 className="text-[16px] text-[#0F172A] font-semibold">Approval Rules</h3>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-[13px] text-[#6B7280] mb-1">Approver</dt>
                    <dd className="text-[14px] text-[#0F172A] font-medium">{rules.approverLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-[#6B7280] mb-1">Re-approval on changes</dt>
                    <dd className="text-[14px] text-[#0F172A] font-medium">{rules.reApprovalOnChangesLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-[#6B7280] mb-1">Acceptance required</dt>
                    <dd className="text-[14px] text-[#0F172A] font-medium">{rules.acceptanceRequiredLabel}</dd>
                  </div>
                </dl>
              </div>

              {/* Attachments */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Paperclip className="w-5 h-5 text-[#6B7280]" />
                  <h3 className="text-[16px] text-[#0F172A] font-semibold">Attachments</h3>
                </div>

                {Array.isArray(commitment?.attachments) && commitment.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {commitment.attachments.map((a: any, idx: number) => (
                      <a
                        key={idx}
                        href={a?.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg hover:bg-white transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] text-[#0F172A] font-medium truncate">
                            {a?.fileName ?? a?.originalName ?? a?.publicId ?? "Attachment"}
                          </div>
                          <div className="text-[12px] text-[#6B7280]">
                            {a?.mimeType ? String(a.mimeType) : "N/A"} {" - "}
                            {typeof a?.bytes === "number" ? `${Math.round(a.bytes / 1024)} KB` : "N/A"}
                          </div>
                        </div>
                        <div className="text-[12px] text-[#4F46E5] font-medium">Open</div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-[14px] text-[#6B7280]">No attachments</div>
                )}
              </div>

              {/* Note: Payment Terms + Milestones */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Payment Terms */}
  <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
    <div className="flex items-center gap-2 mb-4">
      <DollarSign className="w-5 h-5 text-[#6B7280]" />
      <h3 className="text-[16px] text-[#0F172A] font-semibold">Payment Terms</h3>
    </div>

    {isLoading ? (
      <div className="text-[14px] text-[#6B7280]">Loading payment terms...</div>
    ) : Array.isArray(commitment?.paymentTerms) && commitment.paymentTerms.length > 0 ? (
      <div className="space-y-3">
        {commitment.paymentTerms.map((p: any, idx: number) => {
          const amount =
            typeof p?.amount === "number"
              ? formatMoney(p.amount, p.currency || commitment?.currency)
              : null;

          return (
            <div
              key={idx}
              className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[14px] text-[#0F172A] font-medium">
                    {p?.text ?? "N/A"}
                  </div>

                </div>

                {canEditTerms ? (
                  <select
                    className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-[12px] font-medium"
                    value={String(p?.status || "PENDING")}
                    onChange={(e) => openStatusConfirm("payment", idx, e.target.value)}
                    disabled={inlineStatusSaving}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                ) : (
                  <span
                    className={`shrink-0 text-[12px] px-2.5 py-1 rounded-md border font-medium ${pillClass(
                      p?.status
                    )}`}
                  >
                    {String(p?.status || "PENDING").replaceAll("_", " ")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-[14px] text-[#6B7280]">No payment terms</div>
    )}
  </div>

  {/* Milestones */}
  <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
    <div className="flex items-center gap-2 mb-4">
      <Clock className="w-5 h-5 text-[#6B7280]" />
      <h3 className="text-[16px] text-[#0F172A] font-semibold">Milestones</h3>
    </div>

    {isLoading ? (
      <div className="text-[14px] text-[#6B7280]">Loading milestones...</div>
    ) : Array.isArray(commitment?.milestones) && commitment.milestones.length > 0 ? (
      <div className="space-y-3">
        {commitment.milestones.map((m: any, idx: number) => (
          <div
            key={idx}
            className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[14px] text-[#0F172A] font-medium">
                  {m?.text ?? "N/A"}
                </div>

              </div>

              {canEditTerms ? (
                <select
                  className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-[12px] font-medium"
                  value={String(m?.status || "NOT_STARTED")}
                  onChange={(e) => openStatusConfirm("milestone", idx, e.target.value)}
                  disabled={inlineStatusSaving}
                >
                  <option value="NOT_STARTED">NOT_STARTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              ) : (
                <span
                  className={`shrink-0 text-[12px] px-2.5 py-1 rounded-md border font-medium ${pillClass(
                    m?.status
                  )}`}
                >
                  {String(m?.status || "NOT_STARTED").replaceAll("_", " ")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-[14px] text-[#6B7280]">No milestones</div>
    )}
  </div>
</div>


              {/* Actions */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-[16px] text-[#0F172A] font-semibold mb-4">Actions</h3>
                {primaryAction ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="bg-[#0F172A] hover:bg-black text-white h-11"
                      onClick={handlePrimaryActionClick}
                      disabled={isLoading || !!actionLoading}
                    >
                      {actionLoading === primaryAction.key ? "Working..." : primaryAction.label}
                    </Button>
                  </div>
                ) : (
                  <div className="text-[14px] text-[#6B7280]">No actions available for this status.</div>
                )}
              </div>
            </div>
          )}

          {/* Note: TIMELINE TAB (now based on actual commitment fields + history) */}
          {activeTab === "timeline" && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-[16px] text-[#0F172A] font-semibold mb-2">Activity Timeline</h3>
              <p className="text-[13px] text-[#6B7280] mb-6">
                Derived from commitment timestamps (created/sent/approved/delivered/accepted) + history events.
              </p>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-[14px] text-[#6B7280]">Loading timeline...</div>
                ) : timelineEvents.length === 0 ? (
                  <div className="text-[14px] text-[#6B7280]">No activity yet.</div>
                ) : (
                  timelineEvents.map((event: any, index: any) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${TimelineDotClass(
                            event.type
                          )}`}
                        >
                          <TimelineIcon type={event.type} />
                        </div>
                        {index < timelineEvents.length - 1 && <div className="w-0.5 h-full bg-[#E5E7EB] mt-2" />}
                      </div>

                      <div className="flex-1 pb-6">
                        <div className="text-[14px] text-[#0F172A] font-medium mb-1">{event.title}</div>
                        {event.subTitle && <div className="text-[13px] text-[#6B7280]">{event.subTitle}</div>}
                        <div className="text-[13px] text-[#9CA3AF] mt-1">
                          {timeAgo(event.iso)} - {formatDateTime(event.iso)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

{activeTab === "deliverables" && (
  <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
    <h3 className="text-[16px] text-[#0F172A] font-semibold mb-4">
      Deliverables
    </h3>

    {isLoading ? (
      <div className="text-[14px] text-[#6B7280]">Loading deliverables...</div>
    ) : Array.isArray(deliverablesDraft) && deliverablesDraft.length > 0 ? (
      <div className="space-y-3">
        {deliverablesDraft.map((d: any, idx: number) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg"
          >
            {/* Left: Deliverable text */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
              </div>
              <div>
                <div className="text-[14px] text-[#0F172A] font-medium">
                  {d.text ?? "N/A"}
                </div>
              </div>
            </div>

            {/* Right: Status */}
            <div className="shrink-0">
              {canEditDeliverables ? (
                <select
                  className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px]"
                  value={d.status}
                  onChange={(e) =>
                    openStatusConfirm("deliverable", idx, e.target.value)
                  }
                  disabled={inlineStatusSaving}
                >
                  <option value="NOT_STARTED">NOT_STARTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              ) : (
                <span
                  className={`text-[12px] px-2.5 py-1 rounded-md border font-medium ${
                    d.status === "ACCEPTED"
                      ? "bg-[#DCFCE8] text-[#047857] border-[#86EFAC]"
                      : d.status === "DELIVERED"
                      ? "bg-[#E0EAFF] text-[#4338CA] border-[#C7D2FE]"
                      : d.status === "IN_PROGRESS"
                      ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                      : "bg-[#F4F5F7] text-[#4B5563] border-[#E5E7EB]"
                  }`}
                >
                  {String(d.status || "NOT_STARTED").replace("_", " ")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-[14px] text-[#6B7280]">
        No deliverables added yet.
      </div>
    )}
  </div>
)}


          {activeTab === "changes" && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-[16px] text-[#0F172A] font-semibold mb-6">Change Requests</h3>
              {changeRequestsLoading ? (
                <div className="text-[14px] text-[#6B7280]">Loading change requests...</div>
              ) : changeRequestsError ? (
                <div className="text-[14px] text-[#B91C1C]">{changeRequestsError}</div>
              ) : changeRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-[14px] text-[#6B7280] mb-4">No change requests</div>
                  <p className="text-[13px] text-[#9CA3AF]">When the client requests a change, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {changeRequests.map((req) => {
                    const statusLabel = String(req.status || "OPEN").replaceAll("_", " ");
                    const requestedBy =
                      req.requestedBy?.name ??
                      req.requestedBy?.email ??
                      (req.requestedByType ? req.requestedByType : "Client");
                    const isOpen = String(req.status || "OPEN").toUpperCase() === "OPEN";
                    const isBusy = changeRequestsAction?.id === req._id;
                    return (
                      <div key={req._id} className="border border-[#E5E7EB] rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[14px] text-[#0F172A] font-medium mb-1">
                              {req.reason || "No details provided."}
                            </div>
                            <div className="text-[12px] text-[#6B7280]">
                              Requested by {requestedBy}
                              {req.commitmentVersion ? ` - Version ${req.commitmentVersion}` : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[12px] font-medium px-2.5 py-1 rounded-full border ${changeRequestStatusClass(
                                req.status
                              )}`}
                            >
                              {statusLabel}
                            </span>
                            {isOpen && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-[#E5E7EB]"
                                  disabled={isBusy || !!changeRequestsAction}
                                  onClick={() => handleRejectChangeRequest(req)}
                                >
                                  {isBusy && changeRequestsAction?.action === "reject" ? "Rejecting..." : "Reject"}
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 bg-[#0F172A] hover:bg-black text-white"
                                  disabled={isBusy || !!changeRequestsAction}
                                  onClick={() => handleAcceptChangeRequest(req)}
                                >
                                  {isBusy && changeRequestsAction?.action === "accept" ? "Approving..." : "Accept"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-[12px] text-[#9CA3AF] mt-2">
                          {formatDateTime(req.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "versions" && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-[16px] text-[#0F172A] font-semibold">Version History</h3>
                {commitment?.version && (
                  <div className="text-[13px] text-[#6B7280]">Current v{commitment.version}</div>
                )}
              </div>

              {versionHistoryLoading ? (
                <div className="text-[14px] text-[#6B7280]">Loading versions...</div>
              ) : versionHistoryError ? (
                <div className="text-[14px] text-[#B91C1C]">{versionHistoryError}</div>
              ) : versionHistory.length <= 1 ? (
                <div className="text-[14px] text-[#6B7280]">No previous versions yet.</div>
              ) : (
                <div className="space-y-2">
                  {versionHistory.map((v) => {
                    const isCurrent = String(v?._id) === String(currentCommitmentId);
                    return (
                      <button
                        key={v?._id}
                        type="button"
                        onClick={() => {
                          if (!v?._id || isCurrent) return;
                          setCurrentCommitmentId(String(v._id));
                          setActiveTab("overview");
                        }}
                        className={`w-full flex items-center justify-between gap-4 p-3 rounded-lg border text-left transition-colors ${
                          isCurrent
                            ? "bg-[#F4F5F7] border-[#E5E7EB]"
                            : "bg-white border-[#E5E7EB] hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] text-[#0F172A] font-medium">
                            Version {v?.version ?? "?"}
                            {isCurrent ? " (Current)" : ""}
                          </div>
                          <div className="text-[12px] text-[#6B7280]">
                            {formatShortDate(v?.createdAt)} - {String(v?.status || "").replaceAll("_", " ")}
                          </div>
                        </div>
                        <div className="text-[12px] text-[#4F46E5] font-medium">
                          {isCurrent ? "Viewing" : "Open"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "proof" && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-[16px] text-[#0F172A] font-semibold mb-1">Proof of Agreement</h3>
                  <p className="text-[14px] text-[#6B7280]">Export signed record of approval + current terms</p>
                </div>
                <Button
                  onClick={handleExportPDF}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB]">
                  <div className="text-[13px] text-[#6B7280] mb-1">Commitment</div>
                  <div className="text-[14px] text-[#0F172A] font-medium">{title}</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">Version: {commitment?.version ?? "N/A"}</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">Status: {commitment?.status ?? "N/A"}</div>
                </div>

                <div className="p-4 bg-[#F4F5F7] rounded-lg border border-[#E5E7EB]">
                  <div className="text-[13px] text-[#6B7280] mb-1">Client</div>
                  <div className="text-[14px] text-[#0F172A] font-medium">
                    {client?.name ?? derivedClient.name ?? "N/A"}
                  </div>
                  <div className="text-[13px] text-[#6B7280] mt-1">{client?.email ?? derivedClient.email ?? "N/A"}</div>
                </div>

                <div className="text-[13px] text-[#6B7280]">
                  Next: you can generate a proper proof PDF including timeline + attachments + approval rules.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Actions */}
      <div className="lg:hidden border-t border-[#E5E7EB] bg-white p-4">
        {primaryAction ? (
          <Button
            onClick={handlePrimaryActionClick}
            className="w-full bg-[#0F172A] hover:bg-black text-white h-11"
            disabled={isLoading || !!actionLoading}
          >
            {actionLoading === primaryAction.key ? "Working..." : primaryAction.label}
          </Button>
        ) : (
          <Button
            onClick={handleExportPDF}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white h-11"
            disabled={isLoading}
          >
            <Download className="w-[18px] h-[18px] mr-2" />
            Export
          </Button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Commitment</DialogTitle>
              <DialogDescription>Update details before sending for approval.</DialogDescription>
            </DialogHeader>

          <div className="space-y-4 pb-2">
            <div>
              <label className="text-[13px] text-[#6B7280] mb-1 block">Title</label>
              <Input
                value={editDraft.title}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Commitment title"
              />
            </div>

            <div>
              <label className="text-[13px] text-[#6B7280] mb-1 block">Scope description</label>
              <Textarea
                value={editDraft.scopeDescription}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, scopeDescription: e.target.value }))}
                rows={6}
                placeholder="Describe scope and expectations"
              />
            </div>

            <div>
              <label className="text-[13px] text-[#6B7280] mb-1 block">Amount (INR)</label>
              <Input
                type="number"
                value={editDraft.amount}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <div className="text-[13px] text-[#6B7280] mb-2">Payment terms</div>
              <div className="space-y-2">
                {editDraft.paymentTerms.map((term, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={term.text}
                      onChange={(e) =>
                        setEditDraft((prev) => {
                          const next = [...prev.paymentTerms];
                          next[idx] = { ...next[idx], text: e.target.value };
                          return { ...prev, paymentTerms: next };
                        })
                      }
                      placeholder={`Term ${idx + 1}`}
                    />
                    <select
                      className="h-10 rounded-md border border-[#E5E7EB] bg-white px-3 text-[14px]"
                      value={term.status}
                      onChange={(e) =>
                        setEditDraft((prev) => {
                          const next = [...prev.paymentTerms];
                          next[idx] = { ...next[idx], status: e.target.value };
                          return { ...prev, paymentTerms: next };
                        })
                      }
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="OVERDUE">OVERDUE</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                    <Button
                      variant="outline"
                      className="border-[#E5E7EB]"
                      onClick={() =>
                        setEditDraft((prev) => ({
                          ...prev,
                          paymentTerms: prev.paymentTerms.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="border-[#E5E7EB]"
                  onClick={() =>
                    setEditDraft((prev) => ({
                      ...prev,
                      paymentTerms: [...prev.paymentTerms, { text: "", status: "PENDING" }],
                    }))
                  }
                >
                  Add term
                </Button>
              </div>
            </div>

            <div>
              <div className="text-[13px] text-[#6B7280] mb-2">Milestones</div>
              <div className="space-y-2">
                {editDraft.milestones.map((ms, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={ms.text}
                      onChange={(e) =>
                        setEditDraft((prev) => {
                          const next = [...prev.milestones];
                          next[idx] = { ...next[idx], text: e.target.value };
                          return { ...prev, milestones: next };
                        })
                      }
                      placeholder={`Milestone ${idx + 1}`}
                    />
                    <select
                      className="h-10 rounded-md border border-[#E5E7EB] bg-white px-3 text-[14px]"
                      value={ms.status}
                      onChange={(e) =>
                        setEditDraft((prev) => {
                          const next = [...prev.milestones];
                          next[idx] = { ...next[idx], status: e.target.value };
                          return { ...prev, milestones: next };
                        })
                      }
                    >
                      <option value="NOT_STARTED">NOT_STARTED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="BLOCKED">BLOCKED</option>
                    </select>
                    <Button
                      variant="outline"
                      className="border-[#E5E7EB]"
                      onClick={() =>
                        setEditDraft((prev) => ({
                          ...prev,
                          milestones: prev.milestones.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="border-[#E5E7EB]"
                  onClick={() =>
                    setEditDraft((prev) => ({
                      ...prev,
                      milestones: [...prev.milestones, { text: "", status: "NOT_STARTED" }],
                    }))
                  }
                >
                  Add milestone
                </Button>
              </div>
            </div>

            <div>
              <div className="text-[13px] text-[#6B7280] mb-2">Deliverables</div>
              <div className="space-y-2">
                {editDraft.deliverables.map((d, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={d.text}
                      onChange={(e) =>
                        setEditDraft((prev) => {
                          const next = [...prev.deliverables];
                          next[idx] = { ...next[idx], text: e.target.value };
                          return { ...prev, deliverables: next };
                        })
                      }
                      placeholder={`Deliverable ${idx + 1}`}
                    />
                    <select
                      className="h-10 rounded-md border border-[#E5E7EB] bg-white px-3 text-[14px]"
                      value={d.status}
                      onChange={(e) =>
                        setEditDraft((prev) => {
                          const next = [...prev.deliverables];
                          next[idx] = { ...next[idx], status: e.target.value };
                          return { ...prev, deliverables: next };
                        })
                      }
                    >
                      <option value="NOT_STARTED">NOT_STARTED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <Button
                      variant="outline"
                      className="border-[#E5E7EB]"
                      onClick={() =>
                        setEditDraft((prev) => ({
                          ...prev,
                          deliverables: prev.deliverables.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="border-[#E5E7EB]"
                  onClick={() =>
                    setEditDraft((prev) => ({
                      ...prev,
                      deliverables: [...prev.deliverables, { text: "", status: "NOT_STARTED" }],
                    }))
                  }
                >
                  Add deliverable
                </Button>
              </div>
            </div>

            <div>
              <div className="text-[13px] text-[#6B7280] mb-2">Approval rules</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] text-[#6B7280] mb-1 block">Approver</label>
                  <select
                    className="h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-[14px]"
                    value={editDraft.approvalRules.approver}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        approvalRules: { ...prev.approvalRules, approver: e.target.value },
                      }))
                    }
                  >
                    <option value="CLIENT_ONLY">Client only</option>
                    <option value="BOTH_PARTIES">Both parties</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-[#6B7280] mb-1 block">Re-approval</label>
                  <select
                    className="h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-[14px]"
                    value={editDraft.approvalRules.reApprovalOnChanges ? "YES" : "NO"}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        approvalRules: {
                          ...prev.approvalRules,
                          reApprovalOnChanges: e.target.value === "YES",
                        },
                      }))
                    }
                  >
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-[#6B7280] mb-1 block">Acceptance required</label>
                  <select
                    className="h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-[14px]"
                    value={editDraft.approvalRules.acceptanceRequired ? "YES" : "NO"}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        approvalRules: {
                          ...prev.approvalRules,
                          acceptanceRequired: e.target.value === "YES",
                        },
                      }))
                    }
                  >
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
              </div>
            </div>

            {editError && <div className="text-[13px] text-[#B91C1C]">{editError}</div>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#E5E7EB]"
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0F172A] hover:bg-black text-white"
              onClick={handleSaveEdit}
              disabled={editSaving}
            >
              {editSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={actionModalOpen}
        onOpenChange={(open) => {
          setActionModalOpen(open);
          if (!open) setPendingActionKey(null);
        }}
        title={primaryAction?.title || "Confirm action"}
        description={primaryAction?.description || "Are you sure you want to proceed?"}
        confirmLabel={primaryAction?.confirmLabel || "Confirm"}
        onConfirm={() => {
          const key = pendingActionKey;
          setActionModalOpen(false);
          setPendingActionKey(null);
          if (key) executePrimaryAction(key);
        }}
      />
      <ConfirmModal
        open={statusConfirmOpen}
        onOpenChange={(open) => {
          setStatusConfirmOpen(open);
          if (!open) setPendingStatusChange(null);
        }}
        title="Update status?"
        description="This will update the status and save immediately."
        confirmLabel="Update"
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}


