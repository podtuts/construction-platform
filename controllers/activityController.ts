import { Request, Response } from 'express';
import { db } from '../database/db';

export const getActivities = (req: Request, res: Response) => {
  const state = db.getState();

  // Latest records first, hard capped at the 50 most recent entries
  const activities = [...state.activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  res.json({ activities });
};
