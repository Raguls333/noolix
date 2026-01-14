import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, ToggleLeft, ToggleRight, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { createMaster, listMasters, toggleMaster, updateMaster, type MasterItem } from "../../../api/settings";

type MasterTab = "statuses" | "risk-levels" | "approval-types" | "payment-terms";

interface MastersSettingsProps {
  userRole?: "founder" | "manager" | "client";
}

export function MastersSettings({ userRole = "founder" }: MastersSettingsProps) {
  const [activeTab, setActiveTab] = useState<MasterTab>("statuses");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);
  const [dataByType, setDataByType] = useState<Record<MasterTab, MasterItem[]>>({
    statuses: [],
    "risk-levels": [],
    "approval-types": [],
    "payment-terms": [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("#4F46E5");
  const [isSaving, setIsSaving] = useState(false);

  const isFounder = userRole === "founder";

  const tabs = [
    { id: "statuses" as const, label: "Statuses", icon: FileText },
    { id: "risk-levels" as const, label: "Risk Levels", icon: FileText },
    { id: "approval-types" as const, label: "Approval Types", icon: FileText },
    { id: "payment-terms" as const, label: "Payment Terms", icon: FileText },
  ];

  const data = useMemo(() => dataByType[activeTab] || [], [activeTab, dataByType]);

  const fetchMasters = async (tab: MasterTab) => {
    setIsLoading(true);
    try {
      const res = await listMasters(tab);
      setDataByType((prev) => ({ ...prev, [tab]: res.items || [] }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to load master settings");
      setDataByType((prev) => ({ ...prev, [tab]: [] }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    if (!isFounder) {
      toast.error("Only Founder can modify master settings");
      return;
    }
    try {
      await toggleMaster(id, active);
      toast.success("Status updated successfully");
      fetchMasters(activeTab);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update master status");
    }
  };

  const handleEdit = (item: MasterItem) => {
    if (!isFounder) {
      toast.error("Only Founder can edit master settings");
      return;
    }
    setSelectedItem(item);
    setEditLabel(item.label);
    setEditColor(item.color);
    setEditModalOpen(true);
  };

  const handleCreate = () => {
    if (!isFounder) {
      toast.error("Only Founder can create master entries");
      return;
    }
    setSelectedItem(null);
    setEditLabel("");
    setEditColor("#4F46E5");
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!isFounder) return;
    if (!editLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    setIsSaving(true);
    try {
      if (selectedItem) {
        await updateMaster(selectedItem.id, { label: editLabel.trim(), color: editColor });
        toast.success("Updated successfully");
      } else {
        await createMaster({ type: activeTab, label: editLabel.trim(), color: editColor });
        toast.success("Created successfully");
      }
      setEditModalOpen(false);
      setSelectedItem(null);
      fetchMasters(activeTab);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchMasters(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0F172A] mb-1">
            Masters & Definitions
          </h2>
          <p className="text-[14px] text-[#6B7280]">
            Manage system enums and central definitions
          </p>
        </div>
        {isFounder && (
          <Button
            onClick={handleCreate}
            className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      {!isFounder && (
        <div className="mb-6 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-4">
          <p className="text-[14px] text-[#92400E]">
            <strong>Read-only access:</strong> Only Founder can modify master settings
          </p>
        </div>
      )}

      <div className="border-b border-[#E5E7EB] mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#4F46E5] text-[#4F46E5]"
                    : "border-transparent text-[#6B7280] hover:text-[#0F172A]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280]">
                  Label
                </th>
                <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden sm:table-cell">
                  Color
                </th>
                <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280] hidden md:table-cell">
                  Usage
                </th>
                <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280]">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-[13px] font-medium text-[#6B7280]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-[14px] text-[#6B7280]">
                    Loading masters...
                  </td>
                </tr>
              )}
              {!isLoading && data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-[14px] text-[#6B7280]">
                    No items found for this category.
                  </td>
                </tr>
              )}
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-[14px] font-medium text-[#0F172A]">
                      {item.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md border border-[#E5E7EB]"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[13px] text-[#6B7280] font-mono">
                        {item.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="text-[14px] text-[#6B7280]">
                      Used in {item.usageCount} {item.usageCount === 1 ? "commitment" : "commitments"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(item.id, !item.active)}
                      disabled={!isFounder}
                      className={`flex items-center gap-2 ${
                        isFounder ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                      }`}
                      title={!isFounder ? "Only Founder can modify status" : ""}
                    >
                      {item.active ? (
                        <ToggleRight className="w-6 h-6 text-[#047857]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#9CA3AF]" />
                      )}
                      <span
                        className={`text-[13px] font-medium ${
                          item.active ? "text-[#047857]" : "text-[#9CA3AF]"
                        }`}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={!isFounder}
                      className={`flex items-center gap-2 text-[14px] font-medium ${
                        isFounder
                          ? "text-[#4F46E5] hover:text-[#4338CA]"
                          : "text-[#9CA3AF] cursor-not-allowed"
                      } transition-colors`}
                      title={!isFounder ? "Only Founder can edit" : ""}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md animate-in fade-in-0 zoom-in-98 duration-200">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Edit" : "Create"} {activeTab.replace("-", " ")}
            </DialogTitle>
            <DialogDescription>
              {selectedItem ? "Make changes to an existing entry." : "Add a new entry."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[14px] font-medium text-[#0F172A] mb-2">
                Label
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                placeholder="Enter label"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-[#0F172A] mb-2">
                Color
              </label>
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-full h-10 px-2 border border-[#E5E7EB] rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#4F46E5] text-white hover:bg-[#4338CA]"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : selectedItem ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
