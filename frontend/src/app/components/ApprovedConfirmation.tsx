import { useMemo } from "react";
import { CircleCheck, Download } from "lucide-react";
import { Button } from "./ui/button";
import { exportCommitmentToPDF } from "../utils/pdfExport";

type ApprovedConfirmationProps = {
  variant?: "approved" | "accepted";
  commitment?: {
    _id?: string;
    title?: string;
    status?: string;
    version?: number;
    amount?: number;
    currency?: string;
    scopeDescription?: string;
    scopeText?: string;
    createdAt?: string;
    approvalSentAt?: string;
    approvedAt?: string;
  };
  client?: {
    name?: string;
    email?: string;
    companyName?: string;
  };
  approvedAt?: string;
  confirmationId?: string;
};

function formatDateTime(iso?: string) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
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

export function ApprovedConfirmation({
  variant = "approved",
  commitment,
  client,
  approvedAt,
  confirmationId,
}: ApprovedConfirmationProps) {
  const title = commitment?.title ?? "Commitment";
  const status = commitment?.status ?? (variant === "accepted" ? "ACCEPTED" : "APPROVED");
  const version = commitment?.version ?? null;
  const approvedAtLabel = formatDateTime(approvedAt ?? commitment?.approvedAt ?? commitment?.approvalSentAt);
  const confirmation = confirmationId ?? commitment?._id ?? "N/A";
  const amountLabel = formatMoney(commitment?.amount, commitment?.currency);
  const clientName = client?.name ?? "Client";
  const clientEmail = client?.email ?? "N/A";
  const scope = commitment?.scopeDescription ?? commitment?.scopeText ?? "N/A";

  const exportPayload = useMemo(() => {
    if (!commitment) return null;
    return {
      name: title,
      client: clientName,
      status,
      amount: commitment?.amount ?? null,
      dueDate: commitment?.createdAt ? formatDateTime(commitment.createdAt) : "N/A",
      owner: "N/A",
      description: scope,
      deliverables: [],
      approvalProof: {
        approvedBy: clientName,
        approvedAt: approvedAt ?? commitment?.approvedAt ?? new Date().toISOString(),
        ipAddress: "N/A",
        commitmentHash: confirmation,
      },
    };
  }, [approvedAt, clientName, commitment, confirmation, scope, status, title]);

  const handleDownload = async () => {
    if (!exportPayload) return;
    await exportCommitmentToPDF(exportPayload, "client");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CircleCheck className="w-10 h-10 text-green-700" />
        </div>

        <h1 className="text-slate-900 mb-3">
          {variant === "accepted" ? "Deliverables Accepted" : "Commitment Approved"}
        </h1>
        <p className="text-slate-600 mb-8 max-w-lg mx-auto">
          {variant === "accepted"
            ? "Thank you for confirming delivery. Both parties have been notified."
            : "Thank you for approving this commitment. Both parties have been notified and the agreement is now active."}
        </p>

        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 text-left">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">
                {variant === "accepted" ? "Accepted on" : "Approved on"}
              </div>
              <div className="text-slate-900">{approvedAtLabel}</div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="text-sm text-slate-500 mb-1">Confirmation ID</div>
              <div className="text-slate-900 font-mono text-sm">{confirmation}</div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="text-sm text-slate-500 mb-2">Next Steps</div>
              <div className="text-slate-900">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">-</span>
                    <span>Work will begin according to the agreed timeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">-</span>
                    <span>You will receive progress updates at key milestones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">-</span>
                    <span>A copy of this approval has been sent to your email</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="text-sm text-slate-500 mb-1">Commitment</div>
              <div className="text-slate-900">{title}</div>
              <div className="text-slate-600 text-sm">
                {clientName} ({clientEmail})
              </div>
              <div className="text-slate-600 text-sm">
                Status: {status}
                {version !== null ? ` | Version ${version}` : ""}
              </div>
              <div className="text-slate-600 text-sm">Amount: {amountLabel}</div>
            </div>
          </div>
        </div>

        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white"
          onClick={handleDownload}
          disabled={!exportPayload}
        >
          <Download className="w-4 h-4 mr-2" />
          {variant === "accepted" ? "Download Proof of Acceptance" : "Download Proof of Approval"}
        </Button>

        <div className="mt-8 text-sm text-slate-500">
          {variant === "accepted"
            ? "This acceptance is legally binding and timestamped"
            : "This approval is legally binding and timestamped"}
        </div>
      </div>
    </div>
  );
}
