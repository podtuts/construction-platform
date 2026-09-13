import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, Mail, Users, HardHat, Building2, ClipboardList } from 'lucide-react';
import { Project, Contractor } from '../../types';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface ContractorsViewProps {
  projects: Project[];
}

export const ContractorsView: React.FC<ContractorsViewProps> = ({ projects }) => {
  const { user } = useAuth();
  // Contractor records may only be edited by superuser accounts
  const canEdit = user?.role === 'superuser';

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

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
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formStaffCount, setFormStaffCount] = useState('10');
  const [formSiteId, setFormSiteId] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formContactMobile, setFormContactMobile] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formError, setFormError] = useState('');

  const loadContractors = async () => {
    try {
      const res = await api.getContractors();
      setContractors(res.contractors || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadContractors();
  }, []);

  const filteredContractors = contractors.filter((c) => {
    const matchSite = selectedSiteId === 'all' || c.siteId === selectedSiteId;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      c.companyName.toLowerCase().includes(q) ||
      c.scopeOfWork.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.siteName.toLowerCase().includes(q);
    return matchSite && matchQuery;
  });

  const resetForm = () => {
    setFormCompanyName('');
    setFormStaffCount('10');
    setFormSiteId(projects[0]?.id || '');
    setFormScope('');
    setFormContactPerson('');
    setFormContactMobile('');
    setFormContactEmail('');
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Contractor) => {
    setEditingContractor(c);
    setFormCompanyName(c.companyName);
    setFormStaffCount(String(c.staffCount));
    setFormSiteId(c.siteId);
    setFormScope(c.scopeOfWork);
    setFormContactPerson(c.contactPerson);
    setFormContactMobile(c.contactMobileNo);
    setFormContactEmail(c.contactEmail);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formCompanyName.trim() || !formContactPerson.trim() || !formContactMobile.trim() || !formContactEmail.trim()) {
      setFormError('Company name, contact person, mobile number, and email are required');
      return;
    }

    try {
      await api.createContractor({
        companyName: formCompanyName.trim(),
        staffCount: Number(formStaffCount) || 0,
        siteId: formSiteId,
        scopeOfWork: formScope.trim(),
        contactPerson: formContactPerson.trim(),
        contactMobileNo: formContactMobile.trim(),
        contactEmail: formContactEmail.trim()
      });
      setIsAddModalOpen(false);
      loadContractors();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create contractor');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractor) return;
    setFormError('');

    try {
      await api.updateContractor(editingContractor.id, {
        companyName: formCompanyName.trim(),
        staffCount: Number(formStaffCount) || 0,
        siteId: formSiteId,
        scopeOfWork: formScope.trim(),
        contactPerson: formContactPerson.trim(),
        contactMobileNo: formContactMobile.trim(),
        contactEmail: formContactEmail.trim()
      });
      setIsEditModalOpen(false);
      loadContractors();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update contractor');
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
      setContractors((prev) => prev.filter((c) => c.id !== targetId));
      await api.deleteContractor(targetId);
      setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' });
      loadContractors();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete contractor'
      }));
      loadContractors();
    }
  };

  const renderFormFields = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Company Name</label>
          <input
            type="text"
            value={formCompanyName}
            onChange={(e) => setFormCompanyName(e.target.value)}
            placeholder="Ascend Steel Builders Inc."
            required
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Number of Staff</label>
          <input
            type="number"
            min="0"
            value={formStaffCount}
            onChange={(e) => setFormStaffCount(e.target.value)}
            placeholder="45"
            required
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#8D93A1] mb-1">Site Assigned</label>
        <select
          value={formSiteId}
          onChange={(e) => setFormSiteId(e.target.value)}
          className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
        >
          <option value="">Unassigned</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[#8D93A1] mb-1">Scope of Work</label>
        <textarea
          value={formScope}
          onChange={(e) => setFormScope(e.target.value)}
          placeholder="Structural steel erection, rebar installation, and post-tensioning works"
          rows={3}
          className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] resize-none"
        />
      </div>

      <div className="pt-1 border-t border-[#2A2E38]">
        <div className="text-[10px] font-bold text-[#626875] uppercase tracking-wider mb-2 mt-2">
          Contact Person
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Name</label>
            <input
              type="text"
              value={formContactPerson}
              onChange={(e) => setFormContactPerson(e.target.value)}
              placeholder="Engr. Paolo Domingo"
              required
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Mobile No</label>
              <input
                type="text"
                value={formContactMobile}
                onChange={(e) => setFormContactMobile(e.target.value)}
                placeholder="+63 917 340 2288"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Email</label>
              <input
                type="email"
                value={formContactEmail}
                onChange={(e) => setFormContactEmail(e.target.value)}
                placeholder="p.domingo@ascendsteel.example"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-3 border-t border-[#2A2E38]">
        <button
          type="button"
          onClick={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
          className="px-4 py-2 rounded-[5px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] text-xs font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-[5px] bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Contractors Registry</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Subcontractor companies, manpower counts, site assignments, and scope of work
            {canEdit ? '' : ' (read-only for your role)'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Contractor</span>
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
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, scope, contact..."
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
                <th className="py-3 px-4 font-semibold">Company Name</th>
                <th className="py-3 px-4 font-semibold">No. of Staff</th>
                <th className="py-3 px-4 font-semibold">Site Assigned</th>
                <th className="py-3 px-4 font-semibold">Scope of Work</th>
                <th className="py-3 px-4 font-semibold">Contact Person</th>
                <th className="py-3 px-4 font-semibold">Mobile No</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredContractors.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-[#626875]">
                    No contractors found for this query.
                  </td>
                </tr>
              ) : (
                filteredContractors.map((c) => (
                  <tr key={c.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <span className="flex items-center space-x-2">
                        <HardHat className="w-4 h-4 text-[#0090FF] shrink-0" />
                        <span className="font-semibold">{c.companyName}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">
                      <span className="inline-flex items-center">
                        <Users className="w-3 h-3 mr-1.5 text-[#626875]" />
                        {c.staffCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">
                      <span className="inline-flex items-center">
                        <Building2 className="w-3 h-3 mr-1.5 text-[#626875]" />
                        {c.siteName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1] max-w-[260px]">
                      <span className="inline-flex items-start">
                        <ClipboardList className="w-3 h-3 mr-1.5 mt-0.5 text-[#626875] shrink-0" />
                        <span>{c.scopeOfWork || '-'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#0090FF]">{c.contactPerson}</td>
                    <td className="py-3.5 px-4 font-mono text-[#8D93A1]">
                      <span className="inline-flex items-center">
                        <Phone className="w-3 h-3 mr-1.5 text-[#626875]" />
                        {c.contactMobileNo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">
                      <span className="inline-flex items-center">
                        <Mail className="w-3 h-3 mr-1.5 text-[#626875]" />
                        {c.contactEmail}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF]"
                          title="Edit Contractor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDelete(c.id, c.companyName)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] cursor-pointer transition-colors"
                          title="Delete Contractor"
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
        title="Add Contractor"
        subtitle="Register subcontractor company with manpower and site assignment"
      >
        {renderFormFields(handleCreate, 'Create Contractor')}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contractor"
        subtitle={editingContractor?.companyName}
      >
        {renderFormFields(handleUpdate, 'Update Contractor')}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Remove Contractor"
        message="Are you sure you want to remove this contractor from the registry?"
        itemName={deleteModalState.name}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};
