import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, Mail, Contact } from 'lucide-react';
import { Contact as ContactType } from '../../types';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export const ContactsView: React.FC = () => {
  const { user } = useAuth();
  // Contact records may only be edited by superuser accounts
  const canEdit = user?.role === 'superuser';

  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);

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
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState('');

  const loadContacts = async () => {
    try {
      const res = await api.getContacts();
      setContacts(res.contacts || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setFormName('');
    setFormCompany('');
    setFormPosition('');
    setFormMobile('');
    setFormEmail('');
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: ContactType) => {
    setEditingContact(c);
    setFormName(c.name);
    setFormCompany(c.company);
    setFormPosition(c.position);
    setFormMobile(c.mobileNo);
    setFormEmail(c.email);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim() || !formMobile.trim() || !formEmail.trim()) {
      setFormError('Name, mobile number, and email are required');
      return;
    }

    try {
      await api.createContact({
        name: formName.trim(),
        company: formCompany.trim(),
        position: formPosition.trim(),
        mobileNo: formMobile.trim(),
        email: formEmail.trim()
      });
      setIsAddModalOpen(false);
      loadContacts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create contact');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    setFormError('');

    try {
      await api.updateContact(editingContact.id, {
        name: formName.trim(),
        company: formCompany.trim(),
        position: formPosition.trim(),
        mobileNo: formMobile.trim(),
        email: formEmail.trim()
      });
      setIsEditModalOpen(false);
      loadContacts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update contact');
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
      setContacts((prev) => prev.filter((c) => c.id !== targetId));
      await api.deleteContact(targetId);
      setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' });
      loadContacts();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete contact'
      }));
      loadContacts();
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
          <label className="block text-xs text-[#8D93A1] mb-1">Full Name</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Engr. Jonathan Cruz"
            required
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Company</label>
          <input
            type="text"
            value={formCompany}
            onChange={(e) => setFormCompany(e.target.value)}
            placeholder="Cruz Structural Consultants"
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#8D93A1] mb-1">Position</label>
        <input
          type="text"
          value={formPosition}
          onChange={(e) => setFormPosition(e.target.value)}
          placeholder="Principal Structural Engineer"
          className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Mobile No</label>
          <input
            type="text"
            value={formMobile}
            onChange={(e) => setFormMobile(e.target.value)}
            placeholder="+63 917 214 5588"
            required
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Email</label>
          <input
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="j.cruz@cruzconsultants.ph"
            required
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
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
          <h2 className="text-[20px] font-medium text-white tracking-tight">Contacts Directory</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Consultants, legal counsels, utility liaisons, and partner organization contacts
            {canEdit ? '' : ' (read-only for your role)'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[#8D93A1]">
            {filteredContacts.length} of {contacts.length} contacts
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, position..."
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
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Company</th>
                <th className="py-3 px-4 font-semibold">Position</th>
                <th className="py-3 px-4 font-semibold">Mobile No</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-8 text-center text-[#626875]">
                    No contacts found for this query.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center space-x-2">
                      <Contact className="w-4 h-4 text-[#0090FF] shrink-0" />
                      <span className="font-semibold">{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{c.company}</td>
                    <td className="py-3.5 px-4 text-[#0090FF]">{c.position}</td>
                    <td className="py-3.5 px-4 font-mono text-[#8D93A1]">
                      <span className="inline-flex items-center">
                        <Phone className="w-3 h-3 mr-1.5 text-[#626875]" />
                        {c.mobileNo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">
                      <span className="inline-flex items-center">
                        <Mail className="w-3 h-3 mr-1.5 text-[#626875]" />
                        {c.email}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF]"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDelete(c.id, c.name)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] cursor-pointer transition-colors"
                          title="Delete Contact"
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
        title="Add Contact"
        subtitle="Register consultants, liaisons, and partner organization contacts"
      >
        {renderFormFields(handleCreate, 'Create Contact')}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contact"
        subtitle={editingContact?.name}
      >
        {renderFormFields(handleUpdate, 'Update Contact')}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Remove Contact"
        message="Are you sure you want to remove this contact from the directory?"
        itemName={deleteModalState.name}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};
