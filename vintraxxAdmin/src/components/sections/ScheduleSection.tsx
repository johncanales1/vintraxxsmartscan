'use client';

import { useState, useEffect } from 'react';
import { api, ServiceAppointment } from '@/lib/api';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import {
  Search, Trash2, RefreshCw, ChevronLeft, ChevronRight, CalendarDays, CheckCircle, Mail, Send, X
} from 'lucide-react';
import { toast } from 'sonner';

export default function ScheduleSection() {
  // Service Appointments state
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<ServiceAppointment[]>([]);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [appointmentTotalPages, setAppointmentTotalPages] = useState(1);
  const [appointmentTotal, setAppointmentTotal] = useState(0);
  const [appointmentDeleteTarget, setAppointmentDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Email Compose Modal state
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [composeEmail, setComposeEmail] = useState({ to: '', subject: '', body: '' });
  const [composeSending, setComposeSending] = useState(false);
  const [composeSent, setComposeSent] = useState(false);

  // Complete Appointment Confirm Modal state
  const [completeTarget, setCompleteTarget] = useState<{ id: string; name: string; serviceType: string } | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => { loadAppointments(); }, [appointmentPage]);

  useEffect(() => {
    const q = appointmentSearch.toLowerCase();
    setFilteredAppointments(
      appointments.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) ||
        a.dealership?.toLowerCase().includes(q) ||
        a.serviceType.toLowerCase().includes(q) ||
        a.vin?.toLowerCase().includes(q) ||
        a.vehicle?.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
      )
    );
  }, [appointmentSearch, appointments]);

  const loadAppointments = async () => {
    setAppointmentLoading(true);
    try {
      const res = await api.getServiceAppointments(appointmentPage, 50);
      setAppointments(res.appointments);
      setAppointmentTotalPages(res.totalPages);
      setAppointmentTotal(res.total);
    } catch { toast.error('Failed to load appointments'); }
    finally { setAppointmentLoading(false); }
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentDeleteTarget) return;
    try {
      await api.deleteServiceAppointment(appointmentDeleteTarget.id);
      toast.success('Appointment deleted');
      setAppointmentDeleteTarget(null);
      loadAppointments();
    } catch { toast.error('Failed to delete appointment'); }
  };

  // Email Compose handlers
  const openEmailCompose = (toEmail: string) => {
    setComposeEmail({ to: toEmail, subject: '', body: '' });
    setComposeSent(false);
    setComposeSending(false);
    setShowEmailCompose(true);
  };

  const closeEmailCompose = () => {
    setShowEmailCompose(false);
    setComposeEmail({ to: '', subject: '', body: '' });
    setComposeSent(false);
  };

  const handleSendEmail = async () => {
    if (!composeEmail.to || !composeEmail.subject) {
      toast.error('Recipient and subject are required');
      return;
    }
    setComposeSending(true);
    try {
      await api.sendEmail(composeEmail.to, composeEmail.subject, composeEmail.body);
      setComposeSent(true);
      toast.success('Email sent!');
    } catch { toast.error('Failed to send email'); }
    finally { setComposeSending(false); }
  };

  // Complete appointment handler
  const handleCompleteAppointment = async () => {
    if (!completeTarget) return;
    setCompleting(true);
    try {
      await api.completeServiceAppointment(completeTarget.id);
      toast.success('Appointment marked as completed');
      setCompleteTarget(null);
      loadAppointments();
    } catch { toast.error('Failed to complete appointment'); }
    finally { setCompleting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
          <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage service appointments</p>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, service type, VIN..."
            value={appointmentSearch}
            onChange={(e) => setAppointmentSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{appointmentTotal.toLocaleString()} total</span>
          <button onClick={loadAppointments} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {appointmentLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{appointmentSearch ? 'No appointments match your search' : 'No service appointments found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 lg:px-6 py-3">Name</th>
                  <th className="px-4 lg:px-6 py-3">Email</th>
                  <th className="px-4 lg:px-6 py-3">Phone Number</th>
                  <th className="px-4 lg:px-6 py-3">Dealership</th>
                  <th className="px-4 lg:px-6 py-3">Service Type</th>
                  <th className="px-4 lg:px-6 py-3">Vehicle</th>
                  <th className="px-4 lg:px-6 py-3">VIN</th>
                  <th className="px-4 lg:px-6 py-3">Preferred Date</th>
                  <th className="px-4 lg:px-6 py-3">Status</th>
                  <th className="px-4 lg:px-6 py-3">Created</th>
                  <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-900 dark:text-white font-medium">{apt.name}</td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      <button onClick={() => openEmailCompose(apt.email)} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left truncate max-w-[140px] block">{apt.email}</button>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{apt.phone || '—'}</td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      <span className="truncate max-w-[120px] block">{apt.dealership || '—'}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5">
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
                        {apt.serviceType}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{apt.vehicle || '—'}</td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm font-mono text-gray-600 dark:text-gray-300">{apt.vin || '—'}</td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{apt.preferredDate}{apt.preferredTime ? ` ${apt.preferredTime}` : ''}</td>
                    <td className="px-4 lg:px-6 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md capitalize ${
                        apt.status === 'confirmed' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' :
                        apt.status === 'completed' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                        apt.status === 'cancelled' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' :
                        'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}>{apt.status}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(apt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => apt.status !== 'completed' && setCompleteTarget({ id: apt.id, name: apt.name, serviceType: apt.serviceType })}
                          disabled={apt.status === 'completed'}
                          className={`p-1.5 rounded-lg transition-all ${
                            apt.status === 'completed'
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-500'
                          }`}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => setAppointmentDeleteTarget({ id: apt.id, name: apt.name })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {appointmentTotalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Page {appointmentPage} of {appointmentTotalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setAppointmentPage(p => Math.max(1, p - 1))} disabled={appointmentPage === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setAppointmentPage(p => Math.min(appointmentTotalPages, p + 1))} disabled={appointmentPage === appointmentTotalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Appointment Modal */}
      {appointmentDeleteTarget && (
        <ConfirmDeleteModal
          title="Delete Appointment"
          message={`Delete service appointment for "${appointmentDeleteTarget.name}"?`}
          onConfirm={handleDeleteAppointment}
          onCancel={() => setAppointmentDeleteTarget(null)}
        />
      )}

      {/* Email Compose Modal */}
      {showEmailCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeEmailCompose}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">New Message</h2>
              </div>
              <button onClick={closeEmailCompose} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {composeSent ? (
              <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Your message has been sent to {composeEmail.to}</p>
                <button onClick={closeEmailCompose} className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">To</label>
                  <input
                    type="email"
                    value={composeEmail.to}
                    onChange={e => setComposeEmail(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={composeEmail.subject}
                    onChange={e => setComposeEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter subject..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    value={composeEmail.body}
                    onChange={e => setComposeEmail(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Write your message..."
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={closeEmailCompose} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={composeSending || !composeEmail.subject.trim()}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {composeSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {composeSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Appointment Confirm Modal */}
      {completeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !completing && setCompleteTarget(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Complete Service</h2>
              </div>
              <button onClick={() => !completing && setCompleteTarget(null)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Mark as Completed?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to mark this service appointment as completed? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Customer</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{completeTarget.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Service Type</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{completeTarget.serviceType}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCompleteTarget(null)}
                  disabled={completing}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteAppointment}
                  disabled={completing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {completing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {completing ? 'Completing...' : 'Confirm Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
