import { useState } from "react";
import { ArrowLeft, CheckCircle2, Package, AlertCircle } from "lucide-react";
import { StatusBadge } from "../design-system/StatusBadge";
import { AttachmentPreview } from "../shared/AttachmentPreview";
import { ConfirmModal } from "../shared/ConfirmModal";
import { toast } from "../shared/Toast";

interface ClientAcceptanceViewProps {
  onBack: () => void;
  onAccept: () => void;
  onRequestFix: () => void;
}

const mockDeliverables = [
  {
    id: "1",
    title: "User Authentication Module",
    description: "Complete OAuth integration with Google, GitHub, and Microsoft",
    status: "delivered" as const,
    attachments: [
      {
        id: "a1",
        name: "Auth Module Documentation.pdf",
        size: "1.2 MB",
        type: "pdf" as const,
      },
      {
        id: "a2",
        name: "Test Coverage Report.pdf",
        size: "856 KB",
        type: "pdf" as const,
      },
    ],
  },
  {
    id: "2",
    title: "Analytics Dashboard",
    description: "Real-time reporting with customizable widgets and data visualization",
    status: "delivered" as const,
    attachments: [
      {
        id: "a3",
        name: "Dashboard Screenshots.zip",
        size: "3.4 MB",
        type: "other" as const,
      },
      {
        id: "a4",
        name: "dashboard-preview.png",
        size: "2.1 MB",
        type: "image" as const,
        preview: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      },
    ],
  },
  {
    id: "3",
    title: "API Documentation",
    description: "RESTful API endpoints with Swagger documentation and examples",
    status: "delivered" as const,
    attachments: [
      {
        id: "a5",
        name: "API Reference Guide.pdf",
        size: "2.8 MB",
        type: "pdf" as const,
      },
    ],
  },
];

export function ClientAcceptanceView({
  onBack,
  onAccept,
  onRequestFix,
}: ClientAcceptanceViewProps) {
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [fixModalOpen, setFixModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleAccept = () => {
    setAcceptModalOpen(false);
    toast.success("Acceptance confirmed. Final payment milestone triggered.");
    setTimeout(() => {
      onAccept();
    }, 1000);
  };

  const handleRequestFix = () => {
    setFixModalOpen(false);
    toast.success("Fix request submitted. The team has been notified.");
    setTimeout(() => {
      onRequestFix();
    }, 1000);
  };

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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-semibold text-[#0F172A] mb-2">
                Website Redesign - Final Deliverables
              </h1>
              <p className="text-[14px] text-[#6B7280]">
                Review and accept the completed deliverables
              </p>
            </div>
            <StatusBadge status="awaiting-acceptance" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-[#4338CA]" />
            </div>
            <div className="flex-1">
              <h2 className="text-[16px] font-semibold text-[#0F172A] mb-2">
                Delivery Summary
              </h2>
              <p className="text-[14px] text-[#6B7280] mb-4">
                All deliverables have been completed and are ready for your review. 
                Delivered on January 5, 2025.
              </p>
              <div className="flex items-center gap-6 text-[14px]">
                <div>
                  <span className="text-[#6B7280]">Total Deliverables:</span>
                  <span className="ml-2 font-semibold text-[#0F172A]">
                    {mockDeliverables.length}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280]">Commitment Value:</span>
                  <span className="ml-2 font-semibold text-[#0F172A]">$25,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables List */}
        <div className="space-y-4 mb-6">
          {mockDeliverables.map((deliverable, index) => (
            <div
              key={deliverable.id}
              className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F0FDF5] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#047857]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-[16px] font-semibold text-[#0F172A]">
                        {index + 1}. {deliverable.title}
                      </h3>
                      <StatusBadge status="completed" />
                    </div>
                    <p className="text-[14px] text-[#6B7280]">
                      {deliverable.description}
                    </p>
                  </div>
                </div>

                {/* Deliverable Attachments */}
                {deliverable.attachments.length > 0 && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <h4 className="text-[14px] font-medium text-[#0F172A] mb-3">
                      Attachments ({deliverable.attachments.length})
                    </h4>
                    <AttachmentPreview 
                      attachments={deliverable.attachments}
                      layout="grid"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
            Optional Feedback
          </h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share any feedback or comments about the deliverables (optional)"
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[14px] text-[#0F172A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none"
            rows={4}
          />
          <p className="text-[13px] text-[#6B7280] mt-2">
            Your feedback will be shared with the team and included in the project records.
          </p>
        </div>

        {/* Action Panel */}
        <div className="bg-[#F0F4FF] border border-[#E0EAFF] rounded-xl p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-[#4338CA] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-semibold text-[#4338CA] mb-1">
                Review Complete?
              </h3>
              <p className="text-[14px] text-[#4338CA]">
                Once you accept these deliverables, the final payment milestone will be triggered 
                and the commitment will be marked as completed.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setAcceptModalOpen(true)}
              className="flex-1 px-6 py-3 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] transition-colors"
            >
              Accept Deliverables
            </button>
            <button
              onClick={() => setFixModalOpen(true)}
              className="flex-1 px-6 py-3 bg-white text-[#4B5563] border border-[#E5E7EB] rounded-lg font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              Request Fix
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={acceptModalOpen}
        onOpenChange={setAcceptModalOpen}
        title="Accept Deliverables"
        description="By accepting, you confirm that all deliverables meet the requirements. This will trigger the final payment milestone and complete the commitment."
        confirmLabel="Accept"
        onConfirm={handleAccept}
      />

      <ConfirmModal
        open={fixModalOpen}
        onOpenChange={setFixModalOpen}
        title="Request Fix"
        description="This will notify the team that corrections are needed. The commitment will remain in awaiting acceptance status until the issues are resolved."
        confirmLabel="Submit Request"
        onConfirm={handleRequestFix}
      />
    </div>
  );
}
