import { Request, Response } from 'express';
import { db, TeamMember } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getTeam = (req: Request, res: Response) => {
  const { site } = req.query;
  const state = db.getState();
  let members = state.team;

  if (site && site !== 'all') {
    members = members.filter(m => m.sites.some(s => s.toLowerCase().includes(String(site).toLowerCase())));
  }

  res.json({ team: members });
};

export const createTeamMember = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, position, idPhoto, mobileNo, email, sites, department } = req.body;
    if (!name || !position || !mobileNo || !email) {
      return res.status(400).json({ error: 'Name, position, mobile number, and email are required' });
    }

    // Only superuser accounts may set/upload a team member photo ID
    if (idPhoto !== undefined && req.user?.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superuser accounts can upload or set team member photos' });
    }

    const state = db.getState();
    const newMember: TeamMember = {
      id: 'tm-' + Date.now(),
      name: name.trim(),
      position: position.trim(),
      idPhoto: idPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      mobileNo: mobileNo.trim(),
      email: email.trim(),
      sites: Array.isArray(sites) ? sites : [String(sites)],
      department: department || 'Operations'
    };

    state.team.push(newMember);
    db.save();
    res.status(201).json({ message: 'Team member created', member: newMember });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create team member' });
  }
};

export const updateTeamMember = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, position, idPhoto, mobileNo, email, sites, department } = req.body;

    const state = db.getState();
    const idx = state.team.findIndex(t => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const member = state.team[idx];
    // Only superuser accounts may change a team member photo ID
    if (
      idPhoto !== undefined &&
      idPhoto.trim() !== member.idPhoto &&
      req.user?.role !== 'superuser'
    ) {
      return res.status(403).json({ error: 'Only superuser accounts can change team member photos' });
    }
    if (name) member.name = name.trim();
    if (position) member.position = position.trim();
    if (idPhoto) member.idPhoto = idPhoto.trim();
    if (mobileNo) member.mobileNo = mobileNo.trim();
    if (email) member.email = email.trim();
    if (sites) member.sites = Array.isArray(sites) ? sites : [String(sites)];
    if (department) member.department = department.trim();

    state.team[idx] = member;
    db.save();
    res.json({ message: 'Team member updated', member });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update team member' });
  }
};

export const deleteTeamMember = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const member = state.team.find(t => t.id === id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    state.team = state.team.filter(t => t.id !== id);
    db.save();
    res.json({ message: `Removed ${member.name}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete team member' });
  }
};
