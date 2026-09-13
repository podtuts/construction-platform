import { Request, Response } from 'express';
import { db, Contact } from '../database/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getContacts = (req: Request, res: Response) => {
  const state = db.getState();
  res.json({ contacts: state.contacts });
};

export const createContact = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, company, position, mobileNo, email } = req.body;
    if (!name || !mobileNo || !email) {
      return res.status(400).json({ error: 'Name, mobile number, and email are required' });
    }

    const state = db.getState();
    const newContact: Contact = {
      id: 'ct-' + Date.now(),
      name: name.trim(),
      company: company ? company.trim() : '',
      position: position ? position.trim() : '',
      mobileNo: mobileNo.trim(),
      email: email.trim()
    };

    state.contacts.push(newContact);
    db.save();
    res.status(201).json({ message: 'Contact created', contact: newContact });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const updateContact = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, company, position, mobileNo, email } = req.body;

    const state = db.getState();
    const idx = state.contacts.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contact = state.contacts[idx];
    if (name) contact.name = name.trim();
    if (company !== undefined) contact.company = company.trim();
    if (position !== undefined) contact.position = position.trim();
    if (mobileNo) contact.mobileNo = mobileNo.trim();
    if (email) contact.email = email.trim();

    state.contacts[idx] = contact;
    db.save();
    res.json({ message: 'Contact updated', contact });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const state = db.getState();
    const contact = state.contacts.find(c => c.id === id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    state.contacts = state.contacts.filter(c => c.id !== id);
    db.save();
    res.json({ message: `Removed ${contact.name}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
