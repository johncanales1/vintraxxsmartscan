'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/components/ThemeProvider';
import { api, DashboardStats, GpsOverviewStats, GpsAlarm } from '@/lib/api';
import DealerSection from '@/components/sections/DealerSection';
import RegularSection from '@/components/sections/RegularSection';
import HistorySection from '@/components/sections/HistorySection';
import ScheduleSection from '@/components/sections/ScheduleSection';
import InspectionSection from '@/components/sections/InspectionSection';
import SettingsSection from '@/components/sections/SettingsSection';
import GpsTerminalsSection from '@/components/sections/GpsTerminalsSection';
import GpsAlarmsSection from '@/components/sections/GpsAlarmsSection';
import GpsFleetMapSection from '@/components/sections/GpsFleetMapSection';
import GpsDtcsSection from '@/components/sections/GpsDtcsSection';
import GpsCommandsSection from '@/components/sections/GpsCommandsSection';
import GpsAuditLogSection from '@/components/sections/GpsAuditLogSection';
import RealtimePill from '@/components/RealtimePill';
import BackupModal from '@/components/modals/BackupModal';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import { fmtMiles, fmtRelative, severityColor, alarmTypeLabel } from '@/lib/gpsHelpers';
import {
  LayoutDashboard, Users, UserCheck, History, Settings, LogOut,
  Moon, Sun, Shield, Menu,
  TrendingUp, Car, FileText, ClipboardList, CalendarDays, DollarSign,
  Radio, Map as MapIcon, Bell, AlertTriangle, Send, FileSearch, Activity
} from 'lucide-react';
import { toast } from 'sonner';

type Tab =
  | 'overview' | 'dealers' | 'regular' | 'history' | 'schedule' | 'inspection' | 'settings'
  | 'gps-terminals' | 'gps-alarms' | 'gps-fleet' | 'gps-dtcs' | 'gps-commands' | 'audit';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  /** When set and > 0, shows a small pill badge next to the label. */
  badge?: number;
}

interface NavGroup {
  /** Group header. `null` for the top-level Overview row. */
  label: string | null;
  items: NavItem[];
}

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gpsStats, setGpsStats] = useState<GpsOverviewStats | null>(null);
  const [recentAlarms, setRecentAlarms] = useState<GpsAlarm[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  // History supports a third 'dtc' tab as of the GPS integration; the
  // string union here mirrors HistorySection's HistoryTab type.
  const [historyInitialTab, setHistoryInitialTab] = useState<'scans' | 'appraisals' | 'dtc'>('scans');
  const [terminalsInitialOwnerId, setTerminalsInitialOwnerId] = useState<string | undefined>(undefined);
  const [alarmsInitialTerminalId, setAlarmsInitialTerminalId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadStats();
    // Best-effort eager connect of the GPS WS so the RealtimePill flips
    // green during the first paint instead of waiting for it to mount.
    gpsAdminWs.connect();
  }, []);

  // Refresh the unack alarm count on the sidebar badge AND the Recent
  // Alarms list whenever the WS delivers a new alarm or an ack. We
  // re-fetch stats rather than mutate locally because acks can be done by
  // other admins. The recent-alarms list was previously frozen between
  // mount and page reload; that blind-spot is unacceptable on an alarms
  // console, so we fan out a second tiny fetch alongside.
  useEffect(() => {
    const refresh = () => {
      api.getGpsOverview()
        .then((res) => setGpsStats(res.stats))
        .catch(() => {});
      api.listGpsAlarms(1, 5)
        .then((res) => setRecentAlarms(res.alarms))
        .catch(() => {});
    };
    const offOpen = gpsAdminWs.on('alarm.opened', refresh);
    const offClose = gpsAdminWs.on('alarm.closed', refresh);
    const offAck = gpsAdminWs.on('alarm.acknowledged', refresh);
    return () => {
      offOpen();
      offClose();
      offAck();
    };
  }, []);

  const loadStats = async () => {
    try {
      const [coreRes, gpsRes, alarmsRes] = await Promise.allSettled([
        api.getDashboard(),
        api.getGpsOverview(),
        api.listGpsAlarms(1, 5),
      ]);
      if (coreRes.status === 'fulfilled') setStats(coreRes.value.stats);
      else toast.error('Failed to load dashboard stats');
      if (gpsRes.status === 'fulfilled') setGpsStats(gpsRes.value.stats);
      if (alarmsRes.status === 'fulfilled') setRecentAlarms(alarmsRes.value.alarms);
    } finally {
      setLoading(false);
    }
  };

  const navGroups: NavGroup[] = [
    {
      label: null,
      items: [{ id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> }],
    },
    {
      label: 'Operations',
      items: [
        { id: 'dealers', label: 'Dealers', icon: <UserCheck size={20} /> },
        { id: 'regular', label: 'Regular Users', icon: <Users size={20} /> },
        { id: 'history', label: 'Scan History', icon: <History size={20} /> },
        { id: 'schedule', label: 'Schedule', icon: <CalendarDays size={20} /> },
        { id: 'inspection', label: 'Inspections', icon: <ClipboardList size={20} /> },
      ],
    },
    {
      label: 'GPS Telemetry',
      items: [
        { id: 'gps-terminals', label: 'Terminals', icon: <Radio size={20} /> },
        { id: 'gps-fleet', label: 'Fleet Map', icon: <MapIcon size={20} /> },
        {
          id: 'gps-alarms',
          label: 'Alarms',
          icon: <Bell size={20} />,
          badge: gpsStats?.alarms.unacknowledged ?? 0,
        },
        { id: 'gps-dtcs', label: 'DTC Events', icon: <AlertTriangle size={20} /> },
        { id: 'gps-commands', label: 'Commands', icon: <Send size={20} /> },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'audit', label: 'Audit Log', icon: <FileSearch size={20} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
      ],
    },
  ];

  const allNav: NavItem[] = navGroups.flatMap((g) => g.items);

  const handleNavigate = (
    newTab: Tab,
    options?: { historyTab?: 'scans' | 'appraisals' | 'dtc'; ownerUserId?: string; terminalId?: string },
  ) => {
    // Reset sticky deep-link state whenever a field is *not* explicitly
    // overridden. Without this, clicking the Terminals sidebar item after
    // having drilled in from a dealer card would silently keep the list
    // filtered to that dealer. Each field is independent so a caller can
    // deep-link one dimension at a time.
    setHistoryInitialTab(options?.historyTab ?? 'scans');
    setTerminalsInitialOwnerId(options?.ownerUserId);
    setAlarmsInitialTerminalId(options?.terminalId);
    setTab(newTab);
    setSidebarOpen(false);
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

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={group.label ?? `_top_${gi}`} className="space-y-1">
              {group.label && (
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === item.id
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500 text-white min-w-[1.25rem] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={() => setShowBackupModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <FileText size={20} />
            Download Backup
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize truncate">
                  {tab === 'overview' ? 'Dashboard' : allNav.find(n => n.id === tab)?.label}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{admin?.email}</p>
              </div>
            </div>
            <RealtimePill />
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {tab === 'overview' && (
            <OverviewTab
              stats={stats}
              gpsStats={gpsStats}
              recentAlarms={recentAlarms}
              loading={loading}
              onNavigate={handleNavigate}
            />
          )}
          {tab === 'dealers' && <DealerSection onNavigate={handleNavigate} />}
          {tab === 'regular' && <RegularSection onNavigate={handleNavigate} />}
          {tab === 'history' && <HistorySection initialTab={historyInitialTab} />}
          {tab === 'schedule' && <ScheduleSection />}
          {tab === 'inspection' && <InspectionSection />}
          {tab === 'settings' && <SettingsSection />}
          {tab === 'gps-terminals' && (
            <GpsTerminalsSection
              initialOwnerUserId={terminalsInitialOwnerId}
              onClearInitialOwner={() => setTerminalsInitialOwnerId(undefined)}
            />
          )}
          {tab === 'gps-alarms' && (
            <GpsAlarmsSection
              initialTerminalId={alarmsInitialTerminalId}
              onClearInitialTerminal={() => setAlarmsInitialTerminalId(undefined)}
            />
          )}
          {tab === 'gps-fleet' && <GpsFleetMapSection />}
          {tab === 'gps-dtcs' && <GpsDtcsSection />}
          {tab === 'gps-commands' && <GpsCommandsSection />}
          {tab === 'audit' && <GpsAuditLogSection />}
        </div>
      </main>

      {showBackupModal && <BackupModal onClose={() => setShowBackupModal(false)} />}
    </div>
  );
}

function OverviewTab({
  stats,
  gpsStats,
  recentAlarms,
  loading,
  onNavigate,
}: {
  stats: DashboardStats | null;
  gpsStats: GpsOverviewStats | null;
  recentAlarms: GpsAlarm[];
  loading: boolean;
  onNavigate: (
    tab: Tab,
    options?: { historyTab?: 'scans' | 'appraisals' | 'dtc'; ownerUserId?: string; terminalId?: string },
  ) => void;
}) {
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
    { label: 'Inspections', value: stats.totalInspections, icon: <ClipboardList size={22} />, color: 'cyan', onClick: () => onNavigate('inspection') },
    { label: 'Appraisals', value: stats.totalAppraisals, icon: <DollarSign size={22} />, color: 'teal', onClick: () => onNavigate('history', { historyTab: 'appraisals' }) },
    { label: 'Schedule', value: stats.totalServiceAppointments, icon: <CalendarDays size={22} />, color: 'indigo', onClick: () => onNavigate('schedule') },
  ];

  // GPS KPI row — derived directly from the overview payload. Skip when
  // gpsStats hasn't loaded yet so we never render misleading zeros.
  const gpsCards = gpsStats
    ? [
        {
          label: 'Online Terminals',
          value: gpsStats.terminals.online,
          subtitle: `of ${gpsStats.terminals.total} total`,
          icon: <Radio size={22} />,
          color: 'emerald',
          onClick: () => onNavigate('gps-terminals'),
        },
        {
          label: 'Unack Alarms',
          value: gpsStats.alarms.unacknowledged,
          subtitle: `${gpsStats.alarms.criticalLast24h} critical 24h`,
          icon: <Bell size={22} />,
          color: gpsStats.alarms.unacknowledged > 0 ? 'rose' : 'cyan',
          onClick: () => onNavigate('gps-alarms'),
        },
        {
          label: 'DTC Events 24h',
          value: gpsStats.dtcEvents.last24h,
          subtitle: 'last 24 hours',
          icon: <AlertTriangle size={22} />,
          color: 'amber',
          onClick: () => onNavigate('gps-dtcs'),
        },
        {
          label: 'Distance 24h',
          value: fmtMiles(gpsStats.trips.distanceKmLast24h),
          subtitle: `${fmtMiles(gpsStats.trips.distanceKmLast7d)} last 7d`,
          icon: <Activity size={22} />,
          color: 'indigo',
          onClick: () => onNavigate('gps-fleet'),
        },
      ]
    : [];

  // `colorMap` (the gradient variant) used to sit here alongside
  // `bgColorMap` but has been unused since the OverviewCard switched to
  // the flat bg-only palette. Keeping the bg-only map which is still
  // consumed below.
  const bgColorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-500/10',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10',
    violet: 'bg-violet-50 dark:bg-violet-500/10',
    amber: 'bg-amber-50 dark:bg-amber-500/10',
    rose: 'bg-rose-50 dark:bg-rose-500/10',
    cyan: 'bg-cyan-50 dark:bg-cyan-500/10',
    teal: 'bg-teal-50 dark:bg-teal-500/10',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10',
  };

  const textColorMap: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    teal: 'text-teal-600 dark:text-teal-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* OBD KPIs */}
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

      {/* GPS KPIs */}
      {gpsCards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Radio size={16} className="text-blue-500" />
              GPS Telemetry
            </h3>
            <button
              onClick={() => onNavigate('gps-fleet')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open Fleet Map
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gpsCards.map((card, i) => (
              <button
                key={i}
                onClick={card.onClick}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-left hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${bgColorMap[card.color]} flex items-center justify-center ${textColorMap[card.color]}`}>
                    {card.icon}
                  </div>
                  <TrendingUp size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{card.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Alarms */}
      {recentAlarms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-rose-500" />
              Recent Alarms
            </h3>
            <button onClick={() => onNavigate('gps-alarms')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Vehicle / Device ID</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentAlarms.map((alarm) => {
                  const sev = severityColor(alarm.severity);
                  return (
                    <tr
                      key={alarm.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => onNavigate('gps-alarms')}
                    >
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md ${sev.bg} ${sev.text}`}>
                          {alarm.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-900 dark:text-white">
                        {alarmTypeLabel(alarm.alarmType)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                        {alarm.terminal?.nickname || alarm.terminal?.vehicleVin || alarm.terminal?.deviceIdentifier || alarm.terminal?.imei || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        {alarm.acknowledged ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Ack'd</span>
                        ) : alarm.closedAt ? (
                          <span className="text-gray-500">Closed</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Open</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                        {fmtRelative(alarm.openedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
