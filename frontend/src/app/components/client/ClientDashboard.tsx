import { useEffect, useState } from "react";
import { Clock, CheckCircle, FileText } from "lucide-react";
import { StatusBadge } from "../design-system/StatusBadge";
import { toast } from "sonner";
import { getClientDashboard } from "../../../api/dashboard";

interface ClientDashboardProps {
  onViewApproval: (id: string) => void;
  onViewAcceptance: (id: string) => void;
  onViewHistory: (id: string) => void;
}

function formatMoney(amount?: number, currency = "INR") {
  if (amount === undefined || amount === null) return "N/A";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso?: string) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (Number.isNaN(diffMs)) return "N/A";

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

export function ClientDashboard({
  onViewApproval,
  onViewAcceptance,
  onViewHistory,
}: ClientDashboardProps) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await getClientDashboard();
        setDashboard(res.dashboard);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load client dashboard");
        setDashboard(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const pendingApprovals = dashboard?.pendingApprovals || [];
  const pendingAcceptance = dashboard?.pendingAcceptance || [];
  const recentActivity = dashboard?.recentActivity || [];
  const summary = dashboard?.summary || {
    pendingApprovals: { count: 0 },
    pendingAcceptance: { count: 0 },
    recentActivity: 0,
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">Client Portal</h1>
        <p className="text-slate-600">
          Review pending approvals and deliverables awaiting your acceptance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#B45309]" />
            </div>
            <span className="text-[24px] font-semibold text-[#0F172A]">
              {summary.pendingApprovals?.count || 0}
            </span>
          </div>
          <div className="text-[14px] text-[#4B5563] font-medium">
            Pending Approvals
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">
            Require your review
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#4338CA]" />
            </div>
            <span className="text-[24px] font-semibold text-[#0F172A]">
              {summary.pendingAcceptance?.count || 0}
            </span>
          </div>
          <div className="text-[14px] text-[#4B5563] font-medium">
            Pending Acceptance
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">
            Deliverables to review
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0FDF5] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#047857]" />
            </div>
            <span className="text-[24px] font-semibold text-[#0F172A]">
              {summary.recentActivity || 0}
            </span>
          </div>
          <div className="text-[14px] text-[#4B5563] font-medium">
            Recent Activity
          </div>
          <div className="text-[13px] text-[#6B7280] mt-1">
            Last updates
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 text-[14px] text-[#6B7280]">
          Loading client dashboard...
        </div>
      ) : (
        <>
          {pendingApprovals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[18px] font-semibold text-[#0F172A] mb-4">
                Pending Approvals
              </h2>
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280]">
                          Commitment
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden sm:table-cell">
                          Value
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden md:table-cell">
                          Due Date
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden lg:table-cell">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {pendingApprovals.map((item: any) => (
                        <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-[14px] font-medium text-[#0F172A]">
                              {item.name}
                            </div>
                            <div className="text-[13px] text-[#6B7280] mt-0.5">
                              Updated {timeAgo(item.lastUpdateAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#4B5563] hidden sm:table-cell">
                            {formatMoney(item.value)}
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#4B5563] hidden md:table-cell">
                            {formatDate(item.dueDate)}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => onViewApproval(item.commitmentId || item.id)}
                              className="text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {pendingAcceptance.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[18px] font-semibold text-[#0F172A] mb-4">
                Pending Acceptance
              </h2>
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280]">
                          Deliverable
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden sm:table-cell">
                          Value
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden md:table-cell">
                          Delivered
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden lg:table-cell">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {pendingAcceptance.map((item: any) => (
                        <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-[14px] font-medium text-[#0F172A]">
                              {item.name}
                            </div>
                            <div className="text-[13px] text-[#6B7280] mt-0.5">
                              Updated {timeAgo(item.lastUpdateAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#4B5563] hidden sm:table-cell">
                            {formatMoney(item.value)}
                          </td>
                          <td className="px-6 py-4 text-[14px] text-[#4B5563] hidden md:table-cell">
                            {formatDate(item.deliveryDate)}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => onViewAcceptance(item.commitmentId || item.id)}
                              className="text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-[18px] font-semibold text-[#0F172A] mb-4">
              Recent Activity
            </h2>
            <div className="bg-white rounded-xl border border-[#E5E7EB]">
              <div className="divide-y divide-[#E5E7EB]">
                {recentActivity.length === 0 && (
                  <div className="px-6 py-6 text-[14px] text-[#6B7280]">
                    No recent activity available.
                  </div>
                )}
                {recentActivity.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => onViewHistory(item.commitmentId || item.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors text-left"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#6B7280]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-[#0F172A] truncate">
                          {item.action}
                        </div>
                        <div className="text-[13px] text-[#6B7280] mt-0.5">
                          {item.client} - {timeAgo(item.createdAt)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status="completed" className="hidden sm:inline-flex" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {pendingApprovals.length === 0 && pendingAcceptance.length === 0 && recentActivity.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center mt-8">
              <div className="w-16 h-16 rounded-full bg-[#F9FAFB] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#6B7280]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0F172A] mb-2">
                All caught up
              </h3>
              <p className="text-[14px] text-[#6B7280]">
                No pending approvals or deliverables at this time
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
