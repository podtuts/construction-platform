import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  MapPin,
  CalendarDays,
  Wallet,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Project } from '../../types';
import { api } from '../../services/api';
import { fileToDataUri } from '../../services/upload';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ProjectGanttChart } from '../common/ProjectGanttChart';
import { useAuth } from '../../context/AuthContext';

type ProjectType = 'Subdivision' | 'Condominium' | 'Manufacturing' | 'Commercial';
type ProjectStatus = 'Active' | 'Under Review' | 'Completed';

const projectTypes: ProjectType[] = ['Subdivision', 'Condominium', 'Manufacturing', 'Commercial'];
const projectStatuses: ProjectStatus[] = ['Active', 'Under Review', 'Completed'];

interface ProjectForm {
  name: string;
  location: string;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate: string;
  targetCompletionDate: string;
  budget: string;
  spent: string;
  imageUrl: string;
  siteMapUrl: string;
  description: string;
}

const emptyForm = (): ProjectForm => ({
  name: '',
  location: '',
  projectType: 'Subdivision',
  status: 'Active',
  startDate: new Date().toISOString().split('T')[0],
  targetCompletionDate: '',
  budget: '',
  spent: '',
  imageUrl: '',
  siteMapUrl: '',
  description: ''
});

// Quick-select preset site photographs (Unsplash CDN) for fast project setup
const presetImages = [
  { label: 'Subdivision', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80' },
  { label: 'Condominium', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80' },
  { label: 'Commercial', url: 'https://images.unsplash.com/photo-1550864231728-9371c49eded1?w=800&auto=format&fit=crop&q=80' },
  { label: 'Manufacturing', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80' }
];

const formatMoney = (value: number) =>
  Number.isNaN(value) ? '₱ 0' : `₱ ${value.toLocaleString('en-US')}`;

interface ProjectsViewProps {
  projects: Project[];
  onRefresh: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, onRefresh }) => {
  const { user } = useAuth();
  const isSuperuser = user?.role === 'superuser';

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Delete modal
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

  // Form state
  const [form, setForm] = useState<ProjectForm>(emptyForm());
  const [formError, setFormError] = useState('');
  const [formImageError, setFormImageError] = useState('');

  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.projectType.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  const openAddModal = () => {
    setForm(emptyForm());
    setFormError('');
    setFormImageError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setForm({
      name: p.name,
      location: p.location,
      projectType: p.projectType,
      status: p.status,
      startDate: p.startDate || '',
      targetCompletionDate: p.targetCompletionDate,
      budget: p.budget ? String(p.budget) : '',
      spent: p.spent ? String(p.spent) : '',
      imageUrl: p.imageUrl,
      siteMapUrl: p.siteMapUrl,
      description: p.description
    });
    setFormError('');
    setFormImageError('');
    setIsEditModalOpen(true);
  };

  const readImage = async (file: File, onValue: (v: string) => void) => {
    try {
      const dataUri = await fileToDataUri(file);
      onValue(dataUri);
      setFormImageError('');
    } catch (err: any) {
      setFormImageError(err.message || 'Failed to read image file');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.location.trim()) {
      setFormError('Project name and location are required');
      return;
    }

    try {
      await api.createProject({
        name: form.name.trim(),
        location: form.location.trim(),
        projectType: form.projectType,
        status: form.status,
        startDate: form.startDate.trim(),
        targetCompletionDate: form.targetCompletionDate,
        budget: Number(form.budget) || 0,
        spent: Number(form.spent) || 0,
        imageUrl: form.imageUrl.trim(),
        siteMapUrl: form.siteMapUrl.trim(),
        description: form.description.trim()
      });
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create site project');
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setFormError('');

    try {
      await api.updateProject(editingProject.id, {
        name: form.name.trim(),
        location: form.location.trim(),
        projectType: form.projectType,
        status: form.status,
        startDate: form.startDate.trim(),
        targetCompletionDate: form.targetCompletionDate,
        budget: Number(form.budget) || 0,
        spent: Number(form.spent) || 0,
        imageUrl: form.imageUrl.trim(),
        siteMapUrl: form.siteMapUrl.trim(),
        description: form.description.trim()
      });
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update site project');
    }
  };

  const promptDeleteProject = (p: Project) => {
    setDeleteModalState({
      isOpen: true,
      id: p.id,
      name: p.name,
      loading: false,
      error: ''
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.id) return;
    try {
      setDeleteModalState((prev) => ({ ...prev, loading: true, error: '' }));
      await api.deleteProject(deleteModalState.id);
      setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' });
      onRefresh();
    } catch (err: any) {
      setDeleteModalState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to delete site project'
      }));
    }
  };

  // Shared form fields used by both the Add and Edit modals
  const renderProjectFormFields = (submitLabel: string) => (
    <form onSubmit={isEditModalOpen ? handleUpdateProject : handleCreateProject} className="space-y-4">
      {formError && (
        <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
          {formError}
        </div>
      )}

      {formImageError && (
        <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
          {formImageError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Project Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Sunrise Heights Subdivision"
            required
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Location *</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Brgy. Don Jose, Santa Rosa, Laguna"
            required
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Project Type</label>
          <select
            value={form.projectType}
            onChange={(e) => setForm({ ...form, projectType: e.target.value as ProjectType })}
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          >
            {projectTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          >
            {projectStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Start Date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Target Completion</label>
          <input
            type="date"
            value={form.targetCompletionDate}
            onChange={(e) => setForm({ ...form, targetCompletionDate: e.target.value })}
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Budget (₱)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            placeholder="84500000"
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8D93A1] mb-1">Amount Spent (₱)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.spent}
            onChange={(e) => setForm({ ...form, spent: e.target.value })}
            placeholder="56200000"
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
          />
        </div>
      </div>

      {/* Project Photo */}
      <div className="pt-1 border-t border-[#2A2E38]/60">
        <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">
          Project Photo (cover image)
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://... or data:image/..."
            className="flex-1 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] font-mono"
          />
          <div className="w-12 h-12 rounded-[6px] bg-[#20232C] border border-[#2A2E38] flex items-center justify-center overflow-hidden shrink-0">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
              />
            ) : (
              <ImageIcon className="w-4 h-4 text-[#626875]" />
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center px-3 py-1.5 rounded-[4px] bg-[#0090FF]/10 hover:bg-[#0090FF]/20 border border-[#0090FF]/30 text-[11px] text-[#0090FF] hover:text-white cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readImage(file, (v) => setForm({ ...form, imageUrl: v }));
              }}
            />
          </label>
          {form.imageUrl && (
            <button
              type="button"
              onClick={() => setForm({ ...form, imageUrl: '' })}
              className="px-2.5 py-1 rounded-[4px] bg-[#20232C] hover:bg-[#FC424A]/20 text-[11px] text-[#8D93A1] hover:text-[#FC424A] transition-colors"
            >
              <X className="w-3 h-3 mr-1" />
              Remove photo
            </button>
          )}
        </div>
        <div className="mt-1.5">
          <span className="text-[11px] text-[#626875] block mb-1">Quick Select Preset Photo:</span>
          <div className="flex flex-wrap gap-2">
            {presetImages.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setForm({ ...form, imageUrl: preset.url })}
                className="px-2.5 py-1 rounded-[4px] bg-[#20232C] hover:bg-[#2A2E38] border border-[#2A2E38] text-[11px] text-[#8D93A1] hover:text-white transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Site Map Image */}
      <div className="pt-1 border-t border-[#2A2E38]/60">
        <label className="block text-xs font-medium text-[#8D93A1] mb-1.5">
          Site Map Image (optional)
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={form.siteMapUrl}
            onChange={(e) => setForm({ ...form, siteMapUrl: e.target.value })}
            placeholder="https://.../site-map or data:image/..."
            className="flex-1 bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] font-mono"
          />
          <div className="w-12 h-12 rounded-[6px] bg-[#20232C] border border-[#2A2E38] flex items-center justify-center overflow-hidden shrink-0">
            {form.siteMapUrl ? (
              <img
                src={form.siteMapUrl}
                alt="Site Map Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
              />
            ) : (
              <MapPin className="w-4 h-4 text-[#626875]" />
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center px-3 py-1.5 rounded-[4px] bg-[#0090FF]/10 hover:bg-[#0090FF]/20 border border-[#0090FF]/30 text-[11px] text-[#0090FF] hover:text-white cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            <span>Upload Site Map</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readImage(file, (v) => setForm({ ...form, siteMapUrl: v }));
              }}
            />
          </label>
          {form.siteMapUrl && (
            <button
              type="button"
              onClick={() => setForm({ ...form, siteMapUrl: '' })}
              className="px-2.5 py-1 rounded-[4px] bg-[#20232C] hover:bg-[#FC424A]/20 text-[11px] text-[#8D93A1] hover:text-[#FC424A] transition-colors"
            >
              <X className="w-3 h-3 mr-1" />
              Remove map
            </button>
          )}
          <span className="text-[11px] text-[#626875]">PNG, JPG, or SVG up to 5MB</span>
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#8D93A1] mb-1">Project Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Masterplanned residential community with centralized utilities..."
          className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
        />
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
      {/* Header with Title & Add Project */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight">Site Projects</h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Manage construction site projects, photographs, budgets, and all project information
          </p>
        </div>

        {isSuperuser && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add New Project</span>
          </button>
        )}
      </div>

      {/* Gantt Timeline for all Site Projects */}
      <ProjectGanttChart projects={projects} />

      {/* Filter and Search Bar */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-[#8D93A1]">
          <Building2 className="w-4 h-4" />
          <span>
            {projects.length} site project{projects.length === 1 ? '' : 's'} registered
          </span>
          {!isSuperuser && <span className="text-[#626875]">· superuser can edit</span>}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#626875] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search project name, location, type..."
            className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#0090FF] placeholder-[#626875]"
          />
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-[#191C24] border border-dashed border-[#2A2E38] rounded-[8px] p-10 text-center space-y-2">
          <Building2 className="w-8 h-8 text-[#626875] mx-auto" />
          <p className="text-xs text-[#8D93A1]">
            No site projects found{searchTerm ? ' matching your search' : ' yet'}.
          </p>
          {isSuperuser && (
            <button
              onClick={openAddModal}
              className="text-xs text-[#0090FF] hover:text-white transition-colors"
            >
              Click "Add New Project" to register the first site project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const budget = Number(p.budget) || 0;
            const spent = Number(p.spent) || 0;
            const spendPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

            return (
              <div
                key={p.id}
                className="bg-[#191C24] border border-[#2A2E38] rounded-[10px] overflow-hidden flex flex-col group transition-colors hover:border-[#0090FF]/40"
              >
                {/* Image Header */}
                <div className="relative h-40 w-full bg-[#20232C] overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#20232C]">
                      <Building2 className="w-8 h-8 text-[#626875]" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5">
                    <StatusBadge status={p.status} size="sm" />
                  </div>

                  {isSuperuser && (
                    <div className="absolute top-2.5 right-2.5 flex space-x-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit Project Information"
                        className="p-1.5 rounded-[4px] bg-black/60 hover:bg-[#0090FF]/20 text-white hover:text-[#0090FF] backdrop-blur-[2px] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => promptDeleteProject(p)}
                        title="Delete Project"
                        className="p-1.5 rounded-[4px] bg-black/60 hover:bg-[#FC424A]/20 text-white hover:text-[#FC424A] backdrop-blur-[2px] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2.5 text-[10px] font-mono text-[#8D93A1] bg-black/60 px-1.5 py-0.5 rounded-[3px]">
                    {p.projectType}
                  </div>
                </div>
                {/* Card Body */}
                <div className="p-4 flex flex-col gap-3">
                  <h3 className="text-[15px] font-semibold text-white leading-snug">{p.name}</h3>

                  <div className="flex items-center space-x-1.5 text-[11px] text-[#8D93A1]">
                    <MapPin className="w-3 h-3 shrink-0 text-[#626875]" />
                    <span className="truncate flex-1">{p.location}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[11px] text-[#8D93A1]">
                    <CalendarDays className="w-3 h-3 shrink-0 text-[#626875]" />
                    <span>Target completion {p.targetCompletionDate || '—'}</span>
                  </div>

                  {/* Budget / Spent Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5 text-[11px]">
                      <span className="flex items-center space-x-1.5 text-[#8D93A1]">
                        <Wallet className="w-3 h-3 text-[#626875]" />
                        <span>Budget</span>
                      </span>
                      <span className="text-[#BAC2D1] font-mono font-medium">
                        {formatMoney(spent)} <span className="text-[#626875]">/</span> {formatMoney(budget)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#2A2E38] overflow-hidden">
                      <div
                        className={`h-full ${spendPct >= 100 ? 'bg-[#FC424A]' : 'bg-[#0090FF]'}`}
                        style={{ width: `${spendPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Units Summary */}
                  <div className="flex items-center justify-between text-[11px] text-[#8D93A1]">
                    <span>
                      Units: {p.totalUnits > 0 ? `${p.completedUnits} / ${p.totalUnits} completed` : '0 registered yet'}
                    </span>
                    {p.siteMapUrl && (
                      <a
                        href={p.siteMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[11px] text-[#0090FF] hover:text-white transition-colors"
                      >
                        Site Map
                      </a>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-[11px] text-[#626875] leading-relaxed line-clamp-2">{p.description}</p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-auto border-t border-[#2A2E38] bg-[#171A21] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#626875]">{p.id}</span>
                  {isSuperuser && (
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF] transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => promptDeleteProject(p)}
                        className="p-1.5 rounded-[4px] bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    {/* Add Project Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Site Project"
        subtitle="Register a construction site project with complete information"
        maxWidth="lg"
      >
        {renderProjectFormFields('Create Project')}
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Site Project"
        subtitle={editingProject?.name}
        maxWidth="lg"
      >
        {renderProjectFormFields('Save Changes')}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', name: '', loading: false, error: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Site Project"
        message="Are you sure you want to permanently delete this site project? All associated units, documents, drawings, to-dos, and schedules will also be removed, and any linked inventory will be unassigned."
        itemName={deleteModalState.name}
        isLoading={deleteModalState.loading}
        errorMessage={deleteModalState.error}
      />
    </div>
  );
};