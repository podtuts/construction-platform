import { Request, Response } from 'express';
import { db, ConstructionDrawing, SystemType } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getDrawings = (req: Request, res: Response) => {
  const { siteId, system, status } = req.query;
  const state = db.getState();
  let drawings = state.drawings;

  if (siteId && siteId !== 'all') {
    drawings = drawings.filter(d => d.siteId === siteId);
  }
  if (system && system !== 'all') {
    drawings = drawings.filter(d => d.system.toLowerCase() === String(system).toLowerCase());
  }
  if (status && status !== 'all') {
    drawings = drawings.filter(d => d.status.toLowerCase() === String(status).toLowerCase());
  }

  res.json({ drawings });
};

export const createDrawing = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, drawingTitle, system, revision, status, architectEngineer } = req.body;
    if (!siteId || !drawingTitle || !system || !status) {
      return res.status(400).json({ error: 'siteId, drawingTitle, system, and status are required' });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId) || state.projects[0];

    const newDrawing: ConstructionDrawing = {
      id: 'drw-' + Date.now(),
      siteId: site.id,
      siteName: site.name,
      drawingTitle: drawingTitle.trim(),
      system: system as SystemType,
      revision: revision || 'Rev-01',
      status,
      architectEngineer: architectEngineer || (req.user ? req.user.fullName : 'Lead Designer'),
      updatedAt: new Date().toISOString().split('T')[0]
    };

    state.drawings.push(newDrawing);
    db.save();
    res.status(201).json({ message: 'Drawing recorded', drawing: newDrawing });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create drawing' });
  }
};

export const updateDrawing = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { drawingTitle, system, revision, status, architectEngineer, siteId } = req.body;

    const state = db.getState();
    const idx = state.drawings.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    const item = state.drawings[idx];
    if (drawingTitle) item.drawingTitle = drawingTitle.trim();
    if (system) item.system = system;
    if (revision) item.revision = revision;
    if (status) item.status = status;
    if (architectEngineer) item.architectEngineer = architectEngineer.trim();
    if (siteId) {
      const site = state.projects.find(p => p.id === siteId);
      if (site) {
        item.siteId = site.id;
        item.siteName = site.name;
      }
    }
    item.updatedAt = new Date().toISOString().split('T')[0];

    state.drawings[idx] = item;
    db.save();
    res.json({ message: 'Drawing updated', drawing: item });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update drawing' });
  }
};

export const deleteDrawing = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const item = state.drawings.find(d => d.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Drawing not found' });
    }

    state.drawings = state.drawings.filter(d => d.id !== id);
    db.save();
    res.json({ message: `Deleted ${item.drawingTitle}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete drawing' });
  }
};
