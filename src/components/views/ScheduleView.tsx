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
  CheckCircle2,
  ChevronLeft,
  ChevronRight
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

const STATUS_COLORS: Record<ScheduleStatus, string> = {
  'Scheduled': '#0090FF',
  'In Progress': '#FFAB00',
  'Completed': '#00C853',
  'Postponed': '#8D93A1',
  'Cancelled': '#FC424A'
};

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatTime12h = (t?: string) => {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr || '0', 10);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${(mStr || '00').padStart(2, '0')} ${suffix}`;
};

const formatTimeRange = (start?: string, end?: string) => {
  if (start && end) return `${formatTime12h(start)} - ${formatTime12h(end)}`;
  if (start) return formatTime12h(start);
  return '';
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId
}) => {
  const { user } = useAuth();
  const isSuperuser = user?.role === 'superuser';

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const todayKey = toDateKey(new Date());
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
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
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

  const openAddModal = (presetDate?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
    setFormDate(presetDate || selectedDate || today);
    setFormStartTime('08:00');
    setFormEndTime('09:00');
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
    setFormStartTime(item.startTime || '08:00');
    setFormEndTime(item.endTime || '09:00');
    setFormActivity(item.activity);
    setFormAttendees(item.attendees || '');
    setFormNotes(item.notes || '');
    setFormStatus(item.status);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiteId || !formDate || !formStartTime || !formEndTime || !formActivity) {
      setFormError('Please fill out Site, Date, Start Time, End Time, and Activity title');
      return;
    }
    if (formStartTime && formEndTime && formEndTime <= formStartTime) {
      setFormError('End time must be after start time');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      await api.createSchedule({
        siteId: formSiteId,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
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
    if (!formSiteId || !formDate || !formStartTime || !formEndTime || !formActivity) {
      setFormError('Please fill out Site, Date, Start Time, End Time, and Activity title');
      return;
    }
    if (formStartTime && formEndTime && formEndTime <= formStartTime) {
      setFormError('End time must be after start time');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      await api.updateSchedule(editingSchedule.id, {
        siteId: formSiteId,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
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

  // ---- Calendar helpers ----
  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    schedules.forEach((s) => {
      if (!s.date) return;
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "") || a.activity.localeCompare(b.activity))
    );
    return map;
  }, [schedules]);

  const monthCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const selectedDayEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];
  const monthEventCount = monthCells.reduce(
    (n, d) => n + (d ? (eventsByDate[toDateKey(d)]?.length || 0) : 0),
    0
  );

  const goToMonth = (delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(toDateKey(now));
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
            onClick={() => openAddModal()}
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

      {/* Calendar + Agenda */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[10px] p-4 sm:p-5">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToMonth(-1)}
              className="p-2 rounded-[6px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-white transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 rounded-[6px] bg-[#20232C] hover:bg-[#2A2E38] text-[#BAC2D1] hover:text-white text-xs transition-colors"
              title="Jump to today"
            >
              Today
            </button>
            <button
              onClick={() => goToMonth(1)}
              className="p-2 rounded-[6px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-white transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="ml-1">
              <h3 className="text-[16px] font-semibold text-white leading-tight">{monthLabel}</h3>
              <p className="text-[11px] text-[#626875] mt-0.5">
                {monthEventCount} {monthEventCount === 1 ? 'event' : 'events'} this month
              </p>
            </div>
          </div>
          <button
            onClick={() => openAddModal(selectedDate)}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors shadow-sm self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Schedule</span>
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-5">
          {/* Month grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="text-center text-[10px] uppercase tracking-wider text-[#626875] font-medium py-1">
                  {d}
                </div>
              ))}
            </div>
            {loading ? (
              <div className="text-center py-10 text-[12px] text-[#8D93A1]">Loading construction schedules...</div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {monthCells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="min-h-[92px] rounded-[6px]" />;
                  const key = toDateKey(day);
                  const dayEvents = eventsByDate[key] || [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDate;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(key)}
                      onDoubleClick={() => openAddModal(key)}
                      className={`min-h-[92px] rounded-[6px] border p-1.5 text-left transition-colors flex flex-col gap-1 overflow-hidden ${isSelected
                        ? 'border-[#0090FF] bg-[#0090FF]/10'
                        : 'border-[#2A2E38] bg-[#14171D] hover:border-[#0090FF]/50'
                        }`}
                      title={`${dayEvents.length} event(s) — double-click to add`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium ${isToday ? 'bg-[#0090FF] text-white' : 'text-[#8D93A1]'
                          }`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="flex-col gap-1 overflow-hidden hidden sm:flex">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className="truncate text-[10px] leading-tight px-1.5 py-0.5 rounded-[3px] text-white"
                            style={{ backgroundColor: `${STATUS_COLORS[ev.status]}33`, borderLeft: `2px solid ${STATUS_COLORS[ev.status]}` }}
                            title={formatTimeRange(ev.startTime, ev.endTime) ? `${formatTimeRange(ev.startTime, ev.endTime)} - ${ev.activity}` : ev.activity}
                          >
                            {formatTime12h(ev.startTime) ? `${formatTime12h(ev.startTime)} ` : ''}{ev.activity}
                          </span>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-[#626875] px-1">+{dayEvents.length - 3} more</span>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 px-0.5 sm:hidden">
                          {dayEvents.slice(0, 4).map((ev) => (
                            <span key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[ev.status] }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4">
              {SCHEDULE_STATUSES.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-[11px] text-[#8D93A1]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Selected day agenda */}
          <div className="w-full xl:w-[340px] shrink-0 bg-[#14171D] border border-[#2A2E38] rounded-[8px] p-4 self-start">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[13px] font-semibold text-white">
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                  : 'Select a day'}
              </h4>
              <button
                onClick={() => openAddModal(selectedDate)}
                className="inline-flex items-center text-[11px] text-[#0090FF] hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </button>
            </div>
            <p className="text-[11px] text-[#626875] mb-3">
              {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'} scheduled
              {selectedSiteId !== 'all' && projects.find((p) => p.id === selectedSiteId)
                ? ` — ${projects.find((p) => p.id === selectedSiteId)?.name}`
                : ''}
            </p>
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-6">
                <CalendarCheck className="w-8 h-8 text-[#626875] mx-auto mb-2" />
                <p className="text-[12px] text-[#8D93A1]">No events on this day.</p>
                <p className="text-[11px] text-[#626875] mt-1">Click Add or double-click a date to schedule.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-0.5">
                {selectedDayEvents.map((item) => (
                  <div key={item.id} className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3 hover:border-[#0090FF]/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-[12px] font-medium text-white leading-snug flex-1">{item.activity}</h5>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: STATUS_COLORS[item.status] }}
                        title={item.status}
                      />
                    </div>
                    <div className="flex flex-col gap-1 mt-1.5 text-[11px] text-[#8D93A1]">
                      <span className="font-medium text-[#BAC2D1]">{item.siteName}</span>
                      {formatTimeRange(item.startTime, item.endTime) && (
                        <span className="inline-flex items-center font-medium text-white">
                          <Calendar className="w-3 h-3 mr-1.5 text-[#626875]" />
                          {formatTimeRange(item.startTime, item.endTime)}
                        </span>
                      )}
                      {item.attendees && (
                        <span className="inline-flex items-center">
                          <Users className="w-3 h-3 mr-1.5 text-[#626875]" />
                          {item.attendees}
                        </span>
                      )}
                      {item.notes && (
                        <span className="inline-flex items-start">
                          <Clock className="w-3 h-3 mr-1.5 mt-0.5 text-[#626875] shrink-0" />
                          <span className="line-clamp-2 leading-snug">{item.notes}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-[#2A2E38]">
                      <StatusDropdown
                        currentStatus={item.status}
                        options={SCHEDULE_STATUSES}
                        onStatusChange={(newStatus) => handleQuickStatusChange(item, newStatus)}
                        disabled={!user}
                      />
                      <div className="flex items-center gap-1.5">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

          {/* Meeting Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Start Time *</label>
              <input
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">End Time *</label>
              <input
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                min={formStartTime || undefined}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
                required
              />
            </div>
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

          {/* Meeting Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Start Time *</label>
              <input
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">End Time *</label>
              <input
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                min={formStartTime || undefined}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
                required
              />
            </div>
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
