import { ReactNode } from "react";
import { CircleAlert, Clock, Users } from "lucide-react";

interface ReportsLayoutProps {
  children: ReactNode;
  activeReport: 'revenue-risk' | 'aging' | 'client-behavior';
  onReportChange: (report: 'revenue-risk' | 'aging' | 'client-behavior') => void;
}

export function ReportsLayout({ children, activeReport, onReportChange }: ReportsLayoutProps) {
  const reports = [
    { id: 'revenue-risk' as const, label: 'Revenue at Risk', icon: CircleAlert },
    { id: 'aging' as const, label: 'Commitment Aging', icon: Clock },
    { id: 'client-behavior' as const, label: 'Client Behavior', icon: Users },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-1">Reports</h1>
        <p className="text-slate-600">Financial insights and commitment analytics</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8">
        <div className="flex gap-1">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => onReportChange(report.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeReport === report.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {report.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
