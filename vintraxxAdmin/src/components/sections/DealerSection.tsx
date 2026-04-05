'use client';

import { useState, useEffect } from 'react';
import { api, User, UserDetail } from '@/lib/api';
import { StatusBadge } from '@/components/Dashboard';
import UserDetailModal from '@/components/modals/UserDetailModal';
import CreateUserModal from '@/components/modals/CreateUserModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import {
  Search, Plus, Trash2, Eye, Edit2, UserCheck, Smartphone, Car, Mail, Calendar, DollarSign, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function DealerSection() {
  const [dealers, setDealers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => { loadDealers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(dealers.filter(d => d.email.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)));
  }, [search, dealers]);

  const loadDealers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers('dealer');
      setDealers(res.users);
    } catch { toast.error('Failed to load dealers'); }
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
      toast.success('Dealer deleted');
      setDeleteTarget(null);
      loadDealers();
    } catch { toast.error('Failed to delete dealer'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search dealers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={loadDealers} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            <Plus size={18} />
            Add Dealer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserCheck size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{search ? 'No dealers match your search' : 'No dealers found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((dealer) => (
            <div
              key={dealer.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <UserCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{dealer.email}</p>
                    <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                      DEALER
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openDetail(dealer.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: dealer.id, email: dealer.email })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <DollarSign size={14} />
                  <span>Labor Rate: {dealer.pricePerLaborHour ? `$${dealer.pricePerLaborHour}/hr` : 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Car size={14} />
                  <span>{dealer._count.scans} scans</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Smartphone size={14} />
                  <span>{dealer._count.usedScannerDevices} devices &middot; {dealer._count.usedVins} VINs</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>Joined {new Date(dealer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => openDetail(dealer.id)}
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
          onRefresh={loadDealers}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          isDealer={true}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadDealers}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Dealer"
          message={`Delete dealer "${deleteTarget.email}" and all their data (scans, reports, devices)?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
