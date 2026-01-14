import { useState } from "react";
import { Plus, CircleAlert, TrendingUp, Clock, CheckCircle2, AlertTriangle, ArrowRight, Download } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../design-system/StatusBadge";
import { exportToPDF } from "../../utils/pdfExport";

interface DashboardExecutiveProps {
  onCreateNew: () => void;
  onViewCommitment: (id: string) => void;
  onViewAllCommitments: () => void;
  onViewReports: () => void;
  userRole?: 'founder' | 'manager' | 'client';
}

const priorityCommitments = [
  {
    id: '1',
    client: 'Retail Plus',
    name: 'E-commerce Migration',
    status: 'at-risk' as const,
    amount: 35000,
    dueDate: 'May 28, 2024',
    daysUntilDue: -12,
    priority: 'critical'
  },
  {
    id: '2',
    client: 'Acme Corp',
    name: 'Website Redesign Phase 1',
    status: 'pending' as const,
    amount: 15000,
    dueDate: 'Jun 30, 2024',
    daysUntilDue: 5,
    priority: 'high'
  },
  {
    id: '3',
    client: 'Global Solutions',
    name: 'API Integration Project',
    status: 'awaiting-acceptance' as const,
    amount: 12000,
    dueDate: 'Jun 20, 2024',
    daysUntilDue: -5,
    priority: 'high'
  },
];

const recentActivity = [
  { id: 1, type: 'approved', client: 'Finance Co', action: 'Approved commitment', time: '2 hours ago', amount: 22000 },
  { id: 2, type: 'created', client: 'Acme Corp', action: 'Created new commitment', time: '5 hours ago', amount: 15000 },
  { id: 3, type: 'overdue', client: 'Retail Plus', action: 'Commitment overdue', time: '1 day ago', amount: 35000 },
  { id: 4, type: 'reminder', client: 'Global Solutions', action: 'Reminder sent', time: '2 days ago', amount: 12000 },
];

export function DashboardExecutive({ 
  onCreateNew, 
  onViewCommitment, 
  onViewAllCommitments,
  onViewReports,
  userRole = 'founder' 
}: DashboardExecutiveProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDashboard = async () => {
    setIsExporting(true);
    try {
      const data = {
        title: 'Dashboard Overview',
        generatedAt: new Date().toISOString(),
        generatedBy: 'Current User',
        userRole: userRole,
        stats: {
          totalCommitments: 25,
          awaitingApproval: 3,
          active: 12,
          atRisk: 2,
          totalValue: userRole === 'founder' ? 287500 : null,
          revenueAtRisk: userRole === 'founder' ? 56500 : null
        },
        priorityItems: priorityCommitments.map(c => ({
          client: c.client,
          name: c.name,
          status: c.status,
          dueDate: c.dueDate,
          amount: userRole === 'founder' ? c.amount : null,
          priority: c.priority
        })),
        recentActivity: recentActivity.map(a => ({
          client: a.client,
          action: a.action,
          time: a.time,
          amount: userRole === 'founder' ? a.amount : null
        }))
      };

      await exportToPDF('dashboard-overview', data);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6 lg:mb-10">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportDashboard}
            disabled={isExporting}
            className="h-11 border-[#E5E7EB] hover:bg-[#F4F5F7]"
          >
            <Download className="w-[18px] h-[18px] mr-2" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button 
            onClick={onCreateNew}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm px-5 h-11 rounded-lg"
          >
            <Plus className="w-[18px] h-[18px] mr-2" />
            <span className="hidden sm:inline">Create Commitment</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#E0EAFF] flex items-center justify-center">
              <CheckCircle2 className="w-[18px] h-[18px] text-[#4338CA]" />
            </div>
            <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Total</div>
          </div>
          <div className="text-[28px] lg:text-[36px] text-[#0F172A] mb-1 font-semibold tracking-tight">25</div>
          <div className="text-[13px] text-[#6B7280]">Active commitments</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] flex items-center justify-center">
              <Clock className="w-[18px] h-[18px] text-[#B45309]" />
            </div>
            <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Pending</div>
          </div>
          <div className="text-[28px] lg:text-[36px] text-[#0F172A] mb-1 font-semibold tracking-tight">3</div>
          <div className="text-[13px] text-[#D97706]">Awaiting approval</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center">
              <AlertTriangle className="w-[18px] h-[18px] text-[#B91C1C]" />
            </div>
            <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">At Risk</div>
          </div>
          <div className="text-[28px] lg:text-[36px] text-[#0F172A] mb-1 font-semibold tracking-tight">2</div>
          <div className="text-[13px] text-[#DC2626]">Need attention</div>
        </div>

        {userRole === 'founder' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF5] flex items-center justify-center">
                <TrendingUp className="w-[18px] h-[18px] text-[#047857]" />
              </div>
              <div className="text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Value</div>
            </div>
            <div className="text-[24px] lg:text-[32px] text-[#0F172A] mb-1 font-semibold tracking-tight">$287.5K</div>
            <div className="text-[13px] text-[#059669]">Total committed</div>
          </div>
        )}
      </div>

      {/* Revenue at Risk - Founder Only */}
      {userRole === 'founder' && (
        <div className="bg-gradient-to-br from-[#FEF2F2] to-white border border-[#FEE2E2] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CircleAlert className="w-5 h-5 text-[#DC2626]" />
                <h3 className="text-[16px] lg:text-[18px] text-[#0F172A] font-semibold">Revenue at Risk</h3>
              </div>
              <div className="text-[32px] lg:text-[40px] text-[#DC2626] font-semibold mb-2 tracking-tight">$56,500</div>
              <p className="text-[14px] text-[#6B7280]">2 commitments require immediate action</p>
            </div>
            <Button
              onClick={onViewReports}
              className="bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] h-11 px-5"
            >
              View Risk Report
              <ArrowRight className="w-[18px] h-[18px] ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Priority Items */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[16px] text-[#0F172A] font-semibold">Priority Items</h3>
            <button
              onClick={onViewAllCommitments}
              className="text-[14px] text-[#4F46E5] hover:text-[#4338CA] font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-[#E5E7EB]">
            {priorityCommitments.map((commitment) => (
              <button
                key={commitment.id}
                onClick={() => onViewCommitment(commitment.id)}
                className="w-full p-4 lg:p-5 hover:bg-[#FAFAFA] transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] lg:text-[15px] text-[#0F172A] font-semibold mb-1">
                      {commitment.client}
                    </div>
                    <div className="text-[13px] lg:text-[14px] text-[#6B7280] truncate">
                      {commitment.name}
                    </div>
                  </div>
                  {commitment.priority === 'critical' && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FEF2F2] text-[#DC2626] text-[12px] font-semibold rounded uppercase tracking-wide">
                        Critical
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={commitment.status} />
                </div>

                <div className="flex items-center justify-between text-[13px]">
                  <div className="text-[#6B7280]">
                    Due: {commitment.dueDate}
                    {commitment.daysUntilDue < 0 && (
                      <span className="ml-1 text-[#DC2626] font-medium">
                        ({Math.abs(commitment.daysUntilDue)}d overdue)
                      </span>
                    )}
                    {commitment.daysUntilDue > 0 && commitment.daysUntilDue <= 7 && (
                      <span className="ml-1 text-[#D97706] font-medium">
                        ({commitment.daysUntilDue}d left)
                      </span>
                    )}
                  </div>
                  {userRole === 'founder' && (
                    <div className="text-[#0F172A] font-semibold">
                      ${commitment.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E7EB]">
            <h3 className="text-[16px] text-[#0F172A] font-semibold">Recent Activity</h3>
          </div>
          <div className="divide-y divide-[#E5E7EB]">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="p-4 lg:p-5 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'approved' ? 'bg-[#DCFCE8]' :
                    activity.type === 'created' ? 'bg-[#E0EAFF]' :
                    activity.type === 'overdue' ? 'bg-[#FEE2E2]' :
                    'bg-[#F4F5F7]'
                  }`}>
                    {activity.type === 'approved' && <CheckCircle2 className="w-[18px] h-[18px] text-[#047857]" />}
                    {activity.type === 'created' && <Plus className="w-[18px] h-[18px] text-[#4338CA]" />}
                    {activity.type === 'overdue' && <AlertTriangle className="w-[18px] h-[18px] text-[#B91C1C]" />}
                    {activity.type === 'reminder' && <Clock className="w-[18px] h-[18px] text-[#6B7280]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#0F172A] font-medium mb-0.5">
                      {activity.client}
                    </div>
                    <div className="text-[13px] text-[#6B7280] mb-1">
                      {activity.action}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] text-[#9CA3AF]">
                        {activity.time}
                      </div>
                      {userRole === 'founder' && (
                        <div className="text-[13px] text-[#4B5563] font-medium">
                          ${activity.amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={onViewAllCommitments}
          className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#D1D5DB] hover:shadow-sm transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] text-[#0F172A] font-semibold">View All Commitments</div>
            <ArrowRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#4F46E5] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-[13px] text-[#6B7280]">
            Browse and manage all commitments
          </div>
        </button>

        <button
          onClick={onViewReports}
          className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#D1D5DB] hover:shadow-sm transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] text-[#0F172A] font-semibold">View Reports</div>
            <ArrowRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#4F46E5] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-[13px] text-[#6B7280]">
            Analyze risk and commitment trends
          </div>
        </button>

        <button
          onClick={onCreateNew}
          className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#D1D5DB] hover:shadow-sm transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] text-[#0F172A] font-semibold">Create Commitment</div>
            <Plus className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#4F46E5] transition-colors" />
          </div>
          <div className="text-[13px] text-[#6B7280]">
            Start a new client commitment
          </div>
        </button>
      </div>
    </div>
  );
}