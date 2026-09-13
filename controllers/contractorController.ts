import { Request, Response } from 'express';
import { db, Contractor } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getContractors = (req: Request, res: Response) => {
  const { siteId } = req.query;
  const state = db.getState();
  let contractors = state.contractors;

  if (siteId && siteId !== 'all') {
    contractors = contractors.filter(c => c.siteId === siteId);
  }

  res.json({ contractors });
};

export const createContractor = (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      companyName,
      staffCount,
      siteId,
      scopeOfWork,
      contactPerson,
      contactMobileNo,
      contactEmail
    } = req.body;
    if (!companyName || !contactPerson || !contactMobileNo || !contactEmail) {
      return res.status(400).json({
        error: 'Company name, contact person, mobile number, and email are required'
      });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId);

    const newContractor: Contractor = {
      id: 'cn-' + Date.now(),
      companyName: companyName.trim(),
      staffCount: Number(staffCount) || 0,
      siteId: site ? site.id : '',
      siteName: site ? site.name : 'Unassigned',
      scopeOfWork: scopeOfWork ? scopeOfWork.trim() : '',
      contactPerson: contactPerson.trim(),
      contactMobileNo: contactMobileNo.trim(),
      contactEmail: contactEmail.trim()
    };

    state.contractors.push(newContractor);
    db.save();
    res.status(201).json({ message: 'Contractor created', contractor: newContractor });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create contractor' });
  }
};

export const updateContractor = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      staffCount,
      siteId,
      scopeOfWork,
      contactPerson,
      contactMobileNo,
      contactEmail
    } = req.body;

    const state = db.getState();
    const idx = state.contractors.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const contractor = state.contractors[idx];
    if (companyName) contractor.companyName = companyName.trim();
    if (staffCount !== undefined) contractor.staffCount = Number(staffCount) || 0;
    if (scopeOfWork !== undefined) contractor.scopeOfWork = scopeOfWork.trim();
    if (contactPerson) contractor.contactPerson = contactPerson.trim();
    if (contactMobileNo) contractor.contactMobileNo = contactMobileNo.trim();
    if (contactEmail) contractor.contactEmail = contactEmail.trim();
    if (siteId !== undefined) {
      const site = state.projects.find(p => p.id === siteId);
      contractor.siteId = site ? site.id : '';
      contractor.siteName = site ? site.name : 'Unassigned';
    }

    state.contractors[idx] = contractor;
    db.save();
    res.json({ message: 'Contractor updated', contractor });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update contractor' });
  }
};

export const deleteContractor = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const contractor = state.contractors.find(c => c.id === id);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    state.contractors = state.contractors.filter(c => c.id !== id);
    db.save();
    res.json({ message: `Removed ${contractor.companyName}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete contractor' });
  }
};
