import { useState } from "react";
import { ArrowLeft, Calendar, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { StatusBadge } from "../design-system/StatusBadge";
import { AttachmentPreview, type Attachment } from "../shared/AttachmentPreview";
import { ConfirmModal } from "../shared/ConfirmModal";
import { toast } from "../shared/Toast";

interface ClientApprovalViewProps {
  onBack: () => void;
  onApprove: () => void;
  onRequestChange: () => void;
}

const mockAttachments: Attachment[] = [
  {
    id: "1",
    name: "Project Scope Document.pdf",
    size: "2.4 MB",
    type: "pdf",
  },
  {
    id: "2",
    name: "Timeline Overview.pdf",
    size: "1.8 MB",
    type: "pdf",
  },
  {
    id: "3",
    name: "Budget Breakdown.xlsx",
    size: "456 KB",
    type: "doc",
  },
];

const mockChangeHistory = [
  {
    id: "1",
    date: "2025-01-02",
    action: "Scope updated",
    description: "Added Phase 2 deliverables based on client feedback",
    user: "John Smith",
  },
  {
    id: "2",
    date: "2024-12-28",
    action: "Timeline adjusted",
    description: "Extended deadline to accommodate holiday schedule",
    user: "Sarah Johnson",
  },
];

export function ClientApprovalView({
  onBack,
  onApprove,
  onRequestChange,
}: ClientApprovalViewProps) {
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);

  const handleApprove = () => {
    setApproveModalOpen(false);
    toast.success("Approval recorded. Timestamp added to audit trail.");
    setTimeout(() => {
      onApprove();
    }, 1000);
  };

  const handleRequestChange = () => {
    setChangeModalOpen(false);
    toast.success("Change request submitted. The team will be notified.");
    setTimeout(() => {
      onRequestChange();
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
                Q1 Product Delivery - Phase 2
              </h1>
              <p className="text-[14px] text-[#6B7280]">
                Review and approve this commitment
              </p>
            </div>
            <StatusBadge status="pending" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Details */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
            Commitment Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F0FDF5] flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-[#047857]" />
              </div>
              <div>
                <div className="text-[13px] text-[#6B7280] mb-1">Total Value</div>
                <div className="text-[16px] font-semibold text-[#0F172A]">$45,000</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <div className="text-[13px] text-[#6B7280] mb-1">Due Date</div>
                <div className="text-[16px] font-semibold text-[#0F172A]">Jan 15, 2025</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#B45309]" />
              </div>
              <div>
                <div className="text-[13px] text-[#6B7280] mb-1">Days Remaining</div>
                <div className="text-[16px] font-semibold text-[#0F172A]">17 days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scope & Terms */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
            Scope & Terms
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-[14px] text-[#4B5563] leading-relaxed mb-4">
              Complete development and delivery of Phase 2 features including user authentication system, 
              dashboard analytics, and API integrations as specified in the attached project scope document.
            </p>
            <h3 className="text-[14px] font-semibold text-[#0F172A] mb-2">Deliverables</h3>
            <ul className="text-[14px] text-[#4B5563] space-y-1 mb-4">
              <li>User authentication module with OAuth integration</li>
              <li>Analytics dashboard with real-time reporting</li>
              <li>RESTful API endpoints and documentation</li>
              <li>Comprehensive test coverage (min 80%)</li>
              <li>Deployment to staging environment</li>
            </ul>
            <h3 className="text-[14px] font-semibold text-[#0F172A] mb-2">Payment Terms</h3>
            <p className="text-[14px] text-[#4B5563] leading-relaxed">
              50% upon approval, 50% upon successful delivery and acceptance of all deliverables.
            </p>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
            Attachments ({mockAttachments.length})
          </h2>
          <AttachmentPreview attachments={mockAttachments} />
        </div>

        {/* Change History */}
        {mockChangeHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
            <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
              Change History
            </h2>
            <div className="space-y-4">
              {mockChangeHistory.map((change) => (
                <div key={change.id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4 border-b border-[#E5E7EB] last:border-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-[14px] font-medium text-[#0F172A]">
                        {change.action}
                      </div>
                      <div className="text-[13px] text-[#6B7280]">{change.date}</div>
                    </div>
                    <p className="text-[14px] text-[#6B7280] mb-1">
                      {change.description}
                    </p>
                    <div className="text-[13px] text-[#9CA3AF]">
                      by {change.user}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-semibold text-[#B45309] mb-1">
                Your approval is required
              </h3>
              <p className="text-[14px] text-[#92400E]">
                Please review all details and attachments carefully. Your approval will be 
                timestamped and added to the audit trail.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setApproveModalOpen(true)}
              className="flex-1 px-6 py-3 bg-[#047857] text-white rounded-lg font-medium hover:bg-[#065F46] transition-colors"
            >
              Approve Commitment
            </button>
            <button
              onClick={() => setChangeModalOpen(true)}
              className="flex-1 px-6 py-3 bg-white text-[#4B5563] border border-[#E5E7EB] rounded-lg font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              Request Change
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={approveModalOpen}
        onOpenChange={setApproveModalOpen}
        title="Approve Commitment"
        description="By approving, you confirm that you have reviewed all details and agree to the terms. This action will be recorded with a timestamp in the audit trail."
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />

      <ConfirmModal
        open={changeModalOpen}
        onOpenChange={setChangeModalOpen}
        title="Request Change"
        description="This will notify the team that changes are needed. They will be able to view your request and make updates accordingly."
        confirmLabel="Submit Request"
        onConfirm={handleRequestChange}
      />
    </div>
  );
}
