'use client';

import { useState, useEffect } from 'react';
import { api, User, UserDetail } from '@/lib/api';
import UserDetailModal from '@/components/modals/UserDetailModal';
import CreateUserModal from '@/components/modals/CreateUserModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import {
  Search, Plus, Trash2, Eye, Users, Smartphone, Car, Calendar, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function RegularSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u => u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)));
  }, [search, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers('regular');
      setUsers(res.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await api.getUserDetail(userId);
      setSelectedUser(res.user);
    } catch { toast.error('Failed to load user details'); setShowDetailModal(false); }
    finally { setDetailLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteUser(deleteTarget.id);
      toast.success('User deleted');
      setDeleteTarget(null);
      loadUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search regular users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={loadUsers} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{search ? 'No users match your search' : 'No regular users found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.email}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{user.authProvider}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openDetail(user.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: user.id, email: user.email })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Car size={14} />
                  <span>{user._count.scans} scans</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Smartphone size={14} />
                  <span>{user._count.usedScannerDevices} devices &middot; {user._count.usedVins} VINs</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => openDetail(user.id)}
                className="w-full mt-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                View Scan History
              </button>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && (
        <UserDetailModal
          user={selectedUser}
          loading={detailLoading}
          onClose={() => { setShowDetailModal(false); setSelectedUser(null); }}
          onRefresh={loadUsers}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          isDealer={false}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadUsers}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete User"
          message={`Delete user "${deleteTarget.email}" and all their data (scans, reports, devices)?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
