import { ReactNode } from "react";
import { LayoutDashboard, FileText, Activity, Settings, Shield } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  userEmail?: string;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'commitments', label: 'Commitments', icon: FileText },
  { id: 'reports', label: 'Reports', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children, currentView, onNavigate, userEmail }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Sidebar - Premium & Elegant */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
        {/* Logo/Brand */}
        <div className="px-6 py-8 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[15px] text-[#0F172A] font-medium tracking-tight">Commitment</div>
              <div className="text-xs text-[#6B7280]">Engine</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-sm'
                      : 'text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#1F2937]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        {userEmail && (
          <div className="px-6 py-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#0F172A] font-medium truncate">{userEmail.split('@')[0]}</div>
                <div className="text-xs text-[#6B7280] truncate">{userEmail}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
