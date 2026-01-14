import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../design-system/StatusBadge";
import { Breadcrumbs } from "../shared/Breadcrumbs";
import { ClientSelector } from "../shared/ClientSelector";
import { exportToPDF } from "../../utils/pdfExport";
import { atRisk, agingReport, pendingApprovals } from "../../../api/reports";
import type { Commitment as ApiCommitment } from "../../../api/commitments";

interface ReportDetailViewProps {
  reportType: 'revenue-risk' | 'aging' | 'pending-approvals';
  onBack: () => void;
  onViewCommitment: (id: string) => void;
  userRole?: 'founder' | 'manager';
}

type ReportItem = {
  id: string;
  clientId?: string | null;
  client: string;
  commitment: string;
  status: string;
  amount?: number;
  reason?: string;
  age?: number;
  daysPending?: number;
};

function mapApiStatusToUiStatus(status: ApiCommitment["status"]): string {
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

export function ReportDetailView({ reportType, onBack, onViewCommitment, userRole = 'founder' }: ReportDetailViewProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportMeta = useMemo(() => {
    if (reportType === "revenue-risk") {
      return { title: "Revenue at Risk", description: "Commitments requiring immediate attention to prevent revenue loss" };
    }
    if (reportType === "aging") {
      return { title: "Commitment Aging", description: "Commitments grouped by age since creation" };
    }
    return { title: "Pending Approvals", description: "Commitments awaiting client approval" };
  }, [reportType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const clientId = selectedClients.length === 1 ? selectedClients[0] : undefined;
        let res: any;
        if (reportType === "revenue-risk") {
          res = await atRisk({ days: 7, clientId });
          const raw = Array.isArray(res?.items) ? res.items : [];
          const mapped = raw.map((item: any) => ({
            id: String(item._id || ""),
            clientId:
              typeof item?.clientId === "string"
                ? item.clientId
                : item?.clientId?._id
                ? String(item.clientId._id)
                : null,
            client: item.clientName || item?.clientId?.name || item?.clientSnapshot?.name || "Unknown",
            commitment: item.title || "Untitled",
            status: mapApiStatusToUiStatus(item.status),
            amount: item.amount,
            reason: item.riskReason,
          }));
          setItems(
            selectedClients.length > 0
              ? mapped.filter((item) => item.clientId && selectedClients.includes(item.clientId))
              : mapped
          );
        } else if (reportType === "aging") {
          res = await agingReport({ clientId });
          const raw = Array.isArray(res?.items) ? res.items : [];
          const mapped = raw.map((item: any) => ({
            id: String(item._id || ""),
            clientId:
              typeof item?.clientId === "string"
                ? item.clientId
                : item?.clientId?._id
                ? String(item.clientId._id)
                : null,
            client: item.clientName || item?.clientId?.name || item?.clientSnapshot?.name || "Unknown",
            commitment: item.title || "Untitled",
            status: mapApiStatusToUiStatus(item.status),
            amount: item.amount,
            age: item.ageDays,
          }));
          setItems(
            selectedClients.length > 0
              ? mapped.filter((item) => item.clientId && selectedClients.includes(item.clientId))
              : mapped
          );
        } else {
          res = await pendingApprovals({ clientId });
          const raw = Array.isArray(res?.items) ? res.items : [];
          const mapped = raw.map((item: any) => ({
            id: String(item._id || ""),
            clientId:
              typeof item?.clientId === "string"
                ? item.clientId
                : item?.clientId?._id
                ? String(item.clientId._id)
                : null,
            client: item.clientName || item?.clientId?.name || item?.clientSnapshot?.name || "Unknown",
            commitment: item.title || "Untitled",
            status: mapApiStatusToUiStatus(item.status),
            amount: item.amount,
            daysPending: item.daysPending,
          }));
          setItems(
            selectedClients.length > 0
              ? mapped.filter((item) => item.clientId && selectedClients.includes(item.clientId))
              : mapped
          );
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load report.");
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportType, selectedClients]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.amount || 0), 0), [items]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(`${reportType}-detail`, {
        title: reportMeta.title,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Current User',
        userRole,
        description: reportMeta.description,
        totalAmount: userRole === "founder" ? totalAmount : null,
        items: items.map((item: any) => ({
          ...item,
          amount: userRole === 'founder' ? item.amount : null
        }))
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-10 py-4 lg:py-6">
        <div className="max-w-[1600px] mx-auto">
          <Breadcrumbs 
            items={[
              { label: 'Reports', onClick: onBack },
              { label: reportMeta.title }
            ]}
          />

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-2 tracking-tight">
                {reportMeta.title}
              </h1>
              <p className="text-[14px] lg:text-[15px] text-[#6B7280]">{reportMeta.description}</p>
            </div>

            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-11 px-5"
            >
              <Download className="w-[18px] h-[18px] mr-2" />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Report'}</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <ClientSelector
              value={selectedClients}
              onChange={setSelectedClients}
              multiSelect
              placeholder="Filter by client"
              className="flex-1 sm:max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1600px] mx-auto">
          {/* Summary Card */}
          {reportType === "revenue-risk" && userRole === "founder" && (
            <div className="bg-gradient-to-br from-[#FEF2F2] to-white border border-[#FEE2E2] rounded-xl p-6 mb-6">
              <div className="text-[14px] text-[#6B7280] mb-1">Total at Risk</div>
              <div className="text-[36px] lg:text-[40px] text-[#DC2626] font-semibold mb-1 tracking-tight">
                {formatMoney(totalAmount, "INR")}
              </div>
              <div className="text-[14px] text-[#6B7280]">
                {items.length} commitments requiring action
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-[14px] text-red-700">
              {error}
            </div>
          )}
          {isLoading && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6 text-[14px] text-[#6B7280]">
              Loading report...
            </div>
          )}

          {/* Desktop Table */}
          {!isLoading && (
            <div className="hidden lg:block bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Client</th>
                  <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Commitment</th>
                  <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Status</th>
                  {userRole === 'founder' && (
                    <th className="text-right px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Amount</th>
                  )}
                  {reportType === 'revenue-risk' && (
                    <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Risk Reason</th>
                  )}
                  {reportType === 'aging' && (
                    <th className="text-center px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Age (Days)</th>
                  )}
                  {reportType === 'pending-approvals' && (
                    <th className="text-center px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Days Pending</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr 
                    key={item.id}
                    className="border-b border-[#F4F5F7] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                    onClick={() => onViewCommitment(item.id)}
                  >
                    <td className="px-6 py-5 text-[14px] text-[#0F172A] font-medium">{item.client}</td>
                    <td className="px-6 py-5 text-[14px] text-[#4B5563]">{item.commitment}</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={item.status as any} />
                    </td>
                    {userRole === 'founder' && (
                      <td className="px-6 py-5 text-right text-[15px] text-[#0F172A] font-semibold tabular-nums">
                        {formatMoney(item.amount, "INR")}
                      </td>
                    )}
                    {reportType === 'revenue-risk' && (
                      <td className="px-6 py-5 text-[14px] text-[#6B7280]">{item.reason}</td>
                    )}
                    {reportType === 'aging' && (
                      <td className="px-6 py-5 text-center text-[14px] text-[#0F172A] font-medium">{item.age}</td>
                    )}
                    {reportType === 'pending-approvals' && (
                      <td className="px-6 py-5 text-center text-[14px] text-[#0F172A] font-medium">{item.daysPending}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Mobile Cards */}
          {!isLoading && (
            <div className="lg:hidden space-y-3">
            {items.map((item: any) => (
              <button
                key={item.id}
                onClick={() => onViewCommitment(item.id)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all"
              >
                <div className="mb-3">
                  <div className="text-[15px] text-[#0F172A] font-semibold mb-1">{item.client}</div>
                  <div className="text-[14px] text-[#6B7280] mb-2">{item.commitment}</div>
                  <StatusBadge status={item.status as any} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  {userRole === 'founder' && (
                    <div>
                      <div className="text-[#6B7280] mb-0.5">Amount</div>
                      <div className="text-[#0F172A] font-semibold">{formatMoney(item.amount, "INR")}</div>
                    </div>
                  )}
                  {reportType === 'revenue-risk' && (
                    <div className="col-span-2">
                      <div className="text-[#6B7280] mb-0.5">Risk Reason</div>
                      <div className="text-[#0F172A]">{item.reason}</div>
                    </div>
                  )}
                  {reportType === 'aging' && (
                    <div>
                      <div className="text-[#6B7280] mb-0.5">Age</div>
                      <div className="text-[#0F172A] font-semibold">{item.age} days</div>
                    </div>
                  )}
                  {reportType === 'pending-approvals' && (
                    <div>
                      <div className="text-[#6B7280] mb-0.5">Pending</div>
                      <div className="text-[#0F172A] font-semibold">{item.daysPending} days</div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
