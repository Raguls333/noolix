import { useEffect, useMemo, useState } from "react";
import { Download, CircleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../design-system/StatusBadge";
import { DateRangePicker } from "../shared/DateRangePicker";
import { ClientSelector } from "../shared/ClientSelector";
import { atRisk, revenueSummary } from "../../../api/reports";
import { exportToPDF } from "../../utils/pdfExport";
import type { Commitment as ApiCommitment } from "../../../api/commitments";

interface RevenueRiskReportEnhancedProps {
  userRole?: 'founder' | 'manager';
}

type RiskItem = {
  id: string;
  clientId: string | null;
  client: string;
  commitment: string;
  status:
    | "draft"
    | "internal-review"
    | "awaiting-client-approval"
    | "in-progress"
    | "change-requested"
    | "delivered"
    | "accepted"
    | "closed"
    | "disputed"
    | "at-risk";
  amount: number;
  dueDate: string;
  daysOverdue: number;
  riskReason: string;
};

function mapApiStatusToUiStatus(status: ApiCommitment["status"]): RiskItem["status"] {
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

export function RevenueRiskReportEnhanced({ userRole = 'founder' }: RevenueRiskReportEnhancedProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [items, setItems] = useState<RiskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAtRisk = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const from = dateRange.from ? dateRange.from.toISOString() : undefined;
        const to = dateRange.to ? dateRange.to.toISOString() : undefined;
        const clientId = selectedClients.length === 1 ? selectedClients[0] : undefined;
        const res = await atRisk({ days: 7, from, to, clientId });
        if (cancelled) return;
        const rawItems = Array.isArray(res?.items) ? res.items : [];
        const mapped = rawItems.map((item: any) => ({
          id: String(item._id || item.id || ""),
          clientId:
            typeof item?.clientId === "string"
              ? item.clientId
              : item?.clientId?._id
              ? String(item.clientId._id)
              : null,
          client: item.clientName || item?.clientId?.name || item?.clientSnapshot?.name || "Unknown",
          commitment: item.title || "Untitled",
          status: mapApiStatusToUiStatus(item.status),
          amount: typeof item.amount === "number" ? item.amount : 0,
          dueDate: formatShortDate(item.updatedAt || item.createdAt),
          daysOverdue: typeof item.daysSinceUpdate === "number" ? item.daysSinceUpdate : 0,
          riskReason: item.riskReason || "Requires attention",
        }));
        const filtered =
          selectedClients.length > 0
            ? mapped.filter((item) => item.clientId && selectedClients.includes(item.clientId))
            : mapped;
        setItems(filtered);
        if (userRole === "founder") {
          await revenueSummary();
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
  }, [dateRange.from, dateRange.to, selectedClients, userRole]);

  const handleExportPDF = () => {
    exportToPDF("revenue-risk-report", {
      title: "Revenue at Risk",
      generatedAt: new Date().toISOString(),
      generatedBy: "Current User",
      userRole,
      totalAtRisk,
      items: items.map((item) => ({
        client: item.client,
        commitment: item.commitment,
        status: item.status,
        amount: userRole === "founder" ? item.amount : null,
        dueDate: item.dueDate,
        riskReason: item.riskReason,
      })),
    });
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="flex-1 sm:max-w-xs"
        />
        <ClientSelector
          value={selectedClients}
          onChange={setSelectedClients}
          multiSelect
          placeholder="All clients"
          className="flex-1 sm:max-w-xs"
        />
        <Button 
          onClick={handleExportPDF}
          variant="outline"
          className="h-11 border-[#E5E7EB] hover:bg-[#F4F5F7]"
        >
          <Download className="w-[18px] h-[18px] mr-2" />
          <span className="hidden sm:inline">Export PDF</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Summary Card */}
      {userRole === 'founder' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CircleAlert className="w-5 h-5 text-[#DC2626]" />
            <h3 className="text-[16px] text-[#0F172A] font-semibold">Total Revenue at Risk</h3>
          </div>
          <div className="text-[36px] text-[#DC2626] font-semibold mb-1 tracking-tight">
            {formatMoney(totalAtRisk, "INR")}
          </div>
          <div className="text-[14px] text-[#6B7280]">
            {items.length} commitments require immediate attention
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
          Loading revenue risk data...
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
              <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Due Date</th>
              <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Risk Reason</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr 
                key={item.id} 
                className="border-b border-[#F4F5F7] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <td className="px-6 py-5 text-[14px] text-[#0F172A] font-medium">{item.client}</td>
                <td className="px-6 py-5 text-[14px] text-[#4B5563]">{item.commitment}</td>
                <td className="px-6 py-5">
                  <StatusBadge status={item.status} />
                </td>
                {userRole === 'founder' && (
                  <td className="px-6 py-5 text-right text-[15px] text-[#0F172A] font-semibold tabular-nums">
                    {formatMoney(item.amount, "INR")}
                  </td>
                )}
                <td className="px-6 py-5 text-[14px] text-[#4B5563]">
                  {item.dueDate}
                  {item.daysOverdue > 0 && (
                    <span className="ml-2 text-[13px] text-[#DC2626]">({item.daysOverdue}d overdue)</span>
                  )}
                </td>
                <td className="px-6 py-5 text-[14px] text-[#6B7280]">{item.riskReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && (
        <div className="lg:hidden space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-[#E5E7EB] rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-[#0F172A] font-semibold mb-1">{item.client}</div>
                <div className="text-[14px] text-[#4B5563]">{item.commitment}</div>
              </div>
              <CircleAlert className="w-5 h-5 text-[#DC2626] flex-shrink-0 ml-2" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={item.status} />
            </div>

            <div className="space-y-2 text-[13px]">
              {userRole === 'founder' && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Amount at risk</span>
                  <span className="text-[#DC2626] font-semibold">{formatMoney(item.amount, "INR")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Due date</span>
                <span className="text-[#0F172A]">
                  {item.dueDate}
                  {item.daysOverdue > 0 && (
                    <span className="ml-1 text-[#DC2626]">({item.daysOverdue}d overdue)</span>
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <div className="text-[#6B7280] mb-1">Risk reason</div>
                <div className="text-[#0F172A]">{item.riskReason}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
          <CircleAlert className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
          <div className="text-[15px] text-[#0F172A] font-medium mb-2">No revenue at risk</div>
          <div className="text-[14px] text-[#6B7280]">All commitments are on track</div>
        </div>
      )}
    </div>
  );
}
