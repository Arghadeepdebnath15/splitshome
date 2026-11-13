import React, { useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFlat } from '../../context/FlatContext';

const TaskCompleteModal = ({ isOpen, onClose, task, onConfirm, loading }) => {
  const { user } = useAuth();
  const { members } = useFlat();
  const [selectedCompleterId, setSelectedCompleterId] = useState(user?._id);

  if (!task) return null;

  const assignedToId = task.assignedTo?._id;
  const isCompletedOnBehalf = selectedCompleterId !== assignedToId;
  const selectedCompleter = members.find(m => m._id === selectedCompleterId) || user;
  const creditValue = task.creditValue || 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(task._id, selectedCompleterId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Household Task"
      subtitle={`Confirming completion of "${task.title}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task summary */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Assigned To
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <Avatar
                name={task.assignedTo?.name}
                color={task.assignedTo?.avatarColor}
                size="xs"
              />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {task.assignedTo?.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Credit Value
            </span>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{creditValue} credit{creditValue === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* Who actually completed it? */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Who completed this chore?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map((member) => (
              <button
                key={member._id}
                type="button"
                onClick={() => setSelectedCompleterId(member._id)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  selectedCompleterId === member._id
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Avatar name={member.name} color={member.avatarColor} size="xs" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {member.name} {member._id === user._id ? '(You)' : ''}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {member._id === assignedToId ? 'Assigned Person' : 'Flatmate'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Credit Explainer Box */}
        {isCompletedOnBehalf ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Chore Credit Transaction Triggered!</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200">
              <strong className="underline">{selectedCompleter.name}</strong> completed this chore on behalf of{' '}
              <strong className="underline">{task.assignedTo?.name}</strong>.
            </p>
            <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span>{selectedCompleter.name} earns: +{creditValue} credit</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              <span>{task.assignedTo?.name} owes: {creditValue} credit</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Self-completion: Completing your own assigned task marks it done. No credits or debts generated.
            </span>
          </div>
        )}

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Recording...' : 'Confirm Completion'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskCompleteModal;

