// src/components/AcceptanceView.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Package, AlertCircle, Loader2, Wrench } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { getAcceptanceInfo, postAcceptance } from "../../api/public";

type AcceptanceApi = {
  ok: boolean;
  purpose?: string; // "ACCEPTANCE"
  versionOk?: boolean;
  requestId?: string;
  commitment?: any; // your backend shape
  client?: { name?: string; email?: string };
};

interface AcceptanceViewProps {
  token: string;
  onAccepted?: (payload: {
    commitment?: any;
    client?: { name?: string; email?: string };
    acceptedAt?: string;
    confirmationId?: string;
  }) => void;
  onFixRequested?: () => void;
}


function pickCommitment(data: any) {
  // supports both:
  // data.commitment.commitment (your approval response)
  // or data.commitment directly
  return data?.commitment?.commitment ?? data?.commitment ?? null;
}

function formatMoney(amount?: number, currency?: string) {
  if (amount === undefined || amount === null) return "N/A";
  const cur = currency || "INR";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${amount} ${cur}`;
  }
}

export function AcceptanceView({ token, onAccepted, onFixRequested }: AcceptanceViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AcceptanceApi | null>(null);
  const [actionLoading, setActionLoading] = useState<null | "accept" | "request_fix">(null);
  const [mode, setMode] = useState<"default" | "fix">("default");
  const [feedback, setFeedback] = useState("");
  const [fixReason, setFixReason] = useState("");

  const loadAcceptance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAcceptanceInfo(token);
      setData(res);
    } catch (e: any) {
      setData(null);
      setError(typeof e?.message === "string" ? e.message : "Failed to load acceptance.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadAcceptance();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAcceptance]);

  const commitment = useMemo(() => pickCommitment(data), [data]);

  const title = commitment?.title ?? "Deliverables";
  const scope = commitment?.scopeDescription ?? "N/A";
  const amountLabel = formatMoney(commitment?.amount, commitment?.currency);

  const clientName = data?.client?.name ?? commitment?.clientSnapshot?.name ?? "Client";
  const clientEmail = data?.client?.email ?? commitment?.clientSnapshot?.email ?? "-";

  const attachments = Array.isArray(commitment?.attachments) ? commitment.attachments : [];
  const milestones = Array.isArray(commitment?.milestones) ? commitment.milestones : [];
  const paymentTerms = Array.isArray(commitment?.paymentTerms) ? commitment.paymentTerms : [];
    const deliverables = Array.isArray(commitment?.deliverables) ? commitment.deliverables : [];

  const busy = Boolean(actionLoading);

  const handleAccept = async () => {
    if (busy) return;
    setError(null);
    setActionLoading("accept");
    try {
      await postAcceptance(token, "accept", feedback.trim() || undefined);
      const now = new Date().toISOString();
      let latest = data;
      try {
        latest = await getAcceptanceInfo(token);
      } catch {
        // fallback to current data
      }
      const latestCommitment = pickCommitment(latest) ?? commitment;
      const latestClient = latest?.client ?? data?.client;
      onAccepted?.({
        commitment: latestCommitment,
        client: latestClient,
        acceptedAt: latestCommitment?.acceptedAt ?? now,
        confirmationId: latestCommitment?._id,
      });
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Failed to submit acceptance.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestFix = async () => {
    const reason = fixReason.trim();
    if (busy || !reason) return;
    setError(null);
    setActionLoading("request_fix");
    try {
      await postAcceptance(token, "request_fix", reason);
      onFixRequested?.();
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Failed to submit fix request.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-900 mb-2 text-[22px] sm:text-[26px] font-semibold">
            Review & Accept Deliverables
          </h1>
          <p className="text-slate-600">
            Please review what's delivered. You can accept or request fixes from this same link.
          </p>
          <div className="text-xs text-slate-500 mt-2 break-all">
            Token: {token}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
            <div className="text-sm text-slate-700">Loading deliverables...
          </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Details */}
        {!loading && !error && (
          <>
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <div className="space-y-5">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Commitment</div>
                  <div className="text-slate-900 font-semibold text-[16px]">{title}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-5">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Client</div>
                    <div className="text-slate-900">{clientName}</div>
                    <div className="text-slate-600 text-sm">{clientEmail}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Value</div>
                    <div className="text-slate-900">{amountLabel}</div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <div className="text-sm text-slate-500 mb-2">Scope / Notes</div>
                  <div className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed">
                    {scope}
                  </div>
                </div>

                {milestones.length > 0 && (
                  <div className="border-t border-slate-200 pt-5">
                    <div className="text-sm text-slate-500 mb-2">Milestones</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
                      {milestones.map((m: any, idx: number) => (
                        <li key={idx}>
                          {m?.text ?? "N/A"}{" "}
                          <span className="text-slate-500">({m?.status ?? "N/A"})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {deliverables.length > 0 && (
                  <div className="border-t border-slate-200 pt-5">
                    <div className="text-sm text-slate-500 mb-2">Deliverables</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
                        {deliverables.map((d: any, idx: number) => (
                            <li key={idx}>
                              {d?.text ?? "N/A"}{" "}
                              <span className="text-slate-500">({d?.status ?? "N/A"})</span>
                            </li>
                        ))}
                    </ul>
                  </div>
                )}

                {paymentTerms.length > 0 && (
                  <div className="border-t border-slate-200 pt-5">
                    <div className="text-sm text-slate-500 mb-2">Payment Terms</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
                      {paymentTerms.map((p: any, idx: number) => (
                        <li key={idx}>
                          {p?.text ?? "N/A"}{" "}
                          <span className="text-slate-500">({p?.status ?? "N/A"})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="border-t border-slate-200 pt-5">
                    <div className="text-sm text-slate-500 mb-2">Attachments</div>
                    <div className="space-y-2">
                      {attachments.map((a: any, idx: number) => (
                        <a
                          key={idx}
                          href={a?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-indigo-600 hover:underline break-all"
                        >
                          {a?.fileName ?? a?.url ?? "Attachment"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <div className="font-medium mb-1">Important</div>
                  <div>
                    Accept only if everything is correct. If something needs changes, request a fix instead.
                  </div>
                </div>
              </div>
            </div>

            {/* Optional feedback */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <div className="text-slate-900 font-semibold mb-2 text-[15px]">Optional Feedback</div>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share any feedback (optional)"
                rows={4}
                disabled={busy}
              />
              <div className="text-xs text-slate-500 mt-2">
                This feedback will be sent along with your acceptance (optional).
              </div>
            </div>

            {/* Actions */}
            {mode === "fix" ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
                <div className="text-slate-900 font-semibold mb-2 text-[15px]">Request Fix</div>
                <div className="text-sm text-slate-600 mb-4">
                  Tell the team what needs to be corrected.
                </div>
                <Textarea
                  value={fixReason}
                  onChange={(e) => setFixReason(e.target.value)}
                  placeholder="Explain what to fix..."
                  rows={4}
                  disabled={busy}
                />
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => {
                      setMode("default");
                      setFixReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                    disabled={busy || fixReason.trim().length === 0}
                    onClick={handleRequestFix}
                  >
                    {actionLoading === "request_fix" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Wrench className="w-4 h-4 mr-2" />
                        Submit Fix Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => setMode("fix")}
                >
                  Request Fix
                </Button>
                <Button
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={busy}
                  onClick={handleAccept}
                >
                  {actionLoading === "accept" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept Deliverables
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-8 text-sm text-slate-500">
          This action is secure and timestamped. A copy will be sent to both parties.
        </div>
      </div>
    </div>
  );
}
