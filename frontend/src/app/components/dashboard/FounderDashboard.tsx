import { useEffect, useState } from "react";
import { Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle, ArrowRight, Download, Filter } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../design-system/StatusBadge";
import { exportToPDF } from "../../utils/pdfExport";
import { DashboardSkeleton } from "../ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { toast } from "sonner";
import { getFounderDashboard } from "../../../api/dashboard";

interface FounderDashboardProps {
  onCreateNew: () => void;
  onViewCommitment: (id: string) => void;
  onViewAllCommitments: () => void;
  onViewReports: () => void;
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

export function FounderDashboard({ onCreateNew, onViewCommitment, onViewAllCommitments, onViewReports }: FounderDashboardProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const exportDashboard = async () => {
    if (!dashboard) return;
    try {
      await exportToPDF("dashboard-overview", {
        title: "Dashboard Overview",
        generatedAt: new Date().toISOString(),
        generatedBy: "Current User",
        userRole: "founder",
        stats: {
          totalCommitments: dashboard.summary?.totalValue?.count || 0,
          awaitingApproval: dashboard.summary?.pendingApprovals?.count || 0,
          atRisk: dashboard.summary?.atRisk?.count || 0,
          totalValue: dashboard.summary?.totalValue?.amount || 0,
          revenueAtRisk: dashboard.summary?.atRisk?.amount || 0,
        },
        priorityItems: (dashboard.priorityCommitments || []).map((item: any) => ({
          client: item.client,
          name: item.name,
          status: item.status,
          dueDate: formatDate(item.dueDate),
          amount: item.amount,
          priority: item.priority,
        })),
        recentActivity: (dashboard.recentActivity || []).map((item: any) => ({
          client: item.client,
          action: item.action,
          time: timeAgo(item.createdAt),
          amount: item.amount,
        })),
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to export dashboard");
    }
  };

  const activeFiltersCount = statusFilter.length + priorityFilter.length;

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: string) => {
    setPriorityFilter(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
  };

  const filteredCommitments = (dashboard?.priorityCommitments || []).filter((commitment: any) => {
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(commitment.status);
    const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(commitment.priority);
    return statusMatch && priorityMatch;
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await getFounderDashboard();
        setDashboard(res.dashboard);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load dashboard");
        setDashboard(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const summary = dashboard?.summary || {};
  const pendingApprovals = summary.pendingApprovals || { count: 0, amount: 0 };
  const active = summary.active || { count: 0, amount: 0 };
  const atRisk = summary.atRisk || { count: 0, amount: 0 };
  const totalValue = summary.totalValue || { count: 0, amount: 0 };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-10 pt-6 lg:pt-10 pb-6 lg:pb-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-1 tracking-tight">
                Executive Dashboard
              </h1>
              <p className="text-[14px] lg:text-[15px] text-[#6B7280]">
                Monitor commitments and business health
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={exportDashboard}
                className="h-10 px-4 border-[#E5E7EB] hover:bg-[#F9FAFB]"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button 
                onClick={onCreateNew}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-10 px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Commitment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div id="founder-dashboard-content" className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1600px] mx-auto">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-10">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#D97706]" />
                    </div>
                    <div className="text-[13px] text-[#6B7280] font-medium">Pending Approval</div>
                  </div>
                  <div className="text-[28px] lg:text-[32px] text-[#0F172A] font-semibold tracking-tight mb-1">
                    {pendingApprovals.count || 0}
                  </div>
                  <div className="text-[13px] text-[#D97706] font-medium">
                    {formatMoney(pendingApprovals.amount)}
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
                    </div>
                    <div className="text-[13px] text-[#6B7280] font-medium">Active</div>
                  </div>
                  <div className="text-[28px] lg:text-[32px] text-[#0F172A] font-semibold tracking-tight mb-1">
                    {active.count || 0}
                  </div>
                  <div className="text-[13px] text-[#2563EB] font-medium">
                    {formatMoney(active.amount)}
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#FEE2E2] rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
                    </div>
                    <div className="text-[13px] text-[#6B7280] font-medium">At Risk</div>
                  </div>
                  <div className="text-[28px] lg:text-[32px] text-[#0F172A] font-semibold tracking-tight mb-1">
                    {atRisk.count || 0}
                  </div>
                  <div className="text-[13px] text-[#B91C1C] font-medium">
                    {formatMoney(atRisk.amount)}
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#047857]" />
                    </div>
                    <div className="text-[13px] text-[#6B7280] font-medium">Total Value</div>
                  </div>
                  <div className="text-[28px] lg:text-[32px] text-[#0F172A] font-semibold tracking-tight mb-1">
                    {formatMoney(totalValue.amount)}
                  </div>
                  <div className="text-[13px] text-[#047857] font-medium">
                    {totalValue.count || 0} commitments
                  </div>
                </div>
              </div>

              <div className="mb-6 lg:mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-[18px] lg:text-[20px] text-[#0F172A] font-semibold mb-1">Priority Commitments</h2>
                    <p className="text-[14px] text-[#6B7280]">High-priority items requiring attention</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterOpen(true)}
                      className="h-9 px-3 border-[#E5E7EB] hover:bg-[#F9FAFB] relative"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {activeFiltersCount > 0 && (
                        <span className="ml-2 px-1.5 min-w-[20px] h-5 bg-[#4F46E5] text-white text-xs rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onViewAllCommitments}
                      className="h-9 px-3 text-[#4F46E5] hover:bg-[#F0F4FF]"
                    >
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {filteredCommitments.length === 0 ? (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-[14px] text-[#6B7280]">
                    No priority commitments found.
                  </div>
                ) : (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                          <tr>
                            <th className="text-left px-4 lg:px-6 py-3 text-[13px] text-[#6B7280] font-medium">Client</th>
                            <th className="text-left px-4 lg:px-6 py-3 text-[13px] text-[#6B7280] font-medium hidden md:table-cell">Commitment</th>
                            <th className="text-left px-4 lg:px-6 py-3 text-[13px] text-[#6B7280] font-medium">Status</th>
                            <th className="text-right px-4 lg:px-6 py-3 text-[13px] text-[#6B7280] font-medium hidden sm:table-cell">Amount</th>
                            <th className="text-left px-4 lg:px-6 py-3 text-[13px] text-[#6B7280] font-medium hidden lg:table-cell">Due Date</th>
                            <th className="text-right px-4 lg:px-6 py-3 text-[13px] text-[#6B7280] font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F5F7]">
                          {filteredCommitments.map((commitment: any) => (
                            <tr 
                              key={commitment.id}
                              className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                              onClick={() => onViewCommitment(commitment.id)}
                            >
                              <td className="px-4 lg:px-6 py-4">
                                <div className="text-[14px] text-[#0F172A] font-medium">{commitment.client}</div>
                                <div className="text-[13px] text-[#6B7280] md:hidden mt-1">{commitment.name}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                                <div className="text-[14px] text-[#4B5563]">{commitment.name}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4">
                                <StatusBadge status={commitment.status} />
                              </td>
                              <td className="px-4 lg:px-6 py-4 text-right hidden sm:table-cell">
                                <div className="text-[15px] text-[#0F172A] font-semibold">{formatMoney(commitment.amount)}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                                <div className={`text-[14px] ${commitment.daysUntilDue !== null && commitment.daysUntilDue < 0 ? 'text-[#B91C1C]' : 'text-[#6B7280]'}`}>
                                  {formatDate(commitment.dueDate)}
                                  {commitment.daysUntilDue !== null && commitment.daysUntilDue < 0 && (
                                    <span className="ml-2 text-[13px] font-medium">
                                      ({Math.abs(commitment.daysUntilDue)} days overdue)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewCommitment(commitment.id);
                                  }}
                                  className="text-[#4F46E5] hover:bg-[#F0F4FF] h-8 px-3 text-[13px]"
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[18px] lg:text-[20px] text-[#0F172A] font-semibold mb-1">Recent Activity</h2>
                    <p className="text-[14px] text-[#6B7280]">Latest updates across all commitments</p>
                  </div>
                </div>

                {dashboard?.recentActivity?.length ? (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6 space-y-4">
                    {dashboard.recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-4 pb-4 last:pb-0 border-b border-[#F4F5F7] last:border-0">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-[#4F46E5]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                            <div className="min-w-0">
                              <p className="text-[14px] text-[#0F172A] font-medium">{activity.client}</p>
                              <p className="text-[14px] text-[#6B7280]">{activity.action}</p>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <span className="text-[14px] text-[#0F172A] font-semibold">{formatMoney(activity.amount)}</span>
                              <span className="text-[13px] text-[#9CA3AF]">{timeAgo(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-[14px] text-[#6B7280]">
                    No recent activity yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Commitments</DialogTitle>
            <DialogDescription>
              Refine the priority commitments list
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Status Filter */}
            <div>
              <label className="block text-[14px] font-medium text-[#0F172A] mb-3">Status</label>
              <div className="space-y-2">
                {['pending', 'active', 'at-risk', 'awaiting-acceptance'].map(status => (
                  <label key={status} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={() => toggleStatusFilter(status)}
                      className="w-4 h-4 rounded border-[#E5E7EB] text-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
                    />
                    <span className="text-[14px] text-[#4B5563] capitalize">{status.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[14px] font-medium text-[#0F172A] mb-3">Priority</label>
              <div className="space-y-2">
                {['critical', 'high', 'medium', 'low'].map(priority => (
                  <label key={priority} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priorityFilter.includes(priority)}
                      onChange={() => togglePriorityFilter(priority)}
                      className="w-4 h-4 rounded border-[#E5E7EB] text-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
                    />
                    <span className="text-[14px] text-[#4B5563] capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-[#6B7280] hover:text-[#0F172A]"
            >
              Clear all
            </Button>
            <Button
              onClick={() => setFilterOpen(false)}
              className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
