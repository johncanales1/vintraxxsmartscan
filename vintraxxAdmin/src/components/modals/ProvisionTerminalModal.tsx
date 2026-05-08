'use client';

/**
 * ProvisionTerminalModal — admin form to register a new GPS terminal.
 *
 * Backend route: POST /admin/gps/terminals (Zod schema in
 * `schemas/gps.schema.ts::provisionTerminalSchema`).
 *
 * Required: `deviceIdentifier` — the canonical JT/T 808 terminal identity
 * the device transmits in the BCD[6] header field of every packet (per
 * spec §1.5.2). 1–30 alphanumeric chars; covers MSISDN-style 2013
 * devices, IMEI-style 2019 devices, and the manufacturer-defined
 * registration-body terminal ID (§3.3, "uppercase letters and numbers").
 *
 * Everything else — IMEI, phone/MSISDN, ICCID, manufacturer ID, model,
 * firmware, vehicle metadata, owner — is optional. `ownerUserId`, when
 * provided, must be a valid user UUID.
 */

import { useEffect, useState } from 'react';
import { api, ProvisionTerminalBody, User } from '@/lib/api';
import { X, Plus, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function ProvisionTerminalModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<ProvisionTerminalBody>({
    deviceIdentifier: '',
    imei: '',
    phoneNumber: '',
    iccid: '',
    manufacturerId: '',
    terminalModel: '',
    hardwareVersion: '',
    firmwareVersion: '',
    vehicleVin: '',
    vehicleYear: undefined,
    vehicleMake: '',
    vehicleModel: '',
    nickname: '',
    plateNumber: '',
    ownerUserId: undefined,
  });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [selectedOwnerLabel, setSelectedOwnerLabel] = useState<string>('');

  useEffect(() => {
    api.getUsers()
      .then((res) => setUsers(res.users))
      .catch(() => {
        // Non-fatal — the picker simply stays empty.
      });
  }, []);

  const filteredUsers = userQuery.trim()
    ? users.filter((u) => {
        const q = userQuery.toLowerCase();
        return (
          u.email.toLowerCase().includes(q) ||
          (u.fullName && u.fullName.toLowerCase().includes(q))
        );
      }).slice(0, 8)
    : users.slice(0, 8);

  const setField = <K extends keyof ProvisionTerminalBody>(
    key: K,
    value: ProvisionTerminalBody[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    const trimmedDeviceId = form.deviceIdentifier.trim();
    if (!trimmedDeviceId) {
      toast.error('Device identifier is required');
      return;
    }
    // Mirror the backend Zod constraint exactly so the operator gets
    // immediate feedback instead of a round-trip 400. The JT/T 808 spec
    // permits up to 30 alphanumeric characters (uppercase letters + digits
    // for the registration-body terminal ID; pure digits for the BCD
    // header MSISDN/IMEI). We accept lowercase too — some manufacturer
    // SNs are mixed-case — and let the device echo whatever case it
    // actually transmits.
    if (!/^[A-Za-z0-9]{1,30}$/.test(trimmedDeviceId)) {
      toast.error('Device identifier must be 1–30 alphanumeric characters');
      return;
    }
    // IMEI is optional but, when present, must be exactly 15 digits per
    // the 2019-spec 0x0102 auth body layout. Empty string → omit.
    const trimmedImei = form.imei?.trim() ?? '';
    if (trimmedImei && !/^\d{15}$/.test(trimmedImei)) {
      toast.error('IMEI must be exactly 15 digits when provided');
      return;
    }
    setSaving(true);
    try {
      // Strip empty strings — the backend prefers undefined for omitted
      // optional fields so it doesn't store empty rows.
      const cleaned: ProvisionTerminalBody = { deviceIdentifier: trimmedDeviceId };
      if (trimmedImei) cleaned.imei = trimmedImei;
      const optionalKeys: (keyof ProvisionTerminalBody)[] = [
        'phoneNumber', 'iccid', 'manufacturerId', 'terminalModel',
        'hardwareVersion', 'firmwareVersion', 'vehicleVin', 'vehicleMake',
        'vehicleModel', 'nickname', 'plateNumber',
      ];
      for (const k of optionalKeys) {
        const v = form[k];
        if (typeof v === 'string' && v.trim()) (cleaned as any)[k] = v.trim();
      }
      if (form.vehicleYear) cleaned.vehicleYear = form.vehicleYear;
      if (form.ownerUserId) cleaned.ownerUserId = form.ownerUserId;

      await api.provisionGpsTerminal(cleaned);
      toast.success('Terminal provisioned');
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to provision terminal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Provision GPS Terminal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Register a JT/T 808 GPS terminal by its device identifier.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Identification */}
          <Section title="Identification">
            <Field
              label="Device Identifier / Terminal ID *"
              required
              hint="The value the device transmits in its JT/T 808 message header. 1–30 alphanumeric characters — may be an IMEI, MSISDN, or manufacturer-defined terminal ID."
            >
              <input
                type="text"
                value={form.deviceIdentifier}
                onChange={(e) => setField('deviceIdentifier', e.target.value)}
                placeholder="e.g. 013912345678 or DEV0001"
                className="input font-mono"
                maxLength={30}
                autoFocus
              />
            </Field>
            <Field label="IMEI (optional)" hint="Only the 2019-spec 0x0102 auth body carries an IMEI. Leave blank if unknown — the gateway will record it from the device on first connect.">
              <input
                type="text"
                inputMode="numeric"
                value={form.imei || ''}
                onChange={(e) => setField('imei', e.target.value)}
                placeholder="15-digit IMEI (optional)"
                className="input font-mono"
                maxLength={15}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone Number / MSISDN (optional)">
                <input type="text" value={form.phoneNumber || ''} onChange={(e) => setField('phoneNumber', e.target.value)} placeholder="+1234567890" className="input" />
              </Field>
              <Field label="ICCID (optional)">
                <input type="text" value={form.iccid || ''} onChange={(e) => setField('iccid', e.target.value)} placeholder="SIM ICCID" className="input" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Manufacturer ID (optional)">
                <input type="text" value={form.manufacturerId || ''} onChange={(e) => setField('manufacturerId', e.target.value)} className="input" />
              </Field>
              <Field label="Model (optional)">
                <input type="text" value={form.terminalModel || ''} onChange={(e) => setField('terminalModel', e.target.value)} className="input" />
              </Field>
              <Field label="Firmware (optional)">
                <input type="text" value={form.firmwareVersion || ''} onChange={(e) => setField('firmwareVersion', e.target.value)} className="input" />
              </Field>
            </div>
          </Section>

          {/* Vehicle */}
          <Section title="Vehicle (optional)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="VIN">
                <input type="text" value={form.vehicleVin || ''} onChange={(e) => setField('vehicleVin', e.target.value.toUpperCase())} placeholder="17-char VIN" className="input font-mono" />
              </Field>
              <Field label="Plate">
                <input type="text" value={form.plateNumber || ''} onChange={(e) => setField('plateNumber', e.target.value)} className="input" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Year">
                <input
                  type="number"
                  min={1980}
                  max={new Date().getFullYear() + 1}
                  value={form.vehicleYear ?? ''}
                  onChange={(e) => setField('vehicleYear', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="input"
                />
              </Field>
              <Field label="Make">
                <input type="text" value={form.vehicleMake || ''} onChange={(e) => setField('vehicleMake', e.target.value)} className="input" />
              </Field>
              <Field label="Model">
                <input type="text" value={form.vehicleModel || ''} onChange={(e) => setField('vehicleModel', e.target.value)} className="input" />
              </Field>
            </div>
            <Field label="Nickname">
              <input type="text" value={form.nickname || ''} onChange={(e) => setField('nickname', e.target.value)} placeholder="Driver-friendly name" className="input" />
            </Field>
          </Section>

          {/* Owner */}
          <Section title="Owner (optional)">
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserPickerOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <span className="flex items-center gap-2">
                  <UserPlus size={16} className="text-gray-400" />
                  {form.ownerUserId
                    ? `Owner: ${selectedOwnerLabel || form.ownerUserId.substring(0, 8) + '…'}`
                    : 'Leave unpaired (or pick an owner)'}
                </span>
                {form.ownerUserId && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setField('ownerUserId', undefined);
                      setSelectedOwnerLabel('');
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400"
                  >
                    <X size={12} />
                  </span>
                )}
              </button>
              {userPickerOpen && (
                <div className="absolute left-0 right-0 mt-1 z-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg max-h-72 overflow-hidden flex flex-col">
                  <div className="relative p-2 border-b border-gray-100 dark:border-gray-700">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No matches</p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setField('ownerUserId', u.id);
                            setSelectedOwnerLabel(u.fullName || u.email);
                            setUserPickerOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white truncate">{u.fullName || u.email}</p>
                            {u.fullName && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>}
                          </div>
                          {u.isDealer && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ml-2">D</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.deviceIdentifier.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Provision
          </button>
        </div>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(229 231 235);
          background: rgb(249 250 251);
          font-size: 0.875rem;
          color: rgb(17 24 39);
        }
        :global(.dark .input) {
          border-color: rgb(75 85 99);
          background: rgba(55, 65, 81, 0.5);
          color: white;
        }
        :global(.input:focus) {
          outline: none;
          box-shadow: 0 0 0 2px rgb(59 130 246);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  /** Optional helper text rendered below the input. */
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}
