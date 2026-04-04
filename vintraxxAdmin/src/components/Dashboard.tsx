'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/components/ThemeProvider';
import { api, DashboardStats } from '@/lib/api';
import DealerSection from '@/components/sections/DealerSection';
import RegularSection from '@/components/sections/RegularSection';
import HistorySection from '@/components/sections/HistorySection';
import SettingsSection from '@/components/sections/SettingsSection';
import {
  LayoutDashboard, Users, UserCheck, History, Settings, LogOut,
  Moon, Sun, Shield, Menu, X, ChevronDown,
  TrendingUp, Car, FileText, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'overview' | 'dealers' | 'regular' | 'history' | 'settings';

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.getDashboard();
      setStats(res.stats);
    } catch (err: any) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'dealers', label: 'Dealers', icon: <UserCheck size={20} /> },
    { id: 'regular', label: 'Regular Users', icon: <Users size={20} /> },
    { id: 'history', label: 'Scan History', icon: <History size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(api.getBackupUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vintraxx-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch {
      toast.error('Failed to download backup');
    }
  };

  return (
    <div className="min-h-screen flex bg-[rgb(var(--background))]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg">VinTraxx</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === item.id
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={handleBackup}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <FileText size={20} />
            Download Backup
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {tab === 'overview' ? 'Dashboard' : navItems.find(n => n.id === tab)?.label}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{admin?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {tab === 'overview' && <OverviewTab stats={stats} loading={loading} onNavigate={setTab} />}
          {tab === 'dealers' && <DealerSection />}
          {tab === 'regular' && <RegularSection />}
          {tab === 'history' && <HistorySection />}
          {tab === 'settings' && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab({ stats, loading, onNavigate }: { stats: DashboardStats | null; loading: boolean; onNavigate: (tab: Tab) => void }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">Failed to load stats</p>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={22} />, color: 'blue', onClick: () => {} },
    { label: 'Dealers', value: stats.totalDealers, icon: <UserCheck size={22} />, color: 'emerald', onClick: () => onNavigate('dealers') },
    { label: 'Regular Users', value: stats.totalRegular, icon: <Users size={22} />, color: 'violet', onClick: () => onNavigate('regular') },
    { label: 'Total Scans', value: stats.totalScans, icon: <Car size={22} />, color: 'amber', onClick: () => onNavigate('history') },
    { label: 'Reports Generated', value: stats.totalReports, icon: <FileText size={22} />, color: 'rose', onClick: () => onNavigate('history') },
    { label: 'Inspections', value: stats.totalInspections, icon: <ClipboardList size={22} />, color: 'cyan', onClick: () => onNavigate('history') },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };

  const bgColorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-500/10',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10',
    violet: 'bg-violet-50 dark:bg-violet-500/10',
    amber: 'bg-amber-50 dark:bg-amber-500/10',
    rose: 'bg-rose-50 dark:bg-rose-500/10',
    cyan: 'bg-cyan-50 dark:bg-cyan-500/10',
  };

  const textColorMap: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={card.onClick}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-left hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${bgColorMap[card.color]} flex items-center justify-center ${textColorMap[card.color]}`}>
                {card.icon}
              </div>
              <TrendingUp size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Recent Scans */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Scans</h3>
          <button onClick={() => onNavigate('history')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">VIN</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats.recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-mono text-gray-900 dark:text-white">{scan.vin}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      {scan.user.email}
                      {scan.user.isDealer && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          DEALER
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(scan.receivedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
    FAILED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
    RECEIVED: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
    ANALYZING: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    GENERATING_PDF: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
    EMAILING: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    DECODING_VIN: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  };

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md ${colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
