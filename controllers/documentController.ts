import { Request, Response } from 'express';
import { db, ConstructionDocument } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getDocuments = (req: Request, res: Response) => {
  const { siteId, status } = req.query;
  const state = db.getState();
  let docs = state.documents;

  if (siteId && siteId !== 'all') {
    docs = docs.filter(d => d.siteId === siteId);
  }
  if (status && status !== 'all') {
    docs = docs.filter(d => d.status.toLowerCase() === String(status).toLowerCase());
  }

  res.json({ documents: docs });
};

export const createDocument = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, documentName, category, status, fileSize } = req.body;
    if (!siteId || !documentName || !status) {
      return res.status(400).json({ error: 'siteId, documentName, and status are required' });
    }

    const state = db.getState();
    const site = state.projects.find(p => p.id === siteId) || state.projects[0];

    const newDoc: ConstructionDocument = {
      id: 'doc-' + Date.now(),
      siteId: site.id,
      siteName: site.name,
      documentName: documentName.trim(),
      category: category || 'Permit / Clearances',
      status,
      uploadedBy: req.user ? req.user.fullName : 'Engineering Staff',
      fileSize: fileSize || '3.2 MB',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    state.documents.push(newDoc);
    db.save();
    res.status(201).json({ message: 'Document added', document: newDoc });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export const updateDocument = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, documentName, category, siteId } = req.body;

    const state = db.getState();
    const idx = state.documents.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = state.documents[idx];
    if (status) doc.status = status;
    if (documentName) doc.documentName = documentName.trim();
    if (category) doc.category = category;
    if (siteId) {
      const site = state.projects.find(p => p.id === siteId);
      if (site) {
        doc.siteId = site.id;
        doc.siteName = site.name;
      }
    }
    doc.updatedAt = new Date().toISOString().split('T')[0];

    state.documents[idx] = doc;
    db.save();
    res.json({ message: 'Document updated', document: doc });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const doc = state.documents.find(d => d.id === id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    state.documents = state.documents.filter(d => d.id !== id);
    db.save();
    res.json({ message: `Deleted ${doc.documentName}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
