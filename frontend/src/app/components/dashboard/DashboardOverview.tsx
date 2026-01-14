import { useState } from "react";
import { Plus, CircleAlert, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { StatusBadge } from "../design-system/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Commitment {
  id: string;
  client: string;
  name: string;
  stage: 'pending' | 'active' | 'awaiting-acceptance' | 'at-risk' | 'completed';
  amount: number;
  lastActivity: string;
  riskLevel: 'none' | 'low' | 'high';
}

interface DashboardOverviewProps {
  onCreateNew: () => void;
  onViewCommitment: (id: string) => void;
}

const mockCommitments: Commitment[] = [
  {
    id: '1',
    client: 'Acme Corp',
    name: 'Website Redesign Phase 1',
    stage: 'pending',
    amount: 15000,
    lastActivity: '2 hours ago',
    riskLevel: 'none'
  },
  {
    id: '2',
    client: 'TechStart Inc',
    name: 'Mobile App Development',
    stage: 'active',
    amount: 28000,
    lastActivity: '1 day ago',
    riskLevel: 'none'
  },
  {
    id: '3',
    client: 'Global Solutions',
    name: 'API Integration Project',
    stage: 'awaiting-acceptance',
    amount: 12000,
    lastActivity: '3 days ago',
    riskLevel: 'low'
  },
  {
    id: '4',
    client: 'Retail Plus',
    name: 'E-commerce Migration',
    stage: 'at-risk',
    amount: 35000,
    lastActivity: '12 days ago',
    riskLevel: 'high'
  },
  {
    id: '5',
    client: 'Finance Co',
    name: 'Dashboard Development',
    stage: 'active',
    amount: 22000,
    lastActivity: '5 hours ago',
    riskLevel: 'none'
  }
];

export function DashboardOverview({ onCreateNew, onViewCommitment }: DashboardOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const stats = {
    awaitingApproval: mockCommitments.filter(c => c.stage === 'pending').length,
    active: mockCommitments.filter(c => c.stage === 'active').length,
    awaitingAcceptance: mockCommitments.filter(c => c.stage === 'awaiting-acceptance').length,
    atRisk: mockCommitments.filter(c => c.stage === 'at-risk').length,
  };

  const filteredCommitments = mockCommitments.filter(c => {
    const matchesSearch = c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="px-4 lg:px-10 py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Header with Action */}
      <div className="flex items-center justify-between mb-6 lg:mb-10">
        <div className="ml-auto">
          <Button 
            onClick={onCreateNew}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm px-5 h-11 rounded-lg"
          >
            <Plus className="w-[18px] h-[18px] mr-2" />
            Create Commitment
          </Button>
        </div>
      </div>

      {/* Stats Cards - Modern, clean design */}
      <div className="grid grid-cols-4 gap-5 mb-10">
        <button 
          onClick={() => setStageFilter('pending')}
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all group"
        >
          <div className="text-[13px] text-[#6B7280] mb-3 font-medium uppercase tracking-wide">Awaiting Approval</div>
          <div className="text-[36px] text-[#0F172A] mb-2 font-semibold tracking-tight">{stats.awaitingApproval}</div>
          <div className="text-[13px] text-[#D97706] font-medium">Client action required</div>
        </button>

        <button 
          onClick={() => setStageFilter('active')}
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all group"
        >
          <div className="text-[13px] text-[#6B7280] mb-3 font-medium uppercase tracking-wide">Active</div>
          <div className="text-[36px] text-[#0F172A] mb-2 font-semibold tracking-tight">{stats.active}</div>
          <div className="text-[13px] text-[#2563EB] font-medium">In progress</div>
        </button>

        <button 
          onClick={() => setStageFilter('awaiting-acceptance')}
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all group"
        >
          <div className="text-[13px] text-[#6B7280] mb-3 font-medium uppercase tracking-wide">Awaiting Acceptance</div>
          <div className="text-[36px] text-[#0F172A] mb-2 font-semibold tracking-tight">{stats.awaitingAcceptance}</div>
          <div className="text-[13px] text-[#4338CA] font-medium">Ready for review</div>
        </button>

        <button 
          onClick={() => setStageFilter('at-risk')}
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all group"
        >
          <div className="text-[13px] text-[#6B7280] mb-3 font-medium uppercase tracking-wide">At Risk</div>
          <div className="text-[36px] text-[#0F172A] mb-2 font-semibold tracking-tight">{stats.atRisk}</div>
          <div className="text-[13px] text-[#B91C1C] font-medium">Needs attention</div>
        </button>
      </div>

      {/* Filters - Clean, minimal */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search commitments or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-white border-[#E5E7EB] rounded-lg text-[14px]"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48 h-11 bg-white border-[#E5E7EB] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="pending">Awaiting approval</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="awaiting-acceptance">Awaiting acceptance</SelectItem>
            <SelectItem value="at-risk">At risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table - Premium, refined design */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Client</th>
              <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Commitment</th>
              <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Status</th>
              <th className="text-right px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Amount</th>
              <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Last Activity</th>
              <th className="text-left px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide">Risk</th>
              <th className="text-right px-6 py-4 text-[13px] text-[#6B7280] font-medium uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCommitments.map((commitment, index) => (
              <tr 
                key={commitment.id} 
                className={`border-b border-[#F4F5F7] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer ${
                  index === 0 ? '' : ''
                }`}
                onClick={() => onViewCommitment(commitment.id)}
              >
                <td className="px-6 py-5 text-[14px] text-[#0F172A] font-medium">{commitment.client}</td>
                <td className="px-6 py-5 text-[14px] text-[#4B5563]">{commitment.name}</td>
                <td className="px-6 py-5">
                  <StatusBadge status={commitment.stage} />
                </td>
                <td className="px-6 py-5 text-right text-[15px] text-[#0F172A] font-semibold tabular-nums">
                  ${commitment.amount.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-[14px] text-[#6B7280]">{commitment.lastActivity}</td>
                <td className="px-6 py-5">
                  {commitment.riskLevel === 'high' && (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#B91C1C] font-medium">
                      <CircleAlert className="w-3.5 h-3.5" />
                      High
                    </span>
                  )}
                  {commitment.riskLevel === 'low' && (
                    <span className="text-[13px] text-[#D97706] font-medium">Low</span>
                  )}
                  {commitment.riskLevel === 'none' && (
                    <span className="text-[13px] text-[#9CA3AF]">—</span>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewCommitment(commitment.id);
                    }}
                    className="text-[#4F46E5] hover:bg-[#F0F4FF] hover:text-[#4338CA] h-9 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}