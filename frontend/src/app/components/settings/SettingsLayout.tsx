import { ReactNode } from "react";
import { Building2, Users, Activity, Database } from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
  activeTab: 'organization' | 'roles' | 'activity' | 'masters';
  onTabChange: (tab: 'organization' | 'roles' | 'activity' | 'masters') => void;
  userRole?: 'founder' | 'manager' | 'client';
}

export function SettingsLayout({ children, activeTab, onTabChange, userRole = 'founder' }: SettingsLayoutProps) {
  // Filter tabs based on user role
  const allTabs = [
    { id: 'organization' as const, label: 'Organization', icon: Building2, roles: ['founder'] },
    { id: 'roles' as const, label: 'Roles & Access', icon: Users, roles: ['founder'] },
    { id: 'masters' as const, label: 'Masters', icon: Database, roles: ['founder'] },
    { id: 'activity' as const, label: 'Activity Log', icon: Activity, roles: ['founder', 'manager'] },
  ];

  const tabs = allTabs.filter(tab => tab.roles.includes(userRole));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-600">Manage your organization and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
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