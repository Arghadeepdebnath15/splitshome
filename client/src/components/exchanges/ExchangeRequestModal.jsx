import React, { useState } from 'react';
import Modal from '../common/Modal';
import { ArrowLeftRight, HelpCircle, HeartHandshake, AlertCircle } from 'lucide-react';
import { useFlat } from '../../context/FlatContext';
import { useAuth } from '../../context/AuthContext';

const ExchangeRequestModal = ({
  isOpen,
  onClose,
  tasks = [],
  onSubmit,
  loading
}) => {
  const { members } = useFlat();
  const { user } = useAuth();

  const [type, setType] = useState('request_help'); // 'request_help' | 'volunteer' | 'swap'
  const [offeredTaskId, setOfferedTaskId] = useState('');
  const [targetTaskId, setTargetTaskId] = useState('');
  const [requestedToId, setRequestedToId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Tasks assigned to logged-in user
  const myPendingTasks = tasks.filter(
    (t) => t.assignedTo?._id === user?._id && t.status !== 'Completed'
  );

  // Tasks assigned to other flatmates
  const othersPendingTasks = tasks.filter(
    (t) => t.assignedTo?._id !== user?._id && t.status !== 'Completed'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!offeredTaskId) {
      setError('Please select a task.');
      return;
    }
    if (type === 'swap' && !targetTaskId) {
      setError('Please select a task you want to swap for.');
      return;
    }

    onSubmit({
      type,
      offeredTaskId,
      targetTaskId: type === 'swap' ? targetTaskId : null,
      requestedToId: requestedToId || null,
      message: message.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Propose Chore Exchange"
      subtitle="Exchange chores, volunteer, or request help from flatmates"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Exchange Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            What kind of chore request?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('request_help');
                setOfferedTaskId('');
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all ${
                type === 'request_help'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4 mb-1" />
              <span>Ask for Help</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('volunteer');
                setOfferedTaskId('');
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all ${
                type === 'volunteer'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <HeartHandshake className="w-4 h-4 mb-1" />
              <span>Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('swap');
                setOfferedTaskId('');
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all ${
                type === 'swap'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 mb-1" />
              <span>Chore Swap</span>
            </button>
          </div>
        </div>

        {/* 1. Request Help: choose from MY tasks */}
        {type === 'request_help' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select your task that you need help with: *
            </label>
            {myPendingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                You have no pending tasks assigned to you right now.
              </p>
            ) : (
              <select
                required
                value={offeredTaskId}
                onChange={(e) => setOfferedTaskId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose your task --</option>
                {myPendingTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.category}, {t.creditValue} credits)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* 2. Volunteer: choose from OTHERS' tasks */}
        {type === 'volunteer' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select flatmate's task you want to take over: *
            </label>
            {othersPendingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No flatmate tasks currently pending to volunteer for.
              </p>
            ) : (
              <select
                required
                value={offeredTaskId}
                onChange={(e) => setOfferedTaskId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose flatmate's task --</option>
                {othersPendingTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} (Assigned to: {t.assignedTo?.name}, {t.creditValue} cr)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* 3. Swap: choose MY task and THEIR task */}
        {type === 'swap' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your task to give away: *
              </label>
              <select
                required
                value={offeredTaskId}
                onChange={(e) => setOfferedTaskId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose your task --</option>
                {myPendingTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.creditValue} credits)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Their task you want to take instead: *
              </label>
              <select
                required
                value={targetTaskId}
                onChange={(e) => setTargetTaskId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose target task to swap --</option>
                {othersPendingTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} (Assigned to: {t.assignedTo?.name}, {t.creditValue} cr)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Optional message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Note / Reason (Optional)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Busy with exams tomorrow evening, could someone swap?"
            className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Send Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ExchangeRequestModal;

