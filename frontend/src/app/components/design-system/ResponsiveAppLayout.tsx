import { type ReactNode, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Activity,
  Settings,
  Shield,
  Menu,
  X,
  Building2,
  SquareCheck,
  Clock,
} from "lucide-react";
import { Button } from "../ui/button";
import { UserMenu } from "../shared/UserMenu";

interface ResponsiveAppLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;

  // keep optional, but we will render safely even if empty
  userEmail?: string;
  userRole?: "founder" | "manager" | "client";

  // IMPORTANT: if this exists, we show user block
  onLogout?: () => void;
}

// Navigation for Founder/Manager
const internalNavigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["founder", "manager"] },
  { id: "commitments", label: "Commitments", icon: FileText, roles: ["founder", "manager"] },
  { id: "clients", label: "Clients", icon: Building2, roles: ["founder", "manager"] },
  { id: "reports", label: "Reports", icon: Activity, roles: ["founder", "manager"] },
  { id: "settings", label: "Settings", icon: Settings, roles: ["founder", "manager"] },
];

// Navigation for Client
const clientNavigationItems = [
  { id: "client-dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["client"] },
  { id: "client-approvals", label: "Pending Approvals", icon: Clock, roles: ["client"] },
  { id: "client-acceptance", label: "Pending Acceptance", icon: SquareCheck, roles: ["client"] },
  { id: "client-history", label: "History", icon: FileText, roles: ["client"] },
];

export function ResponsiveAppLayout({
  children,
  currentView,
  onNavigate,
  userEmail,
  userRole = "founder",
  onLogout,
}: ResponsiveAppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  // Get navigation items based on user role
  const navigationItems = userRole === "client" ? clientNavigationItems : internalNavigationItems;
  const filteredNavItems = navigationItems.filter((item) => item.roles.includes(userRole));

  // ✅ SAFE FALLBACKS (prevents user section from disappearing on refresh)
  const safeEmail = (userEmail || "").trim() || "—";
  const canShowUserMenu = typeof onLogout === "function";

  const isActiveFor = (itemId: string) => {
    return (
      (itemId === "dashboard" && (currentView === "dashboard" || currentView === "empty-dashboard")) ||
      (itemId === "commitments" &&
        (currentView === "commitments-list" ||
          currentView === "create-commitment" ||
          currentView === "commitment-detail")) ||
      (itemId === "clients" && (currentView === "clients-list" || currentView === "client-detail")) ||
      (itemId === "reports" && currentView === "reports") ||
      (itemId === "settings" && currentView === "settings") ||
      (itemId === "client-dashboard" && currentView === "client-dashboard") ||
      (itemId === "client-approvals" &&
        (currentView === "client-approvals" || currentView === "client-approval-detail")) ||
      (itemId === "client-acceptance" &&
        (currentView === "client-acceptance" || currentView === "client-acceptance-detail")) ||
      (itemId === "client-history" && currentView === "client-history")
    );
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[#E5E7EB] flex-col">
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
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveFor(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all duration-200 ${
                    active
                      ? "bg-[#4F46E5] text-white shadow-sm"
                      : "text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#1F2937]"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ✅ User Info (ALWAYS show when logout exists) */}
        {canShowUserMenu && (
          <div className="px-3 py-4 border-t border-[#E5E7EB]">
            <UserMenu
              userEmail={safeEmail}
              userRole={userRole}
              onLogout={onLogout!}
              onProfile={() => handleNavigate("profile")}
            />
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#E5E7EB] px-4 py-3 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm text-[#0F172A] font-medium tracking-tight">Commitment Engine</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-9 w-9 p-0">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed top-[57px] left-0 right-0 bottom-0 bg-white z-40 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="px-4 py-6">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveFor(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] transition-all ${
                    active
                      ? "bg-[#4F46E5] text-white shadow-sm"
                      : "text-[#4B5563] hover:bg-[#F4F5F7] hover:text-[#1F2937]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ✅ Mobile User Info (ALWAYS show when logout exists) */}
        {canShowUserMenu && (
          <div className="px-4 py-4 mt-6 border-t border-[#E5E7EB]">
            <UserMenu
              userEmail={safeEmail}
              userRole={userRole}
              onLogout={onLogout!}
              onProfile={() => handleNavigate("profile")}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-[57px] md:pt-0">{children}</main>
    </div>
  );
}
