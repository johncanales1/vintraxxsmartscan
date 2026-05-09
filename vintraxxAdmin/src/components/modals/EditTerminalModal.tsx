'use client';

/**
 * EditTerminalModal — admin form to edit an existing GPS terminal's
 * metadata. Uses the new PATCH /admin/gps/terminals/:id backend route.
 *
 * `deviceIdentifier` is intentionally read-only: it's the JT/T 808 lookup
 * key the gateway routes every packet by, so mutating it would orphan
 * live sessions. All other fields mirror `ProvisionTerminalModal`.
 *
 * Owner reassignment still lives in its own modal (ReassignTerminalModal)
 * to keep that high-traffic path one-click; this modal is the "fix the
 * ICCID / VIN / nickname I got wrong at provision time" form.
 *
 * We send ONLY the keys that actually changed — sending unchanged values
 * would still work but keeps the audit-log payload lean.
 */

import { useState } from 'react';
import { api, GpsTerminal, UpdateTerminalBody } from '@/lib/api';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  terminal: GpsTerminal;
  onClose: () => void;
  onUpdated: (next: GpsTerminal) => void;
}

type Form = {
  imei: string;
  phoneNumber: string;
  iccid: string;
  manufacturerId: string;
  terminalModel: string;
  hardwareVersion: string;
  firmwareVersion: string;
  vehicleVin: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  nickname: string;
  plateNumber: string;
};

function seedForm(t: GpsTerminal): Form {
  return {
    imei: t.imei ?? '',
    phoneNumber: t.phoneNumber ?? '',
    iccid: t.iccid ?? '',
    manufacturerId: t.manufacturerId ?? '',
    terminalModel: t.terminalModel ?? '',
    hardwareVersion: t.hardwareVersion ?? '',
    firmwareVersion: t.firmwareVersion ?? '',
    vehicleVin: t.vehicleVin ?? '',
    vehicleYear: t.vehicleYear != null ? String(t.vehicleYear) : '',
    vehicleMake: t.vehicleMake ?? '',
    vehicleModel: t.vehicleModel ?? '',
    nickname: t.nickname ?? '',
    plateNumber: t.plateNumber ?? '',
  };
}

/**
 * Diff the form against the original row. Returns:
 *  - string key ⇒ trimmed new value (non-empty change)
 *  - null ⇒ field was cleared (original had a value, form now empty)
 *  - absent ⇒ unchanged (don't send)
 * Numeric fields (year) get parsed or nulled explicitly.
 */
function buildPatch(form: Form, original: GpsTerminal): UpdateTerminalBody {
  const patch: UpdateTerminalBody = {};
  const pairs: Array<[keyof Form, keyof UpdateTerminalBody]> = [
    ['imei', 'imei'],
    ['phoneNumber', 'phoneNumber'],
    ['iccid', 'iccid'],
    ['manufacturerId', 'manufacturerId'],
    ['terminalModel', 'terminalModel'],
    ['hardwareVersion', 'hardwareVersion'],
    ['firmwareVersion', 'firmwareVersion'],
    ['vehicleVin', 'vehicleVin'],
    ['vehicleMake', 'vehicleMake'],
    ['vehicleModel', 'vehicleModel'],
    ['nickname', 'nickname'],
    ['plateNumber', 'plateNumber'],
  ];
  for (const [formKey, apiKey] of pairs) {
    const formVal = form[formKey].trim();
    const dbVal = (original as any)[apiKey] as string | null;
    const dbNorm = dbVal ?? '';
    if (formVal === dbNorm) continue;
    (patch as any)[apiKey] = formVal === '' ? null : formVal;
  }
  // Year — numeric field, explicit parsing.
  const yearStr = form.vehicleYear.trim();
  const originalYear = original.vehicleYear ?? null;
  if (yearStr === '' && originalYear !== null) {
    patch.vehicleYear = null;
  } else if (yearStr !== '') {
    const parsed = parseInt(yearStr, 10);
    if (!Number.isNaN(parsed) && parsed !== originalYear) {
      patch.vehicleYear = parsed;
    }
  }
  return patch;
}

export default function EditTerminalModal({ terminal, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<Form>(() => seedForm(terminal));
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof Form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mirror the backend Zod regexes so the admin gets instant feedback on
    // common mistakes rather than a round-trip 400.
    const imei = form.imei.trim();
    if (imei && !/^\d{15}$/.test(imei)) {
      return toast.error('IMEI must be exactly 15 digits when provided');
    }
    const phone = form.phoneNumber.trim();
    if (phone && !/^\d{1,15}$/.test(phone)) {
      return toast.error('Phone number must be 1–15 digits');
    }
    const vin = form.vehicleVin.trim();
    if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return toast.error('VIN must be 17 characters (no I / O / Q)');
    }

    const patch = buildPatch(form, terminal);
    if (Object.keys(patch).length === 0) {
      toast.message('No changes to save');
      onClose();
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateGpsTerminal(terminal.id, patch);
      toast.success('Terminal updated');
      onUpdated(res.terminal);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update terminal');
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit GPS Terminal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Device identifier is fixed. Leave any field blank to clear it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Read-only device id */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device Identifier / Terminal ID (immutable)
            </label>
            <input
              type="text"
              value={terminal.deviceIdentifier}
              readOnly
              className="input font-mono bg-gray-100 dark:bg-gray-700/40 cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              The canonical JT/T 808 identifier cannot be changed — editing it would orphan
              live sessions. Delete + re-provision if the wrong id was entered.
            </p>
          </div>

          {/* Identification */}
          <Section title="Identification">
            <Field
              label="IMEI (optional)"
              hint="15 digits. Only the 2019-spec 0x0102 auth body carries this on-wire."
            >
              <input
                type="text"
                inputMode="numeric"
                value={form.imei}
                onChange={(e) => setField('imei', e.target.value)}
                placeholder="15-digit IMEI"
                className="input font-mono"
                maxLength={15}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone Number / MSISDN (optional)">
                <input
                  type="text"
                  value={form.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value)}
                  placeholder="+1234567890"
                  className="input"
                  maxLength={15}
                />
              </Field>
              <Field
                label="ICCID (optional)"
                hint="SIM card serial (typically 19–20 digits). Example: 8F944538532107506820"
              >
                <input
                  type="text"
                  value={form.iccid}
                  onChange={(e) => setField('iccid', e.target.value)}
                  placeholder="SIM ICCID"
                  className="input font-mono"
                  maxLength={32}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field
                label="Manufacturer ID (optional)"
                hint="Short vendor code (≤8 chars). Do NOT paste an ICCID here."
              >
                <input
                  type="text"
                  value={form.manufacturerId}
                  onChange={(e) => setField('manufacturerId', e.target.value)}
                  className="input"
                  maxLength={8}
                />
              </Field>
              <Field label="Model (optional)">
                <input
                  type="text"
                  value={form.terminalModel}
                  onChange={(e) => setField('terminalModel', e.target.value)}
                  className="input"
                  maxLength={32}
                />
              </Field>
              <Field label="Firmware (optional)">
                <input
                  type="text"
                  value={form.firmwareVersion}
                  onChange={(e) => setField('firmwareVersion', e.target.value)}
                  className="input"
                  maxLength={32}
                />
              </Field>
            </div>
            <Field label="Hardware version (optional)">
              <input
                type="text"
                value={form.hardwareVersion}
                onChange={(e) => setField('hardwareVersion', e.target.value)}
                className="input"
                maxLength={32}
              />
            </Field>
          </Section>

          {/* Vehicle */}
          <Section title="Vehicle (optional)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="VIN">
                <input
                  type="text"
                  value={form.vehicleVin}
                  onChange={(e) => setField('vehicleVin', e.target.value.toUpperCase())}
                  placeholder="17-char VIN"
                  className="input font-mono"
                  maxLength={17}
                />
              </Field>
              <Field label="Plate">
                <input
                  type="text"
                  value={form.plateNumber}
                  onChange={(e) => setField('plateNumber', e.target.value)}
                  className="input"
                  maxLength={16}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Year">
                <input
                  type="number"
                  min={1980}
                  max={new Date().getFullYear() + 1}
                  value={form.vehicleYear}
                  onChange={(e) => setField('vehicleYear', e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Make">
                <input
                  type="text"
                  value={form.vehicleMake}
                  onChange={(e) => setField('vehicleMake', e.target.value)}
                  className="input"
                  maxLength={32}
                />
              </Field>
              <Field label="Model">
                <input
                  type="text"
                  value={form.vehicleModel}
                  onChange={(e) => setField('vehicleModel', e.target.value)}
                  className="input"
                  maxLength={64}
                />
              </Field>
            </div>
            <Field label="Nickname">
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setField('nickname', e.target.value)}
                placeholder="Driver-friendly name"
                className="input"
                maxLength={64}
              />
            </Field>
          </Section>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save changes
            </button>
          </div>
        </form>
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
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
