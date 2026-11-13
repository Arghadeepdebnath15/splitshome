import React from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { Check, Trash2, ArrowRight, Clock, ShoppingCart } from 'lucide-react';

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
  const isBorrowerMe = itemDebt.borrower?._id === currentUserId;
  const isLenderMe = itemDebt.lender?._id === currentUserId;
  const isReturned = itemDebt.status === 'returned';

  const emoji = getItemEmoji(itemDebt.itemName);

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
        {/* Item Emoji & Details */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
            {emoji}
          </div>

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
            <div className="mt-2 flex items-center gap-2 text-xs">
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
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {isReturned
            ? `Returned on ${new Date(itemDebt.returnedAt).toLocaleDateString()}`
            : 'Pending return'}
        </span>

        <div className="flex items-center gap-2">
          {!isReturned && (
            <button
              onClick={() => onMarkReturned(itemDebt._id)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark as Returned</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(itemDebt._id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Delete record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDebtCard;

