import { useEffect, useMemo, useState } from "react";
import { Building2, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { getOrganizationSettings, updateOrganizationSettings, type OrgSettings } from "../../../api/settings";

export function OrganizationSettings() {
  const [form, setForm] = useState<OrgSettings | null>(null);
  const [initial, setInitial] = useState<OrgSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const timezones = [
    { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  ];

  const currencies = [
    { value: "INR", label: "INR" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
  ];

  const hasChanges = useMemo(() => {
    if (!form || !initial) return false;
    return JSON.stringify(form) !== JSON.stringify(initial);
  }, [form, initial]);

  const setField = (key: keyof OrgSettings, value: any) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const setNested = (
    group: "approvalDefaults" | "notificationSettings",
    key: string,
    value: boolean
  ) => {
    if (!form) return;
    setForm({
      ...form,
      [group]: {
        ...form[group],
        [key]: value,
      },
    });
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getOrganizationSettings();
      setForm(res.organization);
      setInitial(res.organization);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load organization settings");
      setForm(null);
      setInitial(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      const res = await updateOrganizationSettings({
        name: form.name,
        contactEmail: form.contactEmail,
        timezone: form.timezone,
        currency: form.currency,
        approvalDefaults: form.approvalDefaults,
        notificationSettings: form.notificationSettings,
      });
      setForm(res.organization);
      setInitial(res.organization);
      toast.success("Organization settings updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (initial) setForm(initial);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-slate-600">
            Loading organization settings...
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-slate-600">
            Unable to load organization settings.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h1 className="text-slate-900 mb-1">Organization Settings</h1>
            <p className="text-slate-600">
              Manage company information and default preferences
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-slate-900 mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Contact Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={form.contactEmail || ""}
                  onChange={(e) => setField("contactEmail", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={form.timezone} onValueChange={(value) => setField("timezone", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={form.currency} onValueChange={(value) => setField("currency", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((cur) => (
                        <SelectItem key={cur.value} value={cur.value}>
                          {cur.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Default Rules */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-slate-900 mb-4">Default Approval Rules</h2>
            <p className="text-sm text-slate-600 mb-6">
              These settings apply to new commitments by default
            </p>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="text-slate-900 mb-1">Require client approval</div>
                  <div className="text-sm text-slate-600">
                    All commitments must be approved by client before becoming active
                  </div>
                </div>
                <Switch
                  checked={form.approvalDefaults.requireApproval}
                  onCheckedChange={(value) => setNested("approvalDefaults", "requireApproval", value)}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="text-slate-900 mb-1">Re-approval on changes</div>
                  <div className="text-sm text-slate-600">
                    Any scope or term changes require re-approval
                  </div>
                </div>
                <Switch
                  checked={form.approvalDefaults.reApprovalOnChanges}
                  onCheckedChange={(value) => setNested("approvalDefaults", "reApprovalOnChanges", value)}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="text-slate-900 mb-1">Acceptance required</div>
                  <div className="text-sm text-slate-600">
                    Client must explicitly accept deliverables
                  </div>
                </div>
                <Switch
                  checked={form.approvalDefaults.acceptanceRequired}
                  onCheckedChange={(value) => setNested("approvalDefaults", "acceptanceRequired", value)}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="text-slate-900 mb-1">Activity logging</div>
                  <div className="text-sm text-slate-600">
                    Maintain detailed audit trail of all actions
                  </div>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-slate-900 mb-4">Email Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="text-slate-900 mb-1">Approval reminders</div>
                  <div className="text-sm text-slate-600">
                    Send reminders for pending approvals after 3 days
                  </div>
                </div>
                <Switch
                  checked={form.notificationSettings.approvalReminders}
                  onCheckedChange={(value) => setNested("notificationSettings", "approvalReminders", value)}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="text-slate-900 mb-1">Risk alerts</div>
                  <div className="text-sm text-slate-600">
                    Notify when commitments become at-risk
                  </div>
                </div>
                <Switch
                  checked={form.notificationSettings.riskAlerts}
                  onCheckedChange={(value) => setNested("notificationSettings", "riskAlerts", value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="border-slate-300" onClick={handleCancel} disabled={!hasChanges}>
              Cancel
            </Button>
            <Button className="bg-slate-900 text-white" onClick={handleSave} disabled={!hasChanges || isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
