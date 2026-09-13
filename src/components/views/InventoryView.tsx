import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Boxes, CheckCircle2, AlertTriangle, Clock, Wrench, Download } from 'lucide-react';
import { Project, InventoryItem } from '../../types';
import { api } from '../../services/api';
import { downloadCSV } from '../../services/export';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface InventoryViewProps {
  projects: Project[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId
}) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    loading: boolean;
    error?: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
    loading: false,
    error: ''
  });

  // Form State
  const [formEquipment, setFormEquipment] = useState('');
  const [formSpecs, setFormSpecs] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSiteId, setFormSiteId] = useState(projects[0]?.id || '');
  const [formStatus, setFormStatus] = useState<InventoryItem['status']>('Operational');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formNotes, setFormNotes] = useState('');
  const [formLastInspected, setFormLastInspected] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const res = await api.getInventory({
        siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setInventory(res.inventory || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedSiteId, statusFilter]);

  const filteredInventory = inventory.filter((item) => {
    return (
      item.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDownloadCSV = () => {
    downloadCSV(
      'inventory-' + new Date().toISOString().split('T')[0] + '.csv',
      ['Equipment', 'Specs', 'Location', 'Site Project', 'Status', 'Quantity', 'Notes', 'Last Inspected'],
      filteredInventory.map((i) => [
        i.equipment,
        i.specs,
        i.location,
        i.siteName,
        i.status,
        i.quantity,
        i.notes,
        i.lastInspected
      ])
    );
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormEquipment(item.equipment);
    setFormSpecs(item.specs);
    setFormLocation(item.location);
    setFormSiteId(item.siteId);
    setFormStatus(item.status);
    setFormQuantity(item.quantity);
    setFormNotes(item.notes);
    setFormLastInspected(item.lastInspected);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formEquipment.trim()) {
      setFormError('Equipment name is required');
      return;
    }

    try {
      await api.createInventory({
        equipment: formEquipment.trim(),
        specs: formSpecs.trim(),
        location: formLocation.trim(),
        siteId: formSiteId,
        status: formStatus,
        quantity: Number(formQuantity),
        notes: formNotes.trim(),
        lastInspected: formLastInspected
      });
      setIsAddModalOpen(false);
      loadInventory();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add equipment');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFormError('');

    try {
      await api.updateInventory(editingItem.id, {
        equipment: formEquipment.trim(),
        specs: formSpecs.trim(),
        location: formLocation.trim(),
        status: formStatus,
        quantity: Number(formQuantity),
        notes: formNotes.trim(),
        lastInspected: formLastInspected
      });
      setIsEditModalOpen(false);
      loadInventory();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update equipment');
    }
  };

  const promptDelete = (id: string, name: string) => {
    setDeleteModalState({
      isOpen: true,
      id,
      name,
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
      setInventory((prev) => prev.filter((i) => i.id !== targetId));
      await api.deleteInventory(targetId);
      setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' });
      loadInventory();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete equipment'
      }));
      loadInventory();
    }
  };

  const canEdit = true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Construction Equipment & Inventory</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Heavy machinery, power tools, safety gear, and material tracking per site
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

          {canEdit && (
            <button
              onClick={() => {
                setFormEquipment('');
                setFormSpecs('');
                setFormLocation('');
                setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
                setFormStatus('Operational');
                setFormQuantity(1);
                setFormNotes('');
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Equipment</span>
            </button>
          )}
        </div>
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
              <option value="all">All Sites (4 Projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
              <option value="Operational">Operational</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Deployed">Deployed</option>
              <option value="Standby">Standby</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search equipment or specs..."
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
                <th className="py-3 px-4 font-semibold">Equipment Name</th>
                <th className="py-3 px-4 font-semibold">Specs & Model</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Site Project</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Qty</th>
                <th className="py-3 px-4 font-semibold">Last Inspected</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#626875]">
                    No equipment found for this filter.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center space-x-2">
                      <Boxes className="w-4 h-4 text-[#0090FF] shrink-0" />
                      <span>{item.equipment}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{item.specs}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{item.location}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{item.siteName}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="md" />
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1] font-mono text-[11px]">
                      {item.lastInspected}
                    </td>
                    <td className="py-3.5 px-4 text-[#626875] max-w-[180px] truncate">{item.notes}</td>
                    {canEdit && (
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF] transition-colors"
                          title="Edit Equipment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDelete(item.id, item.equipment)}
                          className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] cursor-pointer transition-colors"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
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
        title="Add Construction Equipment"
        subtitle="Register site machinery, generator sets, or specialized tools"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Equipment Name</label>
              <input
                type="text"
                value={formEquipment}
                onChange={(e) => setFormEquipment(e.target.value)}
                placeholder="CAT Excavator 320"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Specifications / Model</label>
              <input
                type="text"
                value={formSpecs}
                onChange={(e) => setFormSpecs(e.target.value)}
                placeholder="Hydraulic 0.9m³ Bucket"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
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
              <label className="block text-xs text-[#8D93A1] mb-1">Specific Location / Bay</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Sector 2 Excavation Zone"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                <option value="Operational">Operational</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Deployed">Deployed</option>
                <option value="Standby">Standby</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(Number(e.target.value))}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Last Inspected</label>
              <input
                type="date"
                value={formLastInspected}
                onChange={(e) => setFormLastInspected(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Operational Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Routine maintenance oil check scheduled every 250 operational hours."
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
              Save Equipment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Equipment: ${editingItem?.equipment}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Equipment Name</label>
              <input
                type="text"
                value={formEquipment}
                onChange={(e) => setFormEquipment(e.target.value)}
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Specifications</label>
              <input
                type="text"
                value={formSpecs}
                onChange={(e) => setFormSpecs(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                <option value="Operational">Operational</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Deployed">Deployed</option>
                <option value="Standby">Standby</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(Number(e.target.value))}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Last Inspected</label>
            <input
              type="date"
              value={formLastInspected}
              onChange={(e) => setFormLastInspected(e.target.value)}
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Notes</label>
            <textarea
              rows={2}
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
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Equipment Record"
        message="Are you sure you want to remove this equipment/tool item from the inventory?"
        itemName={deleteModalState.name}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};
