import { useEffect, useMemo, useState } from "react";
import { CircleAlert, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import {
  acceptChangeRequest,
  listCommitmentChangeRequests,
  rejectChangeRequest,
  type ChangeRequest as ApiChangeRequest,
} from "../../api/changeRequests";

interface ChangeRequestProps {
  onBack: () => void;
  commitmentId?: string;
  changeRequestId?: string;
}

function formatDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function ChangeRequest({ onBack, commitmentId, changeRequestId }: ChangeRequestProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<ApiChangeRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<null | "accept" | "reject">(null);
  const [resolved, setResolved] = useState<null | "accepted" | "rejected">(null);
  const [createdCommitmentId, setCreatedCommitmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!commitmentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listCommitmentChangeRequests(commitmentId);
        if (cancelled) return;
        const items = Array.isArray((res as any)?.items) ? (res as any).items : (res as any);
        const list = Array.isArray(items) ? items : [];
        const next =
          (changeRequestId ? list.find((item) => item?._id === changeRequestId) : null) ??
          list[0] ??
          null;
        setRequest(next ?? null);
      } catch (e: any) {
        if (cancelled) return;
        setError(typeof e?.message === "string" ? e.message : "Failed to load change request.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [commitmentId, changeRequestId]);

  const requestedByName = useMemo(() => {
    return request?.requestedBy?.name ?? "Client";
  }, [request]);

  const requestedByEmail = useMemo(() => {
    return request?.requestedBy?.email ?? "";
  }, [request]);

  const requestedAt = useMemo(() => formatDateTime(request?.createdAt), [request]);
  const reason = request?.reason ?? "";

  const canResolve = Boolean(commitmentId && request?._id && !loading && !resolved);
  const isDetailMode = Boolean(commitmentId);
  const headerTitle = isDetailMode ? "Change Request" : "Request Submitted";
  const headerDescription = isDetailMode
    ? "Client has requested modifications to the commitment"
    : "Your request has been submitted. The team will review it soon.";

  const handleAccept = async () => {
    if (!commitmentId || !request?._id || actionLoading) return;
    setActionLoading("accept");
    setError(null);
    try {
      const res: any = await acceptChangeRequest(commitmentId, request._id);
      const next = res?.commitment ?? res;
      const nextId = next?._id ? String(next._id) : null;
      setCreatedCommitmentId(nextId);
      setRequest((prev) => (prev ? { ...prev, status: "ACCEPTED" } : prev));
      setResolved("accepted");
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Failed to accept change request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!commitmentId || !request?._id || actionLoading) return;
    setActionLoading("reject");
    setError(null);
    try {
      await rejectChangeRequest(commitmentId, request._id);
      setRequest((prev) => (prev ? { ...prev, status: "REJECTED" } : prev));
      setResolved("rejected");
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Failed to reject change request.");
    } finally {
      setActionLoading(null);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to overview
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CircleAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-slate-900 mb-1">{headerTitle}</h1>
              <p className="text-slate-600">{headerDescription}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {resolved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-6">
            <div className="text-sm text-emerald-800">
              {resolved === "accepted"
                ? `Change request accepted. A new version can now be sent for approval.${createdCommitmentId ? " New version ID: " + createdCommitmentId : ""}`
                : "Change request rejected."}
            </div>
          </div>
        )}

        {!isDetailMode && (
          <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6">
            <div className="text-slate-900 font-medium mb-2">Thanks for the update.</div>
            <div className="text-slate-600 text-sm">
              We have notified the team and they will review your request shortly.
            </div>
          </div>
        )}

        {isDetailMode && (
          <>
            {/* Change Request Details */}
            <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6">
              {loading ? (
                <div className="text-sm text-slate-600">Loading change request...</div>
              ) : !request ? (
                <div className="text-sm text-slate-600">No change request found.</div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="text-sm text-slate-500 mb-1">Requested by</div>
                    <div className="text-slate-900">
                      {requestedByName}
                      {requestedByEmail ? ` (${requestedByEmail})` : ""}
                    </div>
                    <div className="text-slate-600">{requestedAt}</div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <div className="text-sm text-slate-500 mb-2">Requested Changes</div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-slate-900">{reason || "No details provided."}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Comparison */}
            {request && (
              <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6">
                <h2 className="text-slate-900 mb-3">What Changed</h2>
                <div className="text-sm text-slate-600">
                  No field-level change summary is available.
                </div>
              </div>
            )}

            {/* Action Required */}
            {!resolved && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                <div className="flex gap-3">
                  <CircleAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-amber-900 mb-1">Action Required</div>
                    <p className="text-amber-800 text-sm">
                      Approve or reject these changes to move the commitment forward.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700"
                disabled={!canResolve || actionLoading !== null}
                onClick={handleReject}
              >
                {actionLoading === "reject" ? "Rejecting..." : "Reject Changes"}
              </Button>
              <Button
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                disabled={!canResolve || actionLoading !== null}
                onClick={handleAccept}
              >
                {actionLoading === "accept" ? "Approving..." : "Approve & Update Commitment"}
              </Button>
            </div>

            {/* Audit Trail */}
            {request && (
              <div className="mt-8 bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-slate-900 mb-4">Change History</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 bg-slate-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-slate-900 text-sm">Change requested by client</div>
                      <div className="text-slate-600 text-sm">{requestedAt}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}      </div>
    </div>
  );
}
