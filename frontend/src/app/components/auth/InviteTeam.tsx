import { ArrowLeft, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface InviteTeamProps {
  onBack: () => void;
  onInvite: (email: string, role: string) => void;
}

export function InviteTeam({ onBack, onInvite }: InviteTeamProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(email, role);
    setEmail('');
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h2 className="text-slate-900 mb-1">Invite Team Member</h2>
            <p className="text-slate-600">
              Add team members to help manage commitments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="inviteEmail">Email Address</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div><span className="font-medium">Owner:</span> Full access including settings and team management</div>
              <div><span className="font-medium">Manager:</span> Can create and manage commitments</div>
              <div><span className="font-medium">Viewer:</span> Read-only access to commitments and reports</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <span className="font-medium">Audit Log Notice:</span> All team member actions are logged and timestamped. Invited members will have access according to their assigned role.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={onBack}
              className="flex-1 border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
