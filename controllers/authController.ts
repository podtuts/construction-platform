import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../database/db';
import { AuthenticatedRequest, generateToken } from '../middleware/authMiddleware';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const state = db.getState();
    // Allow case-insensitive matching for username while preserving password accuracy
    const normalizedUsername = String(username).trim().toLowerCase();

    const user = state.users.find(u => u.username.toLowerCase() === normalizedUsername);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user, Boolean(rememberMe));

    // Log activity
    state.activities.unshift({
      id: 'act-' + Date.now(),
      action: 'User Signed In',
      details: `${user.fullName} (${user.username}) logged in as ${user.role}.`,
      category: 'Auth',
      userName: user.fullName,
      timestamp: new Date().toISOString()
    });
    db.save();

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service failure' });
  }
};

export const getMe = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { passwordHash, ...safeUser } = req.user;
  res.json({ user: safeUser });
};

export const getUsers = (req: AuthenticatedRequest, res: Response) => {
  const state = db.getState();
  const safeUsers = state.users.map(({ passwordHash, ...safe }) => safe);
  res.json({ users: safeUsers });
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentOperator = req.user!;
    const { id } = req.params;
    const { username, password, role, fullName, email, avatarUrl } = req.body;

    const state = db.getState();
    const targetIndex = state.users.findIndex(u => u.id === id);

    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const targetUser = state.users[targetIndex];

    // Rule:
    // superuser can edit all roles username and password.
    // admin can only edit admin and user username and password.
    if (currentOperator.role === 'admin') {
      if (targetUser.role === 'superuser') {
        return res.status(403).json({ error: 'Admins cannot modify superuser accounts' });
      }
      if (role && role === 'superuser') {
        return res.status(403).json({ error: 'Admins cannot promote accounts to superuser' });
      }
    } else if (currentOperator.role === 'user') {
      if (currentOperator.id !== targetUser.id) {
        return res.status(403).json({ error: 'Standard users can only update their own profile' });
      }
      if (role && role !== targetUser.role) {
        return res.status(403).json({ error: 'Cannot modify your own account privileges' });
      }
    }

    if (username) {
      const lowerNew = String(username).trim().toLowerCase();
      const duplicate = state.users.find(u => u.id !== id && u.username.toLowerCase() === lowerNew);
      if (duplicate) {
        return res.status(400).json({ error: `Username "${username}" is already in use` });
      }
      targetUser.username = String(username).trim();
    }

    if (password && password.trim().length > 0) {
      targetUser.passwordHash = bcrypt.hashSync(password.trim(), 10);
    }

    if (role && (currentOperator.role === 'superuser' || (currentOperator.role === 'admin' && role !== 'superuser'))) {
      targetUser.role = role;
    }

    if (fullName) targetUser.fullName = fullName.trim();
    if (email) targetUser.email = email.trim();
    if (avatarUrl) targetUser.avatarUrl = avatarUrl.trim();

    state.users[targetIndex] = targetUser;

    state.activities.unshift({
      id: 'act-' + Date.now(),
      action: 'Account Updated',
      details: `${currentOperator.fullName} modified credentials/profile for ${targetUser.username} (${targetUser.role}).`,
      category: 'Auth',
      userName: currentOperator.fullName,
      timestamp: new Date().toISOString()
    });

    db.save();

    const { passwordHash, ...safe } = targetUser;
    res.json({ message: 'User updated successfully', user: safe });
  } catch (err: any) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error while updating user' });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentOperator = req.user!;
    const { username, password, role, fullName, email, avatarUrl } = req.body;

    if (!username || !password || !role || !fullName) {
      return res.status(400).json({ error: 'Username, password, role, and full name are required' });
    }

    // Role privilege check
    if (currentOperator.role === 'admin' && role === 'superuser') {
      return res.status(403).json({ error: 'Admins cannot create superuser accounts' });
    }

    const state = db.getState();
    const normalizedUsername = String(username).trim().toLowerCase();

    if (state.users.some(u => u.username.toLowerCase() === normalizedUsername)) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      username: String(username).trim(),
      passwordHash: bcrypt.hashSync(password.trim(), 10),
      role,
      fullName: fullName.trim(),
      email: email ? email.trim() : `${normalizedUsername}@company.com`,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    state.users.push(newUser);

    state.activities.unshift({
      id: 'act-' + Date.now(),
      action: 'New Account Created',
      details: `Account ${newUser.username} (${newUser.role}) was created by ${currentOperator.fullName}.`,
      category: 'Auth',
      userName: currentOperator.fullName,
      timestamp: new Date().toISOString()
    });

    db.save();

    const { passwordHash, ...safe } = newUser;
    res.status(201).json({ message: 'User created successfully', user: safe });
  } catch (err: any) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error while creating user' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentOperator = req.user!;
    const { id } = req.params;

    if (currentOperator.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own active account' });
    }

    const state = db.getState();
    const targetUser = state.users.find(u => u.id === id);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === 'usr-1') {
      return res.status(403).json({ error: 'The primary system superuser account cannot be deleted' });
    }

    state.users = state.users.filter(u => u.id !== id);

    state.activities.unshift({
      id: 'act-' + Date.now(),
      action: 'Account Deleted',
      details: `User account ${targetUser.username} removed by ${currentOperator.fullName}.`,
      category: 'Auth',
      userName: currentOperator.fullName,
      timestamp: new Date().toISOString()
    });

    db.save();

    res.json({ message: `User ${targetUser.username} deleted successfully` });
  } catch (err: any) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error while deleting user' });
  }
};
