import { useEffect, useMemo, useState } from "react";
import { UserPlus, Users, MoreVertical, Shield, Eye, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { inviteTeamMember, listTeamMembers, updateTeamMember } from "../../../api/settings";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "viewer";
  isActive: boolean;
  lastActiveAt?: string;
}

type UiRole = "owner" | "manager" | "viewer";

const roleOptions: { value: UiRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
];

function mapRoleToUi(role?: string): UiRole {
  if (role === "FOUNDER" || role === "SUPER_ADMIN") return "owner";
  if (role === "MANAGER") return "manager";
  return "manager";
}

function mapUiToRole(role: UiRole) {
  if (role === "owner") return "FOUNDER";
  if (role === "manager") return "MANAGER";
  return "MANAGER";
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

export function RolesAccess() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<UiRole>("manager");
  const [editActive, setEditActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const roleConfig = {
    owner: {
      icon: Shield,
      label: "Owner",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    manager: {
      icon: Edit,
      label: "Manager",
      color: "text-purple-700 bg-purple-50 border-purple-200",
    },
    viewer: {
      icon: Eye,
      label: "Viewer",
      color: "text-slate-700 bg-slate-50 border-slate-200",
    },
  };

  const totalActive = useMemo(() => members.filter((m) => m.isActive).length, [members]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await listTeamMembers();
      const mapped: TeamMember[] = (res.items || []).map((m: any) => ({
        id: String(m.id || m._id),
        name: m.name || "Unknown",
        email: m.email || "",
        role: mapRoleToUi(m.role),
        isActive: m.isActive !== false,
        lastActiveAt: m.lastActiveAt || m.updatedAt || m.createdAt,
      }));
      setMembers(mapped);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load team members");
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditActive(member.isActive);
  };

  const handleSave = async () => {
    if (!selectedMember) return;
    setIsSaving(true);
    try {
      await updateTeamMember(selectedMember.id, {
        role: mapUiToRole(editRole),
        isActive: editActive,
      });
      toast.success("Team member updated");
      setSelectedMember(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update team member");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h2 className="text-slate-900 mb-1">Team Members</h2>
            <p className="text-slate-600">
              {totalActive} active members in your organization
            </p>
          </div>
        </div>
        <Button
          className="bg-slate-900 text-white"
          onClick={() => {
            setInviteOpen(true);
            setInviteResult(null);
            setInviteName("");
            setInviteEmail("");
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Name</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Email</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Role</th>
              <th className="text-left px-6 py-3 text-sm text-slate-600">Last Active</th>
              <th className="text-right px-6 py-3 text-sm text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td className="px-6 py-4 text-slate-600" colSpan={5}>
                  Loading team members...
                </td>
              </tr>
            )}
            {!isLoading && members.length === 0 && (
              <tr>
                <td className="px-6 py-4 text-slate-600" colSpan={5}>
                  No team members found.
                </td>
              </tr>
            )}
            {members.map((member) => {
              const config = roleConfig[member.role];
              const RoleIcon = config.icon;

              return (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-900">{member.name}</td>
                  <td className="px-6 py-4 text-slate-600">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm ${config.color}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{timeAgo(member.lastActiveAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-slate-400 hover:text-slate-600"
                      onClick={() => openEdit(member)}
                      title="Edit member"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-slate-900 mb-6">Permission Levels</h3>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-700" />
              <h4 className="text-slate-900">Owner</h4>
            </div>
            <div className="ml-7 space-y-1 text-sm text-slate-700">
              <div>- Full access to all features</div>
              <div>- Can manage team members and roles</div>
              <div>- Can modify organization settings</div>
              <div>- Can export activity logs</div>
              <div>- Can delete commitments</div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Edit className="w-5 h-5 text-purple-700" />
              <h4 className="text-slate-900">Manager</h4>
            </div>
            <div className="ml-7 space-y-1 text-sm text-slate-700">
              <div>- Can create and manage commitments</div>
              <div>- Can send approval requests</div>
              <div>- Can export proof</div>
              <div>- Can view all commitments and reports</div>
              <div>- Cannot modify organization settings</div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-slate-700" />
              <h4 className="text-slate-900">Viewer</h4>
            </div>
            <div className="ml-7 space-y-1 text-sm text-slate-700">
              <div>- Read-only access to commitments</div>
              <div>- Can view reports and analytics</div>
              <div>- Can export proof (view-only copy)</div>
              <div>- Cannot create or modify commitments</div>
              <div>- Cannot access settings</div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update role and access for this team member.</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-slate-600">Member</div>
                <div className="text-slate-900 font-medium">{selectedMember.name}</div>
                <div className="text-sm text-slate-600">{selectedMember.email}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-2">Role</div>
                <Select value={editRole} onValueChange={(value) => setEditRole(value as UiRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                <div>
                  <div className="text-sm text-slate-900">Active access</div>
                  <div className="text-xs text-slate-600">Disable to remove system access</div>
                </div>
                <Switch checked={editActive} onCheckedChange={setEditActive} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMember(null)}>
              Cancel
            </Button>
            <Button className="bg-slate-900 text-white" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Manager</DialogTitle>
            <DialogDescription>
              Create a manager account and send login details via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="text-sm text-slate-600 mb-2">Full Name</div>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-2">Email</div>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="name@company.com"
              />
            </div>
            {inviteResult && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="text-slate-700">Invite sent to {inviteResult.email}</div>
                <div className="mt-2 text-slate-600">Temporary Password</div>
                <div className="mt-1 font-mono text-slate-900">{inviteResult.tempPassword}</div>
                <button
                  className="mt-2 text-xs text-slate-600 underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(inviteResult.tempPassword);
                      toast.success("Password copied");
                    } catch {
                      toast.error("Copy failed");
                    }
                  }}
                >
                  Copy Password
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-slate-900 text-white"
              onClick={async () => {
                if (!inviteName.trim() || !inviteEmail.trim()) {
                  toast.error("Name and email are required");
                  return;
                }
                setIsInviting(true);
                try {
                  const res = await inviteTeamMember({ name: inviteName.trim(), email: inviteEmail.trim() });
                  setInviteResult({ email: res.user.email, tempPassword: res.tempPassword });
                  toast.success("Invite created");
                  fetchMembers();
                } catch (err: any) {
                  toast.error(err?.message || "Failed to invite member");
                } finally {
                  setIsInviting(false);
                }
              }}
              disabled={isInviting}
            >
              {isInviting ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
