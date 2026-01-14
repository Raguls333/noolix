import { useState, useEffect, useMemo } from "react";
import { Building2, Mail, Phone, MapPin, Download, Edit, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../design-system/StatusBadge";
import { Breadcrumbs } from "../shared/Breadcrumbs";
import { exportToPDF } from "../../utils/pdfExport";
import { getClient, updateClient } from "../../../api/clients";
import { listCommitments, type Commitment as ApiCommitment } from "../../../api/commitments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import moment from "moment";

interface ClientDetailProps {
  onBack: () => void;
  onViewCommitment: (id: string) => void;
  userRole?: 'founder' | 'manager';

  //  Added: pass actual client id from route/page (optional; keeps current usage working)
  clientId?: string;
}

type Tab = "overview" | "commitments" | "behavior" | "history";

//  Added: minimal types for API payloads (adjust keys to match your backend)
type ApiClient = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string; // e.g. "San Francisco, CA"
  companyName?: string;
  primaryContact?: string;
  department?: string;
  createdAt?: string; // ISO or display
  updatedAt?: string; // ISO or display
  notes?: string;
  status?: 'active' | 'inactive';
  approvalRate?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
};

type ApiHistoryEvent = {
  _id?: string;
  id?: string | number;
  date: string; // ISO or display
  event: string;
  user: string;
};

function mapApiStatusToUiStatus(status: ApiCommitment["status"]): UiCommitment["status"] {
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

type UiCommitment = {
  id: string;
  name: string;
  status:
    | "draft"
    | "internal-review"
    | "awaiting-client-approval"
    | "in-progress"
    | "change-requested"
    | "delivered"
    | "accepted"
    | "closed"
    | "disputed";
  amount: number;
  dueDate: string;
  owner: string;
  progress: number;
};

export function ClientDetail({ onBack, onViewCommitment, userRole = 'founder', clientId }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isExporting, setIsExporting] = useState(false);

  //  Added: API states
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [client, setClient] = useState<ApiClient | null>(null);
  const [commitments, setCommitments] = useState<ApiCommitment[] | null>(null);
  const [history, setHistory] = useState<ApiHistoryEvent[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    companyName: "",
    name: "",
    email: "",
    phone: "",
    status: "active",
  });

  //  Added: fetch client + commitments + history
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!clientId) {
        setClient(null);
        setCommitments(null);
        setHistory(null);
        return;
      }

      setIsLoading(true);
      setApiError(null);

      try {
        const [clientRes, commitmentsRes] = await Promise.all([
          getClient(clientId),
          listCommitments({ clientId, page: 1, limit: 2000 }),
        ]);

        if (cancelled) return;

        const normalizedClient: ApiClient = {
          _id: (clientRes as any)._id,
          id: (clientRes as any)._id,
          name: (clientRes as any).name,
          email: (clientRes as any).email,
          phone: (clientRes as any).phone,
          companyName: (clientRes as any).company || (clientRes as any).companyName,
          status: (clientRes as any).status as any,
          createdAt: (clientRes as any).createdAt,
          updatedAt: (clientRes as any).updatedAt
        };

        setClient(normalizedClient);

        setCommitments(commitmentsRes.items || []);
        setHistory(null);
      } catch (e: any) {
        if (cancelled) return;
        setApiError(e?.message || "Failed to load client details");
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const approvalRate = useMemo(() => {
    if (!commitments || commitments.length === 0) return 0;
    const approved = commitments.filter((c) =>
      ["IN_PROGRESS", "DELIVERED", "ACCEPTED", "CLOSED"].includes(c.status)
    ).length;
    return Math.round((approved / commitments.length) * 100);
  }, [commitments]);

  const riskLevel = useMemo(() => {
    if (!commitments || commitments.length === 0) return "None";
    if (commitments.some((c) => c.status === "CHANGE_REQUEST_CREATED" || c.status === "CANCELLED")) return "High";
    if (commitments.some((c) => c.status === "AWAITING_CLIENT_APPROVAL" || c.status === "DELIVERED")) return "Low";
    return "None";
  }, [commitments]);

  const uiClient = useMemo(() => {
    const clientSince = client?.createdAt ? moment(client.createdAt).format("MMMM YYYY") : "N/A";
    const lastContact = client?.updatedAt ? moment(client.updatedAt).fromNow() : "N/A";
    return {
      name: client?.companyName || client?.name || "N/A",
      email: client?.email || "N/A",
      phone: client?.phone || "N/A",
      location: client?.location || "N/A",
      status: client?.status || "active",
      approvalRate,
      riskLevel,
      primaryContact: client?.name || "N/A",
      department: client?.department || "N/A",
      clientSince,
      lastContact,
      notes: client?.notes || "N/A",
    };
  }, [client, approvalRate, riskLevel]);

  const uiCommitments: UiCommitment[] = useMemo(() => {
    const arr = commitments ?? [];
    return arr.map((c) => ({
      id: String(c._id || ""),
      name: c.title || "Untitled",
      status: mapApiStatusToUiStatus(c.status),
      amount: typeof c.amount === "number" ? c.amount : 0,
      dueDate: c.createdAt ? moment(c.createdAt).format("MMM D, YYYY") : "N/A",
      owner:
        typeof c.assignedToUserId === "object"
          ? c.assignedToUserId.name || c.assignedToUserId.email || "N/A"
          : typeof c.assignedToUserId === "string"
          ? c.assignedToUserId
          : "N/A",
      progress: 0,
    }));
  }, [commitments]);

  const uiHistory = useMemo(() => {
    const arr = history ?? [];
    if (arr.length > 0) {
      return arr.map((h, idx) => ({
        id: (h.id || h._id || idx + 1) as any,
        date: h.date,
        event: h.event,
        user: h.user,
      }));
    }
    return uiCommitments.map((c, idx) => ({
      id: idx + 1,
      date: c.dueDate,
      event: `Commitment ${c.name} updated`,
      user: c.owner || "System",
    }));
  }, [history, uiCommitments]);

  //  Added: computed totals
  const activeCommitmentsCount = useMemo(() => {
    return uiCommitments.filter((c) =>
      ["draft", "internal-review", "awaiting-client-approval", "in-progress", "change-requested", "delivered"].includes(
        c.status
      )
    ).length;
  }, [uiCommitments]);

  const totalValue = useMemo(() => {
    return uiCommitments.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [uiCommitments]);

  const totalCommitmentCount = useMemo(() => uiCommitments.length, [uiCommitments]);
  const approvedCount = useMemo(() => {
    return commitments
      ? commitments.filter((c) => ["IN_PROGRESS", "DELIVERED", "ACCEPTED", "CLOSED"].includes(c.status)).length
      : 0;
  }, [commitments]);
  const changeRequestedCount = useMemo(() => {
    return commitments ? commitments.filter((c) => c.status === "CHANGE_REQUEST_CREATED").length : 0;
  }, [commitments]);
  const pendingCount = useMemo(() => {
    return commitments
      ? commitments.filter((c) =>
          ["DRAFT", "INTERNAL_REVIEW", "AWAITING_CLIENT_APPROVAL"].includes(c.status)
        ).length
      : 0;
  }, [commitments]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF('client-detail', {
        title: `Client Profile: ${uiClient.name}`,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Current User',
        userRole,
        clientName: uiClient.name,
        status: uiClient.status,
        activeCommitments: activeCommitmentsCount,
        totalValue: userRole === 'founder' ? totalValue : null,
        approvalRate: uiClient.approvalRate,
        commitments: uiCommitments.map(c => ({
          name: c.name,
          status: c.status,
          dueDate: c.dueDate,
          amount: userRole === 'founder' ? c.amount : null,
          owner: c.owner
        }))
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openEdit = () => {
    if (!client) return;
    setEditError(null);
    setEditDraft({
      companyName: client.companyName || "",
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      status: client.status || "active",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!clientId) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const payload = {
        companyName: editDraft.companyName.trim() || undefined,
        name: editDraft.name.trim() || undefined,
        email: editDraft.email.trim() || undefined,
        phone: editDraft.phone.trim() || undefined,
      };
      const updated = await updateClient(clientId, payload);
      setClient({
        _id: (updated as any)._id ?? clientId,
        id: (updated as any)._id ?? clientId,
        name: (updated as any).name,
        email: (updated as any).email,
        phone: (updated as any).phone,
        companyName: (updated as any).companyName,
        status: (updated as any).status,
        createdAt: (updated as any).createdAt,
        updatedAt: (updated as any).updatedAt,
      });
      setEditOpen(false);
    } catch (e: any) {
      setEditError(e?.message || "Failed to update client.");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-10 py-4 lg:py-6">
        <div className="max-w-[1400px] mx-auto">
          <Breadcrumbs 
            items={[
              { label: 'Clients', onClick: onBack },
              { label: uiClient.name }
            ]}
          />

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#F0F4FF] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 className="w-8 h-8 text-[#4338CA]" />
              </div>
              <div>
                <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-2 tracking-tight">
                  {uiClient.name}
                </h1>
                <div className="flex flex-wrap gap-3 text-[14px] text-[#6B7280]">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    <span>{uiClient.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    <span>{uiClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{uiClient.location}</span>
                  </div>
                </div>

                {/*  Added: non-blocking API status */}
                {isLoading && (
                  <div className="mt-2 text-[13px] text-[#6B7280] flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#D1D5DB]" />
                    Loading latest client data
                  </div>
                )}
                {apiError && (
                  <div className="mt-2 text-[13px] text-[#B45309] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Using cached demo data (API error)
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {userRole === "founder" && (
                <Button 
                  variant="outline" 
                  className="h-11 border-[#E5E7EB] hover:bg-[#F4F5F7]"
                  onClick={openEdit}
                >
                  <Edit className="w-[18px] h-[18px] mr-2" />
                  <span className="hidden sm:inline">Edit Client</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              )}
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-11"
              >
                <Download className="w-[18px] h-[18px] mr-2" />
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'commitments', label: 'Commitments' },
              { id: 'behavior', label: 'Behavior' },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-4 lg:px-6 py-3 text-[14px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#6B7280] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1400px] mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Active</div>
                  <div className="text-[28px] text-[#0F172A] font-semibold">{activeCommitmentsCount}</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">Commitments</div>
                </div>

                {userRole === 'founder' && (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                    <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Total Value</div>
                  <div className="text-[28px] text-[#0F172A] font-semibold">{formatMoney(totalValue, "INR")}</div>
                    <div className="text-[13px] text-[#059669] mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Active contracts
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Approval Rate</div>
                  <div className="text-[28px] text-[#0F172A] font-semibold">{uiClient.approvalRate}%</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">Reliable partner</div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide mb-2">Risk Level</div>
                  <div className="text-[28px] text-[#059669] font-semibold">{uiClient.riskLevel}</div>
                  <div className="text-[13px] text-[#6B7280] mt-1">On track</div>
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-[16px] text-[#0F172A] font-semibold mb-4">Client Information</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[13px] text-[#6B7280] mb-1">Primary Contact</dt>
                    <dd className="text-[14px] text-[#0F172A] font-medium">{uiClient.primaryContact}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-[#6B7280] mb-1">Department</dt>
                    <dd className="text-[14px] text-[#0F172A] font-medium">{uiClient.department}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-[#6B7280] mb-1">Client Since</dt>
                    <dd className="text-[14px] text-[#0F172A] font-medium">{uiClient.clientSince}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-[#6B7280] mb-1">Last Contact</dt>
                    <dd className="text-[14px] text-[#0F172A] font-medium">{uiClient.lastContact}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[13px] text-[#6B7280] mb-1">Notes</dt>
                    <dd className="text-[14px] text-[#0F172A]">
                      {uiClient.notes}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'commitments' && (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Commitment</th>
                      <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Status</th>
                      {userRole === 'founder' && (
                        <th className="text-right px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Amount</th>
                      )}
                      <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Due Date</th>
                      <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Owner</th>
                      <th className="text-center px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uiCommitments.map((commitment) => (
                      <tr 
                        key={commitment.id}
                        className="border-b border-[#F4F5F7] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                        onClick={() => onViewCommitment(commitment.id)}
                      >
                        <td className="px-6 py-5 text-[14px] text-[#0F172A] font-medium">{commitment.name}</td>
                        <td className="px-6 py-5">
                          <StatusBadge status={commitment.status} />
                        </td>
                        {userRole === 'founder' && (
                          <td className="px-6 py-5 text-right text-[15px] text-[#0F172A] font-semibold tabular-nums">
                            {formatMoney(commitment.amount, "INR")}
                          </td>
                        )}
                        <td className="px-6 py-5 text-[14px] text-[#4B5563]">{commitment.dueDate}</td>
                        <td className="px-6 py-5 text-[14px] text-[#4B5563]">{commitment.owner}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#4F46E5]"
                                style={{ width: `${commitment.progress}%` }}
                              />
                            </div>
                            <span className="text-[13px] text-[#6B7280] font-medium">{commitment.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {uiCommitments.map((commitment) => (
                  <button
                    key={commitment.id}
                    onClick={() => onViewCommitment(commitment.id)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all"
                  >
                    <div className="mb-3">
                      <div className="text-[15px] text-[#0F172A] font-semibold mb-2">{commitment.name}</div>
                      <StatusBadge status={commitment.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      {userRole === 'founder' && (
                        <div>
                          <div className="text-[#6B7280] mb-0.5">Amount</div>
                          <div className="text-[#0F172A] font-semibold">{formatMoney(commitment.amount, "INR")}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-[#6B7280] mb-0.5">Due Date</div>
                        <div className="text-[#0F172A]">{commitment.dueDate}</div>
                      </div>
                      <div>
                        <div className="text-[#6B7280] mb-0.5">Owner</div>
                        <div className="text-[#0F172A]">{commitment.owner}</div>
                      </div>
                      <div>
                        <div className="text-[#6B7280] mb-0.5">Progress</div>
                        <div className="text-[#0F172A] font-semibold">{commitment.progress}%</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <h3 className="text-[16px] text-[#0F172A] font-semibold mb-6">Approval Behavior</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-[36px] text-[#0F172A] font-semibold mb-1">{uiClient.approvalRate}%</div>
                    <div className="text-[13px] text-[#6B7280]">Approval Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[36px] text-[#0F172A] font-semibold mb-1">N/A</div>
                    <div className="text-[13px] text-[#6B7280]">Avg Days to Approve</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[36px] text-[#0F172A] font-semibold mb-1">{totalCommitmentCount}</div>
                    <div className="text-[13px] text-[#6B7280]">Total Commitments</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="text-[#6B7280]">Approved</span>
                      <span className="text-[#0F172A] font-medium">{approvedCount}</span>
                    </div>
                    <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#059669]"
                        style={{ width: `${totalCommitmentCount ? Math.round((approvedCount / totalCommitmentCount) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="text-[#6B7280]">Change Requested</span>
                      <span className="text-[#0F172A] font-medium">{changeRequestedCount}</span>
                    </div>
                    <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D97706]"
                        style={{ width: `${totalCommitmentCount ? Math.round((changeRequestedCount / totalCommitmentCount) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="text-[#6B7280]">Pending</span>
                      <span className="text-[#0F172A] font-medium">{pendingCount}</span>
                    </div>
                    <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6B7280]"
                        style={{ width: `${totalCommitmentCount ? Math.round((pendingCount / totalCommitmentCount) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h3 className="text-[16px] text-[#0F172A] font-semibold mb-6">Activity History</h3>
              <div className="space-y-4">
                {uiHistory.map((event) => (
                  <div key={event.id} className="flex gap-4 pb-4 border-b border-[#F4F5F7] last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[14px] text-[#0F172A] font-medium mb-1">{event.event}</div>
                      <div className="text-[13px] text-[#6B7280]">
                        {event.user} | {event.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client details and save changes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-[13px] text-[#6B7280] mb-1 block">Company Name</label>
              <Input
                value={editDraft.companyName}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="text-[13px] text-[#6B7280] mb-1 block">Contact Name</label>
              <Input
                value={editDraft.name}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Contact name"
              />
            </div>
            <div>
              <label className="text-[13px] text-[#6B7280] mb-1 block">Email</label>
              <Input
                type="email"
                value={editDraft.email}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="text-[13px] text-[#6B7280] mb-1 block">Phone</label>
              <Input
                value={editDraft.phone}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            {editError && <div className="text-[13px] text-[#B91C1C]">{editError}</div>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#E5E7EB]"
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              onClick={handleSaveEdit}
              disabled={editSaving}
            >
              {editSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
