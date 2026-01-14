import { useState, useEffect, useMemo } from "react";
import { Plus, CircleAlert, Search, Filter, Download, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { StatusBadge } from "../design-system/StatusBadge";
import { DateRangePicker } from "../shared/DateRangePicker";
import { ClientSelector } from "../shared/ClientSelector";
import { exportCommitmentsListToPDF } from "../../utils/pdfExport";
import { FadeIn } from "../ui/animations";
import { TableSkeleton } from "../ui/skeleton";

import {
  listCommitments as apiListCommitments,
  type Commitment as ApiCommitment,
  type Client as ApiClientFromCommitment,
} from "../../../api/commitments";
import { listClients, type Client } from "../../../api/clients";

interface Commitment {
  _id: string;
  rootCommitmentId?: string;
  version?: number;
  clientId?: string | null;
  client: string;
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
  currency?: string;
  dueDate: string;
  owner: string;
  lastActivity: string;
  riskLevel: "none" | "low" | "high";
  approvalSentAt?: string;
}

interface CommitmentsListProps {
  onCreateNew: () => void;
  onViewCommitment: (id: string) => void;
  userRole?: "founder" | "manager";
}

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "internal-review", label: "Internal review" },
  { value: "awaiting-client-approval", label: "Awaiting client approval" },
  { value: "in-progress", label: "In progress" },
  { value: "change-requested", label: "Change requested" },
  { value: "delivered", label: "Delivered" },
  { value: "accepted", label: "Accepted" },
  { value: "closed", label: "Closed" },
  { value: "disputed", label: "Cancelled" },
];

function formatShortDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function formatMoney(amount?: number, currency?: string) {
  if (amount === undefined || amount === null) return "—";
  const cur = currency || "INR";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${cur}`;
  }
}

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (Number.isNaN(diffMs)) return "—";

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

function mapApiStatusToUiStatus(status: ApiCommitment["status"]): Commitment["status"] {
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

function deriveRiskLevel(uiStatus: Commitment["status"]): Commitment["riskLevel"] {
  if (uiStatus === "disputed" || uiStatus === "change-requested") return "high";
  if (uiStatus === "awaiting-client-approval" || uiStatus === "delivered") return "low";
  return "none";
}

function getClientNameFromApiCommitment(it: any, clientsById: Record<string, Client>) {
  // backend populates clientId -> object
  const clientIdVal = it?.clientId;

  if (clientIdVal && typeof clientIdVal === "object") {
    const c = clientIdVal as ApiClientFromCommitment;
    return c.name || c.companyName || c.email || "—";
  }

  // snapshot fallback
  if (it?.clientSnapshot?.name) return it.clientSnapshot.name;
  if (it?.clientSnapshot?.companyName) return it.clientSnapshot.companyName;

  // local map fallback
  if (typeof clientIdVal === "string") {
    return clientsById[clientIdVal]?.name ?? clientIdVal;
  }

  return "—";
}

function getClientIdStringFromApiCommitment(it: any): string | null {
  const v = it?.clientId;
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v._id) return String(v._id);
  return null;
}

function getOwnerNameFromApiCommitment(it: any): string {
  const assigned = it?.assignedToUserId;
  if (assigned && typeof assigned === "object") {
    return assigned.name || assigned.email || assigned._id || "—";
  }
  if (typeof assigned === "string") return assigned;
  return "—";
}

function getRootCommitmentIdFromApiCommitment(it: any): string {
  const root = it?.rootCommitmentId;
  if (!root) return String(it?._id);
  if (typeof root === "string") return root;
  if (typeof root === "object" && root._id) return String(root._id);
  return String(it?._id);
}

function pickLatestCommitments(items: any[]) {
  const byRoot = new Map<string, any>();

  for (const it of items) {
    const key = getRootCommitmentIdFromApiCommitment(it);
    const existing = byRoot.get(key);
    if (!existing) {
      byRoot.set(key, it);
      continue;
    }

    const v = Number(it?.version || 0);
    const ev = Number(existing?.version || 0);
    if (v > ev) {
      byRoot.set(key, it);
      continue;
    }

    if (v === ev) {
      const t = new Date(it?.updatedAt || it?.createdAt || 0).getTime();
      const et = new Date(existing?.updatedAt || existing?.createdAt || 0).getTime();
      if (t > et) byRoot.set(key, it);
    }
  }

  return Array.from(byRoot.values());
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function CommitmentsList({ onCreateNew, onViewCommitment, userRole = "founder" }: CommitmentsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusMenuOpenMobile, setStatusMenuOpenMobile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // API state
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [clientsById, setClientsById] = useState<Record<string, Client>>({});
  const preferLatestVersions = true;

  const hasActiveFilters =
    selectedStatuses.length > 0 || selectedClients.length > 0 || dateRange.from || dateRange.to || searchQuery;
  const selectedStatusLabel =
    selectedStatuses.length === 0
      ? "All statuses"
      : statusOptions
          .filter((s) => selectedStatuses.includes(s.value))
          .map((s) => s.label)
          .join(", ");

  // Load clients (optional; helps when backend doesn't populate clientId)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listClients({ page: 1, limit: 500 });
        if (cancelled) return;

        const map: Record<string, Client> = {};
        res.clients.forEach((c: any) => (map[c._id] = c));
        setClientsById(map);
      } catch {
        // non-blocking
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Main fetch (server-side paging when no searchQuery; client-side mode when searching)
  useEffect(() => {
    let cancelled = false;

    const fetchPaged = async () => {
      const res = await apiListCommitments({
        page: currentPage,
        limit: pageSize,
        // backend list schema supports only single values; we will filter client-side for multi-selects
        from: dateRange.from ? startOfDay(dateRange.from).toISOString() : undefined,
        to: dateRange.to ? endOfDay(dateRange.to).toISOString() : undefined,
      });

      if (cancelled) return;

      const rawItems = pickLatestCommitments(res.items || []);
      const uiItems: Commitment[] = rawItems.map((it: any) => {
        const uiStatus = mapApiStatusToUiStatus(it.status);
        const clientName = getClientNameFromApiCommitment(it, clientsById);

        return {
          _id: it._id,
          rootCommitmentId: getRootCommitmentIdFromApiCommitment(it),
          version: typeof it.version === "number" ? it.version : undefined,
          clientId: getClientIdStringFromApiCommitment(it),
          client: clientName,
          name: it.title,
          status: uiStatus,
          amount: typeof it.amount === "number" ? it.amount : 0,
          currency: it.currency,
          dueDate: formatShortDate(it.createdAt),
          owner: getOwnerNameFromApiCommitment(it),
          lastActivity: timeAgo(it.updatedAt ?? it.createdAt),
          riskLevel: deriveRiskLevel(uiStatus),
          approvalSentAt: it.approvalSentAt,
        };
      });

      setCommitments(uiItems);
      setTotal(uiItems.length);
    };

    const fetchForSearch = async () => {
      // Fetch a large page for client-side search.
      // If you can add backend support for `q`, switch to server-side search.
      const res = await apiListCommitments({
        page: 1,
        limit: 2000,
        from: dateRange.from ? startOfDay(dateRange.from).toISOString() : undefined,
        to: dateRange.to ? endOfDay(dateRange.to).toISOString() : undefined,
      });

      if (cancelled) return;

      const rawItems = pickLatestCommitments(res.items || []);
      const uiItems: Commitment[] = rawItems.map((it: any) => {
        const uiStatus = mapApiStatusToUiStatus(it.status);
        const clientName = getClientNameFromApiCommitment(it, clientsById);

        return {
          _id: it._id,
          rootCommitmentId: getRootCommitmentIdFromApiCommitment(it),
          version: typeof it.version === "number" ? it.version : undefined,
          clientId: getClientIdStringFromApiCommitment(it),
          client: clientName,
          name: it.title,
          status: uiStatus,
          amount: typeof it.amount === "number" ? it.amount : 0,
          currency: it.currency,
          dueDate: formatShortDate(it.createdAt),
          owner: getOwnerNameFromApiCommitment(it),
          lastActivity: timeAgo(it.updatedAt ?? it.createdAt),
          riskLevel: deriveRiskLevel(uiStatus),
          approvalSentAt: it.approvalSentAt,
        };
      });

      // In search-mode total becomes filtered length (client-side)
      setCommitments(uiItems);
      setTotal(uiItems.length);
    };

    (async () => {
      setIsLoading(true);
      try {
        if (searchQuery.trim() || preferLatestVersions) {
          await fetchForSearch();
        } else {
          await fetchPaged();
        }
      } catch {
        setCommitments([]);
        setTotal(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, dateRange.from, dateRange.to, searchQuery, clientsById]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedClients([]);
    setDateRange({ from: null, to: null });
    setCurrentPage(1);
  };

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
    setCurrentPage(1);
  };

  // ✅ Apply multi-filters + search client-side (because backend list schema is single-value)
  const filteredCommitments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return commitments.filter((c) => {
      const matchesSearch =
        !q ||
        c.client.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q);

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(c.status);

      // selectedClients contain clientIds, but UI commitment has client name already.
      // We can’t reliably map back unless backend always populates clientId.
      // Best effort: if selectedClients used, filter by name using clientsById.
      const matchesClient =
        selectedClients.length === 0 ||
        selectedClients.some((cid) => {
          if (c.clientId) return c.clientId === cid;
          const name = clientsById[cid]?.name?.toLowerCase();
          return name ? c.client.toLowerCase() === name : false;
        });

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [commitments, searchQuery, selectedStatuses, selectedClients, clientsById]);

  // ✅ Pagination rules:
  // - If searchQuery is present (we fetched many), paginate client-side.
  // - Else: backend already paginated, so render as-is.
  const isClientSidePaging =
    preferLatestVersions ||
    !!searchQuery.trim() ||
    selectedStatuses.length > 0 ||
    selectedClients.length > 0 ||
    !!dateRange.from ||
    !!dateRange.to;

  const headerTotalCount = isClientSidePaging ? filteredCommitments.length : total;

  const totalPages = Math.max(1, Math.ceil(headerTotalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;

  const paginatedCommitments = isClientSidePaging
    ? filteredCommitments.slice(startIndex, startIndex + pageSize)
    : filteredCommitments;

  useEffect(() => {
    // keep page valid if filters shrink results
    if (currentPage > totalPages) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filtersApplied = [];
      if (searchQuery) filtersApplied.push(`Search: "${searchQuery}"`);
      if (selectedStatuses.length > 0) filtersApplied.push(`Status: ${selectedStatuses.join(", ")}`);
      if (dateRange.from) filtersApplied.push(`Date range applied`);

      // Export based on currently filtered list
      await exportCommitmentsListToPDF(
        filteredCommitments,
        filtersApplied.length > 0 ? filtersApplied.join(" | ") : "None",
        userRole
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 pb-4 lg:pb-6 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-1 tracking-tight">
                Commitments
              </h1>
              <p className="text-[14px] lg:text-[15px] text-[#6B7280]">
                {headerTotalCount} total commitments
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex-1 sm:flex-none h-11 border-[#E5E7EB]"
              >
                <Filter className="w-[18px] h-[18px] mr-2" />
                Filters
                {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-[#4F46E5] rounded-full" />}
              </Button>

              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="hidden sm:flex h-11 border-[#E5E7EB] hover:bg-[#F4F5F7]"
              >
                <Download className="w-[18px] h-[18px] mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>

              <Button
                onClick={onCreateNew}
                className="flex-1 sm:flex-none bg-black hover:bg-black/90 text-white shadow-sm px-5 h-11 rounded-lg"
              >
                <Plus className="w-[18px] h-[18px] mr-2" />
                Create Commitment
              </Button>
            </div>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex flex-wrap gap-3">
            <div className="flex-1 min-w-[300px] max-w-md relative">
              <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                placeholder="Search commitments, clients, or owners..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 h-11 bg-white border-[#E5E7EB] rounded-lg text-[14px]"
              />
            </div>

            <ClientSelector
              value={selectedClients}
              onChange={(v) => {
                setSelectedClients(v);
                setCurrentPage(1);
              }}
              multiSelect
              placeholder="All clients"
              className="w-48"
            />

            <DateRangePicker
              value={dateRange}
              onChange={(v) => {
                setDateRange(v);
                setCurrentPage(1);
              }}
              className="w-64"
            />

            <div className="relative">
              <Button
                variant="outline"
                className="h-11 border-[#E5E7EB] bg-white text-[#0F172A] hover:bg-[#F4F5F7]"
                onClick={() => setStatusMenuOpen((prev) => !prev)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {selectedStatusLabel}
                {selectedStatuses.length > 0 && (
                  <span className="ml-2 text-[11px] font-semibold bg-[#E0EAFF] text-[#4338CA] px-2 py-0.5 rounded-full">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
              {statusMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-20">
                  <div className="px-3 py-2 text-[12px] text-[#6B7280] uppercase tracking-wide border-b border-[#E5E7EB]">
                    Status
                  </div>
                  <div className="max-h-64 overflow-auto p-2 space-y-1">
                    {statusOptions.map((status) => (
                      <label
                        key={status.value}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#F4F5F7] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status.value)}
                          onChange={() => toggleStatus(status.value)}
                          className="h-4 w-4 rounded border-[#CBD5F5]"
                        />
                        <span className="text-[13px] text-[#0F172A]">{status.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      className="text-[12px] text-[#6B7280] hover:text-[#0F172A]"
                      onClick={() => {
                        setSelectedStatuses([]);
                        setCurrentPage(1);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="text-[12px] text-[#4F46E5] font-medium hover:text-[#4338CA]"
                      onClick={() => setStatusMenuOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-11 text-[#6B7280] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="lg:hidden border-b border-[#E5E7EB] bg-white px-4 py-4 space-y-4">
          <div className="relative">
            <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11 h-11 bg-[#F4F5F7] border-[#E5E7EB] rounded-lg text-[14px]"
            />
          </div>

          <ClientSelector
            value={selectedClients}
            onChange={(v) => {
              setSelectedClients(v);
              setCurrentPage(1);
            }}
            multiSelect
            placeholder="All clients"
          />

          <DateRangePicker
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              setCurrentPage(1);
            }}
          />

          <div className="space-y-2">
            <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Status</div>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full h-11 border-[#E5E7EB] justify-between"
                onClick={() => setStatusMenuOpenMobile((prev) => !prev)}
              >
                <span className="truncate">{selectedStatusLabel}</span>
                {selectedStatuses.length > 0 && (
                  <span className="ml-2 text-[11px] font-semibold bg-[#E0EAFF] text-[#4338CA] px-2 py-0.5 rounded-full">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
              {statusMenuOpenMobile && (
                <div className="mt-2 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg">
                  <div className="max-h-64 overflow-auto p-2 space-y-1">
                    {statusOptions.map((status) => (
                      <label
                        key={status.value}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#F4F5F7] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status.value)}
                          onChange={() => toggleStatus(status.value)}
                          className="h-4 w-4 rounded border-[#CBD5F5]"
                        />
                        <span className="text-[13px] text-[#0F172A]">{status.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      className="text-[12px] text-[#6B7280] hover:text-[#0F172A]"
                      onClick={() => {
                        setSelectedStatuses([]);
                        setCurrentPage(1);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="text-[12px] text-[#4F46E5] font-medium hover:text-[#4338CA]"
                      onClick={() => setStatusMenuOpenMobile(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full h-11">
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 lg:px-10 py-6 max-w-[1600px] mx-auto">
          {isLoading ? (
            <TableSkeleton rows={8} />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
                <FadeIn>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E7EB]">
                        <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">
                          Client
                        </th>
                        <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">
                          Commitment
                        </th>
                        <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">
                          Status
                        </th>
                        {userRole === "founder" && (
                          <th className="text-right px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">
                            Amount
                          </th>
                        )}
                        <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">
                          Due Date
                        </th>
                        <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">
                          Owner
                        </th>
                        <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">
                          Risk
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCommitments.map((commitment) => (
                        <tr
                          key={commitment._id}
                          className="border-b border-[#F4F5F7] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                          onClick={() => onViewCommitment(commitment._id)}
                        >
                          <td className="px-6 py-5 text-[14px] text-[#0F172A] font-medium">{commitment.client}</td>
                          <td className="px-6 py-5 text-[14px] text-[#4B5563]">{commitment.name}</td>
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={commitment.status} />
                              {commitment.approvalSentAt && (
                                <span className="text-[11px] font-medium text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-1 rounded-full">
                                  Approval sent
                                </span>
                              )}
                            </div>
                          </td>
                          {userRole === "founder" && (
                            <td className="px-6 py-5 text-right text-[15px] text-[#0F172A] font-semibold tabular-nums">
                              {formatMoney(commitment.amount, commitment.currency)}
                            </td>
                          )}
                          <td className="px-6 py-5 text-[14px] text-[#4B5563]">{commitment.dueDate}</td>
                          <td className="px-6 py-5 text-[14px] text-[#4B5563]">{commitment.owner}</td>
                          <td className="px-6 py-5">
                            {commitment.riskLevel === "high" && (
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#B91C1C] font-medium">
                                <CircleAlert className="w-3.5 h-3.5" />
                                High
                              </span>
                            )}
                            {commitment.riskLevel === "low" && (
                              <span className="text-[13px] text-[#D97706] font-medium">Low</span>
                            )}
                            {commitment.riskLevel === "none" && <span className="text-[13px] text-[#9CA3AF]">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </FadeIn>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {paginatedCommitments.map((commitment) => (
                  <button
                    key={commitment._id}
                    onClick={() => onViewCommitment(commitment._id)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="text-[15px] text-[#0F172A] font-semibold mb-1">{commitment.client}</div>
                        <div className="text-[14px] text-[#4B5563]">{commitment.name}</div>
                      </div>
                      {commitment.riskLevel === "high" && <CircleAlert className="w-5 h-5 text-[#B91C1C] flex-shrink-0" />}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <StatusBadge status={commitment.status} />
                      {commitment.approvalSentAt && (
                        <span className="text-[11px] font-medium text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-1 rounded-full">
                          Approval sent
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      {userRole === "founder" && (
                        <div>
                          <div className="text-[#6B7280] mb-0.5">Amount</div>
                          <div className="text-[#0F172A] font-semibold">
                            {formatMoney(commitment.amount, commitment.currency)}
                          </div>
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
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white border border-[#E5E7EB] rounded-xl">
                  <div className="text-[14px] text-[#6B7280]">
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, headerTotalCount)} of {headerTotalCount}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="h-9"
                    >
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg text-[14px] font-medium transition-colors ${
                            page === currentPage ? "bg-[#4F46E5] text-white" : "text-[#4B5563] hover:bg-[#F4F5F7]"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="h-9"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredCommitments.length === 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
                  <div className="text-[#6B7280] text-[15px] mb-4">No commitments match your filters</div>
                  <Button variant="outline" onClick={clearFilters} className="h-11">
                    Clear filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Sticky Footer with Primary Action */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E5E7EB] shadow-lg">
        <Button onClick={onCreateNew} className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm h-12 rounded-lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Commitment
        </Button>
      </div>
    </div>
  );
}
