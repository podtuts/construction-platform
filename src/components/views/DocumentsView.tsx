import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FileText, CheckCircle, Upload, Download } from 'lucide-react';
import { Project, ConstructionDocument, DocumentStatus } from '../../types';
import { api } from '../../services/api';
import { downloadCSV } from '../../services/export';
import { StatusBadge } from '../common/StatusBadge';
import { StatusDropdown } from '../common/StatusDropdown';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface DocumentsViewProps {
  projects: Project[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  projects,
  selectedSiteId,
  setSelectedSiteId
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ConstructionDocument[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ConstructionDocument | null>(null);

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

  // Form states
  const [formSiteId, setFormSiteId] = useState(projects[0]?.id || '');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Permits & Compliance');
  const [formStatus, setFormStatus] = useState<DocumentStatus>('Received');
  const [formUploadedBy, setFormUploadedBy] = useState(user?.fullName || 'Engr. Admin');
  const [formFileSize, setFormFileSize] = useState('2.4 MB');
  const [formError, setFormError] = useState('');

  const loadDocs = async () => {
    try {
      const res = await api.getDocuments({
        siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setDocuments(res.documents || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [selectedSiteId, statusFilter]);

  const filteredDocs = documents.filter((d) => {
    return (
      d.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDownloadCSV = () => {
    downloadCSV(
      'documents-' + new Date().toISOString().split('T')[0] + '.csv',
      ['Site Project', 'Document Name', 'Category', 'Status', 'Uploaded By', 'File Size', 'Last Updated'],
      filteredDocs.map((d) => [
        d.siteName,
        d.documentName,
        d.category,
        d.status,
        d.uploadedBy,
        d.fileSize,
        d.updatedAt
      ])
    );
  };

  const openEditModal = (d: ConstructionDocument) => {
    setEditingDoc(d);
    setFormSiteId(d.siteId);
    setFormName(d.documentName);
    setFormCategory(d.category);
    setFormStatus(d.status);
    setFormUploadedBy(d.uploadedBy);
    setFormFileSize(d.fileSize);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim()) {
      setFormError('Document title is required');
      return;
    }

    try {
      await api.createDocument({
        siteId: formSiteId,
        documentName: formName.trim(),
        category: formCategory.trim(),
        status: formStatus,
        uploadedBy: formUploadedBy.trim() || user?.fullName || 'Project Admin',
        fileSize: formFileSize
      });
      setIsAddModalOpen(false);
      loadDocs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save document');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setFormError('');

    try {
      await api.updateDocument(editingDoc.id, {
        documentName: formName.trim(),
        category: formCategory.trim(),
        status: formStatus,
        uploadedBy: formUploadedBy.trim(),
        fileSize: formFileSize
      });
      setIsEditModalOpen(false);
      loadDocs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update document');
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
      setDocuments((prev) => prev.filter((d) => d.id !== targetId));
      await api.deleteDocument(targetId);
      setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' });
      loadDocs();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete document'
      }));
      loadDocs();
    }
  };

  const handleQuickStatusChange = async (doc: ConstructionDocument, newStatus: string) => {
    try {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus as DocumentStatus } : d))
      );
      await api.updateDocument(doc.id, {
        status: newStatus as DocumentStatus
      });
      loadDocs();
    } catch (err: any) {
      console.error('Failed to update document status:', err);
      loadDocs();
    }
  };

  // Full operations enabled for all authenticated staff
  const canUpload = true;
  const canDelete = true;
  const canEdit = true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Project Documents & Handover</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Legal permits, environmental certificates, structural clearances, and turnover checklists
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

          {canUpload && (
            <button
              onClick={() => {
                setFormSiteId(selectedSiteId !== 'all' ? selectedSiteId : projects[0]?.id || '');
                setFormName('');
                setFormCategory('Permits & Compliance');
                setFormStatus('Received');
                setFormUploadedBy(user?.fullName || 'Project Admin');
                setFormFileSize('3.1 MB');
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Upload Document</span>
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
              <option value="all">All Sites ({projects.length} Project{projects.length === 1 ? '' : 's'})</option>
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
            placeholder="Search documents..."
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
                <th className="py-3 px-4 font-semibold">Document Title</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Site Project</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Updated</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#626875]">
                    No documents found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#0090FF] shrink-0" />
                      <span className="font-semibold">{doc.documentName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{doc.category}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{doc.siteName}</td>
                    <td className="py-3.5 px-4">
                      <StatusDropdown
                        currentStatus={doc.status}
                        options={['Received', 'Approved', 'Handover']}
                        onStatusChange={(newStatus) => handleQuickStatusChange(doc, newStatus)}
                        disabled={!user}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1] text-[11px]">
                      {new Date(doc.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(doc)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF]"
                          title="Edit Document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => promptDelete(doc.id, doc.documentName)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] cursor-pointer transition-colors"
                          title="Delete Document"
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
        title="Upload / Register Document"
        subtitle="Upload building permit, safety report, or clearance"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Document Title</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. LGU Approved Building Permit & Zoning Clearance"
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
              <label className="block text-xs text-[#8D93A1] mb-1">Category</label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Permits & Compliance"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Lifecycle Status</label>
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
              <label className="block text-xs text-[#8D93A1] mb-1">Uploaded By</label>
              <input
                type="text"
                value={formUploadedBy}
                onChange={(e) => setFormUploadedBy(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="border border-dashed border-[#2A2E38] rounded-[6px] p-4 text-center bg-[#20232C]/50">
            <Upload className="w-6 h-6 text-[#0090FF] mx-auto mb-1.5" />
            <p className="text-xs text-white">Drag & drop files here, or click to browse</p>
            <p className="text-[11px] text-[#626875] mt-0.5">Supports PDF, DWG, DOCX, XLSX up to 50MB</p>
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
              Save Document
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Document: ${editingDoc?.documentName}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Document Title</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Category</label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
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
              Update Document
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message="Are you sure you want to permanently delete this project document?"
        itemName={deleteModalState.name}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};
