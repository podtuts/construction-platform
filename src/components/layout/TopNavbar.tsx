import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Settings,
  Shield,
  Building2,
  X,
  ChevronDown,
  Layers,
  Boxes,
  Users,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { Project } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { ActiveTab } from './Sidebar';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  selectedSiteId: string;
  setSelectedSiteId: (siteId: string) => void;
  projects: Project[];
  onNavigateTab: (tab: ActiveTab) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
  selectedSiteId,
  setSelectedSiteId,
  projects,
  onNavigateTab
}) => {
  const { user, logout } = useAuth();
  const { settings } = useBranding();
  const isSuperuser = user?.role === 'superuser';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch recent notifications
  useEffect(() => {
    api.getDashboardSummary()
      .then((res) => {
        setNotifications(res.activities || []);
      })
      .catch(() => {});
  }, []);

  // Live search debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search(searchQuery.trim());
        setSearchResults(res.results);
        setShowSearchDropdown(true);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResultsCount = searchResults
    ? (searchResults.projects?.length || 0) +
      (searchResults.units?.length || 0) +
      (searchResults.inventory?.length || 0) +
      (searchResults.team?.length || 0) +
      (searchResults.documents?.length || 0) +
      (searchResults.drawings?.length || 0)
    : 0;

  return (
    <header className="h-16 bg-[#191C24] border-b border-[#2A2E38] sticky top-0 z-30 px-4 flex items-center justify-between">
      {/* Left controls: toggle & search */}
      <div className="flex items-center space-x-3 flex-1 max-w-2xl">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-[5px] text-[#8D93A1] hover:text-white hover:bg-[#20232C] transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-[5px] text-[#8D93A1] hover:text-white hover:bg-[#20232C] transition-colors"
          title="Toggle sidebar collapse"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Dashboard Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchDropdown(true)}
              placeholder="Search projects, units, equipment, team, drawings..."
              className="w-full bg-[#20232C] border border-[#2A2E38] focus:border-[#0090FF] focus:outline-none text-white text-[13px] rounded-[6px] pl-9 pr-8 py-2 placeholder-[#626875] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#626875] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#191C24] border border-[#2A2E38] rounded-[8px] shadow-2xl p-2 z-50 max-h-[420px] overflow-y-auto">
              <div className="px-2 py-1 text-[11px] text-[#8D93A1] border-b border-[#2A2E38] flex items-center justify-between">
                <span>Search Results for "{searchQuery}"</span>
                <span className="text-[#0090FF]">{totalResultsCount} found</span>
              </div>

              {isSearching ? (
                <div className="p-4 text-center text-[#8D93A1] text-xs">Searching database...</div>
              ) : totalResultsCount === 0 ? (
                <div className="p-4 text-center text-[#626875] text-xs">No matching records found</div>
              ) : (
                <div className="divide-y divide-[#2A2E38]/60 mt-1">
                  {/* Projects */}
                  {searchResults.projects?.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 text-[10px] font-bold text-[#626875] uppercase mb-1">Projects</div>
                      {searchResults.projects.map((p: Project) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedSiteId(p.id);
                            onNavigateTab('dashboard');
                            setShowSearchDropdown(false);
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#20232C] rounded-[4px] flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-white truncate">{p.name}</span>
                          <span className="text-[11px] text-[#8D93A1]">{p.location}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Units */}
                  {searchResults.units?.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 text-[10px] font-bold text-[#626875] uppercase mb-1">Units & Construction</div>
                      {searchResults.units.slice(0, 4).map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedSiteId(u.siteId);
                            onNavigateTab('project-status');
                            setShowSearchDropdown(false);
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#20232C] rounded-[4px] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-white">{u.unitId}</span>
                            <span className="text-[#8D93A1] ml-2 text-[11px]">({u.siteName})</span>
                          </div>
                          <StatusBadge status={u.status} size="sm" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inventory */}
                  {searchResults.inventory?.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 text-[10px] font-bold text-[#626875] uppercase mb-1">Equipment / Inventory</div>
                      {searchResults.inventory.slice(0, 3).map((i: any) => (
                        <button
                          key={i.id}
                          onClick={() => {
                            onNavigateTab('inventory');
                            setShowSearchDropdown(false);
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#20232C] rounded-[4px] flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-white truncate">{i.equipment}</span>
                          <span className="text-[11px] text-[#8D93A1]">{i.location}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Drawings */}
                  {searchResults.drawings?.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 text-[10px] font-bold text-[#626875] uppercase mb-1">Drawings & Blueprints</div>
                      {searchResults.drawings.slice(0, 3).map((d: any) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            onNavigateTab('drawings');
                            setShowSearchDropdown(false);
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#20232C] rounded-[4px] flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-white truncate">{d.drawingTitle}</span>
                          <span className="text-[11px] text-[#0090FF]">{d.system}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right controls: Site quick selector, Notifications, Profile */}
      <div className="flex items-center space-x-3">
        {/* Site Filter Quick Selector */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-[#20232C] border border-[#2A2E38] rounded-[6px] px-2.5 py-1.5 text-xs text-[#8D93A1]">
          <Building2 className="w-3.5 h-3.5 text-[#0090FF]" />
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
          >
            <option value="all" className="bg-[#191C24] text-white">All Sites ({projects.length} Project{projects.length === 1 ? '' : 's'})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#191C24] text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-[6px] bg-[#20232C] border border-[#2A2E38] hover:border-[#0090FF]/40 text-[#8D93A1] hover:text-white flex items-center justify-center relative transition-colors"
            title="Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#FC424A] absolute top-2 right-2 ring-2 ring-[#191C24]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#191C24] border border-[#2A2E38] rounded-[8px] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-[#2A2E38]">
                <span className="text-[13px] font-medium text-white">Recent System Activity</span>
                <span className="text-[11px] text-[#00D25B]">Live Log</span>
              </div>
              <div className="divide-y divide-[#2A2E38]/60 mt-1 max-h-72 overflow-y-auto">
                {notifications.slice(0, 6).map((item) => (
                  <div key={item.id} className="py-2.5 px-1 hover:bg-[#20232C] rounded-[4px] transition-colors">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">{item.action}</span>
                      <span className="text-[#626875]">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8D93A1] mt-0.5 leading-snug">{item.details}</p>
                    <span className="text-[10px] text-[#0090FF] mt-1 block">By {item.userName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        {user && (
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 p-1 rounded-[6px] hover:bg-[#20232C] border border-transparent hover:border-[#2A2E38] transition-colors"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.fullName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-[#2A2E38]"
              />
              <div className="hidden md:block text-left pr-1">
                <span className="text-[13px] font-medium text-white block leading-tight">{user.fullName}</span>
                <span className="text-[11px] text-[#8D93A1] capitalize block leading-tight">{user.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8D93A1]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#191C24] border border-[#2A2E38] rounded-[8px] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#2A2E38] mb-1">
                  <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                  <p className="text-[11px] text-[#8D93A1] truncate">@{user.username}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={user.role} size="sm" />
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigateTab('accounts');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#8D93A1] hover:text-white hover:bg-[#20232C] rounded-[4px] flex items-center space-x-2 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-[#0090FF]" />
                  <span>Account Credentials</span>
                </button>

                {isSuperuser && (
                  <button
                    onClick={() => {
                      onNavigateTab('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#8D93A1] hover:text-white hover:bg-[#20232C] rounded-[4px] flex items-center space-x-2 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#8D93A1]" />
                    <span>Company Branding</span>
                  </button>
                )}

                <div className="border-t border-[#2A2E38] my-1" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#FC424A] hover:bg-[#FC424A]/10 rounded-[4px] flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
