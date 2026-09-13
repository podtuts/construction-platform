import { Request, Response } from 'express';
import { db, ScheduleItem, ScheduleStatus } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getSchedules = (req: Request, res: Response) => {
  try {
    const { siteId, status, search } = req.query;
    const state = db.getState();
    let schedules = state.schedules || [];

    if (siteId && siteId !== 'all') {
      schedules = schedules.filter(s => s.siteId === siteId);
    }

    if (status && status !== 'all') {
      schedules = schedules.filter(s => s.status.toLowerCase() === String(status).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      schedules = schedules.filter(s =>
        s.activity.toLowerCase().includes(q) ||
        s.attendees.toLowerCase().includes(q) ||
        s.siteName.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }

    // Sort by date ascending
    schedules = [...schedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ schedules });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch schedule events' });
  }
};

export const createSchedule = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, date, startTime, endTime, activity, attendees, notes, status } = req.body;

    if (!siteId || !date || !startTime || !endTime || !activity) {
      return res.status(400).json({ error: 'Site, date, start time, end time, and activity description are required' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId);
    if (!site) {
      return res.status(400).json({ error: 'Referenced site project not found' });
    }

    const newSchedule: ScheduleItem = {
      id: 'sched-' + Date.now(),
      siteId,
      siteName: site.name,
      date,
      startTime,
      endTime,
      activity: activity.trim(),
      attendees: (attendees || '').trim(),
      notes: (notes || '').trim(),
      status: (status as ScheduleStatus) || 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!state.schedules) {
      state.schedules = [];
    }
    state.schedules.push(newSchedule);
    db.save();

    res.status(201).json({ message: 'Schedule event created successfully', schedule: newSchedule });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create schedule event' });
  }
};

export const updateSchedule = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { siteId, date, startTime, endTime, activity, attendees, notes, status } = req.body;

    const state = db.getState();
    if (!state.schedules) state.schedules = [];
    const idx = state.schedules.findIndex(s => s.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Schedule event not found' });
    }

    const existing = state.schedules[idx];

    if (siteId) {
      const site = state.projects.find(p => p.id === siteId);
      if (site) {
        existing.siteId = siteId;
        existing.siteName = site.name;
      }
    }

    if (date) existing.date = date;
    if (startTime !== undefined) existing.startTime = startTime;
    if (endTime !== undefined) existing.endTime = endTime;
    if ((startTime !== undefined || endTime !== undefined) &&
      (existing.endTime || '') <= (existing.startTime || '')) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    if (activity) existing.activity = activity.trim();
    if (attendees !== undefined) existing.attendees = attendees.trim();
    if (notes !== undefined) existing.notes = notes.trim();
    if (status) existing.status = status as ScheduleStatus;
    existing.updatedAt = new Date().toISOString();

    state.schedules[idx] = existing;
    db.save();

    res.json({ message: 'Schedule event updated successfully', schedule: existing });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update schedule event' });
  }
};

export const deleteSchedule = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    if (!state.schedules) state.schedules = [];

    const existing = state.schedules.find(s => s.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Schedule event not found' });
    }

    state.schedules = state.schedules.filter(s => s.id !== id);
    db.save();

    res.json({ message: 'Schedule event deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete schedule event' });
  }
};
