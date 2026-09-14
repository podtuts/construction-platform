import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { ProjectsView } from './components/views/ProjectsView';
import { ProjectStatusView } from './components/views/ProjectStatusView';
import { InventoryView } from './components/views/InventoryView';
import { TeamView } from './components/views/TeamView';
import { DocumentsView } from './components/views/DocumentsView';
import { DrawingsView } from './components/views/DrawingsView';
import { ContactsView } from './components/views/ContactsView';
import { ContractorsView } from './components/views/ContractorsView';
import { ActivityLogsView } from './components/views/ActivityLogsView';
import { ReportView } from './components/views/ReportView';
import { AccountsView } from './components/views/AccountsView';
import { SettingsView } from './components/views/SettingsView';
import { TodoView } from './components/views/TodoView';
import { ScheduleView } from './components/views/ScheduleView';
import { Project, ProjectUnit, DashboardMetrics, ActivityLog } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Project & Dashboard State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const loadInitialData = async () => {
    setIsDataLoading(true);
    try {
      const [projRes, unitsRes, dashRes] = await Promise.all([
        api.getProjects(),
        api.getUnits(),
        api.getDashboardSummary()
      ]);

      setProjects(projRes.projects || []);
      setUnits(unitsRes.units || []);
      setMetrics(dashRes.metrics || null);
      setActivities(dashRes.activities || []);
    } catch (err) {
      console.error('Failed to load application dataset:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F14] flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-[#0090FF]/30 border-t-[#0090FF] rounded-full animate-spin" />
        <span className="text-xs text-[#8D93A1] font-mono tracking-wider uppercase">
          Loading ConstructPulse...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white flex flex-col">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-[250px]'
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          projects={projects}
          onNavigateTab={setActiveTab}
        />

        {/* View Router Container */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              projects={projects}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
              units={units}
              metrics={metrics}
              activities={activities}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onRefresh={loadInitialData}
            />
          )}

          {activeTab === 'project-status' && (
            <ProjectStatusView
              projects={projects}
              units={units}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
              onRefresh={loadInitialData}
            />
          )}

          {activeTab === 'todo' && (
            <TodoView
              projects={projects}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              projects={projects}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              projects={projects}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
            />
          )}

          {activeTab === 'team' && <TeamView projects={projects} />}

          {activeTab === 'documents' && (
            <DocumentsView
              projects={projects}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
            />
          )}

          {activeTab === 'drawings' && (
            <DrawingsView
              projects={projects}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
            />
          )}

          {activeTab === 'contacts' && <ContactsView />}

          {activeTab === 'contractors' && <ContractorsView projects={projects} />}

          {activeTab === 'activity-logs' && (
            <ActivityLogsView
              projects={projects}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
            />
          )}

          {activeTab === 'reports' && <ReportView />}

          {activeTab === 'accounts' && <AccountsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrandingProvider>
  );
}
