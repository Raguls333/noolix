import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Check, CircleAlert, Loader2, Paperclip } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { getApprovalInfo, postApproval } from "../../api/public";

type ApprovalApiResponse = {
  ok: boolean;
  requestId: string;
  purpose: "APPROVAL" | string;
  versionOk: boolean;
  commitment?: {
    commitment?: {
      _id: string;
      title?: string;
      scopeDescription?: string;
      status?: string;
      version?: number;
      amount?: number;
      currency?: string;

      clientSnapshot?: {
        name?: string;
        email?: string;
        companyName?: string;
      };

      paymentTerms?: Array<{ text?: string; status?: string }>;
      milestones?: Array<{ text?: string; status?: string }>;

      attachments?: Array<{
        url?: string;
        publicId?: string;
        fileName?: string;
        mimeType?: string;
        bytes?: number;
        resourceType?: string;
        uploadedAt?: string;
      }>;

      createdAt?: string;
      updatedAt?: string;
      approvalSentAt?: string;
    };
  };
  client?: {
    name?: string;
    email?: string;
  };
};

type ApprovalSuccessPayload = {
  commitment?: ApprovalApiResponse["commitment"]["commitment"];
  client?: ApprovalApiResponse["client"];
  approvedAt?: string;
  confirmationId?: string;
};

interface ApprovalViewProps {
  token: string;
  onApproved?: (payload: ApprovalSuccessPayload) => void;
  onChangeRequested?: () => void;
}


function humanizeError(err: unknown): string {
  const msg = typeof (err as any)?.message === "string" ? (err as any).message : "";
  const status = (err as any)?.status ?? (err as any)?.response?.status;

  if (status === 410) return "This approval link has expired. Please ask the sender to resend a new link.";
  if (status === 401 || status === 403) return "This approval link is not valid anymore. Please request a new link.";
  if (msg.toLowerCase().includes("expired")) return "This approval link has expired. Please request a new link.";
  if (msg) return msg;

  return "Something went wrong. Please try again or request a new link.";
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

export function ApprovalView({ token, onApproved, onChangeRequested }: ApprovalViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApprovalApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeReason, setChangeReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmitChange = useMemo(() => changeReason.trim().length > 0, [changeReason]);

  const loadApproval = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApprovalInfo(token);
      setData(res);
    } catch (e: any) {
      setData(null);
      setError(typeof e?.message === "string" ? e.message : "Failed to load approval.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadApproval();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadApproval]);

  // Note: your real commitment is here
  const c = data?.commitment?.commitment;

  const purpose = data?.purpose;
  const versionOk = data?.versionOk;

  const title = c?.title || "N/A";
  const scope = c?.scopeDescription || "N/A";
  const status = c?.status || "N/A";
  const version = c?.version ?? null;

  const clientName = data?.client?.name ?? c?.clientSnapshot?.name ?? "N/A";
  const clientEmail = data?.client?.email ?? c?.clientSnapshot?.email ?? "N/A";
  const clientCompany = c?.clientSnapshot?.companyName ?? "N/A";

  const amountLabel = formatMoney(c?.amount, c?.currency);

  const paymentTerms = Array.isArray(c?.paymentTerms) ? c!.paymentTerms! : [];
  const milestones = Array.isArray(c?.milestones) ? c!.milestones! : [];
  const attachments = Array.isArray(c?.attachments) ? c!.attachments! : [];

  const isLinkInvalid =
    (purpose && purpose !== "APPROVAL") || (typeof versionOk === "boolean" && versionOk === false);

  const handleApprove = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await postApproval(token, "approve");
      const now = new Date().toISOString();
      let latest = data;
      try {
        latest = await getApprovalInfo(token);
      } catch {
        // fallback to current data
      }
      const commitment = latest?.commitment?.commitment ?? c;
      const client = latest?.client ?? data?.client;
      onApproved?.({
        commitment,
        client,
        approvedAt: commitment?.approvedAt ?? now,
        confirmationId: commitment?._id,
      });
    } catch (e) {
      setSubmitError(humanizeError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChange = async () => {
    if (isSubmitting) return;
    const reason = changeReason.trim();
    if (!reason) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await postApproval(token, "request_change", reason);
      onChangeRequested?.();
    } catch (e) {
      setSubmitError(humanizeError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-900 mb-2 text-xl sm:text-2xl font-semibold">Review & Approve Scope</h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Please review the scope below. You can approve it or request changes from the same link.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
            <div className="text-slate-700 text-sm">Loading approval details...
          </div>
          </div>
        )}

        {/* Load Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
            <div className="text-sm text-red-800">{error}</div>
            <div className="mt-3">
              <Button variant="outline" className="border-red-200" onClick={loadApproval}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Link invalid / expired */}
        {!loading && !error && isLinkInvalid && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
            <div className="text-sm text-amber-900 font-medium mb-1">This link can't be used</div>
            <div className="text-sm text-amber-800">
              {purpose && purpose !== "APPROVAL"
                ? "This link is not meant for approval."
                : "This approval link is outdated (version mismatch) or expired. Please ask the sender to resend a new link."}
            </div>
          </div>
        )}

        {/* Commitment Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 mb-6">
          <div className="space-y-6">
            {/* To */}
            <div>
              <div className="text-sm text-slate-500 mb-1">To</div>
              <div className="text-slate-900 font-medium">{clientName}</div>
              <div className="text-slate-600 text-sm">{clientEmail}</div>
              <div className="text-slate-500 text-xs mt-1">{clientCompany}</div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="text-sm text-slate-500 mb-1">Commitment</div>
              <div className="text-slate-900 font-semibold">{title}</div>
              <div className="text-xs text-slate-500 mt-1">
                Status: <span className="text-slate-700">{status}</span>
                {version !== null && (
                  <>
                    <span className="mx-2 text-slate-300">|</span>
                    Version: <span className="text-slate-700">{version}</span>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="text-sm text-slate-500 mb-2">Scope of Work</div>
              <div className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed">{scope}</div>
            </div>

            <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">Total Amount</div>
                <div className="text-slate-900">{amountLabel}</div>
              </div>

              <div>
                <div className="text-sm text-slate-500 mb-1">Payment Terms</div>
                {paymentTerms.length ? (
                  <ul className="list-disc list-inside text-sm text-slate-900 space-y-1">
                    {paymentTerms.map((p, idx) => (
                      <li key={idx}>
                        {p.text || `Payment ${idx + 1}`}
                        {p.status ? <span className="text-slate-500"> ({p.status})</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-900">N/A</div>
                )}
              </div>
            </div>

            {milestones.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <div className="text-sm text-slate-500 mb-2">Milestones</div>
                <ul className="list-disc list-inside text-sm text-slate-900 space-y-1">
                  {milestones.map((m, idx) => (
                    <li key={idx}>
                      {m.text || `Milestone ${idx + 1}`}
                      {m.status ? <span className="text-slate-500"> ({m.status})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <div className="text-sm text-slate-500 mb-2">Attachments</div>
                <div className="space-y-2">
                  {attachments.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div className="text-sm text-slate-900 truncate">
                          {a.fileName || "Attachment"}
                        </div>
                      </div>

                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-slate-700 underline flex-shrink-0"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">N/A</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <CircleAlert className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <div className="font-medium mb-1">Important</div>
              <div>
                By approving, you agree to the scope and terms above. If you need changes, request them instead of approving.
              </div>
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-red-800">{submitError}</div>
          </div>
        )}

        {/* Actions */}
        {showChangeRequest ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <h3 className="text-slate-900 font-semibold mb-2">Request Changes</h3>
            <p className="text-slate-600 text-sm mb-4">Describe what needs to be changed before you can approve.</p>

            <Textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Please explain what needs to be modified..."
              rows={4}
              className="mb-4"
              disabled={isSubmitting || loading || !!error || isLinkInvalid}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (isSubmitting) return;
                  setShowChangeRequest(false);
                  setChangeReason("");
                  setSubmitError(null);
                }}
                className="flex-1 border-slate-300 text-slate-700"
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                onClick={handleRequestChange}
                disabled={!canSubmitChange || isSubmitting || loading || !!error || isLinkInvalid}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                if (isSubmitting) return;
                setShowChangeRequest(true);
                setSubmitError(null);
              }}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting || loading || !!error || isLinkInvalid}
            >
              Request Change
            </Button>

            <Button
              onClick={handleApprove}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isSubmitting || loading || !!error || isLinkInvalid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve Scope
                </>
              )}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          This approval is secure and timestamped. A copy will be sent to both parties.
        </div>
      </div>
    </div>
  );
}
