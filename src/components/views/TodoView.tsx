import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { Project, TodoItem, TodoStatus, TeamMember } from '../../types';
import { api } from '../../services/api';
import { StatusDropdown } from '../common/StatusDropdown';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface TodoViewProps {
  projects: Project[];
  selectedSiteId: string;
  setSelectedSiteId: (siteId: string) => void;
}

const TODO_STATUSES: TodoStatus[] = ['Pending', 'In Progress', 'Completed', 'Delayed'];

export const TodoView: React.FC<TodoViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId
}) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    loading: boolean;
    error?: string;
  }>({
    isOpen: false,
    id: '',
    title: '',
    loading: false,
    error: ''
  });

  // Form states
  const [formSiteId, setFormSiteId] = useState('');
  const [formDateAssigned, setFormDateAssigned] = useState('');
  const [formName, setFormName] = useState('');
  const [formTask, setFormTask] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<TodoStatus>('Pending');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [todosRes, teamRes] = await Promise.all([
        api.getTodos({
          siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search: searchQuery || undefined
        }),
        api.getTeam()
      ]);
      setTodos(todosRes.todos);
      setTeam(teamRes.team);
    } catch (err: any) {
      console.error('Failed to load to-do data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, selectedStatus, searchQuery]);

  const handleQuickStatusChange = async (todo: TodoItem, newStatus: string) => {
    try {
      // Optimistic update
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus as TodoStatus } : t))
      );
      await api.updateTodo(todo.id, {
        status: newStatus as TodoStatus
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
      loadData();
    }
  };

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
    setFormDateAssigned(today);
    setFormName('');
    setFormTask('');
    setFormDueDate(defaultDueDate);
    setFormNotes('');
    setFormStatus('Pending');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setFormSiteId(todo.siteId);
    setFormDateAssigned(todo.dateAssigned);
    setFormName(todo.name);
    setFormTask(todo.task);
    setFormDueDate(todo.dueDate);
    setFormNotes(todo.notes || '');
    setFormStatus(todo.status);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiteId || !formName || !formTask) {
      setFormError('Please fill out Site, Staff Name, and Task description');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      await api.createTodo({
        siteId: formSiteId,
        dateAssigned: formDateAssigned,
        name: formName,
        task: formTask,
        dueDate: formDueDate,
        notes: formNotes,
        status: formStatus
      });
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to assign task');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;
    if (!formSiteId || !formName || !formTask) {
      setFormError('Please fill out Site, Staff Name, and Task description');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      await api.updateTodo(editingTodo.id, {
        siteId: formSiteId,
        dateAssigned: formDateAssigned,
        name: formName,
        task: formTask,
        dueDate: formDueDate,
        notes: formNotes,
        status: formStatus
      });
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update task');
    } finally {
      setFormSubmitting(false);
    }
  };

  const promptDelete = (id: string, taskTitle: string) => {
    setDeleteModalState({
      isOpen: true,
      id,
      title: taskTitle,
      loading: false,
      error: ''
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.id) return;
    const targetId = deleteModalState.id;
    try {
      setDeleteModalState((prev) => ({ ...prev, loading: true, error: '' }));
      // Optimistic delete
      setTodos((prev) => prev.filter((t) => t.id !== targetId));
      await api.deleteTodo(targetId);
      setDeleteModalState({ isOpen: false, id: '', title: '', loading: false, error: '' });
      loadData();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete task'
      }));
      loadData();
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = todos.length;
    const inProgress = todos.filter((t) => t.status === 'In Progress').length;
    const pending = todos.filter((t) => t.status === 'Pending').length;
    const completed = todos.filter((t) => t.status === 'Completed').length;
    const delayed = todos.filter((t) => t.status === 'Delayed').length;
    return { total, inProgress, pending, completed, delayed };
  }, [todos]);

  const canManage = !!user;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-wide flex items-center">
            <ListTodo className="w-5 h-5 text-[#0090FF] mr-2" />
            Staff Task Assignment (To Do)
          </h2>
          <p className="text-xs text-[#8D93A1]">
            Assign operational construction and field tasks to engineering staff with live status tracking
          </p>
        </div>

        {canManage && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-[#0090FF] hover:bg-[#007cdb] text-white text-xs font-semibold rounded-[4px] shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Assign New Task
          </button>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#8D93A1]">Total Assigned</div>
          <div className="text-lg font-bold text-white mt-1">{metrics.total}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#0090FF]">In Progress</div>
          <div className="text-lg font-bold text-[#0090FF] mt-1">{metrics.inProgress}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#FFAB00]">Pending</div>
          <div className="text-lg font-bold text-[#FFAB00] mt-1">{metrics.pending}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#00D25B]">Completed</div>
          <div className="text-lg font-bold text-[#00D25B] mt-1">{metrics.completed}</div>
        </div>
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[6px] p-3">
          <div className="text-[11px] text-[#8F5FE8]">Delayed</div>
          <div className="text-lg font-bold text-[#8F5FE8] mt-1">{metrics.delayed}</div>
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
              {TODO_STATUSES.map((s) => (
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
            placeholder="Search task, staff, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[4px] focus:outline-none focus:border-[#0090FF] placeholder-[#8D93A1]"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#20232C] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold">Site</th>
                <th className="py-3 px-4 font-semibold">Date Assigned</th>
                <th className="py-3 px-4 font-semibold">Staff Name</th>
                <th className="py-3 px-4 font-semibold">Task</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#8D93A1]">
                    Loading to-do tasks...
                  </td>
                </tr>
              ) : todos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#8D93A1]">
                    No tasks found. Click &quot;Assign New Task&quot; above to add one.
                  </td>
                </tr>
              ) : (
                todos.map((todo) => (
                  <tr key={todo.id} className="hover:bg-[#20232C]/50 transition-colors group">
                    {/* Site */}
                    <td className="py-3.5 px-4 font-medium text-[#BAC2D1]">
                      {todo.siteName}
                    </td>

                    {/* Date Assigned */}
                    <td className="py-3.5 px-4 text-[#8D93A1] font-mono text-[11px] whitespace-nowrap">
                      {todo.dateAssigned}
                    </td>

                    {/* Staff Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-[#0090FF]/20 border border-[#0090FF]/40 text-[#0090FF] flex items-center justify-center text-[10px] font-bold">
                          {todo.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <span className="font-medium text-white">{todo.name}</span>
                      </div>
                    </td>

                    {/* Task */}
                    <td className="py-3.5 px-4 text-white max-w-[280px]">
                      <div className="font-medium leading-relaxed">{todo.task}</div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 text-[#8D93A1] font-mono text-[11px] whitespace-nowrap">
                      <span className="inline-flex items-center text-[#BAC2D1]">
                        <Calendar className="w-3 h-3 text-[#8D93A1] mr-1" />
                        {todo.dueDate}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-[#8D93A1] max-w-[220px] text-[11px]">
                      {todo.notes ? (
                        <p className="line-clamp-2 leading-snug">{todo.notes}</p>
                      ) : (
                        <span className="italic text-[#626875]">—</span>
                      )}
                    </td>

                    {/* Status with Interactive Dropdown */}
                    <td className="py-3.5 px-4">
                      <StatusDropdown
                        currentStatus={todo.status}
                        options={TODO_STATUSES}
                        onStatusChange={(newStatus) => handleQuickStatusChange(todo, newStatus)}
                        disabled={!user}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(todo)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF] transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDelete(todo.id, todo.task)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] transition-colors"
                          title="Delete Task"
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

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Assign New Task to Staff"
      >
        <form onSubmit={handleCreateTodo} className="space-y-4">
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

          {/* Staff Name with Quick Selection */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">
              Assigned Staff Name *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Engr. David Ramos"
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
                required
              />
              {team.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-[#626875] py-0.5">Quick select:</span>
                  {team.slice(0, 5).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormName(m.name)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[#BAC2D1] transition-colors"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Task */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Task Description *</label>
            <textarea
              value={formTask}
              onChange={(e) => setFormTask(e.target.value)}
              placeholder="Detailed description of task or assignment..."
              rows={3}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Dates: Assigned & Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Date Assigned</label>
              <input
                type="date"
                value={formDateAssigned}
                onChange={(e) => setFormDateAssigned(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Due Date</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Initial Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as TodoStatus)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            >
              {TODO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Notes / Instructions</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Special instructions, safety guidelines, references..."
              rows={2}
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
              {formSubmitting ? 'Saving...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Task"
      >
        <form onSubmit={handleUpdateTodo} className="space-y-4">
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

          {/* Staff Name */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Assigned Staff Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Task */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Task Description *</label>
            <textarea
              value={formTask}
              onChange={(e) => setFormTask(e.target.value)}
              rows={3}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              required
            />
          </div>

          {/* Dates: Assigned & Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Date Assigned</label>
              <input
                type="date"
                value={formDateAssigned}
                onChange={(e) => setFormDateAssigned(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Due Date</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as TodoStatus)}
              className="w-full bg-[#20232C] border border-[#2A2E38] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0090FF]"
            >
              {TODO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1 font-medium">Notes / Instructions</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
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
        title="Delete Assigned Task"
        message="Are you sure you want to delete this staff assigned task?"
        itemName={deleteModalState.title}
        isLoading={deleteModalState.loading}
      />
    </div>
  );
};
