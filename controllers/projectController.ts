import { Request, Response } from 'express';
import { db, Project, ProjectUnit } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getProjects = (req: Request, res: Response) => {
  const state = db.getState();
  // Recalculate completed units dynamically from units table for accuracy
  const projectsWithCounts = state.projects.map(p => {
    const siteUnits = state.units.filter(u => u.siteId === p.id);
    const completed = siteUnits.filter(u => u.status === 'Completed' || u.status === 'Handover').length;
    return {
      ...p,
      totalUnits: siteUnits.length > 0 ? siteUnits.length : p.totalUnits,
      completedUnits: siteUnits.length > 0 ? completed : p.completedUnits
    };
  });
  res.json({ projects: projectsWithCounts });
};

export const getProjectById = (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const project = state.projects.find(p => p.id === id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const units = state.units.filter(u => u.siteId === id);
  const inventory = state.inventory.filter(i => i.siteId === id);
  const documents = state.documents.filter(d => d.siteId === id);
  const drawings = state.drawings.filter(dr => dr.siteId === id);

  res.json({
    project,
    units,
    inventory,
    documents,
    drawings
  });
};

export const getUnits = (req: Request, res: Response) => {
  const { siteId, status } = req.query;
  const state = db.getState();
  let units = state.units;

  if (siteId && siteId !== 'all') {
    units = units.filter(u => u.siteId === siteId);
  }
  if (status && status !== 'all') {
    units = units.filter(u => u.status.toLowerCase() === String(status).toLowerCase());
  }

  res.json({ units });
};

export const createUnit = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, unitId, model, progress, status, system, notes, targetDate } = req.body;
    if (!siteId || !unitId || !status) {
      return res.status(400).json({ error: 'siteId, unitId and status are required' });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId);
    if (!site) {
      return res.status(400).json({ error: 'Referenced site does not exist' });
    }

    const newUnit: ProjectUnit = {
      id: 'u-' + Date.now(),
      siteId,
      siteName: site.name,
      unitId,
      model: model || 'Standard Spec',
      progress: Number(progress) || 0,
      status,
      system: system || 'Units',
      notes: notes || '',
      targetDate: targetDate || site.targetCompletionDate,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    state.units.push(newUnit);

    db.save();
    res.status(201).json({ message: 'Unit created successfully', unit: newUnit });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create unit' });
  }
};

export const updateUnit = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { progress, status, notes, model, unitId, targetDate, system } = req.body;

    const state = db.getState();
    const idx = state.units.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const unit = state.units[idx];

    if (progress !== undefined) unit.progress = Math.min(100, Math.max(0, Number(progress)));
    if (status) unit.status = status;
    if (notes !== undefined) unit.notes = notes;
    if (model) unit.model = model;
    if (unitId) unit.unitId = unitId;
    if (targetDate) unit.targetDate = targetDate;
    if (system) unit.system = system;
    unit.updatedAt = new Date().toISOString().split('T')[0];

    state.units[idx] = unit;

    // Activity Logs are manual-only daily site records; no automatic logging here.

    db.save();
    res.json({ message: 'Unit updated successfully', unit });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update unit' });
  }
};

export const deleteUnit = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const unit = state.units.find(u => u.id === id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    state.units = state.units.filter(u => u.id !== id);
    db.save();
    res.json({ message: `Unit ${unit.unitId} deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete unit' });
  }
};

// ==========================================================
// Site Project Management (create / update / delete)
// Restricted to superuser role via routes/projectRoutes.ts
// ==========================================================

export const createProject = (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      location,
      projectType,
      imageUrl,
      siteMapUrl,
      startDate,
      targetCompletionDate,
      budget,
      spent,
      status,
      description
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Project name and location are required' });
    }

    const state = db.getState();

    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name: String(name).trim(),
      location: String(location).trim(),
      projectType: projectType || 'Subdivision',
      imageUrl: imageUrl ? String(imageUrl).trim() : '',
      siteMapUrl: siteMapUrl ? String(siteMapUrl).trim() : '',
      totalUnits: 0,
      completedUnits: 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      targetCompletionDate:
        targetCompletionDate || new Date().toISOString().split('T')[0],
      budget: Number(budget) || 0,
      spent: Number(spent) || 0,
      status: status || 'Active',
      description: description ? String(description).trim() : ''
    };

    state.projects.push(newProject);

    db.save();
    res.status(201).json({ message: 'Site project created successfully', project: newProject });
  } catch (err: any) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create site project' });
  }
};

export const updateProject = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const idx = state.projects.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Site project not found' });
    }

    const project = state.projects[idx];
    const {
      name,
      location,
      projectType,
      imageUrl,
      siteMapUrl,
      startDate,
      targetCompletionDate,
      budget,
      spent,
      status,
      description
    } = req.body;

    if (name !== undefined) project.name = String(name).trim();
    if (location !== undefined) project.location = String(location).trim();
    if (projectType) project.projectType = projectType;
    if (imageUrl !== undefined) project.imageUrl = String(imageUrl).trim();
    if (siteMapUrl !== undefined) project.siteMapUrl = String(siteMapUrl).trim();
    if (startDate !== undefined) project.startDate = startDate;
    if (targetCompletionDate) project.targetCompletionDate = targetCompletionDate;
    if (budget !== undefined) project.budget = Number(budget) || 0;
    if (spent !== undefined) project.spent = Number(spent) || 0;
    if (status) project.status = status;
    if (description !== undefined) project.description = String(description).trim();

    state.projects[idx] = project;

    db.save();
    res.json({ message: 'Site project updated successfully', project });
  } catch (err: any) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update site project' });
  }
};

export const deleteProject = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const project = state.projects.find(p => p.id === id);
    if (!project) {
      return res.status(404).json({ error: 'Site project not found' });
    }

    // Cascade cleanup of all dependent records for the removed site
    state.units = state.units.filter(u => u.siteId !== id);
    state.documents = state.documents.filter(d => d.siteId !== id);
    state.drawings = state.drawings.filter(dr => dr.siteId !== id);
    state.todos = state.todos.filter(t => t.siteId !== id);
    state.schedules = state.schedules.filter(s => s.siteId !== id);

    // Inventory references the site via SET NULL semantics
    state.inventory.forEach(i => {
      if (i.siteId === id) {
        i.siteId = '';
        i.siteName = 'Unassigned';
      }
    });

    // Remove the deleted site from team member site assignments
    state.team.forEach(t => {
      t.sites = t.sites.filter(s => s !== id);
    });

    state.projects = state.projects.filter(p => p.id !== id);

    db.save();
    res.json({ message: `Site project ${project.name} deleted successfully` });
  } catch (err: any) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete site project' });
  }
};
