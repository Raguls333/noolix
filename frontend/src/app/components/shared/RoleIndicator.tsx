import { Shield, Eye, EyeOff, User } from "lucide-react";

interface RoleIndicatorProps {
  role: 'founder' | 'manager' | 'client';
  className?: string;
}

export function RoleIndicator({ role, className = '' }: RoleIndicatorProps) {
  const config = {
    founder: {
      label: 'Full Access',
      icon: Shield,
      leftIcon: Shield,
      rightIcon: Eye,
      className: 'bg-[#F0F4FF] text-[#4338CA] border border-[#E0EAFF]'
    },
    manager: {
      label: 'Limited Access',
      icon: Shield,
      leftIcon: Shield,
      rightIcon: EyeOff,
      className: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
    },
    client: {
      label: 'Client Access',
      icon: User,
      leftIcon: User,
      rightIcon: null,
      className: 'bg-[#F0FDF5] text-[#047857] border border-[#DCFCE8]'
    }
  } as const;

  // Safety check: default to 'manager' if role is undefined or invalid
  const safeRole = role && (role === 'founder' || role === 'manager' || role === 'client') ? role : 'manager';
  const roleConfig = config[safeRole];
  const LeftIcon = roleConfig.leftIcon;
  const RightIcon = roleConfig.rightIcon;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium ${roleConfig.className} ${className}`}>
      <LeftIcon className="w-3.5 h-3.5" />
      <span>{roleConfig.label}</span>
      {RightIcon && <RightIcon className="w-3.5 h-3.5" />}
    </div>
  );
}