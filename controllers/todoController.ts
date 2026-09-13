import { Request, Response } from 'express';
import { db, TodoItem, TodoStatus } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getTodos = (req: Request, res: Response) => {
  try {
    const { siteId, status, search } = req.query;
    const state = db.getState();
    let todos = state.todos || [];

    if (siteId && siteId !== 'all') {
      todos = todos.filter(t => t.siteId === siteId);
    }

    if (status && status !== 'all') {
      todos = todos.filter(t => t.status.toLowerCase() === String(status).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      todos = todos.filter(t => 
        t.task.toLowerCase().includes(q) || 
        t.name.toLowerCase().includes(q) ||
        t.siteName.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    res.json({ todos });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch to-do tasks' });
  }
};

export const createTodo = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, dateAssigned, name, task, dueDate, notes, status } = req.body;

    if (!siteId || !name || !task) {
      return res.status(400).json({ error: 'Site, assigned staff name, and task are required' });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId);
    if (!site) {
      return res.status(400).json({ error: 'Referenced site project not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newTodo: TodoItem = {
      id: 'todo-' + Date.now(),
      siteId,
      siteName: site.name,
      dateAssigned: dateAssigned || todayStr,
      name: name.trim(),
      task: task.trim(),
      dueDate: dueDate || todayStr,
      notes: (notes || '').trim(),
      status: (status as TodoStatus) || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!state.todos) {
      state.todos = [];
    }
    state.todos.unshift(newTodo);
    db.save();

    res.status(201).json({ message: 'Task assigned successfully', todo: newTodo });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create to-do task' });
  }
};

export const updateTodo = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { siteId, dateAssigned, name, task, dueDate, notes, status } = req.body;

    const state = db.getState();
    if (!state.todos) state.todos = [];
    const idx = state.todos.findIndex(t => t.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'To-do task not found' });
    }

    const existing = state.todos[idx];

    if (siteId) {
      const site = state.projects.find(p => p.id === siteId);
      if (site) {
        existing.siteId = siteId;
        existing.siteName = site.name;
      }
    }

    if (dateAssigned) existing.dateAssigned = dateAssigned;
    if (name) existing.name = name.trim();
    if (task) existing.task = task.trim();
    if (dueDate) existing.dueDate = dueDate;
    if (notes !== undefined) existing.notes = notes.trim();
    if (status) existing.status = status as TodoStatus;
    existing.updatedAt = new Date().toISOString();

    state.todos[idx] = existing;
    db.save();

    res.json({ message: 'Task updated successfully', todo: existing });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update to-do task' });
  }
};

export const deleteTodo = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    if (!state.todos) state.todos = [];

    const existing = state.todos.find(t => t.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'To-do task not found' });
    }

    state.todos = state.todos.filter(t => t.id !== id);
    db.save();

    res.json({ message: 'Task deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete to-do task' });
  }
};
