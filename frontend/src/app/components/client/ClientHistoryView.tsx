import { ArrowLeft, FileText, Clock, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "../design-system/StatusBadge";

interface ClientHistoryViewProps {
  onBack: () => void;
  onViewDetail: (id: string) => void;
}

const mockHistory = [
  {
    id: "1",
    name: "Brand Guidelines Package",
    value: "$8,500",
    status: 'approved' as const,
    approvedDate: "2025-01-02",
    completedDate: "2025-01-08",
    timeline: [
      { date: "2024-12-20", event: "Commitment created" },
      { date: "2025-01-02", event: "Approved by client" },
      { date: "2025-01-08", event: "Deliverables accepted" },
    ],
  },
  {
    id: "2",
    name: "Content Strategy Document",
    value: "$12,000",
    status: 'at-risk' as const,
    approvedDate: "2024-12-15",
    completedDate: null,
    timeline: [
      { date: "2024-12-10", event: "Commitment created" },
      { date: "2024-12-15", event: "Approved by client" },
      { date: "2024-12-28", event: "Change requested by client" },
      { date: "2025-01-03", event: "Revisions submitted" },
    ],
  },
  {
    id: "3",
    name: "Website Prototype v1",
    value: "$15,000",
    status: 'completed' as const,
    approvedDate: "2024-11-20",
    completedDate: "2024-12-10",
    timeline: [
      { date: "2024-11-15", event: "Commitment created" },
      { date: "2024-11-20", event: "Approved by client" },
      { date: "2024-12-08", event: "Deliverables submitted" },
      { date: "2024-12-10", event: "Accepted by client" },
    ],
  },
];

export function ClientHistoryView({
  onBack,
  onViewDetail,
}: ClientHistoryViewProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[14px] text-[#6B7280] hover:text-[#0F172A] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-[24px] font-semibold text-[#0F172A] mb-2">
              History & Proof
            </h1>
            <p className="text-[14px] text-[#6B7280]">
              View all commitments and their audit trails
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="text-[13px] text-[#6B7280] mb-1">Total Commitments</div>
            <div className="text-[24px] font-semibold text-[#0F172A]">{mockHistory.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="text-[13px] text-[#6B7280] mb-1">Completed</div>
            <div className="text-[24px] font-semibold text-[#047857]">
              {mockHistory.filter(h => h.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="text-[13px] text-[#6B7280] mb-1">In Progress</div>
            <div className="text-[24px] font-semibold text-[#4F46E5]">
              {mockHistory.filter(h => h.status !== 'completed').length}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {mockHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#6B7280]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1 truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-4 text-[14px] text-[#6B7280]">
                        <span>{item.value}</span>
                        {item.completedDate && (
                          <span>Completed {item.completedDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Timeline */}
                <div className="pl-14 border-l-2 border-[#E5E7EB] ml-5 space-y-4">
                  {item.timeline.map((event, index) => (
                    <div key={index} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1.5">
                        {index === item.timeline.length - 1 ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#9CA3AF]" />
                        )}
                      </div>
                      <div className="text-[13px] text-[#6B7280] mb-0.5">{event.date}</div>
                      <div className="text-[14px] text-[#0F172A] font-medium">{event.event}</div>
                    </div>
                  ))}
                </div>

                {/* View Details Button */}
                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => onViewDetail(item.id)}
                    className="text-[14px] font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                  >
                    View full details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {mockHistory.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F9FAFB] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#6B7280]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#0F172A] mb-2">
              No history yet
            </h3>
            <p className="text-[14px] text-[#6B7280]">
              Your commitment history will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
