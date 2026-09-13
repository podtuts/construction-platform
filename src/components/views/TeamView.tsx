import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, Mail, MapPin, Users, Briefcase, Upload, Lock } from 'lucide-react';
import { Project, TeamMember } from '../../types';
import { api } from '../../services/api';
import { fileToDataUri } from '../../services/upload';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface TeamViewProps {
  projects: Project[];
}

export const TeamView: React.FC<TeamViewProps> = ({ projects }) => {
  const { user } = useAuth();
  // Only superuser accounts may upload or change team member photo IDs
  const isSuperuser = user?.role === 'superuser';
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

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
  const [formPosition, setFormPosition] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formSites, setFormSites] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const loadTeam = async () => {
    try {
      const res = await api.getTeam();
      setTeam(res.team || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const filteredTeam = team.filter((m) => {
    const matchSite =
      selectedSite === 'all' || m.sites.some((s) => s.toLowerCase().includes(selectedSite.toLowerCase()));
    const matchQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSite && matchQuery;
  });

  const openEditModal = (m: TeamMember) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormPosition(m.position);
    setFormPhoto(m.idPhoto);
    setFormMobile(m.mobileNo);
    setFormEmail(m.email);
    setFormDepartment(m.department);
    setFormSites(m.sites);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim() || !formPosition.trim()) {
      setFormError('Name and Position are required');
      return;
    }

    try {
      await api.createTeamMember({
        name: formName.trim(),
        position: formPosition.trim(),
        // Photo ID is a superuser-only field; other roles omit it entirely
        ...(isSuperuser
          ? { idPhoto: formPhoto.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }
          : {}),
        mobileNo: formMobile.trim(),
        email: formEmail.trim(),
        department: formDepartment.trim() || 'Engineering & Construction',
        sites: formSites.length > 0 ? formSites : ['All Sites']
      });
      setIsAddModalOpen(false);
      loadTeam();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create team member');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setFormError('');

    try {
      await api.updateTeamMember(editingMember.id, {
        name: formName.trim(),
        position: formPosition.trim(),
        // Photo ID is a superuser-only field; other roles omit it entirely
        ...(isSuperuser ? { idPhoto: formPhoto.trim() } : {}),
        mobileNo: formMobile.trim(),
        email: formEmail.trim(),
        department: formDepartment.trim(),
        sites: formSites
      });
      setIsEditModalOpen(false);
      loadTeam();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update member');
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
      setTeam((prev) => prev.filter((m) => m.id !== targetId));
      await api.deleteTeamMember(targetId);
      setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' });
      loadTeam();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete team member'
      }));
      loadTeam();
    }
  };

  const toggleSiteSelection = (siteName: string) => {
    if (formSites.includes(siteName)) {
      setFormSites(formSites.filter((s) => s !== siteName));
    } else {
      setFormSites([...formSites, siteName]);
    }
  };

  // Reads an uploaded image file as base64 data URI for the team member photo
  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUri = await fileToDataUri(file);
      setFormPhoto(dataUri);
      setFormError('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to read the selected photo');
    } finally {
      e.target.value = '';
    }
  };

  // Photo ID editor: only superuser accounts can upload or change team member photos
  const renderPhotoEditor = () => (
    <div>
      <label className="block text-xs text-[#8D93A1] mb-1">Photo ID</label>
      <div className="flex items-center space-x-2.5">
        <img
          src={formPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
          alt="Photo preview"
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full object-cover border border-[#2A2E38] shrink-0"
          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
        />
        {isSuperuser ? (
          <input
            type="text"
            value={formPhoto}
            onChange={(e) => setFormPhoto(e.target.value)}
            placeholder="https://... or data:image/..."
            className="flex-1 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] font-mono"
          />
        ) : (
          <span className="inline-flex items-center text-[11px] text-[#626875] truncate min-w-0 flex-1">
            <Lock className="w-3 h-3 mr-1 shrink-0" />
            Photo managed by system superuser
          </span>
        )}
      </div>
      {isSuperuser && (
        <label className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-[4px] bg-[#0090FF]/10 hover:bg-[#0090FF]/20 border border-[#0090FF]/30 text-[11px] text-[#0090FF] hover:text-white cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          <span>Upload New Photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFileSelect} />
        </label>
      )}
    </div>
  );

  const canEdit = true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Project Team & Engineers</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Key personnel, project managers, safety officers, and contractors per site
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setFormName('');
              setFormPosition('');
              setFormPhoto('');
              setFormMobile('');
              setFormEmail('');
              setFormDepartment('Engineering & Operations');
              setFormSites([projects[0]?.name || 'Oakwood Heights']);
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#8D93A1]">Site Assignment:</span>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] px-3 py-1.5 focus:outline-none focus:border-[#0090FF]"
            >
              <option value="all">All Sites</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-[#20232C] p-1 rounded-[5px] border border-[#2A2E38]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs rounded-[4px] font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-[#0090FF] text-white' : 'text-[#8D93A1] hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs rounded-[4px] font-medium transition-colors ${
                viewMode === 'table' ? 'bg-[#0090FF] text-white' : 'text-[#8D93A1] hover:text-white'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, department..."
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#0090FF] placeholder-[#626875]"
          />
        </div>
      </div>

      {/* View Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeam.map((m) => (
            <div
              key={m.id}
              className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-5 relative overflow-hidden transition-all duration-200 hover:border-[#3A4050]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={m.idPhoto}
                    alt={m.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#2A2E38] shrink-0"
                  />
                  <div>
                    <h4 className="text-[14px] font-semibold text-white leading-tight">{m.name}</h4>
                    <p className="text-[12px] text-[#0090FF] font-medium mt-0.5">{m.position}</p>
                    <span className="text-[11px] text-[#8D93A1]">{m.department}</span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1 text-[#8D93A1] hover:text-white rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promptDelete(m.id, m.name)}
                      className="p-1 text-[#8D93A1] hover:text-[#FC424A] rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#2A2E38]/60 space-y-1.5 text-xs">
                <div className="flex items-center text-[#8D93A1]">
                  <Phone className="w-3.5 h-3.5 mr-2 text-[#626875]" />
                  <span>{m.mobileNo}</span>
                </div>
                <div className="flex items-center text-[#8D93A1]">
                  <Mail className="w-3.5 h-3.5 mr-2 text-[#626875]" />
                  <span className="truncate">{m.email}</span>
                </div>
              </div>

              <div className="mt-3.5 pt-2 border-t border-[#2A2E38]/40">
                <div className="text-[10px] uppercase font-bold text-[#626875] mb-1.5">Assigned Sites</div>
                <div className="flex flex-wrap gap-1">
                  {m.sites.map((site) => (
                    <span
                      key={site}
                      className="text-[11px] bg-[#20232C] border border-[#2A2E38] text-[#8D93A1] px-2 py-0.5 rounded-[4px]"
                    >
                      {site}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#171A21] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Team Member</th>
                  <th className="py-3 px-4 font-semibold">Position</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Mobile No</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Assigned Sites</th>
                  {canEdit && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2E38]/60 text-white">
                {filteredTeam.map((m) => (
                  <tr key={m.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3 px-4 flex items-center space-x-2.5">
                      <img
                        src={m.idPhoto}
                        alt={m.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-[#2A2E38]"
                      />
                      <span className="font-medium text-white">{m.name}</span>
                    </td>
                    <td className="py-3 px-4 text-[#0090FF]">{m.position}</td>
                    <td className="py-3 px-4 text-[#8D93A1]">{m.department}</td>
                    <td className="py-3 px-4 font-mono text-[#8D93A1]">{m.mobileNo}</td>
                    <td className="py-3 px-4 text-[#8D93A1]">{m.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {m.sites.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] bg-[#20232C] border border-[#2A2E38] text-[#8D93A1] px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDelete(m.id, m.name)}
                          className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Personnel / Contractor"
        subtitle="Register site engineers, safety coordinators, and foremen"
      >
        <form onSubmit={handleCreate} className="space-y-4">
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
                placeholder="Engr. David Ramos"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Position / Role</label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="Senior Civil Engineer"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Mobile No</label>
              <input
                type="text"
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
                placeholder="+63 917 555 4321"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Work Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="d.ramos@constructpulse.com"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Department</label>
              <input
                type="text"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                placeholder="Civil & Structural Division"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            {renderPhotoEditor()}
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1.5">Assign to Construction Sites</label>
            <div className="grid grid-cols-2 gap-2">
              {projects.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center space-x-2 text-xs text-white p-2 rounded-[5px] bg-[#20232C] border border-[#2A2E38] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formSites.includes(p.name)}
                    onChange={() => toggleSiteSelection(p.name)}
                    className="rounded bg-[#191C24] border-[#2A2E38] text-[#0090FF] focus:ring-0"
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
            </div>
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
              Save Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Personnel: ${editingMember?.name}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Full Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Position / Role</label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Mobile No</label>
              <input
                type="text"
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Work Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Department</label>
              <input
                type="text"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            {renderPhotoEditor()}
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1.5">Assigned Sites</label>
            <div className="grid grid-cols-2 gap-2">
              {projects.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center space-x-2 text-xs text-white p-2 rounded-[5px] bg-[#20232C] border border-[#2A2E38] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formSites.includes(p.name)}
                    onChange={() => toggleSiteSelection(p.name)}
                    className="rounded bg-[#191C24] border-[#2A2E38] text-[#0090FF] focus:ring-0"
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
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
              Update Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Remove Team Member"
        message="Are you sure you want to remove this staff engineer from the personnel directory?"
        itemName={deleteModalState.name}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};
