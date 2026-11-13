import React, { useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { Handshake, AlertCircle } from 'lucide-react';

const SettleModal = ({ isOpen, onClose, debtor, creditor, suggestedAmount, onConfirm, loading }) => {
  const [amount, setAmount] = useState(suggestedAmount || 1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (suggestedAmount) {
      setAmount(suggestedAmount);
    }
  }, [suggestedAmount]);

  if (!debtor || !creditor) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please provide a valid settlement amount.');
      return;
    }
    onConfirm({
      debtorId: debtor._id,
      creditorId: creditor._id,
      amount: Number(amount),
      notes: notes.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Chore Credits"
      subtitle="Record mutual settlement to balance out chore debts"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar name={debtor.name} color={debtor.avatarColor} size="xs" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Debtor (Owes)</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{debtor.name}</p>
            </div>
          </div>
          <Handshake className="w-5 h-5 text-emerald-500" />
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Creditor (Owed)</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{creditor.name}</p>
            </div>
            <Avatar name={creditor.name} color={creditor.avatarColor} size="xs" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Amount of Credits to Settle
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Settlement Reason / Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Paid for dinner, mutual understanding, offset chore"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Handshake className="w-4 h-4" />
            <span>{loading ? 'Settling...' : 'Confirm Settlement'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SettleModal;

