'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Lock, Mail, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsSection() {
  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <ChangePasswordCard />
      <ChangeEmailCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('Please fill all fields');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Lock size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Update your admin password</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Confirm new password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={16} />}
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

function ChangeEmailCard() {
  const { admin, setAdmin, setToken } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return toast.error('Please enter a new email');
    if (newEmail === admin?.email) return toast.error('New email is same as current');
    setLoading(true);
    try {
      await api.sendEmailChangeOtp(newEmail);
      toast.success('Verification code sent to your new email');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the verification code');
    setLoading(true);
    try {
      const res = await api.verifyEmailChange(newEmail, otp);
      setAdmin(res.admin);
      setToken(res.token);
      toast.success('Email changed successfully');
      setNewEmail('');
      setOtp('');
      setStep('email');
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <Mail size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Change Email</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current: <span className="font-medium text-gray-700 dark:text-gray-300">{admin?.email}</span>
          </p>
        </div>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter new email address"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              A verification code has been sent to <span className="font-semibold">{newEmail}</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center text-lg tracking-[0.3em] font-mono"
              placeholder="000000"
              maxLength={6}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); }}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
              {loading ? 'Verifying...' : 'Verify & Change'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
