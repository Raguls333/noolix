import { useEffect, useMemo, useState } from "react";
import { Plus, Building2, CircleAlert, Search, Download, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { exportToPDF } from "../../utils/pdfExport";
import { AddClientModal } from "./AddClientModal";
import { Pagination } from "../shared/Pagination";
import { toast } from "sonner";
import { listClients } from "../../../api/clients";
import { listCommitments, type Commitment as ApiCommitment } from "../../../api/commitments";

interface Client {
  id: string;
  name: string;
  status: "active" | "inactive";
  activeCommitments: number;
  totalValue: number;
  riskLevel: "none" | "low" | "high";
  approvalRate: number;
  lastActivity: string;
}

interface ClientsListProps {
  onViewClient: (id: string) => void;
  onCreateClient: () => void;
  userRole?: "founder" | "manager";
}

const ACTIVE_COMMITMENT_STATUSES = new Set([
  "DRAFT",
  "INTERNAL_REVIEW",
  "AWAITING_CLIENT_APPROVAL",
  "IN_PROGRESS",
  "CHANGE_REQUEST_CREATED",
  "DELIVERED",
]);

function getCommitmentClientId(commitment: ApiCommitment): string | null {
  const c = commitment.clientId;
  if (!c) return null;
  if (typeof c === "string") return c;
  if (typeof c === "object" && c._id) return String(c._id);
  return null;
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

function formatMoney(amount?: number, currency?: string) {
  if (amount === undefined || amount === null) return "N/A";
  const cur = currency || "INR";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${cur}`;
  }
}

export function ClientsList({ onViewClient, onCreateClient, userRole = "founder" }: ClientsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(10);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<any>([]);
  const [commitments, setCommitments] = useState<ApiCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const commitmentStats = useMemo(() => {
    const byClient: Record<
      string,
      { activeCount: number; totalValue: number; total: number; approved: number; latest: string | null; risk: "none" | "low" | "high" }
    > = {};

    for (const commitment of commitments) {
      const clientId = getCommitmentClientId(commitment);
      if (!clientId) continue;
      if (!byClient[clientId]) {
        byClient[clientId] = { activeCount: 0, totalValue: 0, total: 0, approved: 0, latest: null, risk: "none" };
      }
      const stats = byClient[clientId];
      stats.total += 1;
      const status = commitment.status;
      if (ACTIVE_COMMITMENT_STATUSES.has(status)) stats.activeCount += 1;
      if (status === "IN_PROGRESS" || status === "DELIVERED" || status === "ACCEPTED" || status === "CLOSED") {
        stats.approved += 1;
      }
      if (typeof commitment.amount === "number") stats.totalValue += commitment.amount;
      const updatedAt = commitment.updatedAt || commitment.createdAt || null;
      if (updatedAt && (!stats.latest || new Date(updatedAt) > new Date(stats.latest))) {
        stats.latest = updatedAt;
      }
      if (status === "CHANGE_REQUEST_CREATED" || status === "CANCELLED") {
        stats.risk = "high";
      } else if (status === "AWAITING_CLIENT_APPROVAL" || status === "DELIVERED") {
        if (stats.risk !== "high") stats.risk = "low";
      }
    }
    return byClient;
  }, [commitments]);

  const normalizedClients: Client[] = useMemo(() => {
    return clients.map((client: any) => {
      const id = String(client.id || client._id);
      const stats = commitmentStats[id] || {
        activeCount: 0,
        totalValue: 0,
        total: 0,
        approved: 0,
        latest: null,
        risk: "none",
      };
      const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
      return {
        id,
        name: client.companyName || client.name || client.email || "N/A",
        status: client.status === "inactive" ? "inactive" : "active",
        activeCommitments: stats.activeCount,
        totalValue: stats.totalValue,
        riskLevel: stats.risk,
        approvalRate,
        lastActivity: timeAgo(stats.latest || client.updatedAt || client.createdAt),
      };
    });
  }, [clients, commitmentStats]);

  const filteredClients = normalizedClients.filter((client) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || client.name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF("clients-list", {
        title: "Clients Directory",
        generatedAt: new Date().toISOString(),
        generatedBy: "Current User",
        userRole,
        filters: `Status: ${statusFilter}${searchQuery ? ` | Search: "${searchQuery}"` : ""}`,
        items: filteredClients.map((c: any) => ({
          name: c.name,
          contactPerson: "N/A",
          email: "N/A",
          phone: "N/A",
          address: "N/A",
        })),
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const activeClients = filteredClients.filter((c: any) => c.status === "active").length;
  const totalCommitments = filteredClients.reduce((sum: any, c: any) => sum + c.activeCommitments, 0);
  const totalValue = filteredClients.reduce((sum: any, c: any) => sum + c.totalValue, 0);

  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);

  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, commitmentsRes] = await Promise.all([
        listClients({ page: 1, limit: 2000 }),
        listCommitments({ page: 1, limit: 2000 }),
      ]);
      setClients(clientsRes.clients || []);
      setCommitments(commitmentsRes.items || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load clients");
      setClients([]);
      setCommitments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-10 pt-6 lg:pt-10 pb-4 lg:pb-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-1 tracking-tight">Clients</h1>
              <p className="text-[14px] lg:text-[15px] text-[#6B7280]">
                {activeClients} active clients | {totalCommitments || 0} total commitments
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="h-11 border-[#E5E7EB] hover:bg-[#F4F5F7]"
              >
                <Download className="w-[18px] h-[18px] mr-2" />
                <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export"}</span>
                <span className="sm:hidden">Export</span>
              </Button>
              {userRole === "founder" && (
                <Button 
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm px-5 h-11 rounded-lg"
                >
                  <Plus className="w-[18px] h-[18px] mr-2" />
                  <span className="hidden sm:inline">Add Client</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 h-11 bg-white border-[#E5E7EB] rounded-lg text-[14px]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                  statusFilter === "all"
                    ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setStatusFilter("active");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                  statusFilter === "active"
                    ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setStatusFilter("inactive");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                  statusFilter === "inactive"
                    ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {userRole === "founder" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                <div className="text-[13px] text-[#6B7280] mb-1">Total Value</div>
                <div className="text-[20px] text-[#0F172A] font-semibold">{formatMoney(totalValue, "INR")}</div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
                <div className="text-[13px] text-[#6B7280] mb-1">Active Commitments</div>
                <div className="text-[20px] text-[#0F172A] font-semibold">{totalCommitments || 0}</div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 col-span-2 lg:col-span-1">
                <div className="text-[13px] text-[#6B7280] mb-1">Avg Approval Rate</div>
                <div className="text-[20px] text-[#0F172A] font-semibold">
                  {Math.round(filteredClients.reduce((sum: any, c: any) => sum + c.approvalRate, 0) / filteredClients.length) || 0}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 lg:px-10 py-6 max-w-[1600px] mx-auto">
          {isLoading ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-[14px] text-[#6B7280]">
              Loading clients...
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Client</th>
                  <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Status</th>
                  <th className="text-center px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Active</th>
                  {userRole === "founder" && (
                    <th className="text-right px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Total Value</th>
                  )}
                  <th className="text-center px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Approval Rate</th>
                  <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Risk</th>
                  <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {currentClients.map((client: any) => (
                  <tr 
                    key={client.id} 
                    className="border-b border-[#F4F5F7] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                    onClick={() => onViewClient(client.id)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-[#4338CA]" />
                        </div>
                        <div className="text-[14px] text-[#0F172A] font-semibold">{client.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {client.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DCFCE8] text-[#047857] text-[13px] font-medium rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-[#F3F4F6] text-[#6B7280] text-[13px] font-medium rounded-lg">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center text-[15px] text-[#0F172A] font-semibold">
                      {client.activeCommitments || 0}
                    </td>
                    {userRole === "founder" && (
                      <td className="px-6 py-5 text-right text-[15px] text-[#0F172A] font-semibold tabular-nums">
                        {formatMoney(client.totalValue, "INR")}
                      </td>
                    )}
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="text-[14px] text-[#0F172A] font-medium">{client.approvalRate || 0}%</div>
                        <div className="w-16 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              client.approvalRate >= 90 ? 'bg-[#059669]' :
                              client.approvalRate >= 70 ? 'bg-[#D97706]' :
                              'bg-[#DC2626]'
                            }`}
                            style={{ width: `${client.approvalRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {client.riskLevel === "high" && (
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#B91C1C] font-medium">
                          <CircleAlert className="w-3.5 h-3.5" />
                          High
                        </span>
                      )}
                      {client.riskLevel === "low" && (
                        <span className="text-[13px] text-[#D97706] font-medium">Low</span>
                      )}
                      {(client.riskLevel === "none" || !client.riskLevel) && (
                        <span className="text-[13px] text-[#9CA3AF]">None</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-[14px] text-[#6B7280]">{client.lastActivity || "NA"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
            {currentClients.map((client: any) => (
              <button
                key={client.id}
                onClick={() => onViewClient(client.id)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#4338CA]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] text-[#0F172A] font-semibold mb-1">{client.name}</div>
                      {client.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#DCFCE8] text-[#047857] text-[12px] font-medium rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[12px] font-medium rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  {client.riskLevel === "high" && (
                    <CircleAlert className="w-5 h-5 text-[#DC2626] flex-shrink-0 ml-2" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <div className="text-[#6B7280] mb-0.5">Active Commitments</div>
                    <div className="text-[#0F172A] font-semibold">{client.activeCommitments}</div>
                  </div>
                  {userRole === "founder" && (
                    <div>
                      <div className="text-[#6B7280] mb-0.5">Total Value</div>
                      <div className="text-[#0F172A] font-semibold">{formatMoney(client.totalValue, "INR")}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[#6B7280] mb-0.5">Approval Rate</div>
                    <div className="text-[#0F172A] font-semibold">{client.approvalRate}%</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280] mb-0.5">Last Activity</div>
                    <div className="text-[#0F172A]">{client.lastActivity}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

              {/* Empty State */}
              {filteredClients.length === 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
              <Building2 className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
              <div className="text-[15px] text-[#0F172A] font-medium mb-2">No clients found</div>
              <div className="text-[14px] text-[#6B7280] mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first client'}
              </div>
              {userRole === 'founder' && !searchQuery && (
                <Button onClick={onCreateClient} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-11">
                  <Plus className="w-[18px] h-[18px] mr-2" />
                  Add Client
                </Button>
              )}
            </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-[#E5E7EB]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredClients.length}
            itemsPerPage={clientsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        open={isAddClientModalOpen}
        onOpenChange={setIsAddClientModalOpen}
        onCreated={() =>fetchClients()}
      />
    </div>
  );
}
