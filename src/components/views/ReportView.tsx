import React, { useState, useEffect } from 'react';
import { CalendarDays, FileDown, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Project,
  ProjectUnit,
  InventoryItem,
  ConstructionDocument,
  ConstructionDrawing,
  ActivityLog,
  DashboardMetrics
} from '../../types';
import { api } from '../../services/api';
import { useBranding } from '../../context/BrandingContext';

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  daily: 'Daily Report',
  weekly: 'Weekly Report',
  monthly: 'Monthly Report'
};

export const ReportView: React.FC = () => {
  const { settings } = useBranding();
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [documents, setDocuments] = useState<ConstructionDocument[]>([]);
  const [drawings, setDrawings] = useState<ConstructionDrawing[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<Date>(new Date());

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [projRes, unitRes, invRes, docRes, drwRes, actRes, dashRes] = await Promise.all([
        api.getProjects(),
        api.getUnits(),
        api.getInventory(),
        api.getDocuments(),
        api.getDrawings(),
        api.getActivities(),
        api.getDashboardSummary()
      ]);
      setProjects(projRes.projects || []);
      setUnits(unitRes.units || []);
      setInventory(invRes.inventory || []);
      setDocuments(docRes.documents || []);
      setDrawings(drwRes.drawings || []);
      setActivities(actRes.activities || []);
      setMetrics(dashRes.metrics || null);
      setGeneratedAt(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Period start boundary for filtering records belonging to the report window
  const getPeriodStart = (): Date => {
    const start = new Date();
    if (period === 'daily') start.setDate(start.getDate() - 1);
    if (period === 'weekly') start.setDate(start.getDate() - 7);
    if (period === 'monthly') start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const periodStart = getPeriodStart();
  const isWithinPeriod = (dateValue?: string) => {
    if (!dateValue) return false;
    const d = new Date(dateValue);
    return !isNaN(d.getTime()) && d >= periodStart;
  };

  const fmtDate = (dateValue?: string) =>
    dateValue
      ? new Date(dateValue).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : '-';

  // Records updated within the reporting window
  const periodUnits = units.filter((u) => isWithinPeriod(u.updatedAt));
  const periodDocuments = documents.filter((d) => isWithinPeriod(d.updatedAt));
  const periodDrawings = drawings.filter((d) => isWithinPeriod(d.updatedAt));
  const periodActivities = activities.filter((a) => isWithinPeriod(a.timestamp));

  const periodLabel =
    period === 'daily'
      ? 'Last 24 Hours'
      : period === 'weekly'
        ? 'Last 7 Days'
        : 'Last 30 Days';

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const company = settings?.companyName || 'ConstructPulse SaaS';

    // ---- Header ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(company, 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(PERIOD_LABELS[period] + ' - Construction Summary', 14, 23);

    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(
      'Reporting Period: ' + periodLabel + ' (' + fmtDate(periodStart.toISOString()) + ' - ' + fmtDate(generatedAt.toISOString()) + ')',
      14,
      29
    );
    doc.text(
      'Generated: ' + generatedAt.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      14,
      33
    );
    doc.setTextColor(0);
    doc.setDrawColor(0, 144, 255);
    doc.setLineWidth(0.6);
    doc.line(14, 36, pageWidth - 14, 36);

    // ---- Section 1: Key Metrics ----
    autoTable(doc, {
      startY: 41,
      head: [['Key Metric', 'Value', 'Key Metric', 'Value']],
      body: [
        ['Site Projects', String(metrics?.totalProjects ?? projects.length), 'Total Units / Blocks', String(metrics?.totalUnits ?? units.length)],
        ['Completed / Handover', String(metrics?.completedUnits ?? '-'), 'In Progress (Ongoing/T&C/Punchlist)', String(metrics?.inProgressUnits ?? '-')],
        ['Overall Completion', (metrics?.overallProgress ?? 0) + '%', 'Total Inventory Qty', String(metrics?.totalInventory ?? inventory.length)],
        ['Inventory Operational', String(metrics?.operationalInventory ?? '-'), 'Inventory Under Maintenance', String(metrics?.maintenanceInventory ?? '-')],
        ['Total Drawings', String(metrics?.totalDrawings ?? drawings.length), 'Approved / Handover Drawings', String(metrics?.approvedDrawings ?? '-')],
        ['Total Documents', String(metrics?.totalDocuments ?? documents.length), 'Approved / Handover Documents', String(metrics?.approvedDocuments ?? '-')],
        ['Total Budget', (settings?.currencySymbol || '') + (metrics?.totalBudget ?? 0).toLocaleString(), 'Total Spent', (settings?.currencySymbol || '') + (metrics?.totalSpent ?? 0).toLocaleString()],
        ['Unit Updates in Period', String(periodUnits.length), 'Activity Records in Period', String(periodActivities.length)]
      ],
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      headStyles: { fillColor: [0, 144, 255], textColor: 255, fontStyle: 'bold' }
    });

    let cursorY = (doc as any).lastAutoTable.finalY + 7;

    // ---- Section 2: Per-Site Project Summary ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Site Project Summary', 14, cursorY);
    cursorY += 2;

    autoTable(doc, {
      startY: cursorY,
      head: [['Site Project', 'Total Units', 'Completed', 'In Progress', 'Budget', 'Spent', 'Status']],
      body: projects.map((p) => {
        const siteUnits = units.filter((u) => u.siteId === p.id);
        const completed = siteUnits.filter((u) => u.status === 'Completed' || u.status === 'Handover').length;
        const inProgress = siteUnits.filter((u) => u.status === 'Ongoing' || u.status === 'T&C' || u.status === 'Punchlist').length;
        return [
          p.name,
          String(siteUnits.length || p.totalUnits),
          String(completed || p.completedUnits),
          String(inProgress),
          (settings?.currencySymbol || '') + (p.budget ?? 0).toLocaleString(),
          (settings?.currencySymbol || '') + (p.spent ?? 0).toLocaleString(),
          p.status
        ];
      }),
      theme: 'striped',
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      headStyles: { fillColor: [25, 28, 36], textColor: 255, fontStyle: 'bold' }
    });

    cursorY = (doc as any).lastAutoTable.finalY + 7;

    // ---- Section 3: Work Executed / Activity in Period ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Work Executed & Site Activity (' + periodLabel + ')', 14, cursorY);
    cursorY += 2;

    const activityRows = periodActivities.slice(0, 20).map((a) => [
      new Date(a.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      a.siteName || 'Unassigned',
      a.action + (a.details ? ' - ' + a.details : ''),
      a.userName
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Date', 'Site', 'Activity', 'Attended By']],
      body: activityRows.length > 0 ? activityRows : [['-', '-', 'No activity recorded for this period', '-']],
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [0, 144, 255], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 2: { cellWidth: 85 } }
    });

    cursorY = (doc as any).lastAutoTable.finalY + 7;

    // ---- Section 4: Documents & Drawings in Period ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Documents & Drawings Updated in Period', 14, cursorY);
    cursorY += 2;

    const docRows: string[][] = [
      ...periodDocuments.map((d) => ['Document', d.siteName, d.documentName, d.status, d.updatedAt]),
      ...periodDrawings.map((d) => ['Drawing', d.siteName, d.drawingTitle + ' (' + d.revision + ')', d.status, d.updatedAt])
    ];

    autoTable(doc, {
      startY: cursorY,
      head: [['Type', 'Site Project', 'Title', 'Status', 'Updated']],
      body: docRows.length > 0 ? docRows : [['-', '-', 'No document or drawing updates in this period', '-', '-']],
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [25, 28, 36], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 2: { cellWidth: 70 } }
    });

    // ---- Footer: page numbers ----
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text(
        company + ' - ' + PERIOD_LABELS[period],
        14,
        doc.internal.pageSize.getHeight() - 7
      );
      doc.text('Page ' + i + ' of ' + pageCount, pageWidth - 14, doc.internal.pageSize.getHeight() - 7, { align: 'right' });
    }

    doc.save(PERIOD_LABELS[period].replace(/\s+/g, '-').toLowerCase() + '-' + generatedAt.toISOString().split('T')[0] + '.pdf');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Construction Reports</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Formatted Daily, Weekly, and Monthly summary of site progress and activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReportData}
            className="inline-flex items-center px-3.5 py-2 bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[#BAC2D1] hover:text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-[#20232C] p-1 rounded-[5px] border border-[#2A2E38]">
          {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 text-xs rounded-[4px] font-medium capitalize transition-colors ${
                period === p ? 'bg-[#0090FF] text-white' : 'text-[#8D93A1] hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#8D93A1]">
          <CalendarDays className="w-3.5 h-3.5 text-[#626875]" />
          <span>
            {PERIOD_LABELS[period]} | {periodLabel}: {fmtDate(periodStart.toISOString())} - {fmtDate(generatedAt.toISOString())}
          </span>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Site Projects', value: metrics?.totalProjects ?? projects.length, accent: 'text-white' },
          { label: 'Overall Completion', value: (metrics?.overallProgress ?? 0) + '%', accent: 'text-[#00D25B]' },
          { label: 'Units in Progress', value: metrics?.inProgressUnits ?? '-', accent: 'text-[#0090FF]' },
          { label: 'Activities in Period', value: periodActivities.length, accent: 'text-[#F6C763]' }
        ].map((tile) => (
          <div key={tile.label} className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4">
            <div className={`text-[22px] font-semibold ${tile.accent}`}>{isLoading ? '...' : tile.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#8D93A1] mt-1">{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Period Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[
          { label: 'Unit Status Updates', count: periodUnits.length },
          { label: 'Documents Updated', count: periodDocuments.length },
          { label: 'Drawings Updated', count: periodDrawings.length }
        ].map((item) => (
          <div key={item.label} className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex items-center justify-between">
            <span className="text-xs text-[#8D93A1]">{item.label}</span>
            <span className="text-[18px] font-semibold text-white">{item.count}</span>
          </div>
        ))}
      </div>

      {/* Activity in Period */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A2E38] bg-[#171A21]">
          <h3 className="text-[13px] font-semibold text-white">Work Executed & Site Activity ({periodLabel})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171A21] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold w-40">Date</th>
                <th className="py-3 px-4 font-semibold">Site</th>
                <th className="py-3 px-4 font-semibold">Activity</th>
                <th className="py-3 px-4 font-semibold">Attended By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {periodActivities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#626875]">
                    No activity recorded for this period.
                  </td>
                </tr>
              ) : (
                periodActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3 px-4 text-[#8D93A1] text-[11px] align-top">
                      {new Date(a.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#BAC2D1] align-top">{a.siteName || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{a.action}</div>
                      <div className="text-[11px] text-[#8D93A1] mt-0.5">{a.details}</div>
                    </td>
                    <td className="py-3 px-4 text-[#0090FF] align-top">{a.userName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Site Project Summary Table */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A2E38] bg-[#171A21]">
          <h3 className="text-[13px] font-semibold text-white">Site Project Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171A21] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold">Site Project</th>
                <th className="py-3 px-4 font-semibold">Total Units</th>
                <th className="py-3 px-4 font-semibold">Completed</th>
                <th className="py-3 px-4 font-semibold">In Progress</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {projects.map((p) => {
                const siteUnits = units.filter((u) => u.siteId === p.id);
                const completed = siteUnits.filter((u) => u.status === 'Completed' || u.status === 'Handover').length;
                const inProgress = siteUnits.filter((u) => u.status === 'Ongoing' || u.status === 'T&C' || u.status === 'Punchlist').length;
                return (
                  <tr key={p.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{p.name}</td>
                    <td className="py-3 px-4 text-[#8D93A1]">{siteUnits.length || p.totalUnits}</td>
                    <td className="py-3 px-4 text-[#00D25B]">{completed || p.completedUnits}</td>
                    <td className="py-3 px-4 text-[#0090FF]">{inProgress}</td>
                    <td className="py-3 px-4 text-[#8D93A1]">{p.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
