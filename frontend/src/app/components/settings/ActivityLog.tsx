import { useEffect, useMemo, useState } from "react";
import { Activity, Download, Filter } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { exportToPDF } from "../../utils/pdfExport";
import { listActivityLog, listTeamMembers, type ActivityLogItem, type TeamMember } from "../../../api/settings";

type Filters = {
  from: string;
  to: string;
  actorId: string;
  action: string;
};

const actionStyles: Record<
  string,
  { label: string; className: string }
> = {
  COMMITMENT_CREATED: {
    label: "Commitment Created",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  COMMITMENT_UPDATED: {
    label: "Commitment Updated",
    className: "bg-blue-50 border-blue-200 text-blue-800",
  },
  SCOPE_TERMS_UPDATED_VERSION_BUMP: {
    label: "Scope Updated",
    className: "bg-amber-50 border-amber-200 text-amber-800",
  },
  COMMITMENT_ASSIGNED: {
    label: "Commitment Assigned",
    className: "bg-slate-50 border-slate-200 text-slate-800",
  },
  APPROVAL_LINK_SENT: {
    label: "Approval Link Sent",
    className: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  APPROVAL_LINK_RESENT: {
    label: "Approval Link Resent",
    className: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  ACCEPTANCE_LINK_SENT: {
    label: "Acceptance Link Sent",
    className: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  ACCEPTANCE_LINK_RESENT: {
    label: "Acceptance Link Resent",
    className: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  CLIENT_APPROVED: {
    label: "Client Approved",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  CLIENT_ACCEPTED: {
    label: "Client Accepted",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  CLIENT_REQUESTED_CHANGE: {
    label: "Client Requested Change",
    className: "bg-amber-50 border-amber-200 text-amber-800",
  },
  MARKED_DELIVERED: {
    label: "Marked Delivered",
    className: "bg-blue-50 border-blue-200 text-blue-800",
  },
  MARKED_DELIVERED_AUTO_ACCEPTED: {
    label: "Delivered (Auto Accepted)",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  CHANGE_REQUEST_ACCEPTED: {
    label: "Change Accepted",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  CHANGE_REQUEST_REJECTED: {
    label: "Change Rejected",
    className: "bg-rose-50 border-rose-200 text-rose-800",
  },
  ORG_SETTINGS_UPDATED: {
    label: "Settings Updated",
    className: "bg-blue-50 border-blue-200 text-blue-800",
  },
  TEAM_MEMBER_UPDATED: {
    label: "Team Updated",
    className: "bg-amber-50 border-amber-200 text-amber-800",
  },
  MASTER_CREATED: {
    label: "Master Created",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  MASTER_UPDATED: {
    label: "Master Updated",
    className: "bg-purple-50 border-purple-200 text-purple-800",
  },
  MASTER_TOGGLED: {
    label: "Master Toggled",
    className: "bg-slate-50 border-slate-200 text-slate-800",
  },
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityLog() {
  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    actorId: "all",
    action: "all",
  });
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const actionOptions = useMemo(() => {
    return Object.keys(actionStyles).map((key) => ({
      value: key,
      label: actionStyles[key].label,
    }));
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await listActivityLog({
        from: filters.from || undefined,
        to: filters.to || undefined,
        actorId: filters.actorId === "all" ? undefined : filters.actorId,
        action: filters.action === "all" ? undefined : filters.action,
      });
      setLogs(res.items || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load activity log");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await listTeamMembers();
      setUsers(res.items || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load users");
      setUsers([]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const actorLabel =
        filters.actorId !== "all"
          ? users.find((u) => u.id === filters.actorId)?.name || filters.actorId
          : null;
      const actionLabel =
        filters.action !== "all" ? actionStyles[filters.action]?.label || filters.action : null;
      await exportToPDF("activity-log", {
        title: "Activity Log",
        generatedAt: new Date().toISOString(),
        generatedBy: "Current User",
        userRole: "current-user",
        filters: [
          filters.from ? `From: ${filters.from}` : null,
          filters.to ? `To: ${filters.to}` : null,
          actorLabel ? `User: ${actorLabel}` : null,
          actionLabel ? `Action: ${actionLabel}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
        items: logs.map((log) => ({
          timestamp: formatTimestamp(log.createdAt),
          user: log.actor?.name || "Unknown",
          action: actionStyles[log.action]?.label || log.action,
          details: log.details || "",
          ip: log.ipAddress || "",
        })),
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to export activity log");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-slate-900 mb-1">Activity Log</h1>
              <p className="text-slate-600">
                Complete audit trail of system actions
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-slate-300" onClick={handleExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Log"}
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div>
              <Label>User</Label>
              <Select
                value={filters.actorId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, actorId: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Action Type</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, action: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionOptions.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button className="bg-slate-900 text-white" onClick={fetchLogs}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-slate-600">Timestamp</th>
                <th className="text-left px-6 py-3 text-sm text-slate-600">User</th>
                <th className="text-left px-6 py-3 text-sm text-slate-600">Action</th>
                <th className="text-left px-6 py-3 text-sm text-slate-600">Details</th>
                <th className="text-left px-6 py-3 text-sm text-slate-600">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading && (
                <tr>
                  <td className="px-6 py-4 text-slate-600" colSpan={5}>
                    Loading activity log...
                  </td>
                </tr>
              )}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-slate-600" colSpan={5}>
                    No activity found for the selected filters.
                  </td>
                </tr>
              )}
              {logs.map((log) => {
                const style = actionStyles[log.action];
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{log.actor?.name || "Unknown"}</div>
                      <div className="text-sm text-slate-600">{log.actor?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md border text-sm ${
                          style?.className || "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        {style?.label || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{log.details || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{log.ipAddress || "N/A"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">Retention Policy:</span> Activity logs are retained for 7 years for compliance and audit purposes. All timestamps are stored in your organization timezone.
          </p>
        </div>
      </div>
    </div>
  );
}
