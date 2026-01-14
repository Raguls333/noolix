import { useEffect, useState } from "react";
import { Plus, Clock, CheckCircle2, Filter, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../design-system/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { TableSkeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { getManagerDashboard } from "../../../api/dashboard";

interface ManagerDashboardProps {
  onCreateNew: () => void;
  onViewCommitment: (id: string) => void;
  onViewAllCommitments: () => void;
}

function formatMoney(amount?: number, currency = "INR") {
  if (amount === undefined || amount === null) return "N/A";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
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

export function ManagerDashboard({ onCreateNew, onViewCommitment, onViewAllCommitments }: ManagerDashboardProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeFiltersCount = statusFilter.length;

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
  };

  const commitments = dashboard?.commitments || [];
  const filteredCommitments = commitments.filter((commitment: any) => {
    return statusFilter.length === 0 || statusFilter.includes(commitment.status);
  });

  const stats = dashboard?.summary || {
    pendingApprovals: { count: 0 },
    active: { count: 0 },
    awaitingAcceptance: { count: 0 },
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await getManagerDashboard();
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

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-10 pt-6 lg:pt-10 pb-6 lg:pb-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-1 tracking-tight">
                Manager Dashboard
              </h1>
              <p className="text-[14px] lg:text-[15px] text-[#6B7280]">
                Track and manage your commitments
              </p>
            </div>
            <Button 
              onClick={onCreateNew}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-10 px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Create Commitment</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-10">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#D97706]" />
                </div>
                <div className="text-[13px] text-[#6B7280] font-medium">Pending Approval</div>
              </div>
              <div className="text-[28px] lg:text-[32px] text-[#0F172A] font-semibold tracking-tight">
                {stats.pendingApprovals?.count || 0}
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="text-[13px] text-[#6B7280] font-medium">Active</div>
              </div>
              <div className="text-[28px] lg:text-[32px] text-[#0F172A] font-semibold tracking-tight">
                {stats.active?.count || 0}
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#E0E7FF] rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#4338CA]" />
                </div>
                <div className="text-[13px] text-[#6B7280] font-medium">Awaiting Acceptance</div>
              </div>
              <div className="text-[28px] lg:text-[32px] text-[#0F172A] font-semibold tracking-tight">
                {stats.awaitingAcceptance?.count || 0}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-[18px] lg:text-[20px] text-[#0F172A] font-semibold mb-1">My Commitments</h2>
                <p className="text-[14px] text-[#6B7280]">All commitments you're managing</p>
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

            {isLoading ? (
              <TableSkeleton rows={6} />
            ) : filteredCommitments.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-[14px] text-[#6B7280]">
                No commitments found.
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
                        <th className="text-left px-4 lg:px-6 py-3 text-[13px] text-[#6B7280] font-medium hidden lg:table-cell">Last Activity</th>
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
                            <div className="text-[14px] text-[#6B7280]">{timeAgo(commitment.lastActivityAt)}</div>
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
        </div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Commitments</DialogTitle>
            <DialogDescription>
              Refine the commitments list
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <label className="block text-[14px] font-medium text-[#0F172A] mb-3">Status</label>
              <div className="space-y-2">
                {["pending", "active", "awaiting-acceptance", "completed"].map(status => (
                  <label key={status} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={() => toggleStatusFilter(status)}
                      className="w-4 h-4 rounded border-[#E5E7EB] text-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
                    />
                    <span className="text-[14px] text-[#4B5563] capitalize">{status.replace("-", " ")}</span>
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
