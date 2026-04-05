'use client';

import { useState } from 'react';
import { api, UserDetail, normalizePdfUrl } from '@/lib/api';
import { StatusBadge } from '@/components/Dashboard';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import ScanActivityChart from '@/components/charts/ScanActivityChart';
import {
  X, Mail, Calendar, Smartphone, Car, DollarSign, Globe, Edit2, Save, Trash2,
  FileText, ExternalLink, Hash, AlertCircle, CheckCircle, Image
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  user: UserDetail | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function UserDetailModal({ user, loading, onClose, onRefresh }: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    email: '',
    isDealer: false,
    pricePerLaborHour: '',
    maxScannerDevices: '',
    maxVins: '',
  });
  const [saving, setSaving] = useState(false);
  const [scanDeleteTarget, setScanDeleteTarget] = useState<{ id: string; vin: string } | null>(null);

  const startEdit = () => {
    if (!user) return;
    setEditData({
      email: user.email,
      isDealer: user.isDealer,
      pricePerLaborHour: user.pricePerLaborHour?.toString() || '',
      maxScannerDevices: (user.maxScannerDevices ?? 2).toString(),
      maxVins: (user.maxVins ?? 5).toString(),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.updateUser(user.id, {
        email: editData.email,
        isDealer: editData.isDealer,
        pricePerLaborHour: editData.pricePerLaborHour ? parseFloat(editData.pricePerLaborHour) : undefined,
        maxScannerDevices: editData.maxScannerDevices ? parseInt(editData.maxScannerDevices) : null,
        maxVins: editData.maxVins ? parseInt(editData.maxVins) : null,
      });
      toast.success('User updated');
      setEditing(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScan = async () => {
    if (!scanDeleteTarget) return;
    try {
      await api.deleteScan(scanDeleteTarget.id);
      toast.success('Scan deleted');
      setScanDeleteTarget(null);
      onRefresh();
      onClose();
    } catch {
      toast.error('Failed to delete scan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Details</h2>
            {user && <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>}
          </div>
          <div className="flex items-center gap-2">
            {user && !editing && (
              <button onClick={startEdit} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all">
                <Edit2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !user ? (
            <p className="text-gray-500 text-center py-8">User not found</p>
          ) : (
            <div className="space-y-6">
              {/* Logo & QR Code */}
              {!editing && (user.logoUrl || user.qrCodeUrl) && (
                <div className="flex flex-wrap gap-4">
                  {user.logoUrl && (
                    <div className="flex flex-col items-center gap-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Logo</p>
                      <img
                        src={user.logoUrl}
                        alt="Dealer Logo"
                        className="w-24 h-24 object-contain rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  {user.qrCodeUrl && (
                    <div className="flex flex-col items-center gap-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">QR Code</p>
                      <img
                        src={user.qrCodeUrl}
                        alt="QR Code"
                        className="w-24 h-24 object-contain rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Profile */}
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.isDealer}
                        onChange={(e) => setEditData({ ...editData, isDealer: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Is Dealer</span>
                    </label>
                  </div>
                  {editData.isDealer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price Per Labor Hour ($)</label>
                      <input
                        type="number"
                        value={editData.pricePerLaborHour}
                        onChange={(e) => setEditData({ ...editData, pricePerLaborHour: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="199"
                      />
                    </div>
                  )}
                  {!editData.isDealer && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Scanner Devices</label>
                        <input
                          type="number"
                          min="1"
                          value={editData.maxScannerDevices}
                          onChange={(e) => setEditData({ ...editData, maxScannerDevices: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max VINs</label>
                        <input
                          type="number"
                          min="1"
                          value={editData.maxVins}
                          onChange={(e) => setEditData({ ...editData, maxVins: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoItem icon={<Mail size={14} />} label="Email" value={user.email} />
                  <InfoItem icon={<Globe size={14} />} label="Auth" value={user.authProvider} />
                  <InfoItem icon={<DollarSign size={14} />} label="Labor Rate" value={user.pricePerLaborHour ? `$${user.pricePerLaborHour}/hr` : 'N/A'} />
                  <InfoItem icon={<Calendar size={14} />} label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
                  <InfoItem
                    icon={user.isDealer ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    label="Type"
                    value={user.isDealer ? 'Dealer' : 'Regular'}
                    valueClassName={user.isDealer ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'}
                  />
                  <InfoItem icon={<Hash size={14} />} label="ID" value={user.id.substring(0, 8) + '...'} />
                  {!user.isDealer && (
                    <>
                      <InfoItem icon={<Smartphone size={14} />} label="Max Devices" value={`${user.maxScannerDevices ?? 2}`} />
                      <InfoItem icon={<Car size={14} />} label="Max VINs" value={`${user.maxVins ?? 5}`} />
                    </>
                  )}
                </div>
              )}

              {/* Scan Activity Graph */}
              {user.scans.length > 0 && !editing && (
                <ScanActivityChart scans={user.scans} />
              )}

              {/* Scanner Devices */}
              {user.usedScannerDevices.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Smartphone size={16} />
                    Scanner Devices ({user.usedScannerDevices.length})
                  </h3>
                  <div className="space-y-2">
                    {user.usedScannerDevices.map((d) => (
                      <div key={d.id} className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">{d.deviceName || d.deviceId}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Last used: {new Date(d.lastUsedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Used VINs */}
              {user.usedVins.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Car size={16} />
                    Scanned VINs ({user.usedVins.length})
                  </h3>
                  <div className="space-y-2">
                    {user.usedVins.map((v) => (
                      <div key={v.id} className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm flex items-center justify-between">
                        <span className="font-mono text-gray-900 dark:text-white">{v.vin}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{v.scanCount} scan{v.scanCount !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scan History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Scan History ({user.scans.length})
                </h3>
                {user.scans.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No scans yet</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {user.scans.map((scan) => (
                      <div key={scan.id} className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {scan.vehicleYear && scan.vehicleMake
                                ? `${scan.vehicleYear} ${scan.vehicleMake} ${scan.vehicleModel || ''}`
                                : scan.vin}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{scan.vin}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <StatusBadge status={scan.status} />
                              {scan.stockNumber && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">Stock: {scan.stockNumber}</span>
                              )}
                              <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(scan.receivedAt).toLocaleDateString()}</span>
                            </div>
                            {scan.fullReport && (
                              <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                Cost: ${(scan.fullReport.totalReconditioningCost + (scan.fullReport.additionalRepairsCost || 0)).toLocaleString()}
                                {normalizePdfUrl(scan.fullReport.pdfUrl) && (
                                  <a href={normalizePdfUrl(scan.fullReport.pdfUrl)!} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                    <FileText size={10} /> PDF
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setScanDeleteTarget({ id: scan.id, vin: scan.vin })}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {scanDeleteTarget && (
        <ConfirmDeleteModal
          title="Delete Scan"
          message={`Delete scan for VIN "${scanDeleteTarget.vin}" and its report?`}
          onConfirm={handleDeleteScan}
          onCancel={() => setScanDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function InfoItem({ icon, label, value, valueClassName }: { icon: React.ReactNode; label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <span className="text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`text-sm font-medium truncate ${valueClassName || 'text-gray-900 dark:text-white'}`}>{value}</p>
      </div>
    </div>
  );
}
