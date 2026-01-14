import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { RoleIndicator } from "./RoleIndicator";

interface UserMenuProps {
  userEmail: string;
  userRole: 'founder' | 'manager' | 'client';
  onLogout: () => void;
  onProfile: () => void;
}

export function UserMenu({ userEmail, userRole, onLogout, onProfile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get initials from email
  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[#F4F5F7] transition-colors group"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[13px] font-semibold text-white">{getInitials(userEmail)}</span>
        </div>
        <div className="flex-1 min-w-0 text-left hidden lg:block">
          <div className="text-[13px] text-[#0F172A] font-medium truncate">{userEmail}</div>
          <div className="text-[12px] text-[#6B7280] capitalize">{userRole}</div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-[#9CA3AF] transition-transform hidden lg:block ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden z-[100] min-w-[280px]">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="text-[13px] text-[#0F172A] font-medium mb-1">{userEmail}</div>
            <RoleIndicator role={userRole} className="mt-2" />
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                onProfile();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
            >
              <User className="w-[18px] h-[18px] text-[#9CA3AF]" />
              <span>Profile Settings</span>
            </button>
            
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}