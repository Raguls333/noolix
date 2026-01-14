import { CircleCheck, Clock, CircleAlert, ShieldX } from "lucide-react";

type Status =
  | 'draft'
  | 'internal-review'
  | 'awaiting-client-approval'
  | 'in-progress'
  | 'change-requested'
  | 'delivered'
  | 'accepted'
  | 'closed'
  | 'disputed'
  | 'pending'
  | 'awaiting-acceptance'
  | 'completed'
  | 'active'
  | 'at-risk'
  | 'approved';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: Clock,
    className: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
  },
  'internal-review': {
    label: 'Internal review',
    icon: Clock,
    className: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
  },
  'awaiting-client-approval': {
    label: 'Awaiting client approval',
    icon: Clock,
    className: 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]'
  },
  'in-progress': {
    label: 'In progress',
    icon: CircleCheck,
    className: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]'
  },
  'change-requested': {
    label: 'Change requested',
    icon: CircleAlert,
    className: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
  },
  delivered: {
    label: 'Delivered',
    icon: CircleCheck,
    className: 'bg-[#F0F4FF] text-[#4338CA] border-[#E0EAFF]'
  },
  accepted: {
    label: 'Accepted',
    icon: CircleCheck,
    className: 'bg-[#ECFDF3] text-[#047857] border-[#BBF7D0]'
  },
  closed: {
    label: 'Closed',
    icon: CircleCheck,
    className: 'bg-[#F4F5F7] text-[#4B5563] border-[#E5E7EB]'
  },
  disputed: {
    label: 'Cancelled',
    icon: ShieldX,
    className: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FEE2E2]'
  },
  pending: {
    label: 'Awaiting client approval',
    icon: Clock,
    className: 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]'
  },
  'awaiting-acceptance': {
    label: 'Delivered',
    icon: CircleCheck,
    className: 'bg-[#F0F4FF] text-[#4338CA] border-[#E0EAFF]'
  },
  completed: {
    label: 'Accepted',
    icon: CircleCheck,
    className: 'bg-[#ECFDF3] text-[#047857] border-[#BBF7D0]'
  },
  active: {
    label: 'In progress',
    icon: CircleCheck,
    className: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]'
  },
  'at-risk': {
    label: 'Change requested',
    icon: CircleAlert,
    className: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
  },
  approved: {
    label: 'Accepted',
    icon: CircleCheck,
    className: 'bg-[#ECFDF3] text-[#047857] border-[#BBF7D0]'
  }
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-medium ${config.className} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
