import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFlat } from '../context/FlatContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/common/Avatar';
import {
  Settings, User, Building, Moon, Sun, LogOut, AlertTriangle,
  Check, Bell, BellRing, BellOff, Send
} from 'lucide-react';

const avatarColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
];

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { currentFlat, updateFlatSettings, leaveFlat } = useFlat();
  const { theme, toggleTheme } = useTheme();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#3B82F6');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Flat Form (if admin)
  const isAdmin = user?.role === 'admin';
  const [flatName, setFlatName] = useState(currentFlat?.name || '');
  const [flatAddress, setFlatAddress] = useState(currentFlat?.address || '');
  const [flatSuccess, setFlatSuccess] = useState('');
  const [flatLoading, setFlatLoading] = useState(false);

  // Push Notifications state
  const [pushPermission, setPushPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );
  const [testNotificationStatus, setTestNotificationStatus] = useState('');

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This device or browser does not support web push notifications.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        sendTestNotification();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendTestNotification = () => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'FlatMate Alerts Active! 🔔',
        body: 'You will now receive instant alerts for chores, debt updates, and borrowed pantry items.',
        url: '/dashboard'
      });
    } else {
      try {
        new Notification('FlatMate Alerts Active! 🔔', {
          body: 'You will now receive instant alerts for chores, debt updates, and borrowed pantry items.',
          icon: '/icon-192.png'
        });
      } catch (e) {
        console.error(e);
      }
    }
    setTestNotificationStatus('Test notification sent to device!');
    setTimeout(() => setTestNotificationStatus(''), 4000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    try {
      const res = await api.put('/auth/profile', { name, phone, avatarColor });
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateFlat = async (e) => {
    e.preventDefault();
    setFlatLoading(true);
    setFlatSuccess('');
    try {
      const res = await updateFlatSettings({ name: flatName, address: flatAddress });
      if (res.success) {
        setFlatSuccess('Flat settings saved!');
        setTimeout(() => setFlatSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFlatLoading(false);
    }
  };

  const handleLeaveFlat = async () => {
    if (
      !window.confirm(
        'Are you sure you want to leave this flat? You will need an invite code to rejoin.'
      )
    )
      return;
    await leaveFlat();
    window.location.href = '/flat-setup';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <span>System & Account Settings</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal profile and shared household preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-emerald-600" />
          <span>My Profile</span>
        </h3>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{profileSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex items-center gap-4 pb-2">
            <Avatar name={name || 'User'} color={avatarColor} size="lg" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Avatar Color
              </p>
              <div className="flex gap-1.5 mt-1.5">
                {avatarColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${avatarColor === c
                        ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110'
                        : 'opacity-70 hover:opacity-100'
                      }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {profileLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Flat Settings (if Admin) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Household Settings (Admin)</span>
          </h3>

          {flatSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{flatSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateFlat} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Flat Name
                </label>
                <input
                  type="text"
                  required
                  value={flatName}
                  onChange={(e) => setFlatName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={flatAddress}
                  onChange={(e) => setFlatAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={flatLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {flatLoading ? 'Saving...' : 'Update Household Info'}
            </button>
          </form>
        </div>
      )}

      {/* Push Notifications Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <BellRing className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Device Push Notifications
              </h4>
              {pushPermission === 'granted' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  Enabled
                </span>
              ) : pushPermission === 'denied' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                  Blocked in Browser
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  Not Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Receive instant alerts on your phone or computer when a flatmate assigns a chore, completes a task on your behalf, or borrows pantry items.
            </p>
            {testNotificationStatus && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                {testNotificationStatus}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {pushPermission !== 'granted' ? (
              <button
                type="button"
                onClick={requestPushPermission}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Bell className="w-4 h-4" />
                <span>Enable Push Notifications</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={sendTestNotification}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Interface Theme
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between Light mode and Dark mode
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6">
        <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Leave Current Flat
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disconnect from {currentFlat?.name}. You can join back later with the invite code.
            </p>
          </div>
          <button
            onClick={handleLeaveFlat}
            className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 dark:border-rose-800 rounded-xl transition-all self-start sm:self-center"
          >
            Leave Flat
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;