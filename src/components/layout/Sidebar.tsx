import React from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  ListTodo,
  Calendar,
  Boxes,
  Users,
  FileText,
  Layers,
  ShieldCheck,
  Settings,
  HardHat,
  Contact,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { StatusBadge } from '../common/StatusBadge';

export type ActiveTab =
  | 'dashboard'
  | 'projects'
  | 'project-status'
  | 'todo'
  | 'schedule'
  | 'inventory'
  | 'team'
  | 'documents'
  | 'drawings'
  | 'contacts'
  | 'contractors'
  | 'accounts'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  isCollapsed
}) => {
  const { user } = useAuth();
  const { settings } = useBranding();

  const isSuperuser = user?.role === 'superuser';

  const navSections = [
    {
      label: 'MAIN',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects' as ActiveTab, label: 'Site Projects', icon: Building2 },
        { id: 'project-status' as ActiveTab, label: 'Project Status', icon: CheckCircle2 }
      ]
    },
    {
      label: 'OPERATIONS',
      items: [
        { id: 'todo' as ActiveTab, label: 'To Do', icon: ListTodo },
        { id: 'schedule' as ActiveTab, label: 'Schedule', icon: Calendar }
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { id: 'inventory' as ActiveTab, label: 'Inventory', icon: Boxes },
        { id: 'team' as ActiveTab, label: 'Team', icon: Users },
        { id: 'documents' as ActiveTab, label: 'Documents', icon: FileText },
        { id: 'drawings' as ActiveTab, label: 'Drawings', icon: Layers },
        { id: 'contacts' as ActiveTab, label: 'Contacts', icon: Contact },
        { id: 'contractors' as ActiveTab, label: 'Contractors', icon: HardHat }
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'accounts' as ActiveTab, label: 'Accounts', icon: ShieldCheck },
        // Company Settings (branding, logos, banners) is superuser-only
        ...(isSuperuser
          ? [{ id: 'settings' as ActiveTab, label: 'Company Settings', icon: Settings }]
          : [])
      ]
    }
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (isOpenMobile) setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#171A21] border-r border-[#2A2E38] transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-[250px]'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#2A2E38] bg-[#191C24]">
          <div className="flex items-center space-x-3 overflow-hidden">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-[6px] object-cover border border-[#2A2E38] shrink-0"
                onError={(e) => {
                  // Fallback to hardhat icon if logo fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-[6px] bg-[#0090FF]/20 border border-[#0090FF]/40 flex items-center justify-center text-[#0090FF] shrink-0">
                <HardHat className="w-5 h-5" />
              </div>
            )}
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-semibold text-[14px] text-white tracking-wide block truncate">
                  {settings.companyName || 'ConstructPulse'}
                </span>
                <span className="text-[10px] text-[#8D93A1] uppercase tracking-wider block font-medium">
                  SaaS Enterprise
                </span>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-[#8D93A1] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Snippet */}
        {user && !isCollapsed && (
          <div className="px-4 py-3 mx-3 my-3 bg-[#191C24] border border-[#2A2E38] rounded-[6px] flex items-center space-x-3">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-[#2A2E38] shrink-0"
            />
            <div className="truncate min-w-0 flex-1">
              <div className="text-[13px] font-medium text-white truncate">{user.fullName}</div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <StatusBadge status={user.role} size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {navSections.map((sec) => (
            <div key={sec.label}>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-[#626875] uppercase tracking-wider">
                  {sec.label}
                </div>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-0' : 'px-3'
                      } py-2.5 text-[13px] font-normal rounded-[5px] transition-colors relative group ${
                        isActive
                          ? 'bg-[#20232C] text-white font-medium border-l-[3px] border-[#0090FF]'
                          : 'text-[#8D93A1] hover:text-white hover:bg-[#191C24]'
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 ${
                          isActive ? 'text-[#0090FF]' : 'text-[#8D93A1] group-hover:text-white'
                        } ${!isCollapsed ? 'mr-3' : ''}`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-[#2A2E38] text-[11px] text-[#626875] flex items-center justify-between">
            <span>Corona Modern Vertical</span>
            <span className="text-[#00D25B] font-mono font-medium">● v2.4 SaaS</span>
          </div>
        )}
      </aside>
    </>
  );
};
