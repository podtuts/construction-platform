import React, { useState, useEffect } from 'react';
import { History, Search, Download, Plus, AlertCircle, ClipboardPen } from 'lucide-react';
import { ActivityLog, Project } from '../../types';
import { api } from '../../services/api';
import { downloadCSV } from '../../services/export';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

interface ActivityLogsViewProps {
  projects: Project[];
  selectedSiteId: string;
  setSelectedSiteId: (siteId: string) => void;
}

// Manual daily site happenings - Activity Logs are recorded by hand only
// (never written automatically by the system)
const ACTIVITY_CATEGORIES = [
  'General',
  'Site Inspection',
  'Weather',
  'Deliveries',
  'Government Audit',
  'Safety',
  'Other'
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Activity modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSiteId, setFormSiteId] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formDetails, setFormDetails] = useState('');
  const [formAttendedBy, setFormAttendedBy] = useState('');
  const [formDateTime, setFormDateTime] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadActivities = async () => {
    try {
      const res = await api.getActivities();
      setActivities(res.activities || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const openAddModal = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
    setFormAction('');
    setFormCategory('General');
    setFormDetails('');
    setFormAttendedBy(user?.fullName || '');
    setFormDateTime(localNow);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiteId || !formAction.trim() || !formDateTime) {
      setFormError('Please fill out Site, Date & Time, and Activity title');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      await api.createActivity({
        siteId: formSiteId,
        action: formAction.trim(),
        category: formCategory,
        details: formDetails.trim(),
        userName: formAttendedBy.trim(),
        timestamp: new Date(formDateTime).toISOString()
      });
      setIsAddModalOpen(false);
      loadActivities();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record activity');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredActivities = activities.filter((a) => {
    const matchSite = selectedSiteId === 'all' || a.siteId === selectedSiteId;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      a.action.toLowerCase().includes(q) ||
      (a.details || '').toLowerCase().includes(q) ||
      (a.userName || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q) ||
      (a.siteName || '').toLowerCase().includes(q);
    return matchSite && matchSearch;
  });

  const handleDownloadCSV = () => {
    downloadCSV(
      'activity-logs-' + new Date().toISOString().split('T')[0] + '.csv',
      ['Date', 'Site', 'Activity', 'Details', 'Attended By'],
      filteredActivities.map((a) => [
        formatDateTime(a.timestamp),
        a.siteName || 'Unassigned',
        a.action,
        a.details,
        a.userName
      ])
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Activity Logs</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Manual daily site records — e.g. joint site inspections, heavy rains pausing construction,
            deliveries, government engineer audits. Latest {activities.length} record{activities.length === 1 ? '' : 's'} (display capped at 50 most recent)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#007cdb] text-white text-xs font-semibold rounded-[5px] shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Activity</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center px-3.5 py-2 bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[#BAC2D1] hover:text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[#8D93A1]">
            {filteredActivities.length} of {activities.length} records
          </span>

          {/* Site Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[#8D93A1] whitespace-nowrap">Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Sites</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity, site, or attendee..."
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#0090FF] placeholder-[#626875]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171A21] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold w-44">Date</th>
                <th className="py-3 px-4 font-semibold w-56">Site</th>
                <th className="py-3 px-4 font-semibold">Activity</th>
                <th className="py-3 px-4 font-semibold">Attended By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#626875]">
                    No activity records found for this query. Use "Add Activity" to manually record daily
                    site happenings such as joint site inspections, weather interruptions, deliveries, or
                    government engineer audits.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 text-[#8D93A1] text-[11px] align-top">
                      {formatDateTime(a.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start space-x-2">
                        <ClipboardPen className="w-3.5 h-3.5 text-[#626875] mt-0.5 shrink-0" />
                        <span className="font-medium text-[#BAC2D1]">{a.siteName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-start space-x-2">
                        <History className="w-3.5 h-3.5 text-[#0090FF] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-white">{a.action}</div>
                          <div className="text-[11px] text-[#8D93A1] mt-0.5">{a.details}</div>
                          <div className="text-[10px] text-[#626875] mt-1 inline-block px-1.5 py-0.5 rounded bg-[#20232C] border border-[#2A2E38]">
                            {a.category || 'General'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#0090FF] align-top">{a.userName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Site Activity"
        subtitle="Manually log daily happenings on site — Activity Logs are never recorded automatically"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] rounded text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {formError}
            </div>
          )}

          {/* Site */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Construction Site *</label>
            <select
              value={formSiteId}
              onChange={(e) => setFormSiteId(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={formDateTime}
              onChange={(e) => setFormDateTime(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Activity Title */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Activity Title *</label>
            <input
              type="text"
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              placeholder="e.g. Joint Site Inspection, Heavy Rains Paused Construction, Government Engineer Audit"
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF] placeholder-[#626875]"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            >
              {ACTIVITY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Details</label>
            <textarea
              value={formDetails}
              onChange={(e) => setFormDetails(e.target.value)}
              rows={3}
              placeholder="Describe what happened on site..."
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF] placeholder-[#626875] resize-none"
            />
          </div>

          {/* Attended By */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Attended By</label>
            <input
              type="text"
              value={formAttendedBy}
              onChange={(e) => setFormAttendedBy(e.target.value)}
              placeholder="Name of person who attended / recorded the event"
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF] placeholder-[#626875]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[#BAC2D1] hover:text-white text-xs font-medium rounded-[4px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-[#0090FF] hover:bg-[#0080E0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-[4px] transition-colors"
            >
              {formSubmitting ? 'Recording...' : 'Record Activity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
