'use client';

/**
 * GpsAlarmDetailModal — slide-over panel showing the full alarm row,
 * the related terminal block, the actor who acknowledged it (if any),
 * and an inline acknowledge form.
 *
 * The slide-over pattern (right-anchored sheet) is intentionally lighter
 * than the centered terminal-detail modal: alarms are typically
 * triaged in batches and the operator wants to keep the list visible
 * underneath.
 */

import { useEffect, useState } from 'react';
import { api, GpsAlarm } from '@/lib/api';
import {
  fmtRelative,
  vehicleLabel,
  terminalLabel,
  severityColor,
  alarmTypeLabel,
} from '@/lib/gpsHelpers';
import {
  X, AlertTriangle, MapPin, ExternalLink, CheckCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  alarmId: string;
  onClose: () => void;
  onAcknowledged: () => void;
}

export default function GpsAlarmDetailModal({ alarmId, onClose, onAcknowledged }: Props) {
  const [alarm, setAlarm] = useState<GpsAlarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [acking, setAcking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getGpsAlarm(alarmId);
      setAlarm(res.alarm);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load alarm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmId]);

  const handleAck = async () => {
    if (!alarm) return;
    setAcking(true);
    try {
      await api.acknowledgeGpsAlarm(alarm.id, note.trim() || undefined);
      toast.success('Alarm acknowledged');
      onAcknowledged();
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge');
    } finally {
      setAcking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col animate-slide-in-right">
        {loading || !alarm ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Header alarm={alarm} onClose={onClose} onRefresh={load} />
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <Body alarm={alarm} />
            </div>
            {!alarm.acknowledged && !alarm.closedAt && (
              <Footer
                note={note}
                onNote={setNote}
                onAck={handleAck}
                acking={acking}
              />
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        :global(.animate-slide-in-right) {
          animation: slide-in-right 0.18s ease-out;
        }
      `}</style>
    </div>
  );
}

function Header({
  alarm,
  onClose,
  onRefresh,
}: {
  alarm: GpsAlarm;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const sev = severityColor(alarm.severity);
  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl ${sev.bg} flex items-center justify-center ${sev.text} flex-shrink-0`}>
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${sev.bg} ${sev.text}`}>{alarm.severity}</span>
              {alarm.acknowledged && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  ACKNOWLEDGED
                </span>
              )}
              {alarm.closedAt && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  CLOSED
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mt-1">
              {alarmTypeLabel(alarm.alarmType)}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fmtRelative(alarm.openedAt)}</p>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Body({ alarm }: { alarm: GpsAlarm }) {
  return (
    <>
      {/* Terminal */}
      {alarm.terminal && (
        <Section title="Vehicle">
          <p className="text-sm text-gray-900 dark:text-white">
            {vehicleLabel({
              vehicleYear: alarm.terminal.vehicleYear ?? null,
              vehicleMake: alarm.terminal.vehicleMake ?? null,
              vehicleModel: alarm.terminal.vehicleModel ?? null,
              vehicleVin: alarm.terminal.vehicleVin,
              nickname: alarm.terminal.nickname,
              deviceIdentifier: alarm.terminal.deviceIdentifier,
              imei: alarm.terminal.imei,
            })}
          </p>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">{terminalLabel(alarm.terminal)}</p>
          {alarm.terminal.vehicleVin && (
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{alarm.terminal.vehicleVin}</p>
          )}
          {alarm.terminal.ownerUser && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Owner:</span>
              <span className="text-gray-900 dark:text-white">
                {alarm.terminal.ownerUser.fullName || alarm.terminal.ownerUser.email}
              </span>
              {alarm.terminal.ownerUser.isDealer && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  DEALER
                </span>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Location */}
      {alarm.latitude != null && alarm.longitude != null && (
        <Section title="Location at trigger" icon={<MapPin size={14} />}>
          <p className="text-xs font-mono text-gray-700 dark:text-gray-200">
            {Number(alarm.latitude).toFixed(5)}, {Number(alarm.longitude).toFixed(5)}
          </p>
          {alarm.speedKmh != null && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Speed: {Number(alarm.speedKmh).toFixed(1)} km/h</p>
          )}
          <a
            href={`https://www.google.com/maps?q=${alarm.latitude},${alarm.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={12} />
            Open in Google Maps
          </a>
        </Section>
      )}

      {/* Acknowledged-by */}
      {alarm.acknowledged && (
        <Section title="Acknowledged" icon={<CheckCircle size={14} />}>
          <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {alarm.acknowledgedAt ? fmtRelative(alarm.acknowledgedAt) : 'time unknown'}
              {' · by '}
              {alarm.acknowledgedByAdmin
                ? `${alarm.acknowledgedByAdmin.email} (admin)`
                : alarm.acknowledgedByUser
                  ? alarm.acknowledgedByUser.fullName || alarm.acknowledgedByUser.email
                  : 'unknown'}
            </p>
            {alarm.ackNote && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 italic">"{alarm.ackNote}"</p>
            )}
          </div>
        </Section>
      )}

      {/* Closed-at */}
      {alarm.closedAt && (
        <Section title="Closed">
          <p className="text-xs text-gray-700 dark:text-gray-200">{fmtRelative(alarm.closedAt)}</p>
        </Section>
      )}

      {/* Extra data */}
      {alarm.extraData && Object.keys(alarm.extraData).length > 0 && (
        <Section title="Extra data">
          <pre className="text-[11px] font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(alarm.extraData, null, 2)}
          </pre>
        </Section>
      )}

      {/* Service appointment link */}
      {alarm.serviceAppointmentId && (
        <Section title="Service appointment">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-200">{alarm.serviceAppointmentId}</p>
        </Section>
      )}
    </>
  );
}

function Footer({
  note,
  onNote,
  onAck,
  acking,
}: {
  note: string;
  onNote: (n: string) => void;
  onAck: () => void;
  acking: boolean;
}) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Acknowledgement note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Why is this safe to dismiss?"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <button
        onClick={onAck}
        disabled={acking}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-all shadow-sm"
      >
        {acking ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <CheckCircle size={16} />
        )}
        Acknowledge
      </button>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
