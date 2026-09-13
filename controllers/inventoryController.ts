import { Request, Response } from 'express';
import { db, InventoryItem } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getInventory = (req: Request, res: Response) => {
  const { siteId, status } = req.query;
  const state = db.getState();
  let items = state.inventory;

  if (siteId && siteId !== 'all') {
    items = items.filter(i => i.siteId === siteId);
  }
  if (status && status !== 'all') {
    items = items.filter(i => i.status.toLowerCase() === String(status).toLowerCase());
  }

  res.json({ inventory: items });
};

export const createInventory = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { equipment, specs, location, siteId, status, quantity, notes } = req.body;
    if (!equipment || !specs || !location || !status) {
      return res.status(400).json({ error: 'Equipment, specs, location, and status are required' });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId) || state.projects[0];

    const newItem: InventoryItem = {
      id: 'inv-' + Date.now(),
      equipment: equipment.trim(),
      specs: specs.trim(),
      location: location.trim(),
      siteId: site.id,
      siteName: site.name,
      status,
      quantity: Number(quantity) || 1,
      notes: notes || '',
      lastInspected: new Date().toISOString().split('T')[0]
    };

    state.inventory.push(newItem);

    state.activities.unshift({
      id: 'act-' + Date.now(),
      action: 'Inventory Registered',
      details: `${site.name}: Registered "${newItem.equipment}" at ${newItem.location}.`,
      category: 'Inventory',
      userName: req.user ? req.user.fullName : 'System',
      timestamp: new Date().toISOString()
    });

    db.save();
    res.status(201).json({ message: 'Equipment added', item: newItem });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

export const updateInventory = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { equipment, specs, location, status, quantity, notes, siteId } = req.body;

    const state = db.getState();
    const idx = state.inventory.findIndex(i => i.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = state.inventory[idx];
    if (equipment) item.equipment = equipment.trim();
    if (specs) item.specs = specs.trim();
    if (location) item.location = location.trim();
    if (status) item.status = status;
    if (quantity !== undefined) item.quantity = Number(quantity);
    if (notes !== undefined) item.notes = notes;
    if (siteId) {
      const site = state.projects.find(p => p.id === siteId);
      if (site) {
        item.siteId = site.id;
        item.siteName = site.name;
      }
    }
    item.lastInspected = new Date().toISOString().split('T')[0];

    state.inventory[idx] = item;
    db.save();
    res.json({ message: 'Inventory updated', item });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update inventory' });
  }
};

export const deleteInventory = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const item = state.inventory.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    state.inventory = state.inventory.filter(i => i.id !== id);
    db.save();
    res.json({ message: `Deleted ${item.equipment}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};
