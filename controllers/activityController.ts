import { Request, Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getActivities = (req: Request, res: Response) => {
  const state = db.getState();

  // Latest records first, hard capped at the 50 most recent entries
  const activities = [...state.activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  res.json({ activities });
};

// ==========================================================
// MANUAL RECORDING ONLY
// Site Events are intentionally NOT written automatically by
// other controllers. Field staff/admins manually log daily
// on-site happenings such as safety meetings, site visits,
// audits, weather interruptions, incidents, utilities,
// hauling, deliveries and other events.
// Categories: Safety, Visits, Audits, Weather, Incidents,
// Utilities, Hauling, Others
// ==========================================================
export const createActivity = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, action, details, category, userName, timestamp } = req.body;

    if (!siteId || !action) {
      return res.status(400).json({ error: 'Site and site event title are required' });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId);
    if (!site) {
      return res.status(400).json({ error: 'Referenced site project not found' });
    }

    const newActivity = {
      id: 'act-' + Date.now(),
      siteId,
      siteName: site.name,
      action: String(action).trim(),
      details: details ? String(details).trim() : '',
      category: category ? String(category).trim() : 'Others',
      userName: userName && String(userName).trim()
        ? String(userName).trim()
        : (req.user ? req.user.fullName : 'Unrecorded'),
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    };

    if (!state.activities) {
      state.activities = [];
    }
    state.activities.push(newActivity);
    db.save();

    res.status(201).json({ message: 'Site event logged successfully', activity: newActivity });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record site event' });
  }
};
