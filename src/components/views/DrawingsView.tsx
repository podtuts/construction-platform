import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Layers, Compass, Download, ExternalLink } from 'lucide-react';
import { Project, ConstructionDrawing, SystemType, DocumentStatus } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { StatusDropdown } from '../common/StatusDropdown';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface DrawingsViewProps {
  projects: Project[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
}

export const DrawingsView: React.FC<DrawingsViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId
}) => {
  const { user } = useAuth();
  const [drawings, setDrawings] = useState<ConstructionDrawing[]>([]);
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState<ConstructionDrawing | null>(null);

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
  const [formSiteId, setFormSiteId] = useState(projects[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formSystem, setFormSystem] = useState<SystemType>('Civil');
  const [formRevision, setFormRevision] = useState('Rev-01');
  const [formStatus, setFormStatus] = useState<DocumentStatus>('Received');
  const [formArchitectEngineer, setFormArchitectEngineer] = useState('Engr. David Ramos (Civil)');
  const [formError, setFormError] = useState('');

  const systems: SystemType[] = ['Civil', 'Electrical', 'Mechanical', 'ELV', 'HVAC', 'Units', 'Exterior'];

  const loadDrawings = async () => {
    try {
      const res = await api.getDrawings({
        siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        system: systemFilter !== 'all' ? systemFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setDrawings(res.drawings || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDrawings();
  }, [selectedSiteId, systemFilter, statusFilter]);

  const filteredDrawings = drawings.filter((d) => {
    return (
      d.drawingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.architectEngineer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.revision.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const openEditModal = (d: ConstructionDrawing) => {
    setEditingDrawing(d);
    setFormSiteId(d.siteId);
    setFormTitle(d.drawingTitle);
    setFormSystem(d.system);
    setFormRevision(d.revision);
    setFormStatus(d.status);
    setFormArchitectEngineer(d.architectEngineer);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formTitle.trim()) {
      setFormError('Drawing title is required');
      return;
    }

    try {
      await api.createDrawing({
        siteId: formSiteId,
        drawingTitle: formTitle.trim(),
        system: formSystem,
        revision: formRevision.trim(),
        status: formStatus,
        architectEngineer: formArchitectEngineer.trim()
      });
      setIsAddModalOpen(false);
      loadDrawings();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create drawing');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrawing) return;
    setFormError('');

    try {
      await api.updateDrawing(editingDrawing.id, {
        drawingTitle: formTitle.trim(),
        system: formSystem,
        revision: formRevision.trim(),
        status: formStatus,
        architectEngineer: formArchitectEngineer.trim()
      });
      setIsEditModalOpen(false);
      loadDrawings();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update drawing');
    }
  };

  const promptDelete = (id: string, title: string) => {
    setDeleteModalState({
      isOpen: true,
      id,
      title,
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
      setDrawings((prev) => prev.filter((d) => d.id !== targetId));
      await api.deleteDrawing(targetId);
      setDeleteModalState({ isOpen: false, id: '', title: '', loading: false, error: '' });
      loadDrawings();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete drawing'
      }));
      loadDrawings();
    }
  };

  const handleQuickStatusChange = async (draw: ConstructionDrawing, newStatus: string) => {
    try {
      setDrawings((prev) =>
        prev.map((d) => (d.id === draw.id ? { ...d, status: newStatus as DocumentStatus } : d))
      );
      await api.updateDrawing(draw.id, {
        status: newStatus as DocumentStatus
      });
      loadDrawings();
    } catch (err: any) {
      console.error('Failed to update drawing status:', err);
      loadDrawings();
    }
  };

  // Full operations enabled for all authenticated staff
  const canAdd = true;
  const canDelete = true;
  const canEdit = true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Engineering Drawings & Blueprints</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Architectural, Civil, Electrical, Mechanical, ELV, and HVAC revisions
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => {
              setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
              setFormTitle('');
              setFormSystem('Civil');
              setFormRevision('Rev-01');
              setFormStatus('Received');
              setFormArchitectEngineer('Engr. David Ramos');
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Drawing</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#8D93A1]">Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Sites</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#8D93A1]">System:</span>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Systems</option>
              {systems.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#8D93A1]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Approved">Approved</option>
              <option value="Handover">Handover</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drawing or architect..."
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
                <th className="py-3 px-4 font-semibold">Drawing Title</th>
                <th className="py-3 px-4 font-semibold">System Discipline</th>
                <th className="py-3 px-4 font-semibold">Revision</th>
                <th className="py-3 px-4 font-semibold">Site Project</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Architect / Engineer</th>
                <th className="py-3 px-4 font-semibold">Last Updated</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredDrawings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#626875]">
                    No blueprints or drawings found for this query.
                  </td>
                </tr>
              ) : (
                filteredDrawings.map((draw) => (
                  <tr key={draw.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#0090FF] shrink-0" />
                      <span className="font-semibold">{draw.drawingTitle}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#20232C] border border-[#2A2E38] text-white font-medium">
                        {draw.system}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#00D25B]">{draw.revision}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{draw.siteName}</td>
                    <td className="py-3.5 px-4">
                      <StatusDropdown
                        currentStatus={draw.status}
                        options={['Received', 'Approved', 'Handover']}
                        onStatusChange={(newStatus) => handleQuickStatusChange(draw, newStatus)}
                        disabled={!user}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{draw.architectEngineer}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1] text-[11px]">
                      {new Date(draw.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => alert(`Opening Blueprint CAD Viewer: ${draw.drawingTitle}`)}
                        className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-white"
                        title="View CAD Blueprint"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(draw)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF]"
                          title="Edit Drawing"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => promptDelete(draw.id, draw.drawingTitle)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] cursor-pointer transition-colors"
                          title="Delete Drawing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Engineering Drawing"
        subtitle="Register blueprint set or MEPF schematic"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Drawing Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Electrical Power Distribution & Main Transformer Load"
              required
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">System Discipline</label>
              <select
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value as SystemType)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                {systems.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Revision Tag</label>
              <input
                type="text"
                value={formRevision}
                onChange={(e) => setFormRevision(e.target.value)}
                placeholder="Rev-01"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as DocumentStatus)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                <option value="Received">Received</option>
                <option value="Approved">Approved</option>
                <option value="Handover">Handover</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Architect / Professional Engineer in Charge</label>
            <input
              type="text"
              value={formArchitectEngineer}
              onChange={(e) => setFormArchitectEngineer(e.target.value)}
              placeholder="Engr. David Ramos (PECE)"
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
              Save Drawing
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Drawing: ${editingDrawing?.drawingTitle}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Drawing Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">System Discipline</label>
              <select
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value as SystemType)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                {systems.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Revision Tag</label>
              <input
                type="text"
                value={formRevision}
                onChange={(e) => setFormRevision(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as DocumentStatus)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                <option value="Received">Received</option>
                <option value="Approved">Approved</option>
                <option value="Handover">Handover</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Architect / Engineer</label>
              <input
                type="text"
                value={formArchitectEngineer}
                onChange={(e) => setFormArchitectEngineer(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
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
              Update Drawing
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', title: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Drawing"
        message="Are you sure you want to permanently remove this drawing blueprint from the register?"
        itemName={deleteModalState.title}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};
