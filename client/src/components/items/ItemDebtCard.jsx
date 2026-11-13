import React, { useState } from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { Check, Trash2, ArrowRight, Clock, Maximize2, X } from 'lucide-react';

const itemEmojis = {
  onion: '🧅',
  onions: '🧅',
  rice: '🍚',
  milk: '🥛',
  egg: '🥚',
  eggs: '🥚',
  oil: '🫒',
  butter: '🧈',
  bread: '🍞',
  potato: '🥔',
  potatoes: '🥔',
  tomato: '🍅',
  tomatoes: '🍅',
  coffee: '☕',
  tea: '🍵',
  sugar: '🍬',
  salt: '🧂',
  garlic: '🧄',
  ginger: '🫚',
  cheese: '🧀'
};

const getItemEmoji = (name = '') => {
  const clean = name.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(itemEmojis)) {
    if (clean.includes(key)) return emoji;
  }
  return '📦';
};

const ItemDebtCard = ({ itemDebt, onMarkReturned, onDelete, currentUserId, loading }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const isBorrowerMe = itemDebt.borrower?._id === currentUserId;
  const isLenderMe = itemDebt.lender?._id === currentUserId;
  const isReturned = itemDebt.status === 'returned';

  const emoji = getItemEmoji(itemDebt.itemName);

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(itemDebt._id);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all ${
        isReturned
          ? 'border-emerald-200/60 dark:border-emerald-900/30 opacity-75'
          : isBorrowerMe
          ? 'border-amber-200 dark:border-amber-900/50'
          : 'border-emerald-200 dark:border-emerald-900/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Item Image or Emoji & Details */}
        <div className="flex items-start gap-3">
          {itemDebt.imageUrl ? (
            <div
              onClick={() => setShowImageModal(true)}
              className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 cursor-pointer group shadow-sm border border-slate-200 dark:border-slate-700"
              title="Click to view photo"
            >
              <img
                src={itemDebt.imageUrl}
                alt={itemDebt.itemName}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              {emoji}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {itemDebt.quantity} {itemDebt.unit} of {itemDebt.itemName}
              </h4>
              <Badge variant={isReturned ? 'Completed' : isBorrowerMe ? 'warning' : 'success'}>
                {isReturned ? 'Returned' : isBorrowerMe ? 'You Owe' : 'Owed to You'}
              </Badge>
            </div>

            {/* Borrower & Lender Flow */}
            <div className="mt-2 flex items-center gap-2 text-xs flex-wrap">
              <Avatar
                name={itemDebt.borrower?.name}
                color={itemDebt.borrower?.avatarColor}
                size="xs"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {itemDebt.borrower?.name} {isBorrowerMe ? '(You)' : ''}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <Avatar
                name={itemDebt.lender?.name}
                color={itemDebt.lender?.avatarColor}
                size="xs"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {itemDebt.lender?.name} {isLenderMe ? '(You)' : ''}
              </span>
            </div>

            {itemDebt.description && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                "{itemDebt.description}"
              </p>
            )}
          </div>
        </div>

        {/* Date logged */}
        <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3 h-3" />
          {new Date(itemDebt.createdAt).toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400">
          {isReturned
            ? `Returned on ${new Date(itemDebt.returnedAt).toLocaleDateString()}`
            : 'Pending return'}
        </span>

        <div className="flex items-center gap-2">
          {!isReturned && (
            <button
              type="button"
              onClick={() => onMarkReturned(itemDebt._id)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark as Returned</span>
            </button>
          )}

          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl px-2 py-1">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Delete?</span>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isDeleting ? '...' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  disabled={isDeleting}
                  className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete record"
                aria-label="Delete item record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
      {/* Lightbox Photo Preview Modal */}
      {showImageModal && itemDebt.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>{emoji}</span>
                <span>{itemDebt.itemName} ({itemDebt.quantity} {itemDebt.unit})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center">
              <img
                src={itemDebt.imageUrl}
                alt={itemDebt.itemName}
                className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDebtCard;
