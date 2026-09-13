import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Users,
  AlertCircle,
  Edit2,
  Trash2,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';
import { Project, ScheduleItem, ScheduleStatus } from '../../types';
import { api } from '../../services/api';
import { StatusDropdown } from '../common/StatusDropdown';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface ScheduleViewProps {
  projects: Project[];
  selectedSiteId: string;
  setSelectedSiteId: (siteId: string) => void;
}

const SCHEDULE_STATUSES: ScheduleStatus[] = [
  'Scheduled',
  'In Progress',
  'Completed',
  'Postponed',
  'Cancelled'
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId
}) => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    loading: boolean;
  }>({
    isOpen: false,
    id: '',
    title: '',
    loading: false
  });

  // Form states
  const [formSiteId, setFormSiteId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formActivity, setFormActivity] = useState('');
  const [formAttendees, setFormAttendees] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<ScheduleStatus>('Scheduled');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules({
        siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchQuery || undefined
      });
      setSchedules(res.schedules);
    } catch (err: any) {
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [selectedSiteId, selectedStatus, searchQuery]);

  const handleQuickStatusChange = async (item: ScheduleItem, newStatus: string) => {
    try {
      setSchedules((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: newStatus as ScheduleStatus } : s))
      );
      await api.updateSchedule(item.id, {
        status: newStatus as ScheduleStatus
      });
      loadSchedules();
    } catch (err: any) {
      alert(err.message || 'Failed to update schedule status');
      loadSchedules();
    }
  };

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
    setFormDate(today);
    setFormActivity('');
    setFormAttendees('');
    setFormNotes('');
    setFormStatus('Scheduled');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingSchedule(item);
    setFormSiteId(item.siteId);
    setFormDate(item.date);
    setFormActivity(item.activity);
    setFormAttendees(item.attendees || '');
    setFormNotes(item.notes || '');
    setFormStatus(item.status);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiteId || !formDate || !formActivity) {
      setFormError('Please fill out Site, Date, and Activity title');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      await api.createSchedule({
        siteId: formSiteId,
        date: formDate,
        activity: formActivity,
        attendees: formAttendees,
        notes: formNotes,
        status: formStatus
      });
      setIsAddModalOpen(false);
      loadSchedules();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create schedule');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    if (!formSiteId || !formDate || !formActivity) {
      setFormError('Please fill out Site, Date, and Activity title');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      await api.updateSchedule(editingSchedule.id, {
        siteId: formSiteId,
        date: formDate,
        activity: formActivity,
        attendees: formAttendees,
        notes: formNotes,
        status: formStatus
      });
      setIsEditModalOpen(false);
      loadSchedules();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update schedule');
    } finally {
      setFormSubmitting(false);
    }
  };

  const promptDelete = (id: string, activityName: string) => {
    setDeleteModalState({
      isOpen: true,
      id,
      title: activityName,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.id) return;
    try {
      setDeleteModalState((prev) => ({ ...prev, loading: true }));
      await api.deleteSchedule(deleteModalState.id);
      setDeleteModalState({ isOpen: false, id: '', title: '', loading: false });
      loadSchedules();
    } catch (err: any) {
      setDeleteModalState((prev) => ({ ...prev, loading: false }));
      alert(err.message || 'Failed to delete schedule item');
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = schedules.length;
    const scheduled = schedules.filter((s) => s.status === 'Scheduled').length;
    const inProgress = schedules.filter((s) => s.status === 'In Progress').length;
    const completed = schedules.filter((s) => s.status === 'Completed').length;
    const other = schedules.filter(
      (s) => s.status === 'Postponed' || s.status === 'Cancelled'
    ).length;
    return { total, scheduled, inProgress, completed, other };
  }, [schedules]);

  const canManage = !!user;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-wide flex items-center">
            <Calendar className="w-5 h-5 text-[#0090FF] mr-2" />
            Site Schedule & Milestones
          </h2>
          <p className="text-xs text-[#8D93A1]">
            Track planned construction activities, testing & inspections, and key site participant schedules
          </p>
        </div>

        {canManage && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-[#0090FF] hover:bg-[#007cdb] text-white text-xs font-semibold rounded-[4px] shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Schedule Event
          </button>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#8D93A1]">Total Events</div>
          <div className="text-lg font-bold text-white mt-1">{metrics.total}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#0090FF]">Scheduled</div>
          <div className="text-lg font-bold text-[#0090FF] mt-1">{metrics.scheduled}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#FFAB00]">In Progress</div>
          <div className="text-lg font-bold text-[#FFAB00] mt-1">{metrics.inProgress}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#00D25B]">Completed</div>
          <div className="text-lg font-bold text-[#00D25B] mt-1">{metrics.completed}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#8F5FE8]">Postponed / Cancelled</div>
          <div className="text-lg font-bold text-[#8F5FE8] mt-1">{metrics.other}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Site Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#8D93A1] whitespace-nowrap">Site:</span>
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

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#8D93A1] whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[4px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Statuses</option>
              {SCHEDULE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8D93A1]" />
          <input
            type="text"
            placeholder="Search activity, attendees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[4px] focus:outline-none focus:border-[#0090FF] placeholder-[#8D93A1]"
          />
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#20232C] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold">Site</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Activity</th>
                <th className="py-3 px-4 font-semibold">Attendees</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8D93A1]">
                    Loading schedule events...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8D93A1]">
                    No schedule events found. Click &quot;Add Schedule Event&quot; above to create one.
                  </td>
                </tr>
              ) : (
                schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-[#20232C]/50 transition-colors group">
                    {/* Site */}
                    <td className="py-3.5 px-4 font-medium text-[#BAC2D1]">
                      {item.siteName}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#20232C] border border-[#2A2E38] text-white">
                        <Calendar className="w-3 h-3 text-[#0090FF] mr-1.5" />
                        {item.date}
                      </span>
                    </td>

                    {/* Activity */}
                    <td className="py-3.5 px-4 text-white max-w-[280px]">
                      <div className="font-medium leading-relaxed">{item.activity}</div>
                    </td>

                    {/* Attendees */}
                    <td className="py-3.5 px-4 text-[#8D93A1] max-w-[220px]">
                      {item.attendees ? (
                        <div className="flex items-start space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-[#8D93A1] shrink-0 mt-0.5" />
                          <span className="text-[11px] line-clamp-2">{item.attendees}</span>
                        </div>
                      ) : (
                        <span className="italic text-[#626875]">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-[#8D93A1] max-w-[220px] text-[11px]">
                      {item.notes ? (
                        <p className="line-clamp-2 leading-snug">{item.notes}</p>
                      ) : (
                        <span className="italic text-[#626875]">—</span>
                      )}
                    </td>

                    {/* Status with Interactive Dropdown */}
                    <td className="py-3.5 px-4">
                      <StatusDropdown
                        currentStatus={item.status}
                        options={SCHEDULE_STATUSES}
                        onStatusChange={(newStatus) => handleQuickStatusChange(item, newStatus)}
                        disabled={!user}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF] transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDelete(item.id, item.activity)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Construction Schedule Event"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
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

          {/* Date */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Event / Activity Date *</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Activity */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Activity Description *</label>
            <input
              type="text"
              value={formActivity}
              onChange={(e) => setFormActivity(e.target.value)}
              placeholder="e.g. Ready-Mix Concrete Pouring, BFP Inspection..."
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Attendees / Personnel</label>
            <input
              type="text"
              value={formAttendees}
              onChange={(e) => setFormAttendees(e.target.value)}
              placeholder="e.g. Engr. David Ramos, Concreting Crew Alpha, QA Inspector"
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as ScheduleStatus)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            >
              {SCHEDULE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Operational Notes / Requirements</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Testing parameters, equipment needed, safety precautions..."
              rows={3}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-[#20232C] hover:bg-[#2A2E38] text-white text-xs rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-[#0090FF] hover:bg-[#007cdb] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Add Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Schedule Event"
      >
        <form onSubmit={handleUpdateSchedule} className="space-y-4">
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

          {/* Date */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Event / Activity Date *</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Activity */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Activity Description *</label>
            <input
              type="text"
              value={formActivity}
              onChange={(e) => setFormActivity(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Attendees / Personnel</label>
            <input
              type="text"
              value={formAttendees}
              onChange={(e) => setFormAttendees(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as ScheduleStatus)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            >
              {SCHEDULE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Operational Notes / Requirements</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-[#20232C] hover:bg-[#2A2E38] text-white text-xs rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-[#0090FF] hover:bg-[#007cdb] text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', title: '', loading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Schedule Event"
        message="Are you sure you want to delete this scheduled milestone or activity?"
        itemName={deleteModalState.title}
        isLoading={deleteModalState.loading}
      />
    </div>
  );
};
