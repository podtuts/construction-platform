import { Request, Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getSettings = (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ settings: state.settings });
};

export const updateSettings = (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      companyName,
      logoUrl,
      faviconUrl,
      loginBannerUrl,
      dashboardBannerUrl,
      contactEmail,
      currencySymbol,
      primaryColor
    } = req.body;
    const state = db.getState();

    if (companyName) state.settings.companyName = companyName.trim();
    if (logoUrl !== undefined) state.settings.logoUrl = logoUrl.trim();
    if (faviconUrl !== undefined) state.settings.faviconUrl = faviconUrl.trim();
    if (loginBannerUrl !== undefined) state.settings.loginBannerUrl = loginBannerUrl.trim();
    if (dashboardBannerUrl !== undefined) state.settings.dashboardBannerUrl = dashboardBannerUrl.trim();
    if (contactEmail) state.settings.contactEmail = contactEmail.trim();
    if (currencySymbol) state.settings.currencySymbol = currencySymbol.trim();
    if (primaryColor) state.settings.primaryColor = primaryColor.trim();
    state.settings.updatedAt = new Date().toISOString();

    db.save();
    res.json({ message: 'Settings saved successfully', settings: state.settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update company settings' });
  }
};

export const getDashboardSummary = (req: Request, res: Response) => {
  const state = db.getState();
  const totalProjects = state.projects.length;

  const totalUnits = state.units.length;
  const completedUnits = state.units.filter(u => u.status === 'Completed' || u.status === 'Handover').length;
  const inProgressUnits = state.units.filter(u => u.status === 'Ongoing' || u.status === 'T&C' || u.status === 'Punchlist').length;
  const planningUnits = state.units.filter(u => u.status === 'Planning').length;

  const totalInventory = state.inventory.reduce((acc, i) => acc + i.quantity, 0);
  const operationalInventory = state.inventory.filter(i => i.status === 'Operational' || i.status === 'Deployed').reduce((acc, i) => acc + i.quantity, 0);
  const maintenanceInventory = state.inventory.filter(i => i.status === 'Under Maintenance').reduce((acc, i) => acc + i.quantity, 0);

  const totalDrawings = state.drawings.length;
  const approvedDrawings = state.drawings.filter(d => d.status === 'Approved' || d.status === 'Handover').length;

  const totalDocuments = state.documents.length;
  const approvedDocuments = state.documents.filter(d => d.status === 'Approved' || d.status === 'Handover').length;

  const totalBudget = state.projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = state.projects.reduce((acc, p) => acc + p.spent, 0);

  res.json({
    metrics: {
      totalProjects,
      totalUnits,
      completedUnits,
      inProgressUnits,
      planningUnits,
      overallProgress: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0,
      totalInventory,
      operationalInventory,
      maintenanceInventory,
      totalDrawings,
      approvedDrawings,
      totalDocuments,
      approvedDocuments,
      totalBudget,
      totalSpent
    },
    // Site Events Feed in Dashboard shows the latest manually recorded daily site events
    activities: [...state.activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  });
};

export const globalSearch = (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json({ results: { projects: [], units: [], inventory: [], team: [], documents: [], drawings: [] } });
  }

  const state = db.getState();

  const projects = state.projects.filter(p => 
    p.name.toLowerCase().includes(query) || p.location.toLowerCase().includes(query)
  );

  const units = state.units.filter(u => 
    u.unitId.toLowerCase().includes(query) || 
    u.siteName.toLowerCase().includes(query) || 
    u.model.toLowerCase().includes(query)
  );

  const inventory = state.inventory.filter(i => 
    i.equipment.toLowerCase().includes(query) || 
    i.specs.toLowerCase().includes(query) || 
    i.location.toLowerCase().includes(query)
  );

  const team = state.team.filter(t => 
    t.name.toLowerCase().includes(query) || 
    t.position.toLowerCase().includes(query) || 
    t.email.toLowerCase().includes(query)
  );

  const documents = state.documents.filter(d => 
    d.documentName.toLowerCase().includes(query) || 
    d.siteName.toLowerCase().includes(query)
  );

  const drawings = state.drawings.filter(dr => 
    dr.drawingTitle.toLowerCase().includes(query) || 
    dr.siteName.toLowerCase().includes(query) || 
    dr.system.toLowerCase().includes(query)
  );

  res.json({
    results: {
      projects,
      units,
      inventory,
      team,
      documents,
      drawings
    }
  });
};
