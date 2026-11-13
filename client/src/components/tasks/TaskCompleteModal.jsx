import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import {
  CheckCircle2, Sparkles, ArrowRight, ShieldCheck,
  Camera, Image as ImageIcon, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFlat } from '../../context/FlatContext';
import { compressImage } from '../../utils/imageUtils';

const TaskCompleteModal = ({ isOpen, onClose, task, onConfirm, loading }) => {
  const { user } = useAuth();
  const { members } = useFlat();
  const [selectedCompleterId, setSelectedCompleterId] = useState(user?._id);
  const [proofImage, setProofImage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef(null);

  if (!task) return null;

  const assignedToId = task.assignedTo?._id;
  const isCompletedOnBehalf = selectedCompleterId !== assignedToId;
  const selectedCompleter = members.find(m => m._id === selectedCompleterId) || user;
  const creditValue = task.creditValue || 1;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setProofImage(compressed);
    } catch (err) {
      console.error(err);
      alert('Could not process image. Please try another photo.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setProofImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(task._id, selectedCompleterId, proofImage);
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

        {/* Optional Photo Proof Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Photo Proof of Completion <span className="text-slate-400 font-normal">(optional)</span>
            </span>
            {proofImage && (
              <button
                type="button"
                onClick={removeImage}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
            id="task-proof-image-input"
          />

          {proofImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center max-h-48 group">
              <img
                src={proofImage}
                alt="Proof of task completion"
                className="w-full h-44 object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 shadow hover:bg-slate-100"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white shadow hover:bg-rose-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-50/50 dark:bg-slate-850 transition-all"
            >
              {isCompressing ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <span className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                  Optimizing photo...
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Snap or attach clean chore photo</span>
                  <span className="text-[10px] text-slate-400">e.g. Clean kitchen sink, tidy room, washed dishes</span>
                </>
              )}
            </button>
          )}
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
            disabled={loading || isCompressing}
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
