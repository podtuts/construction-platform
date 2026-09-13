import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Eye, EyeOff, Lock, UserCheck } from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export const AccountsView: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    username: string;
    loading: boolean;
  }>({
    isOpen: false,
    id: '',
    username: '',
    loading: false
  });

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formModalError, setFormModalError] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users || []);
    } catch (e: any) {
      console.error('Error fetching users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const canEditUser = (target: User): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'superuser') return true; // Superuser can edit all roles
    if (currentUser.role === 'admin') {
      // Admin can only edit admin and user roles, never superuser
      return target.role === 'admin' || target.role === 'user';
    }
    // Normal user can only edit their own profile
    return currentUser.id === target.id;
  };

  const openEditModal = (u: User) => {
    setTargetUser(u);
    setFormUsername(u.username);
    setFormFullName(u.fullName);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPassword('');
    setShowPassword(false);
    setFormModalError('');
    setIsEditModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormModalError('');

    if (!formUsername.trim() || !formPassword) {
      setFormModalError('Username and Password are required');
      return;
    }

    try {
      await api.createUser({
        username: formUsername.trim(),
        password: formPassword,
        role: formRole,
        fullName: formFullName.trim() || formUsername,
        email: formEmail.trim() || `${formUsername.toLowerCase()}@constructpulse.com`
      });

      setFeedback({ type: 'success', message: `Account @${formUsername} created successfully!` });
      setIsAddModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setFormModalError(err.message || 'Failed to create account');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setFormModalError('');

    try {
      const updatePayload: any = {
        username: formUsername.trim(),
        fullName: formFullName.trim(),
        email: formEmail.trim(),
        role: formRole
      };

      if (formPassword.trim()) {
        updatePayload.password = formPassword.trim();
      }

      await api.updateUser(targetUser.id, updatePayload);
      setFeedback({
        type: 'success',
        message: `Account @${formUsername} and security credentials updated!`
      });
      setIsEditModalOpen(false);
      loadUsers();
      if (currentUser?.id === targetUser.id) {
        refreshUser();
      }
    } catch (err: any) {
      setFormModalError(err.message || 'Failed to update credentials');
    }
  };

  const promptDeleteUser = (id: string, uname: string) => {
    setDeleteModalState({
      isOpen: true,
      id,
      username: uname,
      loading: false
    });
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteModalState.id) return;
    try {
      setDeleteModalState((prev) => ({ ...prev, loading: true }));
      await api.deleteUser(deleteModalState.id);
      setFeedback({ type: 'success', message: `Account @${deleteModalState.username} deleted.` });
      setDeleteModalState({ isOpen: false, id: '', username: '', loading: false });
      loadUsers();
    } catch (err: any) {
      setDeleteModalState((prev) => ({ ...prev, loading: false }));
      setFeedback({ type: 'error', message: err.message || 'Failed to delete user' });
    }
  };

  const isSuperuser = currentUser?.role === 'superuser';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-medium text-white tracking-tight flex items-center">
            <Shield className="w-5 h-5 mr-2 text-[#0090FF]" />
            Accounts & Access Control (RBAC)
          </h2>
          <p className="text-[13px] text-[#8D93A1] mt-0.5">
            Role privileges: <span className="text-[#8F5FE8] font-medium">Superuser</span> can edit all
            roles/passwords. <span className="text-[#0090FF] font-medium">Admin</span> can edit admin and user roles/passwords.
          </p>
        </div>

        {(isSuperuser || isAdmin) && (
          <button
            onClick={() => {
              setFormUsername('');
              setFormFullName('');
              setFormEmail('');
              setFormRole('user');
              setFormPassword('');
              setShowPassword(false);
              setFormModalError('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center px-3.5 py-2 bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium rounded-[5px] transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add User Account</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-[6px] text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-[#00D25B]/10 border-[#00D25B]/30 text-[#00D25B]'
              : 'bg-[#FC424A]/10 border-[#FC424A]/30 text-[#FC424A]'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-white hover:opacity-80 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Role Privilege Indicator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#191C24] border border-[#8F5FE8]/30 rounded-[8px] p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white">Superuser Privilege</span>
            <StatusBadge status="superuser" size="sm" />
          </div>
          <p className="text-[12px] text-[#8D93A1]">
            Unrestricted access: Can modify all roles (superuser, admin, user), update usernames, and reset passwords.
          </p>
        </div>

        <div className="bg-[#191C24] border border-[#0090FF]/30 rounded-[8px] p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white">Admin Privilege</span>
            <StatusBadge status="admin" size="sm" />
          </div>
          <p className="text-[12px] text-[#8D93A1]">
            Restricted access: Can only edit admin and user accounts & passwords. Cannot alter superuser accounts.
          </p>
        </div>

        <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white">User Privilege</span>
            <StatusBadge status="user" size="sm" />
          </div>
          <p className="text-[12px] text-[#8D93A1]">
            Standard field operational access: Read-only for administrative accounts and credentials.
          </p>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-[#191C24] border border-[#2A2E38] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171A21] text-[#8D93A1] uppercase text-[10px] tracking-wider border-b border-[#2A2E38]">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Username (Login)</th>
                <th className="py-3 px-4 font-semibold">Role Privilege</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Created Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E38]/60 text-white">
              {users.map((u) => {
                const canEditThis = canEditUser(u);
                const isCurrent = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-[#20232C]/40 transition-colors">
                    <td className="py-3.5 px-4 flex items-center space-x-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={u.fullName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-[#2A2E38]"
                      />
                      <div>
                        <span className="font-semibold text-white flex items-center">
                          {u.fullName}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] bg-[#0090FF]/20 text-[#0090FF] px-1.5 py-0.2 rounded font-normal">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#0090FF]">@{u.username}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={u.role} size="md" />
                    </td>
                    <td className="py-3.5 px-4 text-[#8D93A1]">{u.email}</td>
                    <td className="py-3.5 px-4 text-[#8D93A1] text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {canEditThis ? (
                        <>
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] hover:text-[#0090FF] transition-colors"
                            title="Edit Account Credentials & Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {/* Cannot delete oneself, and admin cannot delete superuser */}
                          {!isCurrent && (isSuperuser || (isAdmin && u.role !== 'superuser')) && (
                            <button
                              onClick={() => promptDeleteUser(u.id, u.username)}
                              className="p-1.5 rounded bg-[#20232C] hover:bg-[#FC424A]/20 text-[#8D93A1] hover:text-[#FC424A] transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-[#626875] italic">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New User Account"
        subtitle="Configure credentials and RBAC access tier"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formModalError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formModalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Username (Case Insensitive)</label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="e.g. jdoe"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Full Name</label>
              <input
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Email Address</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="jdoe@constructpulse.com"
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Role Privilege</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              >
                {isSuperuser && <option value="superuser">Superuser (Full Control)</option>}
                <option value="admin">Admin (Site & Account Manager)</option>
                <option value="user">User (Operational Staff)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8D93A1] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Min 6 chars (accepts small & capital letters)"
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 pr-10 focus:outline-none focus:border-[#0090FF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626875] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#626875] mt-1">
              Supports special characters, numbers, uppercase and lowercase letters.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#2A2E38]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-[5px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[5px] bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User & Password Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit User Credentials: @${targetUser?.username}`}
        subtitle="Update account details, role permissions, or reset login password"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {formModalError && (
            <div className="p-2.5 rounded bg-[#FC424A]/10 border border-[#FC424A]/30 text-[#FC424A] text-xs">
              {formModalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Username</label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Full Name</label>
              <input
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                required
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8D93A1] mb-1">Role Privilege</label>
              <select
                value={formRole}
                disabled={!isSuperuser && targetUser?.role === 'admin'}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full bg-[#20232C] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 focus:outline-none focus:border-[#0090FF] disabled:opacity-50"
              >
                {isSuperuser && <option value="superuser">Superuser</option>}
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#20232C]/60 rounded-[6px] border border-[#2A2E38]">
            <label className="block text-xs font-semibold text-white mb-1 flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1.5 text-[#0090FF]" />
              Reset Password (Leave blank to keep current)
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter new password to change..."
                className="w-full bg-[#191C24] border border-[#2A2E38] text-white text-xs rounded-[5px] p-2.5 pr-10 focus:outline-none focus:border-[#0090FF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626875] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#2A2E38]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-[5px] bg-[#20232C] hover:bg-[#2A2E38] text-[#8D93A1] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[5px] bg-[#0090FF] hover:bg-[#0080E0] text-white text-xs font-medium"
            >
              Update Credentials
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: '', username: '', loading: false })}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user account? Their credentials and access will be immediately revoked."
        itemName={`@${deleteModalState.username}`}
        isLoading={deleteModalState.loading}
      />
    </div>
  );
};
