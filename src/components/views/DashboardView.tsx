import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  FileText,
  Boxes,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Project, ProjectUnit, DashboardMetrics, ActivityLog } from '../../types';
import { useBranding } from '../../context/BrandingContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardViewProps {
  projects: Project[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  units: ProjectUnit[];
  metrics: DashboardMetrics | null;
  activities: ActivityLog[];
  onNavigateTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId,
  units,
  metrics,
  activities,
  onNavigateTab
}) => {
  const { settings } = useBranding();
  const [activeSiteMapModal, setActiveSiteMapModal] = useState(false);

  // Active project selection
  const currentProject =
    selectedSiteId !== 'all'
      ? projects.find((p) => p.id === selectedSiteId) || projects[0]
      : projects[0];

  // Filtered units for the selected site or all
  const displayUnits =
    selectedSiteId !== 'all'
      ? units.filter((u) => u.siteId === selectedSiteId)
      : units;

  const totalUnitsCount = displayUnits.length;
  const completedCount = displayUnits.filter(
    (u) => u.status === 'Completed' || u.status === 'Handover'
  ).length;
  const progressPercent =
    totalUnitsCount > 0 ? Math.round((completedCount / totalUnitsCount) * 100) : 0;

  // System Progress chart data
  const systems = ['Civil', 'Electrical', 'Mechanical', 'ELV', 'HVAC', 'Units', 'Exterior'];
  const systemChartData = systems.map((sys) => {
    const sysUnits = displayUnits.filter((u) => u.system === sys);
    const avgProgress =
      sysUnits.length > 0
        ? Math.round(sysUnits.reduce((acc, u) => acc + u.progress, 0) / sysUnits.length)
        : Math.floor(Math.random() * 30 + 55); // Fallback representative progress
    return {
      system: sys,
      progress: avgProgress,
      count: sysUnits.length
    };
  });

  // Status Distribution data
  const statusCounts = [
    { name: 'Completed', value: displayUnits.filter((u) => u.status === 'Completed').length, color: '#00D25B' },
    { name: 'Handover', value: displayUnits.filter((u) => u.status === 'Handover').length, color: '#00E5FF' },
    { name: 'Punchlist', value: displayUnits.filter((u) => u.status === 'Punchlist').length, color: '#8F5FE8' },
    { name: 'T&C', value: displayUnits.filter((u) => u.status === 'T&C').length, color: '#FFAB00' },
    { name: 'Ongoing', value: displayUnits.filter((u) => u.status === 'Ongoing').length, color: '#0090FF' },
    { name: 'Planning', value: displayUnits.filter((u) => u.status === 'Planning').length, color: '#626875' }
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO BANNER: Project Image, Location, Site Map, Completed Units, Target Date */}
      <div className="relative bg-[#191C24] border border-[#2A2E38] rounded-[10px] overflow-hidden">
        <div className="relative h-64 md:h-72 w-full overflow-hidden">
          <img
            src={settings.dashboardBannerUrl || currentProject?.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=1200&auto=format&fit=crop&q=80'}
            alt={settings.dashboardBannerUrl ? 'Company Banner' : currentProject?.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-[0.45] transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#191C24] via-[#191C24]/60 to-transparent" />

          {/* Site Selector Pills on Top */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center space-x-2 bg-[#0B0F14]/80 backdrop-blur-md p-1 rounded-[6px] border border-[#2A2E38]">
              <span className="text-[11px] font-semibold text-[#8D93A1] uppercase px-2">Select Site:</span>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedSiteId(p.id)}
                  className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-all ${
                    selectedSiteId === p.id
                      ? 'bg-[#0090FF] text-white shadow-md'
                      : 'text-[#8D93A1] hover:text-white hover:bg-[#20232C]'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
              <button
                onClick={() => setSelectedSiteId('all')}
                className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-all ${
                  selectedSiteId === 'all'
                    ? 'bg-[#0090FF] text-white shadow-md'
                    : 'text-[#8D93A1] hover:text-white hover:bg-[#20232C]'
                }`}
              >
                All (4 Sites)
              </button>
            </div>

            <button
              onClick={() => setActiveSiteMapModal(!activeSiteMapModal)}
              className="bg-[#0B0F14]/90 hover:bg-[#20232C] text-white border border-[#2A2E38] px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#0090FF]" />
              <span>{activeSiteMapModal ? 'Hide Site Map' : 'View Site Map / Master Plan'}</span>
            </button>
          </div>

          {/* Project Details Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 z-10">
            <div className="max-w-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-[#0090FF]/20 text-[#0090FF] border border-[#0090FF]/30 text-[11px] font-medium px-2 py-0.5 rounded-[4px]">
                  {currentProject?.projectType}
                </span>
                <span className="text-[#8D93A1] text-xs flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#FC424A]" />
                  {currentProject?.location}
                </span>
              </div>
              <h2 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight leading-tight">
                {currentProject?.name}
              </h2>
              <p className="text-[13px] text-[#8D93A1] mt-1 line-clamp-2">
                {currentProject?.description}
              </p>
            </div>

            {/* Quick KPI stats in hero */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Completed Units */}
              <div className="bg-[#0B0F14]/90 border border-[#2A2E38] rounded-[8px] p-3 text-center min-w-[130px]">
                <div className="text-[11px] font-medium text-[#8D93A1] uppercase tracking-wider">
                  Completed Units
                </div>
                <div className="text-[22px] font-bold text-white mt-0.5">
                  <span className="text-[#00D25B]">{completedCount}</span>
                  <span className="text-[#626875] text-base"> / {totalUnitsCount}</span>
                </div>
                <div className="w-full bg-[#20232C] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#00D25B] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Target Completion Date */}
              <div className="bg-[#0B0F14]/90 border border-[#2A2E38] rounded-[8px] p-3 text-center min-w-[130px]">
                <div className="text-[11px] font-medium text-[#8D93A1] uppercase tracking-wider">
                  Target Date
                </div>
                <div className="text-[15px] font-bold text-white mt-1.5 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#0090FF] mr-1.5" />
                  {currentProject?.targetCompletionDate
                    ? new Date(currentProject.targetCompletionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Nov 30, 2026'}
                </div>
                <div className="text-[11px] text-[#FFAB00] mt-1 font-medium">On Schedule</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Site Map Blueprint Section */}
        {activeSiteMapModal && (
          <div className="p-5 border-t border-[#2A2E38] bg-[#171A21] animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-[14px] font-semibold text-white">
                  Interactive Site Master Plan Blueprint - {currentProject?.name}
                </h4>
                <p className="text-[12px] text-[#8D93A1]">
                  Geographic plot, layout of units, pumps, security CCTV, and access loop.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('drawings')}
                className="text-xs text-[#0090FF] hover:underline flex items-center"
              >
                Browse System Drawings <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="relative rounded-[8px] overflow-hidden border border-[#2A2E38] bg-[#0B0F14] h-64">
              <img
                src={currentProject?.siteMapUrl || 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?w=800&auto=format&fit=crop&q=80'}
                alt="Site Map"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                <div className="bg-[#191C24]/90 border border-[#2A2E38] p-4 rounded-[8px] max-w-md text-center">
                  <p className="text-xs font-medium text-white mb-2">Unit Markers & Infrastructure</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {displayUnits.slice(0, 6).map((u) => (
                      <span
                        key={u.id}
                        onClick={() => onNavigateTab('project-status')}
                        className="cursor-pointer bg-[#20232C] hover:bg-[#0090FF]/20 border border-[#2A2E38] text-[11px] px-2 py-1 rounded text-white"
                      >
                        📍 {u.unitId} ({u.progress}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. STATISTIC / KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Construction Progress"
          value={`${progressPercent}%`}
          trend={{ value: '+4.2% this month', isPositive: true, label: 'vs last cycle' }}
          icon={TrendingUp}
          iconColor="blue"
        />

        <StatCard
          title="Completed / Turnover Units"
          value={`${completedCount} Units`}
          subtitle={`Out of ${totalUnitsCount} active units`}
          trend={{ value: `${totalUnitsCount - completedCount} in queue`, isPositive: true }}
          icon={CheckCircle2}
          iconColor="green"
        />

        <StatCard
          title="Equipment & Machinery"
          value={metrics?.totalInventory || 10}
          subtitle={`${metrics?.operationalInventory || 9} operational`}
          trend={{ value: '1 maintenance', isPositive: false, label: 'requires check' }}
          icon={Boxes}
          iconColor="yellow"
        />

        <StatCard
          title="Drawings & Approvals"
          value={`${metrics?.approvedDrawings || 9} / ${metrics?.totalDrawings || 13}`}
          subtitle="Engineering sign-offs"
          trend={{ value: '100% compliant', isPositive: true }}
          icon={Layers}
          iconColor="purple"
        />
      </div>

      {/* 3. CHARTS ROW: System Progress & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Progress Bar Chart */}
        <div className="lg:col-span-2 bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-medium text-white">Construction Progress by System</h3>
              <p className="text-[12px] text-[#8D93A1]">
                Civil, Electrical, Mechanical, ELV, HVAC, Units, and Exterior progress
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('project-status')}
              className="text-xs text-[#0090FF] hover:underline flex items-center"
            >
              Full Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={systemChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="system"
                  tick={{ fill: '#8D93A1', fontSize: 11 }}
                  axisLine={{ stroke: '#2A2E38' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#8D93A1', fontSize: 11 }}
                  axisLine={{ stroke: '#2A2E38' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#191C24',
                    borderColor: '#2A2E38',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#FFF'
                  }}
                  formatter={(val: any) => [`${val}% Progress`, 'Completion']}
                />
                <Bar dataKey="progress" fill="#0090FF" radius={[4, 4, 0, 0]} barSize={28}>
                  {systemChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.progress === 100 ? '#00D25B' : entry.progress >= 70 ? '#0090FF' : '#FFAB00'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unit Status Breakdown Doughnut Chart */}
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-white">Unit Status Breakdown</h3>
            <p className="text-[12px] text-[#8D93A1]">Lifecycle stages across active sites</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusCounts.map((entry, idx) => (
                    <Cell key={`slice-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#191C24',
                    borderColor: '#2A2E38',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#FFF'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#2A2E38]/60">
            {statusCounts.map((s) => (
              <div key={s.name} className="flex items-center justify-between px-1.5 py-0.5">
                <span className="flex items-center text-[#8D93A1]">
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: Unit Status Quick Matrix & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Status Quick Matrix */}
        <div className="lg:col-span-2 bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-medium text-white">
                Project Units Overview ({currentProject?.name})
              </h3>
              <p className="text-[12px] text-[#8D93A1]">
                Site units, progress bars, and operational status
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('project-status')}
              className="px-3 py-1.5 bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-white text-xs font-medium rounded-[4px] transition-colors"
            >
              Manage Units
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
                <tr>
                  <th className="pb-2.5 font-semibold">Unit Id</th>
                  <th className="pb-2.5 font-semibold">Model / Specs</th>
                  <th className="pb-2.5 font-semibold">System</th>
                  <th className="pb-2.5 font-semibold">Progress</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2E38]/60 text-white">
                {displayUnits.slice(0, 6).map((unit) => (
                  <tr key={unit.id} className="hover:bg-[#20232C]/50 transition-colors">
                    <td className="py-3 font-medium text-[#0090FF]">{unit.unitId}</td>
                    <td className="py-3 text-[#8D93A1] max-w-[180px] truncate">{unit.model}</td>
                    <td className="py-3">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#20232C] border border-[#2A2E38] text-[#8D93A1]">
                        {unit.system || 'Units'}
                      </span>
                    </td>
                    <td className="py-3 w-36">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-[#20232C] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              unit.progress === 100
                                ? 'bg-[#00D25B]'
                                : unit.progress >= 70
                                ? 'bg-[#0090FF]'
                                : 'bg-[#FFAB00]'
                            }`}
                            style={{ width: `${unit.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#8D93A1] w-8 text-right">
                          {unit.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={unit.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vertical Activity Timeline - Project Status changes only */}
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-medium text-white flex items-center">
                <Activity className="w-4 h-4 text-[#0090FF] mr-2" />
                Site Activity Feed
              </h3>
              <p className="text-[11px] text-[#8D93A1]">Project Status transitions</p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00D25B]/10 border border-[#00D25B]/30 text-[#00D25B] font-mono">
              PROJECT STATUS
            </span>
          </div>

          {(() => {
            const statusActivities = activities.filter(
              (act) =>
                act.category === 'Project Status' ||
                act.category === 'Status' ||
                act.action.toLowerCase().includes('status')
            );

            if (statusActivities.length === 0) {
              return (
                <div className="py-8 text-center text-xs text-[#8D93A1]">
                  No project status changes recorded yet.
                </div>
              );
            }

            return (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#2A2E38]">
                {statusActivities.slice(0, 6).map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0090FF] ring-4 ring-[#191C24]" />
                    <div className="text-[13px] font-medium text-white">{act.action}</div>
                    <p className="text-[12px] text-[#8D93A1] mt-0.5 leading-snug">{act.details}</p>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-[#626875]">
                      <span className="text-[#BAC2D1]">{act.userName}</span>
                      <span>•</span>
                      <span>
                        {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
