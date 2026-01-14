import { Plus } from "lucide-react";
import { EmptyState } from "../design-system/EmptyState";

interface EmptyDashboardProps {
  onCreateNew: () => void;
}

export function EmptyDashboard({ onCreateNew }: EmptyDashboardProps) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-slate-900 mb-1">Dashboard</h1>
          <p className="text-slate-600">Overview of all commitments and their status</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg">
        <EmptyState
          title="No commitments yet"
          description="Create one to lock agreements with clients and maintain proof of what was agreed."
          action={{
            label: 'Create New Commitment',
            onClick: onCreateNew
          }}
          icon={<Plus className="w-8 h-8 text-slate-400" />}
        />
      </div>
    </div>
  );
}
