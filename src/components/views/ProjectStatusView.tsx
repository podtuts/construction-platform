import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Filter, Search, CheckCircle, Clock, Download } from 'lucide-react';
import { Project, ProjectUnit, UnitStatus, SystemType } from '../../types';
import { api } from '../../services/api';
import { downloadCSV } from '../../services/export';
import { StatusBadge } from '../common/StatusBadge';
import { StatusDropdown } from '../common/StatusDropdown';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface ProjectStatusViewProps {
  projects: Project[];
  units: ProjectUnit[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  onRefresh: () => void;
}

export const ProjectStatusView: React.FC<ProjectStatusViewProps> = ({
  projects,
  units,
  selectedSiteId,
  setSelectedSiteId,
  onRefresh
}) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProjectUnit | null>(null);

  // Delete modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    unitId: string;
    loading: boolean;
    error?: string;
  }>({
    isOpen: false,
    id: '',
    unitId: '',
    loading: false,
    error: ''
  });

  // Form states
  const [formSiteId, setFormSiteId] = useState(projects[0]?.id || '');
  const [formUnitId, setFormUnitId] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formStatus, setFormStatus] = useState<UnitStatus>('Planning');
  const [formSystem, setFormSystem] = useState<SystemType>('Units');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const statuses: UnitStatus[] = ['Planning', 'Ongoing', 'T&C', 'Punchlist', 'Completed', 'Handover'];
  const systems: SystemType[] = ['Civil', 'Electrical', 'Mechanical', 'ELV', 'HVAC', 'Units', 'Exterior'];

  // Filtering
  const filteredUnits = units.filter((u) => {
    const matchSite = selectedSiteId === 'all' || u.siteId === selectedSiteId;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchSearch =
      u.unitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSite && matchStatus && matchSearch;
  });

  const handleDownloadCSV = () => {
    downloadCSV(
      'project-status-' + new Date().toISOString().split('T')[0] + '.csv',
      ['Site Project', 'Unit ID', 'Model', 'Progress (%)', 'Status', 'System', 'Target Date', 'Notes'],
      filteredUnits.map((u) => [
        u.siteName,
        u.unitId,
        u.model,
        u.progress,
        u.status,
        u.system || 'Units',
        u.targetDate,
        u.notes || ''
      ])
    );
  };

  const openEditModal = (unit: ProjectUnit) => {
    setEditingUnit(unit);
    setFormSiteId(unit.siteId);
    setFormUnitId(unit.unitId);
    setFormModel(unit.model);
    setFormProgress(unit.progress);
    setFormStatus(unit.status);
    setFormSystem((unit.system as SystemType) || 'Units');
    setFormTargetDate(unit.targetDate || '');
    setFormNotes(unit.notes || '');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formUnitId.trim()) {
      setFormError('Unit identifier is required');
      return;
    }

    try {
      await api.createUnit({
        siteId: formSiteId,
        unitId: formUnitId.trim(),
        model: formModel.trim() || 'Standard Unit Spec',
        progress: Number(formProgress),
        status: formStatus,
        system: formSystem,
        targetDate: formTargetDate,
        notes: formNotes
      });
      setIsAddModalOpen(false);
      // Reset form
      setFormUnitId('');
      setFormModel('');
      setFormProgress(0);
      setFormNotes('');
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save unit');
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setFormError('');

    try {
      await api.updateUnit(editingUnit.id, {
        unitId: formUnitId.trim(),
        model: formModel.trim(),
        progress: Number(formProgress),
        status: formStatus,
        system: formSystem,
        targetDate: formTargetDate,
        notes: formNotes
      });
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update unit');
    }
  };

  const promptDeleteUnit = (id: string, unitName: string) => {
    setDeleteModalState({
      isOpen: true,
      id,
      unitId: unitName,
      loading: false,
      error: ''
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.id) return;
    try {
      setDeleteModalState((prev) => ({ ...prev, loading: true, error: '' }));
      await api.deleteUnit(deleteModalState.id);
      setDeleteModalState({ isOpen: false, id: '', unitId: '', loading: false, error: '' });
      onRefresh();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete unit'
      }));
    }
  };

  const handleQuickStatusChange = async (unit: ProjectUnit, newStatus: string) => {
    try {
      let newProgress = unit.progress;
      if ((newStatus === 'Completed' || newStatus === 'Handover') && unit.progress < 100) {
        newProgress = 100;
      } else if (newStatus === 'Planning' && unit.progress > 20) {
        newProgress = 10;
      }
      await api.updateUnit(unit.id, {
        status: newStatus as UnitStatus,
        progress: newProgress
      });
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update unit status:', err);
    }
  };

  // Allow all operations for active users
  const canAddUnit = true;
  const canDeleteUnit = true;
  const canEdit = true;

  return (
    <div className="space-y-5">
      {/* Header with Title & Add Unit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Project Construction Status</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Monitor real-time progress, staging, and turnover milestones across site units
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center px-3.5 py-2 bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[#BAC2D1] hover:text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Download CSV</span>
          </button>

          {canAddUnit && (
            <button
              onClick={() => {
                setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
                setFormUnitId('');
                setFormModel('');
                setFormProgress(0);
                setFormStatus('Planning');
                setFormSystem('Units');
                setFormNotes('');
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add New Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#8D93A1]">Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Sites ({projects.length} Project{projects.length === 1 ? '' : 's'})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#8D93A1]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Unit Id or Model..."
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#0090FF] placeholder-[#626875]"
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171A21] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold">Site Project</th>
                <th className="py-3 px-4 font-semibold">Unit Id</th>
                <th className="py-3 px-4 font-semibold">House Model / Specs</th>
                <th className="py-3 px-4 font-semibold">System</th>
                <th className="py-3 px-4 font-semibold w-48">Progress (% Construction)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Target Date</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#626875]">
                    No construction units match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#8D93A1]">{u.siteName}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#0090FF]">{u.unitId}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{u.model}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#20232C] border border-[#2A2E38] text-white">
                        {u.system || 'Units'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex-1 bg-[#20232C] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              u.progress === 100
                                ? 'bg-[#00D25B]'
                                : u.progress >= 70
                                ? 'bg-[#0090FF]'
                                : u.progress >= 30
                                ? 'bg-[#FFAB00]'
                                : 'bg-[#626875]'
                            }`}
                            style={{ width: `${u.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-medium text-white w-9 text-right">
                          {u.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusDropdown
                        currentStatus={u.status}
                        options={statuses}
                        onStatusChange={(newStatus) => handleQuickStatusChange(u, newStatus)}
                        disabled={!user}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1] text-[11px]">
                      {u.targetDate || '2026-11-30'}
                    </td>
                    {canEdit && (
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF] transition-colors"
                          title="Edit Unit Progress & Status"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteUnit && (
                          <button
                            onClick={() => promptDeleteUnit(u.id, u.unitId)}
                            className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] transition-colors cursor-pointer"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Unit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Construction Unit"
        subtitle="Register a new building unit, block lot, or area"
      >
        <form onSubmit={handleCreateUnit} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Site Project</label>
            <select
              value={formSiteId}
              onChange={(e) => setFormSiteId(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Unit Id (e.g. Block-1 Lot-7, 3F Unit-5)</label>
              <input
                type="text"
                value={formUnitId}
                onChange={(e) => setFormUnitId(e.target.value)}
                placeholder="Block-1 Lot-7"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Model / Specification</label>
              <input
                type="text"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                placeholder="Sapphire Villa (220sqm)"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">System</label>
              <select
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value as SystemType)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                {systems.map((sys) => (
                  <option key={sys} value={sys}>
                    {sys}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Target Completion Date</label>
              <input
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Construction Progress ({formProgress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => setFormProgress(Number(e.target.value))}
                className="w-full accent-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as UnitStatus)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Notes / Scope Highlights</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Foundation pouring complete, proceeding to structural framing..."
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#2A2E38]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-[5px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[5px] bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium"
            >
              Save Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Update Unit: ${editingUnit?.unitId}`}
        subtitle={`Location: ${editingUnit?.siteName}`}
      >
        <form onSubmit={handleUpdateUnit} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Unit Id</label>
              <input
                type="text"
                value={formUnitId}
                onChange={(e) => setFormUnitId(e.target.value)}
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Model / Specification</label>
              <input
                type="text"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">System</label>
              <select
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value as SystemType)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                {systems.map((sys) => (
                  <option key={sys} value={sys}>
                    {sys}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Target Completion Date</label>
              <input
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-[#8D93A1]">Progress</span>
                <span className="font-mono font-bold text-[#0090FF]">{formProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => setFormProgress(Number(e.target.value))}
                className="w-full accent-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as UnitStatus)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Inspection Notes & Details</label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#2A2E38]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-[5px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[5px] bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium"
            >
              Update Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', unitId: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Construction Unit"
        message="Are you sure you want to permanently remove this construction unit from the project status register?"
        itemName={deleteModalState.unitId}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};
