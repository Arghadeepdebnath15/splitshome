import React, { useState } from 'react';
import Modal from '../common/Modal';
import { AlertTriangle } from 'lucide-react';

const DisputeModal = ({ isOpen, onClose, transaction, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!transaction) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for disputing this transaction.');
      return;
    }
    onConfirm(transaction._id, reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispute Chore Transaction"
      subtitle="Flag an incorrect or unauthorized credit transaction for review"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
          <p className="font-bold text-slate-900 dark:text-white">
            {transaction.credits} credits: {transaction.debtor?.name} owes {transaction.creditor?.name}
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {transaction.notes || (transaction.task ? `Task: ${transaction.task.title}` : 'Chore credit exchange')}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Why are you disputing this? *
          </label>
          <textarea
            required
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. I actually completed the dishes myself, or the credit value was wrongly set"
            className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'Submit Dispute'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DisputeModal;

