import { ReactNode } from "react";
import { LayoutDashboard, TrendingUp } from "lucide-react";

interface DashboardLayoutResponsiveProps {
  children: ReactNode;
  activeView: 'overview' | 'executive';
  onViewChange: (view: 'overview' | 'executive') => void;
  userRole?: 'founder' | 'manager' | 'client';
}

export function DashboardLayoutResponsive({ children, activeView, onViewChange, userRole = 'founder' }: DashboardLayoutResponsiveProps) {
  const views = [
    { id: 'executive' as const, label: 'Executive View', shortLabel: 'Executive', icon: TrendingUp },
    { id: 'overview' as const, label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  ];

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header with Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 lg:px-10 pt-6 lg:pt-10 pb-0">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-1 tracking-tight">Dashboard</h1>
            <p className="text-[14px] lg:text-[15px] text-[#6B7280]">Monitor commitments and approvals</p>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:flex gap-1 -mb-px">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-[14px] font-medium border-b-2 transition-colors ${
                    activeView === view.id
                      ? 'border-[#4F46E5] text-[#4F46E5]'
                      : 'border-transparent text-[#6B7280] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {view.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden flex gap-2 -mb-px overflow-x-auto pb-px">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    activeView === view.id
                      ? 'bg-[#F0F4FF] text-[#4F46E5] border-b-2 border-[#4F46E5]'
                      : 'text-[#6B7280]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="sm:hidden">{view.shortLabel}</span>
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
